package com.baizu.tiedye.diy.agent.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.agent.entity.AgentSession;
import com.baizu.tiedye.agent.service.ActorResolver;
import com.baizu.tiedye.agent.service.AgentSessionService;
import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.ai.client.LlmResult;
import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.ai.json.JsonOutputParser;
import com.baizu.tiedye.ai.runtime.AiRuntimeStatus;
import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.diy.agent.dto.DiyGenerateRequest;
import com.baizu.tiedye.diy.agent.dto.DiyGenerateResponse;
import com.baizu.tiedye.diy.agent.dto.DiyHistoryItem;
import com.baizu.tiedye.diy.agent.dto.DiySuggestionDto;
import com.baizu.tiedye.diy.agent.dto.OxidationPlanDto;
import com.baizu.tiedye.diy.agent.dto.PatternPlanDto;
import com.baizu.tiedye.diy.agent.entity.DiyGenerateRecord;
import com.baizu.tiedye.diy.agent.model.DiyPlan;
import com.baizu.tiedye.diy.agent.repository.DiyGenerateRecordRepository;
import com.baizu.tiedye.rag.ingest.SimulationProfileCatalog;
import com.baizu.tiedye.rag.model.Citation;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 模块 5 的 Agent 主流程：检索 → 推理 → JSON → 校验 → 纠正 → 落库。
 * 在线失败或无 Key 时自动切换到确定性离线 planner。
 */
@Service
public class DiyPatternAgentService {

    private static final Logger log = LoggerFactory.getLogger(DiyPatternAgentService.class);
    private static final String SEED_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Set<String> RETRIEVAL_CATEGORIES = Set.of("technique", "motif", "oxidation");

    private final LlmClient llmClient;
    private final JsonOutputParser jsonOutputParser;
    private final DiyPromptBuilder promptBuilder;
    private final DiyOutputValidator validator;
    private final DiyOfflinePlanner offlinePlanner;
    private final RagRetrievalService retrievalService;
    private final AgentSessionService sessionService;
    private final DiyGenerateRecordRepository recordRepository;
    private final AiProperties properties;
    private final AiRuntimeStatus runtimeStatus;
    private final ObjectMapper objectMapper;

