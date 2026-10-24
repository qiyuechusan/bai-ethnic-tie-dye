package com.baizu.tiedye.tutor.service;

import java.util.List;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.agent.entity.AgentChatHistory;
import com.baizu.tiedye.ai.client.JsonOutputMode;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.tutor.dto.QuizStatDto;
import com.baizu.tiedye.tutor.model.TutorTurnContext;

/**
 * 模块 6 ReAct 提示词。动作与参数以 JSON 描述，模型只负责决策，不下判题结论。
 */
@Component
public class TutorPromptBuilder {

    public LlmRequest buildRequest(TutorTurnContext context) {
        StringBuilder user = new StringBuilder();
        user.append("【当前问题】").append(context.getMessage()).append('\n');
        if (context.getScope() != null && !context.getScope().isBlank()) {
            user.append("【用户指定范围】").append(context.getScope()).append('\n');
        }

        List<AgentChatHistory> history = context.getHistory();
        if (!history.isEmpty()) {
            user.append("【最近对话】\n");
            history.stream().limit(8).forEach(item ->
                    user.append('-').append(item.getRole()).append("：")
                            .append(shorten(item.getContent(), 160)).append('\n'));
        }

        if (!context.getStats().isEmpty()) {
            user.append("【学习画像】\n");
            for (QuizStatDto stat : context.getStats()) {
                user.append("- ").append(stat.topic())
                        .append("：作答 ").append(stat.attempts())
                        .append(" 次，正确 ").append(stat.correct())
                        .append("，下一题难度 ").append(stat.nextDifficulty()).append('\n');
            }
        }
        if (context.getPendingQuiz() != null) {
            user.append("【待答题】quizId=").append(context.getPendingQuiz().getQuizKey())
                    .append("，难度 ").append(context.getPendingQuiz().getDifficulty())
                    .append("。若用户给出了选项，可调用 grade_answer。\n");
        }
        user.append("【识别到的意图】").append(context.getIntentType()).append('\n');
        if (context.getTopic() != null) {
            user.append("【识别到的主题】").append(context.getTopic()).append('\n');
        }

        user.append("【知识证据】\n");
        if (context.getEvidence().isEmpty()) {
            user.append("- 暂无。需要知识时先调用 retrieve。\n");
        } else {
            for (RagHit hit : context.getEvidence()) {
                user.append("- [").append(hit.chunkKey()).append("] ")
                        .append(hit.title()).append("（").append(hit.category()).append("）：")
                        .append(shorten(hit.content(), 260)).append('\n');
            }
        }

        if (!context.getObservations().isEmpty()) {
            user.append("【已执行动作与观察】\n");
            context.getObservations().forEach(item -> user.append("- ").append(shorten(item, 300)).append('\n'));
        }

        user.append("""
                【输出要求】只输出一个 JSON 对象：
                {"thought":"简短思考", "action":"retrieve|gen_quiz|draw_pattern|grade_answer|clarify|final_answer",
                 "actionInput":{...}}
                动作参数：
                - retrieve: {"query":"...","category":"可选","topK":1-6}
                - gen_quiz: {"topic":"可选","difficulty":1-3}
                - draw_pattern: {"prompt":"...","fabric":"cotton|linen|silk","concentration":0.1-1.0}
                - grade_answer: {"quizId":"可选，默认当前待答题","optionKey":"A|B|C|D"}
                - clarify: {"question":"...","options":["...","..."]}
                - final_answer: {"answerText":"中文回答","citationChunkKeys":["..."],
                  "relatedQuestions":["..."],"suggestedPrompts":["..."]}
                """);

        List<LlmMessage> messages = List.of(
                LlmMessage.system(systemPrompt()),
                LlmMessage.user(user.toString()));
        return new LlmRequest("tutor_react", messages, JsonOutputMode.JSON_OBJECT, null, 0.4, 900);
    }

    private static String systemPrompt() {
        return """
                你是“蓝白之境”的白族扎染非遗助教，不是通用聊天机器人。
                你的任务是帮助用户理解扎染工艺、辨析易混概念，并在合适时出题或调用纹样生成工具。

                你可以执行的动作：
                1. retrieve：检索知识库；
                2. gen_quiz：生成一道四选一辨析题；
                3. draw_pattern：调用模块 5 生成纹样与氧化参数；
                4. grade_answer：对当前待答题判分（判分由服务端完成，你只负责调用）；
                5. clarify：问题模糊或知识库未覆盖时，向用户澄清；
                6. final_answer：给出最终回答。

                硬性规则：
                1. 只输出 JSON，不要 Markdown，不要代码围栏。
                2. 事实必须来自【知识证据】；没有证据就调用 retrieve；仍没有就 clarify 或明确说“知识库暂未收录”，不得编造。
                3. final_answer 的 citationChunkKeys 只能使用【知识证据】中的 chunkKey。
                4. 判题前绝不泄露正确选项，不替用户答题；判题必须调用 grade_answer。
                5. 区分文献事实与项目模拟参数；氧化时长存在工坊差异时要说明。
                6. 用户问“你能做什么/你有哪些资料”时，列出知识范围并给示例问题。
                7. 非扎染、非非遗领域的问题，礼貌拒绝并引导回知识范围。
                8. 中文回答，简洁、有依据；一次只做一个动作，拿到观察后再决定下一步。
                9. 如果【识别到的意图】是 quiz，必须先调用 gen_quiz；是 draw，必须先调用 draw_pattern；
                   是 grade，必须先调用 grade_answer。不要用 final_answer 直接写题目或纹样。
                """;
    }

    private static String shorten(String value, int max) {
        if (value == null) {
            return "";
        }
        String text = value.replaceAll("\\s+", " ");
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
