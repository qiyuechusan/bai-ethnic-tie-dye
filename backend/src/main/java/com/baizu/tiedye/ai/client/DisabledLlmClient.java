package com.baizu.tiedye.ai.client;

/**
 * 未配置 DashScope Key 时的占位实现。调用方应先判断 isAvailable，
 * 或捕获 AiUnavailableException 后走离线 planner。
 */
public class DisabledLlmClient implements LlmClient {

    private final String reason;

    public DisabledLlmClient(String reason) {
        this.reason = reason;
    }

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public String modelId() {
        return "offline";
    }

    @Override
    public LlmResult chat(LlmRequest request) {
        throw new AiUnavailableException(reason);
    }
}
