package com.baizu.tiedye.tutor.dto;

import java.time.Instant;

public record TutorSessionItem(
        String sessionId,
        String title,
        String summary,
        Integer turnCount,
        boolean degraded,
        Instant updatedAt
) {
}
