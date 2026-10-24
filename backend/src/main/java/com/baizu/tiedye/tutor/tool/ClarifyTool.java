package com.baizu.tiedye.tutor.tool;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.tutor.dto.ClarifyCardDto;
import com.baizu.tiedye.tutor.dto.TutorCardDto;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class ClarifyTool implements AgentTool {

    private final ObjectMapper objectMapper;

    public ClarifyTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "clarify";
    }

    @Override
    public ToolResult execute(TutorTurnContext context, JsonNode input) {
        String question = input == null ? null : input.path("question").asText(null);
        if (question == null || question.isBlank()) {
            question = "你更想了解哪一方面？";
        }
        List<String> options = new ArrayList<>();
        if (input != null && input.path("options").isArray()) {
            input.path("options").forEach(item -> {
                if (item.isTextual() && !item.asText().isBlank()) {
                    options.add(item.asText());
                }
            });
        }
        if (options.size() < 2) {
            options.clear();
            options.addAll(List.of("防染方式", "纹样特征", "工艺步骤"));
        }
        context.addCard(TutorCardDto.clarify(new ClarifyCardDto(question, options)));
        context.incrementTool(name());

        ObjectNode data = objectMapper.createObjectNode();
        data.put("question", question);
        return ToolResult.ok("已向用户提出澄清问题", data);
    }
}
