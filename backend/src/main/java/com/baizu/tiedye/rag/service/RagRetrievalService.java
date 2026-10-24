package com.baizu.tiedye.rag.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.EmbeddingClient;
import com.baizu.tiedye.ai.client.EmbeddingPurpose;
import com.baizu.tiedye.ai.client.local.LocalHashEmbeddingClient;
import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.QueryAliasExpander.QueryTerms;

/**
 * 手写 RAG 检索：向量余弦 + 关键词 + 元数据混合打分，全部在 JVM 内完成。
 */
@Service
public class RagRetrievalService {

    private static final Logger log = LoggerFactory.getLogger(RagRetrievalService.class);
    private static final Set<String> DEFAULT_ROLES = Set.of("fact", "simulation");

    private final RagIndexService indexService;
    private final EmbeddingClient embeddingClient;
    private final LocalHashEmbeddingClient localEmbeddingClient;
    private final QueryAliasExpander aliasExpander;
    private final HybridScorer scorer;
    private final AiProperties properties;
    private final Map<String, RetrievalResult> cache = new ConcurrentHashMap<>();

    public RagRetrievalService(RagIndexService indexService,
                               EmbeddingClient embeddingClient,
                               @Qualifier("localHashEmbeddingClient") LocalHashEmbeddingClient localEmbeddingClient,
                               QueryAliasExpander aliasExpander,
                               HybridScorer scorer,
                               AiProperties properties) {
        this.indexService = indexService;
        this.embeddingClient = embeddingClient;
        this.localEmbeddingClient = localEmbeddingClient;
        this.aliasExpander = aliasExpander;
        this.scorer = scorer;
        this.properties = properties;
    }

    public RetrievalResult retrieve(String query, int topK, Set<String> categories) {
        return retrieve(query, topK, categories, DEFAULT_ROLES, null, null, null);
    }

    public RetrievalResult retrieve(String query,
                                    int topK,
                                    Set<String> categories,
                                    Set<String> roles,
                                    String fabric,
                                    String motif,
                                    String boostChunkKey) {
        RagIndexService.Snapshot snapshot = indexService.snapshot();
        if (snapshot.chunks().isEmpty()) {
            return RetrievalResult.empty(snapshot.embeddingModel());
        }
        int safeTopK = topK <= 0 ? properties.getRag().getTopK() : Math.min(topK, 20);
        Set<String> safeRoles = (roles == null || roles.isEmpty()) ? DEFAULT_ROLES : roles;
        Set<String> safeCategories = categories == null ? Set.of() : categories;

        String cacheKey = snapshot.version() + "|" + safeTopK + "|" + safeCategories + "|" + safeRoles
                + "|" + fabric + "|" + motif + "|" + boostChunkKey + "|" + query;
        RetrievalResult cached = cache.get(cacheKey);
        if (cached != null) {
            return cached;
        }
        if (cache.size() > 400) {
            cache.clear();
        }

        QueryTerms queryTerms = aliasExpander.analyze(query);
        double[] queryVector = embedQuery(query, snapshot.embeddingModel());

        List<RagHit> hits = new ArrayList<>();
        for (RagIndexService.IndexedChunk chunk : snapshot.chunks()) {
            if (!safeRoles.contains(chunk.role())) {
                continue;
            }
            if (!safeCategories.isEmpty() && !safeCategories.contains(chunk.category())) {
                continue;
            }
            double vectorScore = queryVector != null && chunk.hasEmbedding()
                    ? clamp(VectorSimilarityUtil.cosine(queryVector, chunk.embedding()))
                    : 0.0;
            double keywordScore = scorer.keywordScore(
                    chunk.title(), chunk.keywords(), chunk.content(), queryTerms);
            double metadataScore = scorer.metadataScore(
                    chunk.category(), chunk.metadataJson(), queryTerms, safeCategories, fabric, motif);

            double score = queryVector != null
                    ? 0.55 * vectorScore + 0.35 * keywordScore + 0.10 * metadataScore
                    : 0.72 * keywordScore + 0.28 * metadataScore;
            if (boostChunkKey != null && boostChunkKey.equals(chunk.chunkKey())) {
                score += 0.12;
            }
            hits.add(new RagHit(
                    chunk.chunkKey(),
                    chunk.title(),
                    chunk.category(),
                    chunk.content(),
                    chunk.source(),
                    chunk.sourceUrl(),
                    chunk.confidence(),
                    chunk.role(),
                    clamp(score),
                    vectorScore,
                    keywordScore,
                    metadataScore));
        }

        hits.sort(Comparator.comparingDouble(RagHit::score).reversed());
        List<RagHit> top = hits.size() > safeTopK ? List.copyOf(hits.subList(0, safeTopK)) : List.copyOf(hits);
        double topScore = top.isEmpty() ? 0.0 : top.get(0).score();
        boolean matched = topScore >= properties.getRag().getMinScore();
        boolean lowConfidence = topScore < properties.getRag().getLowConfidence();
        if (!top.isEmpty() && log.isDebugEnabled()) {
            RagHit best = top.get(0);
            log.debug("RAG top query='{}' key={} score={} vector={} keyword={} metadata={}",
                    query, best.chunkKey(),
                    String.format("%.4f", best.score()),
                    String.format("%.4f", best.vectorScore()),
                    String.format("%.4f", best.keywordScore()),
                    String.format("%.4f", best.metadataScore()));
        }
        RetrievalResult result = new RetrievalResult(
                top, matched, lowConfidence, snapshot.embeddingModel(), topScore);
        cache.put(cacheKey, result);
        return result;
    }

    public RagHit canonicalProfile() {
        for (RagIndexService.IndexedChunk chunk : indexService.snapshot().chunks()) {
            if ("sim_oxidation_profile_v1".equals(chunk.chunkKey())) {
                return new RagHit(
                        chunk.chunkKey(), chunk.title(), chunk.category(), chunk.content(),
                        chunk.source(), chunk.sourceUrl(), chunk.confidence(), chunk.role(),
                        1.0, 1.0, 1.0, 1.0);
            }
        }
        return null;
    }

    public RagHit hitByKey(String chunkKey) {
        for (RagIndexService.IndexedChunk chunk : indexService.snapshot().chunks()) {
            if (chunk.chunkKey().equals(chunkKey)) {
                return new RagHit(
                        chunk.chunkKey(), chunk.title(), chunk.category(), chunk.content(),
                        chunk.source(), chunk.sourceUrl(), chunk.confidence(), chunk.role(),
                        1.0, 1.0, 1.0, 1.0);
            }
        }
        return null;
    }

    private double[] embedQuery(String query, String indexModel) {
        if (indexModel == null || "mixed".equals(indexModel) || query == null || query.isBlank()) {
            return null;
        }
        try {
            if (indexModel.equals(embeddingClient.modelId())) {
                return embeddingClient.embedOne(query, EmbeddingPurpose.QUERY);
            }
            if (indexModel.equals(localEmbeddingClient.modelId())) {
                return localEmbeddingClient.embedOne(query, EmbeddingPurpose.QUERY);
            }
            log.warn("索引 embedding 模型 {} 与当前客户端 {} 不一致，本轮只做关键词检索",
                    indexModel, embeddingClient.modelId());
        } catch (AiUnavailableException ex) {
            log.warn("查询向量化失败，降级为关键词检索: {}", ex.getMessage());
        }
        return null;
    }

    private static double clamp(double value) {
        if (Double.isNaN(value)) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(1.0, value));
    }
}
