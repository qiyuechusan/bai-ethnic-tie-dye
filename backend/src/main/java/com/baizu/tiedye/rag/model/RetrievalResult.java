package com.baizu.tiedye.rag.model;

import java.util.List;

public record RetrievalResult(
        List<RagHit> hits,
        boolean matched,
        boolean lowConfidence,
        String embeddingModel,
        double topScore
) {

    public static RetrievalResult empty(String embeddingModel) {
        return new RetrievalResult(List.of(), false, true, embeddingModel, 0.0);
    }
}
