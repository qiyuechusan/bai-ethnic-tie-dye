package com.baizu.tiedye.ai.runtime;

/**
 * 运行时 AI 状态，供 /api/ai/status 与前端降级徽标读取。
 * knowledgeCount / indexEmbeddingModel 由知识库初始化器写入。
 */
public class AiRuntimeStatus {

    private final boolean llmAvailable;
    private final boolean remoteEmbedding;
    private final String chatModel;
    private final String configuredEmbeddingModel;
    private final String mode;
    private volatile int knowledgeCount;
    private volatile String indexEmbeddingModel;
    private volatile String degradedReason;

    public AiRuntimeStatus(boolean llmAvailable,
                           boolean remoteEmbedding,
                           String chatModel,
                           String configuredEmbeddingModel,
                           String mode,
                           String degradedReason) {
        this.llmAvailable = llmAvailable;
        this.remoteEmbedding = remoteEmbedding;
        this.chatModel = chatModel;
        this.configuredEmbeddingModel = configuredEmbeddingModel;
        this.mode = mode;
        this.degradedReason = degradedReason;
    }

    public boolean isLlmAvailable() {
        return llmAvailable;
    }

    public boolean isRemoteEmbedding() {
        return remoteEmbedding;
    }

    public String getChatModel() {
        return chatModel;
    }

    public String getConfiguredEmbeddingModel() {
        return configuredEmbeddingModel;
    }

    public String getMode() {
        return mode;
    }

    public int getKnowledgeCount() {
        return knowledgeCount;
    }

    public void setKnowledgeCount(int knowledgeCount) {
        this.knowledgeCount = knowledgeCount;
    }

    public String getIndexEmbeddingModel() {
        return indexEmbeddingModel;
    }

    public void setIndexEmbeddingModel(String indexEmbeddingModel) {
        this.indexEmbeddingModel = indexEmbeddingModel;
    }

    public String getDegradedReason() {
        return degradedReason;
    }

    public void setDegradedReason(String degradedReason) {
        this.degradedReason = degradedReason;
    }

    public boolean isDegraded() {
        return degradedReason != null && !degradedReason.isBlank();
    }
}
