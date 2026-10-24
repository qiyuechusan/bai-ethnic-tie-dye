package com.baizu.tiedye.tutor.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.agent.entity.AgentChatHistory;
import com.baizu.tiedye.agent.entity.AgentSession;
import com.baizu.tiedye.agent.repository.AgentSessionRepository;
import com.baizu.tiedye.agent.service.ActorResolver;
import com.baizu.tiedye.agent.service.AgentSessionService;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.ai.runtime.AiRuntimeStatus;
import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.rag.model.Citation;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagCatalogService;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.tutor.dto.ChatRequest;
import com.baizu.tiedye.tutor.dto.ChatResponse;
import com.baizu.tiedye.tutor.dto.GenerateQuizRequest;
import com.baizu.tiedye.tutor.dto.QuizCardDto;
import com.baizu.tiedye.tutor.dto.SubmitAnswerRequest;
import com.baizu.tiedye.tutor.dto.SubmitAnswerResponse;
import com.baizu.tiedye.tutor.dto.TutorHistoryItem;
import com.baizu.tiedye.tutor.dto.TutorSessionItem;
import com.baizu.tiedye.tutor.dto.TutorStatsDto;
import com.baizu.tiedye.tutor.entity.AgentQuizQuestion;
import com.baizu.tiedye.tutor.model.GeneratedQuiz;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.baizu.tiedye.tutor.repository.AgentQuizQuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 模块 6 的总装：会话 → 预检索 → ReAct/离线 planner → 引用 → 持久化。
 */
@Service
public class TutorAgentService {

    private static final Logger log = LoggerFactory.getLogger(TutorAgentService.class);

    private final AgentSessionService sessionService;
    private final AgentSessionRepository sessionRepository;
    private final RagRetrievalService retrievalService;
    private final RagCatalogService catalogService;
    private final QuizStatService statService;
    private final QuizGenerationService quizGenerationService;
    private final QuizGradingService gradingService;
    private final ReActLoop reactLoop;
    private final TutorOfflinePlanner offlinePlanner;
    private final AgentQuizQuestionRepository questionRepository;
    private final AiProperties properties;
    private final AiRuntimeStatus runtimeStatus;
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;

