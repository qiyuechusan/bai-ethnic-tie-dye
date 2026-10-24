package com.baizu.tiedye.ai.client;

import java.util.List;

public interface EmbeddingClient {

    String modelId();

    int dimensions();

    boolean isRemote();

    List<double[]> embed(List<String> texts, EmbeddingPurpose purpose);

    default double[] embedOne(String text, EmbeddingPurpose purpose) {
        List<double[]> vectors = embed(List.of(text), purpose);
        if (vectors.isEmpty()) {
            throw new IllegalStateException("embedding 返回为空");
        }
        return vectors.get(0);
    }
}
