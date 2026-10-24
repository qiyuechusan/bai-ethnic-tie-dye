package com.baizu.tiedye.quiz.dto;

public record AnswerResultDto(
        Long questionId,
        boolean correct,
        String correctOptionKey,
        String explanation,
        Long patternId
) {
}
