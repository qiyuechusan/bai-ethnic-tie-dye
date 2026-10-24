package com.baizu.tiedye.rag.ingest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.EmbeddingClient;
import com.baizu.tiedye.ai.client.EmbeddingPurpose;
import com.baizu.tiedye.ai.client.local.LocalHashEmbeddingClient;
import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.ai.runtime.AiRuntimeStatus;
import com.baizu.tiedye.rag.entity.DyeKnowledgeChunk;
import com.baizu.tiedye.rag.model.KnowledgeSeed;
import com.baizu.tiedye.rag.repository.DyeKnowledgeChunkRepository;
import com.baizu.tiedye.rag.service.RagIndexService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 知识库启动入库：
 * 1) 读取 9 个语料文件 + 1 个模拟参数 profile；
 * 2) 按 chunkKey upsert；
 * 3) 有 Key 用 DashScope；无 Key 生产模式跳过向量，测试环境可开启本地兜底；
 * 4) 生产环境远程 embedding 失败时只保留已有向量，不回退模拟向量；
 * 5) 重建内存索引；预置题库只在测试/显式开启离线兜底时写入。
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 100)
public class RagKnowledgeSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RagKnowledgeSeeder.class);

    private final KnowledgeSeedLoader loader;
    private final DyeKnowledgeChunkRepository chunkRepository;
    private final EmbeddingClient embeddingClient;
    private final LocalHashEmbeddingClient localEmbeddingClient;
    private final AiRuntimeStatus runtimeStatus;
    private final RagIndexService indexService;
    private final ObjectMapper objectMapper;
    private final AiProperties properties;

    public RagKnowledgeSeeder(KnowledgeSeedLoader loader,
                              DyeKnowledgeChunkRepository chunkRepository,
                              EmbeddingClient embeddingClient,
                              @Qualifier("localHashEmbeddingClient") LocalHashEmbeddingClient localEmbeddingClient,
                              AiRuntimeStatus runtimeStatus,
                              RagIndexService indexService,
                              ObjectMapper objectMapper,
                              AiProperties properties) {
        this.loader = loader;
        this.chunkRepository = chunkRepository;
        this.embeddingClient = embeddingClient;
        this.localEmbeddingClient = localEmbeddingClient;
        this.runtimeStatus = runtimeStatus;
        this.indexService = indexService;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seed(false);
    }

    @Transactional
    public SeedResult reindex(boolean force) {
        return seed(force);
    }

    private SeedResult seed(boolean force) {
        List<KnowledgeSeed> seeds = new ArrayList<>(loader.loadChunks());
        seeds.add(loader.loadProfile());

        boolean allowOfflineFallback = properties.isAllowOfflineFallback();
        boolean canEmbed = embeddingClient.isRemote() || allowOfflineFallback;

        List<DyeKnowledgeChunk> existingRows = chunkRepository.findAll();
        if (!canEmbed) {
            // 生产默认不生成离线模拟向量；同时清掉旧版本留下的本地哈希向量。
            for (DyeKnowledgeChunk row : existingRows) {
                if (localEmbeddingClient.modelId().equals(row.getEmbeddingModel())) {
                    row.setEmbedding(null);
                    row.setEmbeddingModel(null);
                    row.setEmbeddingDim(null);
                    chunkRepository.save(row);
                }
            }
        }
        boolean forceAll = canEmbed && (force || needsFullRebuild(existingRows));
        if (forceAll && !existingRows.isEmpty()) {
            log.info("检测到 embedding 模型/维度变化或强制重建，将全量重新向量化");
        }

        EmbeddingClient target = embeddingClient;
        String targetModel = target.modelId();
        int targetDimension = target.dimensions();
        boolean degraded = !canEmbed;
        String degradedReason = !canEmbed
                ? "未配置 DASHSCOPE_API_KEY，AI 功能不可用"
                : runtimeStatus.getDegradedReason();

        List<RagSeedPair> pairs = new ArrayList<>();
        List<String> toEmbedTexts = new ArrayList<>();
        for (KnowledgeSeed seed : seeds) {
            String hash = hash(seed);
            DyeKnowledgeChunk existing = existingRows.stream()
                    .filter(row -> row.getChunkKey().equals(seed.chunkKey()))
                    .findFirst()
                    .orElse(null);
            boolean needs = canEmbed && (forceAll
                    || existing == null
                    || existing.getEmbedding() == null
                    || existing.getEmbedding().isBlank()
                    || !target.modelId().equals(existing.getEmbeddingModel())
                    || existing.getEmbeddingDim() == null
                    || existing.getEmbeddingDim() != target.dimensions()
                    || !hash.equals(existing.getContentHash()));
            pairs.add(new RagSeedPair(seed, existing, hash, needs));
            if (needs) {
                toEmbedTexts.add(embedText(seed));
            }
        }

        List<double[]> vectors;
        if (!canEmbed) {
            vectors = List.of();
        } else {
            try {
                vectors = target.embed(toEmbedTexts, EmbeddingPurpose.DOCUMENT);
            } catch (AiUnavailableException ex) {
                if (!allowOfflineFallback) {
                    log.warn("远程 embedding 失败，保留已有向量并仅使用关键词检索: {}", ex.getMessage());
                    degraded = true;
                    degradedReason = "DashScope embedding 调用失败，仅使用关键词检索";
                    vectors = List.of();
                    for (RagSeedPair pair : pairs) {
                        pair.needsEmbedding = false;
                    }
                } else {
                    log.warn("远程 embedding 失败，测试环境回退本地哈希向量: {}", ex.getMessage());
                    degraded = true;
                    degradedReason = "DashScope embedding 调用失败，知识库已回退本地向量";
                    target = localEmbeddingClient;
                    targetModel = target.modelId();
                    targetDimension = target.dimensions();
                    toEmbedTexts = seeds.stream().map(this::embedText).toList();
                    vectors = target.embed(toEmbedTexts, EmbeddingPurpose.DOCUMENT);
                    for (RagSeedPair pair : pairs) {
                        pair.needsEmbedding = true;
                    }
                }
            }
        }

        int vectorIndex = 0;
        for (RagSeedPair pair : pairs) {
            if (pair.needsEmbedding) {
                pair.embedding = vectors.get(vectorIndex++);
            }
        }

        Set<String> seedKeys = new LinkedHashSet<>();
        for (RagSeedPair pair : pairs) {
            seedKeys.add(pair.seed.chunkKey());
            DyeKnowledgeChunk row = pair.existing == null ? new DyeKnowledgeChunk() : pair.existing;
            row.setChunkKey(pair.seed.chunkKey());
            row.setCategory(pair.seed.category());
            row.setTitle(pair.seed.title());
            row.setContent(pair.seed.text());
            row.setKeywords(String.join(",", pair.seed.keywords()));
            row.setMetadataJson(toJson(pair.seed.metadata()));
            row.setSource(pair.seed.source());
            row.setSourceUrl(pair.seed.sourceUrl());
            row.setConfidence(pair.seed.confidence());
            row.setRole(pair.seed.role());
            row.setEnabled(Boolean.TRUE);
            row.setContentHash(pair.hash);
            if (pair.needsEmbedding && pair.embedding != null) {
                row.setEmbedding(toJson(pair.embedding));
                row.setEmbeddingModel(targetModel);
                row.setEmbeddingDim(pair.embedding.length);
            }
            chunkRepository.save(row);
        }

        for (DyeKnowledgeChunk row : existingRows) {
            if (!seedKeys.contains(row.getChunkKey()) && Boolean.TRUE.equals(row.getEnabled())) {
                row.setEnabled(Boolean.FALSE);
                chunkRepository.save(row);
            }
        }

        indexService.reload();
        indexService.markReady();
        runtimeStatus.setKnowledgeCount(indexService.chunkCount());
        runtimeStatus.setIndexEmbeddingModel(indexService.activeEmbeddingModel());
        if (degraded) {
            runtimeStatus.setDegradedReason(degradedReason);
        }
        log.info("RAG seeded: chunks={} embeddingModel={} degraded={}",
                indexService.chunkCount(), runtimeStatus.getIndexEmbeddingModel(), degraded);
        return new SeedResult(indexService.chunkCount(), runtimeStatus.getIndexEmbeddingModel(), degraded);
    }

    private boolean needsFullRebuild(List<DyeKnowledgeChunk> rows) {
        if (rows.isEmpty()) {
            return false;
        }
        for (DyeKnowledgeChunk row : rows) {
            if (!Boolean.TRUE.equals(row.getEnabled())) {
                continue;
            }
            if (!embeddingClient.modelId().equals(row.getEmbeddingModel())
                    || row.getEmbeddingDim() == null
                    || row.getEmbeddingDim() != embeddingClient.dimensions()) {
                return true;
            }
        }
        return false;
    }

    private String embedText(KnowledgeSeed seed) {
        return "标题：" + seed.title() + "\n关键词：" + String.join("、", seed.keywords())
                + "\n正文：" + seed.text();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("JSON 序列化失败", ex);
        }
    }

    private static String hash(KnowledgeSeed seed) {
        String raw = seed.title() + "\n" + seed.text() + "\n" + String.join(",", seed.keywords());
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 不可用", ex);
        }
    }

    public record SeedResult(int chunkCount, String embeddingModel, boolean degraded) {
    }

    private static final class RagSeedPair {
        private final KnowledgeSeed seed;
        private final DyeKnowledgeChunk existing;
        private final String hash;
        private boolean needsEmbedding;
        private double[] embedding;

        private RagSeedPair(KnowledgeSeed seed, DyeKnowledgeChunk existing, String hash, boolean needsEmbedding) {
            this.seed = seed;
            this.existing = existing;
            this.hash = hash;
            this.needsEmbedding = needsEmbedding;
        }
    }
}
