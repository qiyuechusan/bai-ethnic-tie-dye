package com.baizu.tiedye.tutor.tool;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.tutor.dto.GradeCardDto;
import com.baizu.tiedye.tutor.dto.SubmitAnswerResponse;
import com.baizu.tiedye.tutor.dto.TutorCardDto;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.baizu.tiedye.tutor.service.QuizGradingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class GradeAnswerTool implements AgentTool {

    private final QuizGradingService gradingService;
    private final ObjectMapper objectMapper;

    public GradeAnswerTool(QuizGradingService gradingService, ObjectMapper objectMapper) {
        this.gradingService = gradingService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "grade_answer";
    }

    @Override
    public ToolResult execute(TutorTurnContext context, JsonNode input) {
        if (context.toolCount(name()) >= 1) {
            return ToolResult.error("本轮已经判过一道题");
        }
        String quizId = input == null ? null : input.path("quizId").asText(null);
        if ((quizId == null || quizId.isBlank()) && context.getPendingQuiz() != null) {
            quizId = context.getPendingQuiz().getQuizKey();
        }
        String optionKey = input == null ? null : input.path("optionKey").asText(null);
        if (quizId == null || quizId.isBlank() || optionKey == null || optionKey.isBlank()) {
            return ToolResult.error("缺少 quizId 或选项");
        }
        SubmitAnswerResponse result = gradingService.grade(
                context.getSession().getSessionKey(), context.getActor(), quizId, optionKey);
        context.addCard(TutorCardDto.grade(new GradeCardDto(
                result.quizId(),
                result.correct(),
                result.correctOptionKey(),
                result.explanation(),
                result.citations())));
        context.incrementTool(name());

        ObjectNode data = objectMapper.createObjectNode();
        data.put("quizId", result.quizId());
        data.put("correct", result.correct());
        data.put("correctOptionKey", result.correctOptionKey());
        data.put("nextDifficulty", result.stat().nextDifficulty());
        return ToolResult.ok(result.correct() ? "回答正确" : "回答错误，正确答案是 " + result.correctOptionKey(), data);
    }
}
