package com.baizu.tiedye.ai.client;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record LlmRequest(
        String task,
        List<LlmMessage> messages,
        JsonOutputMode outputMode,
        JsonNode jsonSchema,
        double temperature,
        int maxTokens
) {

    public LlmRequest {
        messages = messages == null ? List.of() : List.copyOf(messages);
        outputMode = outputMode == null ? JsonOutputMode.TEXT : outputMode;
    }

    public static LlmRequest text(String task, List<LlmMessage> messages, double temperature, int maxTokens) {
        return new LlmRequest(task, messages, JsonOutputMode.TEXT, null, temperature, maxTokens);
    }

    public static LlmRequest json(String task, List<LlmMessage> messages, JsonNode schema,
                                  double temperature, int maxTokens) {
        return new LlmRequest(task, messages, JsonOutputMode.JSON_SCHEMA, schema, temperature, maxTokens);
    }
}
