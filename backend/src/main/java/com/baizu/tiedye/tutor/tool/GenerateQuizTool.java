package com.baizu.tiedye.tutor.tool;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.agent.service.AgentSessionService;
import com.baizu.tiedye.tutor.dto.QuizCardDto;
import com.baizu.tiedye.tutor.dto.TutorCardDto;
import com.baizu.tiedye.tutor.model.GeneratedQuiz;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.baizu.tiedye.tutor.service.QuizGenerationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class GenerateQuizTool implements AgentTool {

    private final QuizGenerationService quizGenerationService;
    private final AgentSessionService sessionService;
    private final ObjectMapper objectMapper;

    public GenerateQuizTool(QuizGenerationService quizGenerationService,
                            AgentSessionService sessionService,
                            ObjectMapper objectMapper) {
        this.quizGenerationService = quizGenerationService;
        this.sessionService = sessionService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "gen_quiz";
    }

    @Override
    public ToolResult execute(TutorTurnContext context, JsonNode input) {
        if (context.toolCount(name()) >= 1) {
            return ToolResult.error("本轮已经出过一道题");
        }
        String topic = input == null ? null : input.path("topic").asText(null);
        Integer difficulty = input != null && input.path("difficulty").isNumber()
                ? input.path("difficulty").asInt()
                : null;
        String actorKey = sessionService.actorKey(context.getActor().userId(), context.getSession().getSessionKey());
        GeneratedQuiz quiz = quizGenerationService.generate(
                context.getSession(), actorKey, topic, difficulty);
        QuizCardDto card = new QuizCardDto(
                quiz.question().getQuizKey(),
                quiz.question().getStem(),
                quiz.question().getTopic(),
                quiz.question().getDifficulty(),
                quiz.options(),
                quiz.hint());
        context.addCard(TutorCardDto.quiz(card));
        context.incrementTool(name());

        ObjectNode data = objectMapper.createObjectNode();
        data.put("quizId", quiz.question().getQuizKey());
        data.put("difficulty", quiz.question().getDifficulty());
        data.put("origin", quiz.question().getOrigin());
        return ToolResult.ok("已生成一道辨析题（" + quiz.question().getDifficulty() + " 星）", data);
    }
}
