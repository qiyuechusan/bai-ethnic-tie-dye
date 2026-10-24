package com.baizu.tiedye.tutor.model;

import java.util.List;

import com.baizu.tiedye.tutor.dto.QuizOptionDto;
import com.baizu.tiedye.tutor.entity.AgentQuizQuestion;

public record GeneratedQuiz(
        AgentQuizQuestion question,
        List<QuizOptionDto> options,
        String hint
) {
}
