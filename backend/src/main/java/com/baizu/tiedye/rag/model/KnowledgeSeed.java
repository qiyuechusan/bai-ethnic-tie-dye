package com.baizu.tiedye.rag.model;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 知识库 JSON 的统一内存表示。兼容旧语料的 chunk_id/text/metadata 结构。
 */
public record KnowledgeSeed(
        String chunkKey,
        String category,
        String title,
        String text,
        List<String> keywords,
        JsonNode metadata,
        String source,
        String sourceUrl,
        String confidence,
        String role
) {
}
