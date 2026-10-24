package com.baizu.tiedye.ai.client.dashscope;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.EmbeddingClient;
import com.baizu.tiedye.ai.client.EmbeddingPurpose;
import com.baizu.tiedye.ai.config.AiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * DashScope 原生同步 Embedding 接口，区分 query/document 文本类型。
 */
public class DashScopeEmbeddingClient implements EmbeddingClient {

    private static final Logger log = LoggerFactory.getLogger(DashScopeEmbeddingClient.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AiProperties properties;

    public DashScopeEmbeddingClient(RestClient restClient, ObjectMapper objectMapper, AiProperties properties) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Override
    public String modelId() {
        return properties.getEmbeddingModel();
    }

    @Override
    public int dimensions() {
        return properties.getEmbeddingDimensions();
    }

    @Override
    public boolean isRemote() {
        return true;
    }

    @Override
    public List<double[]> embed(List<String> texts, EmbeddingPurpose purpose) {
        if (!properties.isOnlineConfigured()) {
            throw new AiUnavailableException("未配置 DASHSCOPE_API_KEY");
        }
        List<double[]> result = new ArrayList<>(texts.size());
        int batchSize = Math.max(1, properties.getEmbeddingBatchSize());
        for (int start = 0; start < texts.size(); start += batchSize) {
            int end = Math.min(texts.size(), start + batchSize);
            result.addAll(embedBatch(texts.subList(start, end), purpose));
        }
        return result;
    }

    private List<double[]> embedBatch(List<String> batch, EmbeddingPurpose purpose) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", properties.getEmbeddingModel());
        ObjectNode input = body.putObject("input");
        ArrayNode textsNode = input.putArray("texts");
        for (String text : batch) {
            textsNode.add(text);
        }
        ObjectNode parameters = body.putObject("parameters");
        parameters.put("text_type", purpose.apiValue());
        parameters.put("dimension", properties.getEmbeddingDimensions());
        parameters.put("output_type", "dense");

        String raw = callWithRetry(body);
        JsonNode root;
        try {
            root = objectMapper.readTree(raw == null ? "{}" : raw);
        } catch (Exception ex) {
            throw new AiUnavailableException("Embedding 响应无法解析", ex);
        }

        JsonNode embeddings = root.path("output").path("embeddings");
        if (!embeddings.isArray() || embeddings.size() != batch.size()) {
            throw new AiUnavailableException("Embedding 返回数量与输入不一致");
        }
        double[][] ordered = new double[batch.size()][];
        for (JsonNode item : embeddings) {
            int index = item.path("text_index").asInt(0);
            if (index < 0 || index >= ordered.length) {
                continue;
            }
            JsonNode vector = item.path("embedding");
            if (!vector.isArray()) {
                throw new AiUnavailableException("Embedding 返回格式不正确");
            }
            double[] values = new double[vector.size()];
            for (int i = 0; i < vector.size(); i++) {
                values[i] = vector.get(i).asDouble();
            }
            ordered[index] = values;
        }
        List<double[]> result = new ArrayList<>(batch.size());
        for (double[] values : ordered) {
            if (values == null) {
                throw new AiUnavailableException("Embedding 返回缺少向量");
            }
            result.add(values);
        }
        return result;
    }

    private String callWithRetry(ObjectNode body) {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                return restClient.post()
                        .uri("/services/embeddings/text-embedding/text-embedding")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientResponseException ex) {
                int status = ex.getStatusCode().value();
                if (status == 401 || status == 403) {
                    throw new AiUnavailableException("Embedding 鉴权失败（HTTP " + status + "）", ex);
                }
                if ((status == 429 || status >= 500) && attempt < 2) {
                    sleep();
                    continue;
                }
                throw new AiUnavailableException("Embedding 调用失败（HTTP " + status + "）", ex);
            } catch (ResourceAccessException ex) {
                if (attempt < 2) {
                    sleep();
                    continue;
                }
                throw new AiUnavailableException("Embedding 网络不可达或超时", ex);
            } catch (AiUnavailableException ex) {
                throw ex;
            } catch (RuntimeException ex) {
                throw new AiUnavailableException("Embedding 调用异常：" + ex.getMessage(), ex);
            }
        }
        throw new AiUnavailableException("Embedding 重试次数已用尽");
    }

    private static void sleep() {
        try {
            Thread.sleep(700);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
