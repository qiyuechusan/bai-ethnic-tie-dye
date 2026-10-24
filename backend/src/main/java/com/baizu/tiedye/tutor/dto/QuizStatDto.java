package com.baizu.tiedye.tutor.dto;

public record QuizStatDto(
        String topic,
        int attempts,
        int correct,
        double accuracy,
        double mastery,
        int streak,
        int bestStreak,
        int nextDifficulty
) {
}
