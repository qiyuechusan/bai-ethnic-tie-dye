package com.baizu.tiedye.atlas.dto;

import java.time.LocalDate;

public record StatsDto(
        String place,
        String placeName,
        Integer workers,
        Integer workshops,
        String annualOutput,
        String annualOutputUnit,
        String sourceNote,
        LocalDate updatedAt
) {
}
