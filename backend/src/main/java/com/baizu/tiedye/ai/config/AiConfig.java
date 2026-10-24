package com.baizu.tiedye.ai.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.baizu.tiedye.ai.client.DisabledLlmClient;
import com.baizu.tiedye.ai.client.EmbeddingClient;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.dashscope.DashScopeEmbeddingClient;
import com.baizu.tiedye.ai.client.dashscope.DashScopeLlmClient;
import com.baizu.tiedye.ai.client.local.LocalHashEmbeddingClient;
import com.baizu.tiedye.ai.runtime.AiRuntimeStatus;
import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class AiConfig {

    @Bean
    public LocalHashEmbeddingClient localHashEmbeddingClient(AiProperties properties) {
        return new LocalHashEmbeddingClient(properties.getEmbeddingDimensions());
    }

    @Bean
    public RestClient dashScopeChatRestClient(AiProperties properties) {
        return buildRestClient(properties, properties.getBaseUrl());
    }

    @Bean
    public RestClient dashScopeEmbeddingRestClient(AiProperties properties) {
        return buildRestClient(properties, properties.getNativeBaseUrl());
    }

    @Bean
    public LlmClient llmClient(AiProperties properties,
                               RestClient dashScopeChatRestClient,
                               ObjectMapper objectMapper) {
        if (!properties.isOnlineConfigured()) {
            return new DisabledLlmClient(buildOfflineReason(properties));
        }
        return new DashScopeLlmClient(dashScopeChatRestClient, objectMapper, properties);
    }

    @Bean
    public EmbeddingClient embeddingClient(AiProperties properties,
                                           RestClient dashScopeEmbeddingRestClient,
                                           ObjectMapper objectMapper,
                                           @Qualifier("localHashEmbeddingClient") LocalHashEmbeddingClient local) {
        if (!properties.isOnlineConfigured()) {
            return local;
        }
        return new DashScopeEmbeddingClient(dashScopeEmbeddingRestClient, objectMapper, properties);
    }

    @Bean
    public AiRuntimeStatus aiRuntimeStatus(AiProperties properties) {
        boolean online = properties.isOnlineConfigured();
        String mode = online ? "online" : "offline";
        String reason = online ? null : buildOfflineReason(properties);
        return new AiRuntimeStatus(
                online,
                online,
                properties.getChatModel(),
                online ? properties.getEmbeddingModel() : LocalHashEmbeddingClient.MODEL_ID,
                mode,
                reason);
    }

    private RestClient buildRestClient(AiProperties properties, String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeout = (int) Math.max(1000, properties.getRequestTimeout().toMillis());
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        if (properties.isOnlineConfigured()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey());
        }
        return builder.build();
    }

    private static String buildOfflineReason(AiProperties properties) {
        if ("offline".equalsIgnoreCase(properties.getMode())) {
            return "AI_MODE=offline，使用本地检索与规则生成";
        }
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            return "未配置 DASHSCOPE_API_KEY，使用本地检索与规则生成";
        }
        return "DashScope 不可用，使用本地检索与规则生成";
    }
}
