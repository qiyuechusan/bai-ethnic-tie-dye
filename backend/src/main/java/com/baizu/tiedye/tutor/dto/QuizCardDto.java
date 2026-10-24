package com.baizu.tiedye.tutor.dto;

import java.util.List;

public record QuizCardDto(
        String quizId,
        String stem,
        String topic,
        Integer difficulty,
        List<QuizOptionDto> options,
        String hint
) {
}
