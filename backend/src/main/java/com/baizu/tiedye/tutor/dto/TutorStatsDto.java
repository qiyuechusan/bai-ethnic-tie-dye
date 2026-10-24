package com.baizu.tiedye.tutor.dto;

import java.util.List;

public record TutorStatsDto(
        String actorKey,
        int attempts,
        int correct,
        double accuracy,
        List<QuizStatDto> topics
) {
}
