package com.baizu.tiedye.ai.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * DashScope 与手写 RAG/Agent 的配置入口。所有字段都可以通过环境变量覆盖。
 */
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    /** auto：有 Key 用在线，没有就离线；dashscope：强制在线；offline：强制离线。 */
    private String mode = "auto";
    private String apiKey = "";
    private String baseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    private String nativeBaseUrl = "https://dashscope.aliyuncs.com/api/v1";
    private String chatModel = "qwen3.7-plus";
    private String embeddingModel = "qwen3.7-text-embedding";
    private int embeddingDimensions = 1024;
    private int embeddingBatchSize = 10;
    private Duration requestTimeout = Duration.ofSeconds(20);
    private boolean enableThinking = false;
    private boolean allowOfflineFallback = false;
    private int maxCorrectionRounds = 1;
    private String reindexToken = "";
    private final Rag rag = new Rag();
    private final Agent agent = new Agent();

    public boolean isOnlineConfigured() {
        if ("offline".equalsIgnoreCase(mode)) {
            return false;
        }
        return apiKey != null && !apiKey.isBlank();
    }

    public String resolvedMode() {
        return isOnlineConfigured() ? "online" : "offline";
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getNativeBaseUrl() {
        return nativeBaseUrl;
    }

    public void setNativeBaseUrl(String nativeBaseUrl) {
        this.nativeBaseUrl = nativeBaseUrl;
    }

    public String getChatModel() {
        return chatModel;
    }

    public void setChatModel(String chatModel) {
        this.chatModel = chatModel;
    }

    public String getEmbeddingModel() {
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public int getEmbeddingDimensions() {
        return embeddingDimensions;
    }

    public void setEmbeddingDimensions(int embeddingDimensions) {
        this.embeddingDimensions = embeddingDimensions;
    }

    public int getEmbeddingBatchSize() {
        return embeddingBatchSize;
    }

    public void setEmbeddingBatchSize(int embeddingBatchSize) {
        this.embeddingBatchSize = embeddingBatchSize;
    }

    public Duration getRequestTimeout() {
        return requestTimeout;
    }

    public void setRequestTimeout(Duration requestTimeout) {
        this.requestTimeout = requestTimeout;
    }

    public boolean isEnableThinking() {
        return enableThinking;
    }

    public void setEnableThinking(boolean enableThinking) {
        this.enableThinking = enableThinking;
    }

    public boolean isAllowOfflineFallback() {
        return allowOfflineFallback;
    }

    public void setAllowOfflineFallback(boolean allowOfflineFallback) {
        this.allowOfflineFallback = allowOfflineFallback;
    }

    public int getMaxCorrectionRounds() {
        return maxCorrectionRounds;
    }

    public void setMaxCorrectionRounds(int maxCorrectionRounds) {
        this.maxCorrectionRounds = maxCorrectionRounds;
    }

    public String getReindexToken() {
        return reindexToken;
    }

    public void setReindexToken(String reindexToken) {
        this.reindexToken = reindexToken;
    }

    public Rag getRag() {
        return rag;
    }

    public Agent getAgent() {
        return agent;
    }

    public static class Rag {
        private int topK = 6;
        private double minScore = 0.16;
        // 离线哈希向量的分数区间比真实 embedding 低，0.18 经过域内外校准。
        private double lowConfidence = 0.18;

        public int getTopK() {
            return topK;
        }

        public void setTopK(int topK) {
            this.topK = topK;
        }

        public double getMinScore() {
            return minScore;
        }

        public void setMinScore(double minScore) {
            this.minScore = minScore;
        }

        public double getLowConfidence() {
            return lowConfidence;
        }

        public void setLowConfidence(double lowConfidence) {
            this.lowConfidence = lowConfidence;
        }
    }

    public static class Agent {
        private int maxIterations = 3;
        private int maxToolCalls = 3;
        private int historyTurns = 8;

        public int getMaxIterations() {
            return maxIterations;
        }

        public void setMaxIterations(int maxIterations) {
            this.maxIterations = maxIterations;
        }

        public int getMaxToolCalls() {
            return maxToolCalls;
        }

        public void setMaxToolCalls(int maxToolCalls) {
            this.maxToolCalls = maxToolCalls;
        }

        public int getHistoryTurns() {
            return historyTurns;
        }

        public void setHistoryTurns(int historyTurns) {
            this.historyTurns = historyTurns;
        }
    }
}
