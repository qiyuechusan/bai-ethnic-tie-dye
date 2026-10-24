package com.baizu.tiedye.diy.agent.dto;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record PatternPlanDto(
        String code,
        String name,
        String subtitle,
        String description,
        String patternType,
        Integer difficulty,
        JsonNode params,
        List<String> previewColors
) {
}
