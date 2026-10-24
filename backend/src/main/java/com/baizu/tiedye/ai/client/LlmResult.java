package com.baizu.tiedye.ai.client;

public record LlmResult(
        String content,
        String model,
        long latencyMs,
        JsonOutputMode outputMode
) {
}
