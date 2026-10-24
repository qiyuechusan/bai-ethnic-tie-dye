package com.baizu.tiedye.tutor.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.agent.entity.AgentSession;
import com.baizu.tiedye.ai.client.JsonOutputMode;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.ai.client.LlmResult;
import com.baizu.tiedye.ai.json.JsonOutputParser;
import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.tutor.dto.QuizOptionDto;
import com.baizu.tiedye.tutor.entity.AgentQuizQuestion;
import com.baizu.tiedye.tutor.model.GeneratedQuiz;
import com.baizu.tiedye.tutor.repository.AgentQuizQuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 动态辨析题：只依据 RAG 检索到的“易混辨析”资料生成；没有模型时返回服务不可用，
 * 不再使用预置题库或模拟题目。
 */
@Service
public class QuizGenerationService {

    private static final Logger log = LoggerFactory.getLogger(QuizGenerationService.class);
    private static final Set<String> KEYS = Set.of("A", "B", "C", "D");
    private static final String DIFFERENCE_QUERY =
            "扎染 蜡染 夹缬 灰缬 蓝印花布 绞缬 防染 区别 辨析";

    private final AgentQuizQuestionRepository questionRepository;
    private final LlmClient llmClient;
    private final JsonOutputParser jsonOutputParser;
    private final ObjectMapper objectMapper;
    private final RagRetrievalService retrievalService;
    private final QuizStatService statService;

    public QuizGenerationService(AgentQuizQuestionRepository questionRepository,
                                 LlmClient llmClient,
                                 JsonOutputParser jsonOutputParser,
                                 ObjectMapper objectMapper,
                                 RagRetrievalService retrievalService,
                                 QuizStatService statService) {
        this.questionRepository = questionRepository;
        this.llmClient = llmClient;
        this.jsonOutputParser = jsonOutputParser;
        this.objectMapper = objectMapper;
        this.retrievalService = retrievalService;
        this.statService = statService;
    }