    public DiyPatternAgentService(LlmClient llmClient,
                                  JsonOutputParser jsonOutputParser,
                                  DiyPromptBuilder promptBuilder,
                                  DiyOutputValidator validator,
                                  DiyOfflinePlanner offlinePlanner,
                                  RagRetrievalService retrievalService,
                                  AgentSessionService sessionService,
                                  DiyGenerateRecordRepository recordRepository,
                                  AiProperties properties,
                                  AiRuntimeStatus runtimeStatus,
                                  ObjectMapper objectMapper) {
        this.llmClient = llmClient;
        this.jsonOutputParser = jsonOutputParser;
        this.promptBuilder = promptBuilder;
        this.validator = validator;
        this.offlinePlanner = offlinePlanner;
        this.retrievalService = retrievalService;
        this.sessionService = sessionService;
        this.recordRepository = recordRepository;
        this.properties = properties;
        this.runtimeStatus = runtimeStatus;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DiyGenerateResponse generate(DiyGenerateRequest request, ActorResolver.Actor actor) {
        if (!llmClient.isAvailable() && !properties.isAllowOfflineFallback()) {
            throw new ApiException(50301, "智能生成服务未配置，请检查 API Key 与网络", HttpStatus.SERVICE_UNAVAILABLE);
        }
        long started = System.currentTimeMillis();
        String prompt = request.prompt().trim();
        String fabric = SimulationProfileCatalog.normalizeFabric(request.fabric());
        double concentration = normalizeConcentration(request.concentration());
        int width = canvasValue(request.canvas() == null ? null : request.canvas().width(), 900);
        int height = canvasValue(request.canvas() == null ? null : request.canvas().height(), 1125);
        validateCanvas(width, height);
        String seed = normalizeSeed(request.seed());

        AgentSession session = sessionService.getOrCreate(request.sessionId(), "diy", actor.userId());
        if (actor.userId() != null && session.getUserId() != null
                && !actor.userId().equals(session.getUserId())) {
            throw new ApiException(40301, "无权访问该会话", HttpStatus.FORBIDDEN);
        }

        String searchQuery = prompt + " " + SimulationProfileCatalog.fabricLabel(fabric) + " 扎染 纹样 工艺";
        RetrievalResult retrieval = retrievalService.retrieve(
                searchQuery,
                properties.getRag().getTopK(),
                RETRIEVAL_CATEGORIES,
                Set.of("fact", "simulation"),
                fabric,
                null,
                "sim_oxidation_profile_v1");
        List<RagHit> hits = new ArrayList<>(retrieval.hits());
        RagHit profile = retrievalService.canonicalProfile();
        if (profile != null && hits.stream().noneMatch(hit -> hit.chunkKey().equals(profile.chunkKey()))) {
            hits.add(profile);
        }
        Set<String> allowedCitations = new LinkedHashSet<>();
        hits.forEach(hit -> allowedCitations.add(hit.chunkKey()));
        if (allowedCitations.isEmpty()) {
            allowedCitations.add("sim_oxidation_profile_v1");
        }

        JsonNode previousPlan = loadPreviousPlan(request.parentGenerationId(), session.getId());
        DiyPlan plan = null;
        boolean planFromLlm = false;
        int attempts = 0;
        String degradedReason = null;

        if (llmClient.isAvailable()) {
            // 单次模型调用 20s，加上一次纠正最多约 45s；这里再设总预算，
            // 超过就立刻切离线，避免用户长时间等一个不可用的模型。
            long deadline = System.currentTimeMillis()
                    + Math.max(10_000L, properties.getRequestTimeout().toMillis() + 5_000L);
            try {
                LlmRequest llmRequest = promptBuilder.buildRequest(
                        prompt, fabric, concentration, width, height, seed, hits, previousPlan);
                LlmResult result = llmClient.chat(llmRequest);
                attempts = 1;
                ObjectNode raw = jsonOutputParser.parseObject(result.content());
                plan = parsePlan(raw);
                ValidationResult check = validator.validate(plan, allowedCitations);
                while (!check.valid()
                        && attempts <= properties.getMaxCorrectionRounds()
                        && System.currentTimeMillis() < deadline) {
                    LlmResult fixed = llmClient.chat(promptBuilder.buildFixRequest(raw, check.errors()));
                    raw = jsonOutputParser.parseObject(fixed.content());
                    plan = parsePlan(raw);
                    check = validator.validate(plan, allowedCitations);
                    attempts++;
                }
                if (!check.valid()) {
                    log.warn("模块 5 模型输出修正后仍不合法或已超时: {}", check.errors());
                    degradedReason = System.currentTimeMillis() >= deadline
                            ? "模型响应超时，已切换本地规则生成"
                            : "模型输出未通过参数校验，已切换本地规则生成";
                    plan = null;
                } else {
                    planFromLlm = true;
                }
            } catch (RuntimeException ex) {
                log.warn("模块 5 在线生成失败，切换离线: {}", ex.getMessage(), ex);
                degradedReason = "模型调用失败：" + ex.getMessage();
                plan = null;
            }
        } else {
            degradedReason = runtimeStatus.getDegradedReason();
        }

        if (plan == null) {
            if (!properties.isAllowOfflineFallback()) {
                throw new ApiException(50302, "智能生成服务暂时不可用，请稍后重试", HttpStatus.SERVICE_UNAVAILABLE);
            }
            plan = offlinePlanner.plan(prompt, fabric, concentration, width, height, seed, hits);
            planFromLlm = false;
        }

        ValidationResult offlineCheck = validator.validate(plan, allowedCitations);
        if (!offlineCheck.valid()) {
            log.error("离线 planner 输出未通过校验（将照常返回，便于发现缺陷）: {}", offlineCheck.errors());
        }

        List<Citation> citations = resolveCitations(plan.citationChunkKeys(), hits);
        boolean degraded = !planFromLlm;
        String mode = planFromLlm ? "online" : "offline";
        boolean lowConfidence = !retrieval.matched() || retrieval.lowConfidence();
        List<String> warnings = new ArrayList<>();
        if (!retrieval.matched()) {
            warnings.add("知识库未命中高度相关分片，当前参数为演示预设。");
        }
        if (degradedReason != null && degraded) {
            warnings.add(degradedReason);
        }

        DiyGenerateRecord record = saveRecord(session, actor, request, prompt, fabric, concentration,
                width, height, seed, plan, citations, degraded, mode, attempts, started);

        updateSession(session, prompt, plan, degraded, record.getId());

        PatternPlanDto method = new PatternPlanDto(
                plan.methodCode(), plan.methodName(), plan.subtitle(), plan.description(),
                plan.rendererType(), plan.difficulty(), plan.params(), plan.previewColors());
        OxidationPlanDto oxidation = new OxidationPlanDto(
                plan.stops(), plan.finalColor(), plan.dipDurationMs(), plan.oxidationDurationMs(),
                plan.tintAlpha(), plan.dips(), fabric, concentration, plan.easing());

        return new DiyGenerateResponse(
                session.getSessionKey(),
                record.getId(),
                mode,
                degraded,
                degradedReason,
                method,
                seed,
                oxidation,
                plan.explanation(),
                citations,
                plan.suggestedPrompts(),
                lowConfidence,
                warnings);
    }

    public List<DiySuggestionDto> suggestions() {
        return List.of(
                new DiySuggestionDto("wave", "用棉布做一块洱海波纹的围巾，浓度高一点", "cotton", 0.8, "wave"),
                new DiySuggestionDto("butterfly", "缝扎一只展开翅膀的蝴蝶", "cotton", 0.7, "butterfly"),
                new DiySuggestionDto("octagon", "亚麻桌旗，八角花旋转对称，颜色浅一些", "linen", 0.4, "octagon"),
                new DiySuggestionDto("plum", "丝绸方巾，梅花纹，淡一点的蓝", "silk", 0.35, "plum"),
                new DiySuggestionDto("spiral", "从中心旋开的星芒螺旋，浸染三次", "cotton", 0.9, "spiral"),
                new DiySuggestionDto("bean", "豆结扎出一片星空圆点，麻布", "linen", 0.6, "bean"));
    }

    public List<DiyHistoryItem> history(String sessionKey, ActorResolver.Actor actor) {
        return sessionService.find(sessionKey)
                .filter(session -> actor.userId() == null || session.getUserId() == null
                        || actor.userId().equals(session.getUserId()))
                .map(session -> recordRepository.findTop10BySessionIdOrderByCreatedAtDesc(session.getId()).stream()
                        .map(record -> new DiyHistoryItem(
                                record.getId(),
                                record.getPrompt(),
                                record.getRendererType(),
                                record.getMotifType(),
                                record.getMethodCode(),
                                record.getSeed(),
                                Boolean.TRUE.equals(record.getDegraded()),
                                record.getCreatedAt()))
                        .toList())
                .orElse(List.of());
    }

    private JsonNode loadPreviousPlan(Long parentGenerationId, Long sessionId) {
        DiyGenerateRecord record = parentGenerationId == null
                ? recordRepository.findTopBySessionIdOrderByCreatedAtDesc(sessionId).orElse(null)
                : recordRepository.findById(parentGenerationId).filter(row -> row.getSessionId().equals(sessionId)).orElse(null);
        if (record == null || record.getPatternParamsJson() == null) {
            return null;
        }
        try {
            ObjectNode context = objectMapper.createObjectNode();
            context.put("rendererType", record.getRendererType());
            context.set("params", objectMapper.readTree(record.getPatternParamsJson()));
            if (record.getOxidationParamsJson() != null) {
                context.set("oxidation", objectMapper.readTree(record.getOxidationParamsJson()));
            }
            context.put("previousPrompt", record.getPrompt());
            return context;
        } catch (Exception ex) {
            return null;
        }
    }

    private DiyPlan parsePlan(ObjectNode node) {
        JsonNode params = node.get("params");
        JsonNode oxidation = node.path("oxidation");
        return new DiyPlan(
                text(node, "rendererType"),
                text(node, "methodCode"),
                text(node, "methodName"),
                text(node, "subtitle"),
                text(node, "description"),
                integer(node, "difficulty"),
                params == null || params.isNull() ? null : params,
                textList(node.path("previewColors")),
                textList(oxidation.path("stops")),
                text(oxidation, "finalColor"),
                integer(oxidation, "dipDurationMs"),
                integer(oxidation, "oxidationDurationMs"),
                decimal(oxidation, "tintAlpha"),
                integer(oxidation, "dips"),
                text(oxidation, "easing"),
                text(node, "explanation"),
                textList(node.path("citationChunkKeys")),
                textList(node.path("suggestedPrompts")));
    }

    private List<Citation> resolveCitations(List<String> keys, List<RagHit> hits) {
        Map<String, Citation> citations = new LinkedHashMap<>();
        if (keys != null) {
            for (String key : keys) {
                RagHit hit = hits.stream().filter(item -> item.chunkKey().equals(key)).findFirst()
                        .orElseGet(() -> retrievalService.hitByKey(key));
                if (hit != null) {
                    citations.put(key, Citation.from(hit));
                }
            }
        }
        if (citations.isEmpty()) {
            hits.stream().limit(3).forEach(hit -> citations.put(hit.chunkKey(), Citation.from(hit)));
        }
        return List.copyOf(citations.values());
    }

    private DiyGenerateRecord saveRecord(AgentSession session,
                                         ActorResolver.Actor actor,
                                         DiyGenerateRequest request,
                                         String prompt,
                                         String fabric,
                                         double concentration,
                                         int width,
                                         int height,
                                         String seed,
                                         DiyPlan plan,
                                         List<Citation> citations,
                                         boolean degraded,
                                         String mode,
                                         int attempts,
                                         long started) {
        DiyGenerateRecord record = new DiyGenerateRecord();
        record.setSessionId(session.getId());
        record.setUserId(actor == null ? null : actor.userId());
        record.setParentId(request.parentGenerationId());
        record.setPrompt(prompt);
        record.setFabric(fabric);
        record.setConcentration(BigDecimal.valueOf(concentration).setScale(2, RoundingMode.HALF_UP));
        record.setCanvasWidth(width);
        record.setCanvasHeight(height);
        record.setRendererType(plan.rendererType());
        record.setMotifType(plan.params() == null ? null : text(plan.params(), "motifType"));
        record.setMethodCode(plan.methodCode());
        record.setSeed(seed);
        record.setPatternParamsJson(write(plan.params()));
        record.setOxidationParamsJson(write(new OxidationPlanDto(
                plan.stops(), plan.finalColor(), plan.dipDurationMs(), plan.oxidationDurationMs(),
                plan.tintAlpha(), plan.dips(), fabric, concentration, plan.easing())));
        record.setPreviewColorsJson(write(plan.previewColors()));
        record.setExplanation(plan.explanation());
        record.setCitationsJson(write(citations));
        record.setDegraded(degraded);
        record.setMode(mode);
        record.setModel(planFromLlmModel(mode));
        record.setValidationAttempts(attempts);
        record.setLatencyMs((int) (System.currentTimeMillis() - started));
        return recordRepository.save(record);
    }

    private String planFromLlmModel(String mode) {
        return "online".equals(mode) ? llmClient.modelId() : "offline-planner";
    }

    private void updateSession(AgentSession session, String prompt, DiyPlan plan, boolean degraded, Long generationId) {
        int turnNo = (session.getTurnCount() == null ? 0 : session.getTurnCount()) + 1;
        sessionService.appendMessage(session.getId(), turnNo, "user", prompt, null);
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("generationId", generationId);
        payload.put("rendererType", plan.rendererType());
        payload.put("methodName", plan.methodName());
        payload.set("params", plan.params());
        sessionService.appendMessage(session.getId(), turnNo, "assistant", plan.explanation(), write(payload));
        sessionService.bumpTurn(session);

        ObjectNode context = objectMapper.createObjectNode();
        context.put("lastGenerationId", generationId);
        context.put("lastPrompt", prompt);
        context.put("lastMethodCode", plan.methodCode());
        context.set("lastParams", plan.params());
        sessionService.updateSummary(session, prompt, plan.explanation(), degraded, write(context));
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("JSON 序列化失败", ex);
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static Integer integer(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || !value.isNumber() ? null : value.asInt();
    }

    private static Double decimal(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || !value.isNumber() ? null : value.asDouble();
    }

    private static List<String> textList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        for (JsonNode item : node) {
            if (item.isTextual()) {
                values.add(item.asText());
            }
        }
        return List.copyOf(values);
    }

    private static double normalizeConcentration(Double value) {
        if (value == null) {
            return 0.8;
        }
        if (value < 0.1 || value > 1.0) {
            throw new ApiException(40001, "染料浓度必须在 0.1–1.0", HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private static int canvasValue(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private static void validateCanvas(int width, int height) {
        if (width < 600 || width > 1600 || height < 600 || height > 1600) {
            throw new ApiException(40001, "画布尺寸需要在 600–1600 之间", HttpStatus.BAD_REQUEST);
        }
        double ratio = (double) width / height;
        if (ratio < 0.5 || ratio > 2.0) {
            throw new ApiException(40001, "画布宽高比需要在 0.5–2.0 之间", HttpStatus.BAD_REQUEST);
        }
    }

    private static String normalizeSeed(String seed) {
        if (seed != null && !seed.isBlank()) {
            return seed.trim().toUpperCase(java.util.Locale.ROOT).substring(0, Math.min(16, seed.trim().length()));
        }
        StringBuilder builder = new StringBuilder(4);
        ThreadLocalRandom random = ThreadLocalRandom.current();
        for (int i = 0; i < 4; i++) {
            builder.append(SEED_ALPHABET.charAt(random.nextInt(SEED_ALPHABET.length())));
        }
        return builder.toString();
    }
}
