package com.baizu.tiedye.rag.model;

public record RagHit(
        String chunkKey,
        String title,
        String category,
        String content,
        String source,
        String sourceUrl,
        String confidence,
        String role,
        double score,
        double vectorScore,
        double keywordScore,
        double metadataScore
) {

    public String snippet() {
        if (content == null) {
            return "";
        }
        return content.length() > 140 ? content.substring(0, 140) + "…" : content;
    }
}
