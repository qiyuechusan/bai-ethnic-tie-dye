package com.baizu.tiedye.diy.dto;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record DiyMethodDto(
        Long id,
        String code,
        String name,
        String subtitle,
        String description,
        String patternType,
        Integer difficulty,
        JsonNode params,
        List<String> previewColors,
        Integer sortOrder
) {
}
