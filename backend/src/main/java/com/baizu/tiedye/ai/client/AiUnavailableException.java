package com.baizu.tiedye.ai.client;

/**
 * 模型不可用或调用失败。上层据此切换到离线规则链路，不向前端抛 500。
 */
public class AiUnavailableException extends RuntimeException {

    public AiUnavailableException(String message) {
        super(message);
    }

    public AiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
