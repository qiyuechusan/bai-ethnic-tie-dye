package com.baizu.tiedye.tutor.dto;

import java.util.List;

import com.baizu.tiedye.rag.model.Citation;

public record GradeCardDto(
        String quizId,
        boolean correct,
        String correctOptionKey,
        String explanation,
        List<Citation> citations
) {
}
