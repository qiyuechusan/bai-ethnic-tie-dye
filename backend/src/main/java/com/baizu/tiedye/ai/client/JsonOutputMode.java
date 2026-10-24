package com.baizu.tiedye.ai.client;

/**
 * 结构化输出强度的三级降级：JSON Schema → JSON Object → 普通文本。
 */
public enum JsonOutputMode {
    JSON_SCHEMA,
    JSON_OBJECT,
    TEXT
}
