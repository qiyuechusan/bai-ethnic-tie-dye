package com.baizu.tiedye.ai.client.dashscope;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.JsonOutputMode;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.ai.client.LlmResult;
import com.baizu.tiedye.ai.config.AiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * DashScope OpenAI 兼容对话接口。JSON 结构化输出按
 * JSON Schema → JSON Object → 普通文本 三级降级。
 */
public class DashScopeLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(DashScopeLlmClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AiProperties properties;

    public DashScopeLlmClient(RestClient restClient, ObjectMapper objectMapper, AiProperties properties) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Override
    public boolean isAvailable() {
        return properties.isOnlineConfigured();
    }

    @Override
    public String modelId() {
        return properties.getChatModel();
    }

    @Override
    public LlmResult chat(LlmRequest request) {
        if (!isAvailable()) {
            throw new AiUnavailableException("未配置 DASHSCOPE_API_KEY");
        }
        JsonOutputMode mode = request.outputMode();
        if (mode == JsonOutputMode.JSON_SCHEMA && request.jsonSchema() == null) {
            mode = JsonOutputMode.JSON_OBJECT;
        }

        int attempts = 0;
        while (attempts < 3) {
            attempts++;
            try {
                return call(request, mode);
            } catch (RestClientResponseException ex) {
                int status = ex.getStatusCode().value();
                if (status == 401 || status == 403) {
                    throw new AiUnavailableException("DashScope 鉴权失败（HTTP " + status + "）", ex);
                }
                if (status == 400 && mode == JsonOutputMode.JSON_SCHEMA) {
                    log.warn("DashScope 不接受 json_schema，降级为 json_object");
                    mode = JsonOutputMode.JSON_OBJECT;
                    continue;
                }
                if (status == 400 && mode == JsonOutputMode.JSON_OBJECT) {
                    log.warn("DashScope 不接受 json_object，降级为普通文本");
                    mode = JsonOutputMode.TEXT;
                    continue;
                }
                if ((status == 429 || status >= 500) && attempts < 3) {
                    sleep(700L * attempts);
                    continue;
                }
                throw new AiUnavailableException("DashScope 调用失败（HTTP " + status + "）", ex);
            } catch (ResourceAccessException ex) {
                if (attempts < 3) {
                    sleep(700L * attempts);
                    continue;
                }
                throw new AiUnavailableException("DashScope 网络不可达或超时", ex);
            } catch (AiUnavailableException ex) {
                throw ex;
            } catch (RuntimeException ex) {
                // 连接重置、响应解码失败等非标准异常也统一转成可降级异常，
                // 避免冒泡到全局异常处理器变成“服务器开小差了”。
                throw new AiUnavailableException("DashScope 调用异常：" + ex.getMessage(), ex);
            }
        }
        throw new AiUnavailableException("DashScope 调用重试次数已用尽");
    }

    private LlmResult call(LlmRequest request, JsonOutputMode mode) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", properties.getChatModel());
        body.put("temperature", request.temperature());
        body.put("max_tokens", request.maxTokens());
        // qwen3.7-plus 默认会开启思考模式，先生成 reasoning token 再输出，
        // 对参数生成/意图解析这类任务没有必要，关闭后可显著降低延迟。
        body.put("enable_thinking", properties.isEnableThinking());
        ArrayNode messages = body.putArray("messages");
        for (LlmMessage message : request.messages()) {
            ObjectNode item = messages.addObject();
            item.put("role", message.role());
            item.put("content", message.content());
        }

        if (mode == JsonOutputMode.JSON_OBJECT) {
            ObjectNode responseFormat = body.putObject("response_format");
            responseFormat.put("type", "json_object");
        } else if (mode == JsonOutputMode.JSON_SCHEMA) {
            ObjectNode responseFormat = body.putObject("response_format");
            responseFormat.put("type", "json_schema");
            responseFormat.set("json_schema", request.jsonSchema());
            responseFormat.put("strict", true);
        }

        long started = System.currentTimeMillis();
        String raw = restClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
        long latency = System.currentTimeMillis() - started;

        JsonNode root;
        try {
            root = objectMapper.readTree(raw == null ? "{}" : raw);
        } catch (Exception ex) {
            throw new AiUnavailableException("DashScope 返回了无法解析的响应", ex);
        }

        JsonNode message = root.path("choices").path(0).path("message");
        String content = message.path("content").isTextual()
                ? message.path("content").asText()
                : message.path("content").toString();
        if (content == null || content.isBlank()) {
            throw new AiUnavailableException("DashScope 返回内容为空");
        }

        log.info("DashScope chat task={} mode={} latency={}ms", request.task(), mode, latency);
        return new LlmResult(content, properties.getChatModel(), latency, mode);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
