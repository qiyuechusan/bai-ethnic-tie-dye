package com.baizu.tiedye.ai.client;

/**
 * 手写的大模型调用抽象。在线实现走 DashScope OpenAI 兼容接口，
 * 离线实现直接抛 AiUnavailableException，由上层 Agent 走规则兜底。
 */
public interface LlmClient {

    boolean isAvailable();

    String modelId();

    LlmResult chat(LlmRequest request);
}
