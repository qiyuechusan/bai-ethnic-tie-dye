package com.baizu.tiedye.quiz.dto;

import java.util.List;

public record QuestionListDto(long total, List<QuestionDto> questions) {
}
