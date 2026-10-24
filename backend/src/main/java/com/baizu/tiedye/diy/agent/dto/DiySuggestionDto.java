package com.baizu.tiedye.diy.agent.dto;

public record DiySuggestionDto(
        String id,
        String text,
        String fabric,
        Double concentration,
        String motif
) {
}
