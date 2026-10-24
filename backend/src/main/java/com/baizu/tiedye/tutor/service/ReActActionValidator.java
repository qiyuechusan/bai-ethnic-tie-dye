package com.baizu.tiedye.tutor.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * ReAct 动作校验：动作名、参数、工具次数、最终答案的引用范围。
 */
@Component
public class ReActActionValidator {

    private static final Set<String> ACTIONS = Set.of(
            "retrieve", "gen_quiz", "draw_pattern", "grade_answer", "clarify", "final_answer");

    public ReActValidationResult validate(ObjectNode action, TutorTurnContext context) {
        List<String> errors = new ArrayList<>();
        if (action == null || !action.path("action").isTextual()) {
            return ReActValidationResult.fail(List.of("缺少 action 字段"));
        }
        String name = action.path("action").asText();
        if (!ACTIONS.contains(name)) {
            return ReActValidationResult.fail(List.of("未知 action: " + name));
        }
        JsonNode input = action.path("actionInput");
        if (!input.isObject()) {
            input = action.objectNode();
        }

        switch (name) {
            case "retrieve" -> {
                if (context.toolCount(name) >= 2) {
                    errors.add("retrieve 本轮最多调用 2 次");
                }
                if (input.path("query").asText("").isBlank()) {
                    errors.add("retrieve 需要 query");
                }
                int topK = input.path("topK").asInt(0);
                if (topK < 0 || topK > 6) {
                    errors.add("retrieve.topK 必须在 1–6");
                }
            }
            case "gen_quiz" -> {
                if (context.toolCount(name) >= 1) {
                    errors.add("gen_quiz 本轮最多调用 1 次");
                }
                int difficulty = input.path("difficulty").asInt(0);
                if (difficulty < 0 || difficulty > 3) {
                    errors.add("gen_quiz.difficulty 必须在 1–3");
                }
            }
            case "draw_pattern" -> {
                if (context.toolCount(name) >= 1) {
                    errors.add("draw_pattern 本轮最多调用 1 次");
                }
                if (input.path("prompt").asText("").isBlank()
                        && (context.getMessage() == null || context.getMessage().isBlank())) {
                    errors.add("draw_pattern 需要 prompt");
                }
            }
            case "grade_answer" -> {
                if (context.toolCount(name) >= 1) {
                    errors.add("grade_answer 本轮最多调用 1 次");
                }
                String quizId = input.path("quizId").asText("");
                if (quizId.isBlank() && context.getPendingQuiz() == null) {
                    errors.add("grade_answer 缺少 quizId，且当前没有待答题");
                }
                String key = input.path("optionKey").asText("").toUpperCase(java.util.Locale.ROOT);
                if (!Set.of("A", "B", "C", "D").contains(key)) {
                    errors.add("grade_answer.optionKey 必须是 A/B/C/D");
                }
            }
            case "clarify" -> {
                JsonNode options = input.path("options");
                if (options.isArray() && (options.size() < 2 || options.size() > 4)) {
                    errors.add("clarify.options 需要 2–4 个");
                }
            }
            case "final_answer" -> {
                if (input.path("answerText").asText("").isBlank()) {
                    errors.add("final_answer 需要 answerText");
                }
                JsonNode citations = input.path("citationChunkKeys");
                if (citations.isArray()) {
                    for (JsonNode citation : citations) {
                        if (!context.evidenceKeys().contains(citation.asText())) {
                            errors.add("final_answer 引用了未召回的分片: " + citation.asText());
                        }
                    }
                }
            }
            default -> {
            }
        }
        return errors.isEmpty() ? ReActValidationResult.ok() : ReActValidationResult.fail(errors);
    }
}
