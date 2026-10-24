package com.baizu.tiedye.diy.agent.dto;

import java.time.Instant;

public record DiyHistoryItem(
        Long generationId,
        String prompt,
        String rendererType,
        String motifType,
        String methodCode,
        String seed,
        boolean degraded,
        Instant createdAt
) {
}
