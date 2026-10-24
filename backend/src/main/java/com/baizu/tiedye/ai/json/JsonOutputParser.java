package com.baizu.tiedye.ai.json;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 从模型输出里提取 JSON：兼容 ```json 代码块、前后解释文字、以及直接返回对象。
 */
@Component
public class JsonOutputParser {

    private final ObjectMapper objectMapper;

    public JsonOutputParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ObjectNode parseObject(String raw) {
        JsonNode node = parse(raw);
        if (!node.isObject()) {
            throw new IllegalArgumentException("模型输出不是 JSON 对象");
        }
        return (ObjectNode) node;
    }

    public JsonNode parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("模型输出为空");
        }
        String content = raw.trim();
        if (content.startsWith("```")) {
            int firstBreak = content.indexOf('\n');
            if (firstBreak > 0) {
                content = content.substring(firstBreak + 1);
            }
            int lastFence = content.lastIndexOf("```");
            if (lastFence >= 0) {
                content = content.substring(0, lastFence);
            }
            content = content.trim();
        }

        try {
            return objectMapper.readTree(content);
        } catch (JsonProcessingException ignored) {
            int start = content.indexOf('{');
            int end = content.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return objectMapper.readTree(content.substring(start, end + 1));
                } catch (JsonProcessingException ex) {
                    throw new IllegalArgumentException("无法解析模型返回的 JSON", ex);
                }
            }
            throw new IllegalArgumentException("无法解析模型返回的 JSON", ignored);
        }
    }
}
