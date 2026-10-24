package com.baizu.tiedye.tutor.dto;

public record GenerateQuizRequest(
        String sessionId,
        String topic,
        Integer difficulty
) {
}
