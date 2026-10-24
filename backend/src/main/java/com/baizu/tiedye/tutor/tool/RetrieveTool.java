package com.baizu.tiedye.tutor.tool;

import java.util.Set;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class RetrieveTool implements AgentTool {

    private static final int MAX_PER_TURN = 2;

    private final RagRetrievalService retrievalService;
    private final AiProperties properties;
    private final ObjectMapper objectMapper;

    public RetrieveTool(RagRetrievalService retrievalService, AiProperties properties, ObjectMapper objectMapper) {
        this.retrievalService = retrievalService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "retrieve";
    }

    @Override
    public ToolResult execute(TutorTurnContext context, JsonNode input) {
        if (context.toolCount(name()) >= MAX_PER_TURN) {
            return ToolResult.error("本轮检索次数已达上限");
        }
        String query = input == null ? null : input.path("query").asText(null);
        if (query == null || query.isBlank()) {
            query = context.getMessage();
        }
        String category = input == null ? null : input.path("category").asText(null);
        int topK = input == null ? properties.getRag().getTopK() : input.path("topK").asInt(properties.getRag().getTopK());
        Set<String> categories = category == null || category.isBlank() ? null : Set.of(category);
        RetrievalResult result = retrievalService.retrieve(
                query, topK, categories, Set.of("fact", "simulation"), null, null, null);
        context.addEvidence(result.hits());
        context.incrementTool(name());
        if (result.lowConfidence()) {
            context.setLowConfidence(true);
        }

        ObjectNode data = objectMapper.createObjectNode();
        data.put("matched", result.matched());
        data.put("lowConfidence", result.lowConfidence());
        data.put("topScore", result.topScore());
        ArrayNode hits = data.putArray("hits");
        for (RagHit hit : result.hits()) {
            ObjectNode item = hits.addObject();
            item.put("chunkKey", hit.chunkKey());
            item.put("title", hit.title());
            item.put("category", hit.category());
            item.put("score", hit.score());
            item.put("snippet", hit.snippet());
        }
        String summary = result.hits().isEmpty()
                ? "没有检索到知识分片"
                : "召回 " + result.hits().size() + " 条，最高分 " + String.format("%.3f", result.topScore());
        return ToolResult.ok(summary, data);
    }
}
