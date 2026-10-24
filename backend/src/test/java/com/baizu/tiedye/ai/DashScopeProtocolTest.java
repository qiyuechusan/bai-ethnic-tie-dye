package com.baizu.tiedye.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.EmbeddingPurpose;
import com.baizu.tiedye.ai.client.JsonOutputMode;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.ai.client.LlmResult;
import com.baizu.tiedye.ai.client.dashscope.DashScopeEmbeddingClient;
import com.baizu.tiedye.ai.client.dashscope.DashScopeLlmClient;
import com.baizu.tiedye.ai.config.AiProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;

/**
 * 用 JDK 内置 HTTP Server 验证 DashScope 的请求形状，
 * 不依赖真实 API Key，也不需要额外 mock 框架。
 */
class DashScopeProtocolTest {

    @Test
    void chatSendsJsonObjectAndParsesContent() throws Exception {
        AtomicReference<String> captured = new AtomicReference<>();
        HttpServer server = server("/chat/completions", exchange -> {
            captured.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] body = """
                    {"choices":[{"message":{"content":"{\\"action\\":\\"final_answer\\"}"}}]}
                    """.trim().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        try {
            AiProperties properties = properties(server);
            RestClient client = RestClient.builder()
                    .baseUrl(properties.getBaseUrl())
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer test-key")
                    .build();
            DashScopeLlmClient llm = new DashScopeLlmClient(client, new ObjectMapper(), properties);
            LlmResult result = llm.chat(new LlmRequest(
                    "test",
                    List.of(LlmMessage.system("输出 JSON"), LlmMessage.user("你好")),
                    JsonOutputMode.JSON_OBJECT,
                    null,
                    0.3,
                    200));
            assertThat(result.content()).contains("final_answer");
            assertThat(captured.get()).contains("\"response_format\":{\"type\":\"json_object\"}");
            assertThat(captured.get()).contains("\"model\":\"qwen-test\"");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void embeddingSendsTextTypeAndParsesVector() throws Exception {
        AtomicReference<String> captured = new AtomicReference<>();
        HttpServer server = server("/services/embeddings/text-embedding/text-embedding", exchange -> {
            captured.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] body = """
                    {"output":{"embeddings":[{"text_index":0,"embedding":[0.1,0.2,0.3,0.4]}]}}
                    """.trim().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        try {
            AiProperties properties = properties(server);
            RestClient client = RestClient.builder().baseUrl(properties.getNativeBaseUrl()).build();
            DashScopeEmbeddingClient embedding = new DashScopeEmbeddingClient(
                    client, new ObjectMapper(), properties);
            List<double[]> vectors = embedding.embed(List.of("扎染"), EmbeddingPurpose.DOCUMENT);
            assertThat(vectors).hasSize(1);
            assertThat(vectors.get(0)).containsExactly(0.1, 0.2, 0.3, 0.4);
            assertThat(captured.get()).contains("\"text_type\":\"document\"");
            assertThat(captured.get()).contains("\"dimension\":4");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void chatDoesNotRetryOn401() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        HttpServer server = server("/chat/completions", exchange -> {
            calls.incrementAndGet();
            byte[] body = "{\"message\":\"unauthorized\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(401, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        try {
            AiProperties properties = properties(server);
            RestClient client = RestClient.builder().baseUrl(properties.getBaseUrl()).build();
            DashScopeLlmClient llm = new DashScopeLlmClient(client, new ObjectMapper(), properties);
            assertThatThrownBy(() -> llm.chat(new LlmRequest(
                    "test", List.of(LlmMessage.user("你好")), JsonOutputMode.TEXT, null, 0.2, 100)))
                    .isInstanceOf(AiUnavailableException.class);
            assertThat(calls.get()).isEqualTo(1);
        } finally {
            server.stop(0);
        }
    }

    private static AiProperties properties(HttpServer server) {
        String base = "http://127.0.0.1:" + server.getAddress().getPort();
        AiProperties properties = new AiProperties();
        properties.setMode("dashscope");
        properties.setApiKey("test-key");
        properties.setChatModel("qwen-test");
        properties.setEmbeddingModel("embed-test");
        properties.setEmbeddingDimensions(4);
        properties.setBaseUrl(base);
        properties.setNativeBaseUrl(base);
        return properties;
    }

    private static HttpServer server(String path, Handler handler) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext(path, exchange -> {
            try {
                handler.handle(exchange);
            } catch (Exception ex) {
                exchange.sendResponseHeaders(500, -1);
                exchange.close();
            }
        });
        server.start();
        return server;
    }

    @FunctionalInterface
    private interface Handler {
        void handle(com.sun.net.httpserver.HttpExchange exchange) throws Exception;
    }
}