    public TutorAgentService(AgentSessionService sessionService,
                             AgentSessionRepository sessionRepository,
                             RagRetrievalService retrievalService,
                             RagCatalogService catalogService,
                             QuizStatService statService,
                             QuizGenerationService quizGenerationService,
                             QuizGradingService gradingService,
                             ReActLoop reactLoop,
                             TutorOfflinePlanner offlinePlanner,
                             AgentQuizQuestionRepository questionRepository,
                             AiProperties properties,
                             AiRuntimeStatus runtimeStatus,
                             LlmClient llmClient,
                             ObjectMapper objectMapper) {
        this.sessionService = sessionService;
        this.sessionRepository = sessionRepository;
        this.retrievalService = retrievalService;
        this.catalogService = catalogService;
        this.statService = statService;
        this.quizGenerationService = quizGenerationService;
        this.gradingService = gradingService;
        this.reactLoop = reactLoop;
        this.offlinePlanner = offlinePlanner;
        this.questionRepository = questionRepository;
        this.properties = properties;
        this.runtimeStatus = runtimeStatus;
        this.llmClient = llmClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ChatResponse chat(ChatRequest request, ActorResolver.Actor actor) {
        if (!llmClient.isAvailable() && !properties.isAllowOfflineFallback()) {
            throw new ApiException(50301, "智能导师服务未配置，请检查 API Key 与网络", HttpStatus.SERVICE_UNAVAILABLE);
        }
        String message = request.message().trim();
        AgentSession session = sessionService.getOrCreate(request.sessionId(), "tutor", actor.userId());
        requireSessionOwner(session, actor);
        String actorKey = sessionService.actorKey(actor.userId(), session.getSessionKey());
        int turnNo = (session.getTurnCount() == null ? 0 : session.getTurnCount()) + 1;

        TutorTurnContext context = new TutorTurnContext(
                session, actor, message, request.scope(), turnNo);
        context.setHistory(sessionService.recentHistory(session.getId(), properties.getAgent().getHistoryTurns()));
        context.setStats(statService.overview(actorKey).topics());
        context.setPendingQuiz(questionRepository
                .findFirstBySessionIdAndStatusOrderByCreatedAtDesc(session.getId(), "pending")
                .orElse(null));
        // 先做一次确定性的意图识别，在线 ReAct 也据此强制走对应工具，
        // 避免模型把“出题/画纹样”直接写进 final_answer。
        context.setIntentType(offlinePlanner.detectIntent(message, context));
        context.setTopic(offlinePlanner.detectTopic(message));
        if ("quiz".equals(context.getIntentType()) || "grade".equals(context.getIntentType())) {
            context.setTopic("differentiation");
        }

        RetrievalResult preRetrieval = retrievalService.retrieve(
                message,
                properties.getRag().getTopK(),
                categoriesForScope(request.scope()),
                Set.of("fact", "simulation"),
                null,
                null,
                null);
        context.addEvidence(preRetrieval.hits());
        if (preRetrieval.lowConfidence()) {
            context.setLowConfidence(true);
        }

        boolean online;
        try {
            online = reactLoop.run(context);
        } catch (RuntimeException ex) {
            log.warn("ReAct 循环异常，切换到离线 planner: {}", ex.getMessage(), ex);
            online = false;
        }
        String mode;
        String degradedReason;
        if (!online) {
            if (!properties.isAllowOfflineFallback()) {
                throw new ApiException(50302, "智能导师服务暂时不可用，请稍后重试", HttpStatus.SERVICE_UNAVAILABLE);
            }
            try {
                offlinePlanner.run(context);
            } catch (Exception ex) {
                log.error("离线 planner 执行失败", ex);
                context.setAnswerText("抱歉，这一轮处理失败，没有生成可靠回答。可以换个问法，或先浏览右侧知识范围。");
                context.setLowConfidence(true);
                context.setAnswerCitationKeys(List.of());
            }
            mode = "offline";
            degradedReason = llmClient.isAvailable()
                    ? "模型输出未通过校验或调用失败，已使用本地规则回答"
                    : runtimeStatus.getDegradedReason();
            sessionService.recordTrace(session.getId(), turnNo, 99, "offline_planner",
                    null, null, null, null, "离线规则回答");
        } else {
            mode = "online";
            degradedReason = null;
        }
        boolean degraded = !online;

        String answerText = context.getAnswerText();
        if (answerText == null || answerText.isBlank()) {
            answerText = "这一轮我没有组织出可靠的回答。你可以换个问法，或让我先检索一下相关知识。";
            context.setAnswerText(answerText);
            context.setLowConfidence(true);
        }
        List<Citation> citations = resolveCitations(context);
        List<String> related = context.getRelatedQuestions();
        List<String> suggested = context.getSuggestedPrompts();
        if (suggested.isEmpty()) {
            suggested = catalogService.catalog().suggestedPrompts().stream()
                    .map(RagCatalogService.PromptDto::text)
                    .limit(4)
                    .toList();
        }

        persistTurn(context, answerText, citations, mode, degraded, actorKey);
        sessionService.bumpTurn(session);
        sessionService.updateSummary(session, truncate(message, 100), truncate(answerText, 1500),
                degraded, sessionContext(context, mode));

        log.info("Tutor turn session={} turn={} mode={} intent={} cards={} citations={} evidence={} topScore={}",
                session.getSessionKey(), turnNo, mode, context.getIntentType(),
                context.getCards().size(), citations.size(), context.getEvidence().size(), preRetrieval.topScore());

        return new ChatResponse(
                session.getSessionKey(),
                turnNo,
                mode,
                degraded,
                degradedReason,
                new ChatResponse.IntentDto(context.getIntentType(), context.getTopic(), context.getIntentConfidence()),
                new ChatResponse.AnswerDto(answerText, citations, related, suggested),
                context.getCards(),
                context.isLowConfidence());
    }

    @Transactional
    public SubmitAnswerResponse submitAnswer(SubmitAnswerRequest request, ActorResolver.Actor actor) {
        return gradingService.grade(request.sessionId(), actor, request.quizId(), request.optionKey());
    }

    @Transactional
    public QuizCardDto generateQuiz(GenerateQuizRequest request, ActorResolver.Actor actor) {
        AgentSession session = sessionService.getOrCreate(request.sessionId(), "tutor", actor.userId());
        requireSessionOwner(session, actor);
        String actorKey = sessionService.actorKey(actor.userId(), session.getSessionKey());
        GeneratedQuiz quiz = quizGenerationService.generate(
                session, actorKey, request.topic(), request.difficulty());
        return new QuizCardDto(
                quiz.question().getQuizKey(),
                quiz.question().getStem(),
                quiz.question().getTopic(),
                quiz.question().getDifficulty(),
                quiz.options(),
                quiz.hint());
    }

    @Transactional(readOnly = true)
    public TutorStatsDto stats(String sessionKey, ActorResolver.Actor actor) {
        String actorKey = sessionService.actorKey(actor.userId(), sessionKey);
        return statService.overview(actorKey);
    }

    @Transactional(readOnly = true)
    public List<TutorSessionItem> sessions(ActorResolver.Actor actor) {
        if (actor.userId() == null) {
            return List.of();
        }
        return sessionRepository.findTop20ByUserIdOrderByUpdatedAtDesc(actor.userId()).stream()
                .filter(session -> session.getKind() == null
                        || "tutor".equals(session.getKind())
                        || "mixed".equals(session.getKind()))
                .map(session -> new TutorSessionItem(
                        session.getSessionKey(),
                        session.getTitle(),
                        session.getSummary(),
                        session.getTurnCount(),
                        Boolean.TRUE.equals(session.getDegraded()),
                        session.getUpdatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TutorHistoryItem> history(String sessionKey, ActorResolver.Actor actor) {
        AgentSession session = sessionService.find(sessionKey)
                .orElseThrow(() -> new ApiException(40401, "会话不存在", HttpStatus.NOT_FOUND));
        if (actor.userId() != null && session.getUserId() != null
                && !actor.userId().equals(session.getUserId())) {
            throw new ApiException(40301, "无权查看该会话", HttpStatus.FORBIDDEN);
        }
        return sessionService.allHistory(session.getId()).stream()
                .map(this::toHistoryItem)
                .toList();
    }

    public RagCatalogService.CatalogDto catalog() {
        return catalogService.catalog();
    }

    public RagCatalogService.KnowledgePageDto knowledge(String category, int offset, int limit) {
        return catalogService.knowledge(category, offset, limit);
    }

    private void persistTurn(TutorTurnContext context, String answerText, List<Citation> citations,
                             String mode, boolean degraded, String actorKey) {
        int turnNo = context.getTurnNo();
        ObjectNode userPayload = objectMapper.createObjectNode();
        userPayload.put("scope", context.getScope());
        sessionService.appendMessage(context.getSession().getId(), turnNo, "user",
                context.getMessage(), userPayload.toString());

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("mode", mode);
        payload.put("degraded", degraded);
        payload.put("intent", context.getIntentType());
        payload.put("lowConfidence", context.isLowConfidence());
        payload.set("cards", objectMapper.valueToTree(context.getCards()));
        payload.set("citations", objectMapper.valueToTree(citations));
        payload.put("pendingQuizKey", context.getPendingQuiz() == null
                ? null
                : context.getPendingQuiz().getQuizKey());
        payload.put("actorKey", actorKey);
        sessionService.appendMessage(context.getSession().getId(), turnNo, "assistant",
                answerText, payload.toString());
    }

    private String sessionContext(TutorTurnContext context, String mode) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("lastIntent", context.getIntentType());
        node.put("lastTopic", context.getTopic());
        node.put("mode", mode);
        node.put("lowConfidence", context.isLowConfidence());
        node.put("lastAnswer", truncate(context.getAnswerText(), 500));
        return node.toString();
    }

    private TutorHistoryItem toHistoryItem(AgentChatHistory history) {
        JsonNode payload = null;
        if (history.getPayloadJson() != null && !history.getPayloadJson().isBlank()) {
            try {
                payload = objectMapper.readTree(history.getPayloadJson());
            } catch (Exception ignored) {
                payload = null;
            }
        }
        return new TutorHistoryItem(
                history.getTurnNo(), history.getRole(), history.getContent(), payload, history.getCreatedAt());
    }

    private List<Citation> resolveCitations(TutorTurnContext context) {
        Map<String, Citation> citations = new LinkedHashMap<>();
        for (String key : context.getAnswerCitationKeys()) {
            RagHit hit = context.getEvidence().stream()
                    .filter(item -> item.chunkKey().equals(key))
                    .findFirst()
                    .orElseGet(() -> retrievalService.hitByKey(key));
            if (hit != null) {
                citations.put(key, Citation.from(hit));
            }
        }
        return List.copyOf(citations.values());
    }

    private static void requireSessionOwner(AgentSession session, ActorResolver.Actor actor) {
        if (actor.userId() != null && session.getUserId() != null
                && !actor.userId().equals(session.getUserId())) {
            throw new ApiException(40301, "无权访问该会话", HttpStatus.FORBIDDEN);
        }
    }

    private Set<String> categoriesForScope(String scope) {
        if (scope == null || scope.isBlank()) {
            return null;
        }
        String normalized = scope.trim().toLowerCase(java.util.Locale.ROOT);
        return catalogService.knownCategories().contains(normalized) ? Set.of(normalized) : null;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
