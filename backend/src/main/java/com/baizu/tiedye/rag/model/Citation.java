package com.baizu.tiedye.rag.model;

/**
 * 返回给前端的引用。只暴露可展示字段，不包含 embedding。
 */
public record Citation(
        String chunkKey,
        String title,
        String category,
        String source,
        String sourceUrl,
        String confidence,
        String snippet
) {

    public static Citation from(RagHit hit) {
        return new Citation(
                hit.chunkKey(),
                hit.title(),
                hit.category(),
                hit.source(),
                hit.sourceUrl(),
                hit.confidence(),
                hit.snippet());
    }
}
