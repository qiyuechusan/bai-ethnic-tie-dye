package com.baizu.tiedye.tutor.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.baizu.tiedye.agent.service.AgentSessionService;
import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.LlmResult;
import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.ai.json.JsonOutputParser;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.baizu.tiedye.tutor.tool.AgentTool;
import com.baizu.tiedye.tutor.tool.ToolRegistry;
import com.baizu.tiedye.tutor.tool.ToolResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 手写 ReAct：模型每轮只产出一个动作，后端分发工具，把 Observation 拼回上下文，
 * 直到 final_answer 或触发迭代/工具次数熔断。失败时由离线 planner 接管。
 */
@Service
public class ReActLoop {

    private static final Logger log = LoggerFactory.getLogger(ReActLoop.class);

    private final LlmClient llmClient;
    private final TutorPromptBuilder promptBuilder;
    private final JsonOutputParser jsonOutputParser;
    private final ReActActionValidator actionValidator;
    private final ToolRegistry toolRegistry;
    private final AgentSessionService sessionService;
    private final AiProperties properties;
    private final ObjectMapper objectMapper;

    public ReActLoop(LlmClient llmClient,
                     TutorPromptBuilder promptBuilder,
                     JsonOutputParser jsonOutputParser,
                     ReActActionValidator actionValidator,
                     ToolRegistry toolRegistry,
                     AgentSessionService sessionService,
                     AiProperties properties,
                     ObjectMapper objectMapper) {
        this.llmClient = llmClient;
        this.promptBuilder = promptBuilder;
        this.jsonOutputParser = jsonOutputParser;
        this.actionValidator = actionValidator;
        this.toolRegistry = toolRegistry;
        this.sessionService = sessionService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public boolean run(TutorTurnContext context) {
        if (!llmClient.isAvailable()) {
            return false;
        }
        Set<String> fingerprints = new HashSet<>();
        int duplicateCount = 0;
        int maxIterations = Math.max(1, properties.getAgent().getMaxIterations());
        int maxToolCalls = Math.max(1, properties.getAgent().getMaxToolCalls());

        try {
            for (int step = 1; step <= maxIterations; step++) {
                long started = System.currentTimeMillis();
                LlmResult result = llmClient.chat(promptBuilder.buildRequest(context));
                long latency = System.currentTimeMillis() - started;

                ObjectNode action;
                try {
                    action = jsonOutputParser.parseObject(result.content());
                } catch (IllegalArgumentException ex) {
                    trace(context, step, "invalid_json", null, latency, result.content());
                    context.addObservation("上一步输出不是合法 JSON，请只输出 JSON 对象。");
                    continue;
                }
                trace(context, step, "action", null, latency, action.toPrettyString());

                ReActValidationResult check = actionValidator.validate(action, context);
                if (!check.valid()) {
                    context.addObservation("动作校验失败：" + String.join("；", check.errors())
                            + "。请修正动作或参数后继续。");
                    duplicateCount++;
                    if (duplicateCount >= 3) {
                        return false;
                    }
                    continue;
                }

                String name = action.path("action").asText();
                JsonNode input = action.path("actionInput");
                if ("final_answer".equals(name)) {
                    if (requiresTool(context)) {
                        context.addObservation("当前意图是 " + context.getIntentType()
                                + "，请先调用对应工具，不要把题目或纹样直接写进 final_answer。");
                        duplicateCount++;
                        if (duplicateCount >= 3) {
                            return false;
                        }
                        continue;
                    }
                    applyFinalAnswer(context, input);
                    return true;
                }

                if (context.totalToolCalls() >= maxToolCalls) {
                    context.addObservation("本轮工具调用次数已达上限，请直接给出 final_answer。");
                    continue;
                }
                String fingerprint = name + "|" + input.toString();
                if (!fingerprints.add(fingerprint)) {
                    duplicateCount++;
                    context.addObservation("检测到重复的工具调用，请改变策略或直接回答。");
                    if (duplicateCount >= 2) {
                        return false;
                    }
                    continue;
                }

                AgentTool tool = toolRegistry.find(name).orElse(null);
                if (tool == null) {
                    context.addObservation("工具 " + name + " 不存在。");
                    continue;
                }
                long toolStarted = System.currentTimeMillis();
                ToolResult toolResult = tool.execute(context, input);
                long toolLatency = System.currentTimeMillis() - toolStarted;
                context.addObservation("tool=" + name + " ok=" + toolResult.ok()
                        + " summary=" + toolResult.summary());
                trace(context, step, "tool", name, toolLatency, toolResult.summary());

                // 出题/画纹样/判题的卡片已经包含完整信息，直接给确定性收尾文案，
                // 不再额外调用一次模型，通常能省 8–15 秒。
                if (shortCircuitAfterTool(context, name)) {
                    return true;
                }
            }
        } catch (AiUnavailableException ex) {
            log.warn("ReAct 模型调用失败，切换到离线 planner: {}", ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.warn("ReAct 循环异常，切换到离线 planner", ex);
            return false;
        }
        return false;
    }

    private boolean shortCircuitAfterTool(TutorTurnContext context, String toolName) {
        if ("gen_quiz".equals(toolName)) {
            var quiz = context.getCards().stream()
                    .filter(card -> "quiz".equals(card.type()))
                    .map(com.baizu.tiedye.tutor.dto.TutorCardDto::quiz)
                    .findFirst()
                    .orElse(null);
            if (quiz == null) {
                return false;
            }
            context.setAnswerText("我根据你的学习画像出了一道 " + quiz.difficulty()
                    + " 星辨析题。先自己判断，选好后提交答案，判分会由服务端完成。");
            context.setAnswerCitationKeys(List.of());
            context.setRelatedQuestions(List.of());
            context.setSuggestedPrompts(List.of("再来一道", "画出这道题相关的纹样", "换个难度"));
            context.setLowConfidence(false);
            return true;
        }
        if ("draw_pattern".equals(toolName)) {
            var pattern = context.getCards().stream()
                    .filter(card -> "pattern".equals(card.type()))
                    .map(com.baizu.tiedye.tutor.dto.TutorCardDto::pattern)
                    .findFirst()
                    .orElse(null);
            if (pattern == null) {
                return false;
            }
            context.setAnswerText("已按你的描述生成「" + pattern.methodName()
                    + "」，画布与氧化动画会使用同一组参数。你可以继续用一句话微调，或点「换一个种子」看随机细节。");
            context.setAnswerCitationKeys(List.of());
            context.setRelatedQuestions(List.of());
            context.setSuggestedPrompts(List.of("换一个纹样", "颜色浅一点", "用麻布再生成一次"));
            context.setLowConfidence(false);
            return true;
        }
        if ("grade_answer".equals(toolName)) {
            var grade = context.getCards().stream()
                    .filter(card -> "grade".equals(card.type()))
                    .map(com.baizu.tiedye.tutor.dto.TutorCardDto::grade)
                    .findFirst()
                    .orElse(null);
            if (grade == null) {
                return false;
            }
            if (grade.correct()) {
                context.setAnswerText("答对了。你已经抓住了这道辨析题的核心差别，可以试试更难的同类题。");
            } else {
                String source = grade.citations().isEmpty()
                        ? ""
                        : "先回看《" + grade.citations().get(0).title() + "》。";
                context.setAnswerText("这题的正确答案是 " + grade.correctOptionKey() + "。"
                        + source + "解析已放在下方卡片里。");
            }
            context.setAnswerCitationKeys(grade.citations().stream()
                    .map(citation -> citation.chunkKey()).toList());
            context.setRelatedQuestions(List.of());
            context.setSuggestedPrompts(grade.correct()
                    ? List.of("出更难的同类题", "画一个相关纹样", "再来一道")
                    : List.of("再解释一下", "出同类题", "画出来看看"));
            context.setLowConfidence(false);
            return true;
        }
        return false;
    }

    private boolean requiresTool(TutorTurnContext context) {
        String intent = context.getIntentType();
        if ("quiz".equals(intent)) {
            return context.getCards().stream().noneMatch(card -> "quiz".equals(card.type()));
        }
        if ("draw".equals(intent)) {
            return context.getCards().stream().noneMatch(card -> "pattern".equals(card.type()));
        }
        if ("grade".equals(intent) && context.getPendingQuiz() != null) {
            return context.getCards().stream().noneMatch(card -> "grade".equals(card.type()));
        }
        return false;
    }

    private void applyFinalAnswer(TutorTurnContext context, JsonNode input) {
        String answer = input.path("answerText").asText("");
        context.setAnswerText(answer);
        context.setAnswerCitationKeys(stringList(input.path("citationChunkKeys")));
        context.setRelatedQuestions(stringList(input.path("relatedQuestions")));
        context.setSuggestedPrompts(stringList(input.path("suggestedPrompts")));
        context.setIntentType("qa");
        double topScore = context.getEvidence().stream().mapToDouble(RagHit::score).max().orElse(0.0);
        boolean noEvidence = context.getEvidence().isEmpty();
        boolean noCitations = context.getAnswerCitationKeys().isEmpty();
        context.setLowConfidence(noEvidence || noCitations
                || topScore < properties.getRag().getLowConfidence());
    }

    private void trace(TutorTurnContext context, int step, String type, String toolName,
                       long latency, String payload) {
        try {
            sessionService.recordTrace(
                    context.getSession().getId(),
                    context.getTurnNo(),
                    step,
                    type,
                    toolName,
                    (int) latency,
                    null,
                    null,
                    payload);
        } catch (Exception ex) {
            log.debug("写入 trace 失败（不影响回答）: {}", ex.getMessage());
        }
    }

    private static List<String> stringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(item -> {
            if (item.isTextual() && !item.asText().isBlank()) {
                values.add(item.asText());
            }
        });
        return values;
    }
}