    @Transactional
    public GeneratedQuiz generate(AgentSession session,
                                  String actorKey,
                                  String requestedTopic,
                                  Integer requestedDifficulty) {
        if (!llmClient.isAvailable()) {
            throw new ApiException(50301, "智能出题服务未配置，请检查 API Key 与网络",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        int difficulty = requestedDifficulty == null
                ? statService.nextDifficulty(actorKey, "differentiation")
                : Math.max(1, Math.min(3, requestedDifficulty));

        String query = requestedTopic == null || requestedTopic.isBlank()
                ? DIFFERENCE_QUERY
                : DIFFERENCE_QUERY + " " + requestedTopic;
        RetrievalResult retrieval = retrievalService.retrieve(
                query, 5, Set.of("differentiation"), Set.of("fact"), null, null, null);
        List<RagHit> hits = new ArrayList<>(retrieval.hits());
        if (hits.isEmpty()) {
            throw new ApiException(50303, "知识库暂未检索到辨析资料，请稍后重试",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        Set<String> allowedCitations = new LinkedHashSet<>();
        hits.forEach(hit -> allowedCitations.add(hit.chunkKey()));

        try {
            QuizDraft draft = generateWithLlm(difficulty, hits);
            if (isValidDraft(draft, allowedCitations)) {
                return persist(session, actorKey, draft);
            }
            log.warn("LLM 出题未通过校验");
        } catch (RuntimeException ex) {
            log.warn("LLM 出题失败: {}", ex.getMessage());
        }
        throw new ApiException(50304, "智能出题暂时不可用，请稍后重试",
                HttpStatus.SERVICE_UNAVAILABLE);
    }

    private QuizDraft generateWithLlm(int difficulty, List<RagHit> hits) {
        StringBuilder evidence = new StringBuilder();
        for (RagHit hit : hits) {
            evidence.append("- [").append(hit.chunkKey()).append("] ")
                    .append(hit.title()).append("：").append(shorten(hit.content(), 220)).append('\n');
        }
        String system = """
                你是白族扎染非遗辨析题出题器。只输出 JSON，不要 Markdown 或解释。
                题目必须是四选一的辨析题，围绕证据中出现的易混概念，考察真正的理解而不是记忆答案。
                选项必须互斥、长度接近；正确答案只能在 A/B/C/D 中；不能把答案写进题干。
                事实必须来自证据；引用只允许使用证据里出现过的 chunkKey。
                输出字段：stem, difficulty, options[{key,content}], correctKey, explanation,
                citationChunkKeys, hint。JSON 对象必须合法。
                """;
        String user = "主题：白族扎染易混辨析"
                + "\n目标难度：" + difficulty
                + "\n请从以下证据中提炼一个具体的易混点出题，不要照抄证据句子。"
                + "\n知识证据：\n" + evidence;
        LlmResult result = llmClient.chat(new LlmRequest(
                "tutor_quiz",
                List.of(LlmMessage.system(system), LlmMessage.user(user)),
                JsonOutputMode.JSON_OBJECT,
                null,
                0.6,
                800));
        ObjectNode node = jsonOutputParser.parseObject(result.content());
        return new QuizDraft(
                text(node, "stem"),
                integer(node, "difficulty", difficulty),
                options(node.path("options")),
                text(node, "correctKey"),
                text(node, "explanation"),
                stringList(node.path("citationChunkKeys")),
                text(node, "hint"));
    }

    private GeneratedQuiz persist(AgentSession session, String actorKey, QuizDraft draft) {
        AgentQuizQuestion question = new AgentQuizQuestion();
        List<QuizOptionDto> normalizedOptions = draft.options().stream()
                .map(option -> new QuizOptionDto(
                        option.key().toUpperCase(Locale.ROOT), option.content()))
                .toList();
        question.setQuizKey(UUID.randomUUID().toString());
        question.setSessionId(session.getId());
        question.setActorKey(actorKey);
        question.setTopic("differentiation");
        question.setDifficulty(draft.difficulty());
        question.setStem(draft.stem());
        question.setOptionsJson(write(normalizedOptions));
        question.setCorrectKey(draft.correctKey().toUpperCase(Locale.ROOT));
        question.setExplanation(draft.explanation());
        question.setCitationsJson(write(draft.citationChunkKeys()));
        question.setOrigin("llm");
        question.setStatus("pending");
        questionRepository.save(question);
        return new GeneratedQuiz(question, normalizedOptions, draft.hint());
    }

    private static boolean isValidDraft(QuizDraft draft, Set<String> allowedCitations) {
        if (draft.stem() == null || draft.stem().isBlank()
                || draft.explanation() == null || draft.explanation().isBlank()) {
            return false;
        }
        if (draft.difficulty() == null || draft.difficulty() < 1 || draft.difficulty() > 3) {
            return false;
        }
        if (draft.options() == null || draft.options().size() != 4) {
            return false;
        }
        Set<String> keys = new LinkedHashSet<>();
        for (QuizOptionDto option : draft.options()) {
            if (option.key() == null || option.content() == null || option.content().isBlank()) {
                return false;
            }
            keys.add(option.key().toUpperCase(Locale.ROOT));
        }
        if (!keys.equals(KEYS)) {
            return false;
        }
        if (draft.correctKey() == null || !KEYS.contains(draft.correctKey().toUpperCase(Locale.ROOT))) {
            return false;
        }
        if (draft.citationChunkKeys() != null) {
            for (String key : draft.citationChunkKeys()) {
                if (!allowedCitations.contains(key)) {
                    return false;
                }
            }
        }
        return true;
    }

    private List<QuizOptionDto> options(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<QuizOptionDto> options = new ArrayList<>();
        for (JsonNode item : node) {
            options.add(new QuizOptionDto(
                    text(item, "key"),
                    text(item, "content")));
        }
        return options;
    }

    private static List<String> stringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(item -> {
            if (item.isTextual()) {
                values.add(item.asText());
            }
        });
        return values;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static int integer(JsonNode node, String field, int fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || !value.isNumber() ? fallback : value.asInt();
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("JSON 序列化失败", ex);
        }
    }

    private static String shorten(String value, int max) {
        if (value == null) {
            return "";
        }
        String text = value.replaceAll("\\s+", " ");
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    private record QuizDraft(
            String stem,
            Integer difficulty,
            List<QuizOptionDto> options,
            String correctKey,
            String explanation,
            List<String> citationChunkKeys,
            String hint
    ) {
    }
}
