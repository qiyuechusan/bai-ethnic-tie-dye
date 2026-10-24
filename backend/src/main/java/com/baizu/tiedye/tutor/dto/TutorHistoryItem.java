package com.baizu.tiedye.tutor.dto;

import java.time.Instant;

import com.fasterxml.jackson.databind.JsonNode;

public record TutorHistoryItem(
        Integer turnNo,
        String role,
        String content,
        JsonNode payload,
        Instant createdAt
) {
}
