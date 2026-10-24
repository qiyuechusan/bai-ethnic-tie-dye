package com.baizu.tiedye.ai.client;

/**
 * DashScope 非对称检索建议区分 query / document 文本类型。
 */
public enum EmbeddingPurpose {
    QUERY("query"),
    DOCUMENT("document");

    private final String apiValue;

    EmbeddingPurpose(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }
}
