package com.baizu.tiedye.quiz.dto;

import java.util.List;

public record QuestionDto(
        Long id,
        String stem,
        String category,
        Integer difficulty,
        List<OptionDto> options
) {
}
