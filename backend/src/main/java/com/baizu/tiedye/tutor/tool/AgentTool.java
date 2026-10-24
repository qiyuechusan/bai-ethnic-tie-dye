package com.baizu.tiedye.tutor.tool;

import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.fasterxml.jackson.databind.JsonNode;

public interface AgentTool {

    String name();

    ToolResult execute(TutorTurnContext context, JsonNode input);
}
