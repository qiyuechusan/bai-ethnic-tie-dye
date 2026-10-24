package com.baizu.tiedye.tutor.dto;

import java.util.List;

import com.baizu.tiedye.rag.model.Citation;

public record ChatResponse(
        String sessionId,
        Integer turnNo,
        String mode,
        boolean degraded,
        String degradedReason,
        IntentDto intent,
        AnswerDto answer,
        List<TutorCardDto> cards,
        boolean lowConfidence
) {

    public record IntentDto(String type, String topic, Double confidence) {
    }

    public record AnswerDto(
            String text,
            List<Citation> citations,
            List<String> relatedQuestions,
            List<String> suggestedPrompts
    ) {
    }
}
