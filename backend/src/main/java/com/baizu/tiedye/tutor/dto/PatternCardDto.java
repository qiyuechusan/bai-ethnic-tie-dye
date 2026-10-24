package com.baizu.tiedye.tutor.dto;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record PatternCardDto(
        Long generationId,
        String methodName,
        String patternType,
        JsonNode params,
        List<String> previewColors,
        JsonNode oxidation,
        String seed,
        String explanation
) {
}
