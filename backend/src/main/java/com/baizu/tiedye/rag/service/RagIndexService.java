package com.baizu.tiedye.rag.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.rag.entity.DyeKnowledgeChunk;
import com.baizu.tiedye.rag.repository.DyeKnowledgeChunkRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * MySQL 向量的内存索引快照。MySQL 仍是唯一事实源，
 * 启动/reindex 后把启用分片和 embedding 反序列化到不可变快照。
 */
@Service
public class RagIndexService {

    private static final Logger log = LoggerFactory.getLogger(RagIndexService.class);

    private final DyeKnowledgeChunkRepository repository;
    private final ObjectMapper objectMapper;
    private final AtomicLong versionGenerator = new AtomicLong();
    private final CountDownLatch readyLatch = new CountDownLatch(1);
    private volatile Snapshot snapshot = Snapshot.empty();

    public RagIndexService(DyeKnowledgeChunkRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public void reload() {
        List<DyeKnowledgeChunk> rows = repository.findByEnabledTrue();
        List<IndexedChunk> chunks = new ArrayList<>(rows.size());
        Set<String> models = new HashSet<>();
        Set<Integer> dimensions = new HashSet<>();

        for (DyeKnowledgeChunk row : rows) {
            double[] embedding = parseEmbedding(row.getEmbedding());
            if (row.getEmbeddingModel() != null) {
                models.add(row.getEmbeddingModel());
            }
            if (row.getEmbeddingDim() != null) {
                dimensions.add(row.getEmbeddingDim());
            }
            chunks.add(new IndexedChunk(
                    row.getId(),
                    row.getChunkKey(),
                    row.getCategory(),
                    row.getTitle(),
                    row.getContent(),
                    row.getKeywords(),
                    row.getMetadataJson(),
                    row.getSource(),
                    row.getSourceUrl(),
                    row.getConfidence(),
                    row.getRole(),
                    embedding));
        }

        String model = models.size() == 1 ? models.iterator().next() : (models.isEmpty() ? null : "mixed");
        int dimension = dimensions.size() == 1 ? dimensions.iterator().next() : (dimensions.isEmpty() ? 0 : -1);
        snapshot = new Snapshot(List.copyOf(chunks), model, dimension, versionGenerator.incrementAndGet());
        log.info("RAG index loaded: chunks={} embeddingModel={} dim={}", chunks.size(), model, dimension);
    }

    public void markReady() {
        readyLatch.countDown();
    }

    /**
     * 启动时知识库仍在远程向量化，AI 请求先等一会儿，
     * 避免拿到空索引后误判为“未收录”或触发无意义的模型重试。
     */
    public boolean awaitReady(long timeout, TimeUnit unit) {
        if (readyLatch.getCount() == 0) {
            return true;
        }
        try {
            return readyLatch.await(timeout, unit);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    public Snapshot snapshot() {
        awaitReady(20, TimeUnit.SECONDS);
        Snapshot current = snapshot;
        if (current.chunks().isEmpty()) {
            reload();
            current = snapshot;
        }
        return current;
    }

    public String activeEmbeddingModel() {
        return snapshot().embeddingModel();
    }

    public int chunkCount() {
        return snapshot().chunks().size();
    }

    private double[] parseEmbedding(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(raw);
            if (!node.isArray()) {
                return null;
            }
            double[] values = new double[node.size()];
            for (int i = 0; i < node.size(); i++) {
                values[i] = node.get(i).asDouble();
            }
            return values;
        } catch (Exception ex) {
            log.warn("无法解析 embedding，分片将只参与关键词检索: {}", ex.getMessage());
            return null;
        }
    }

    public record IndexedChunk(
            Long id,
            String chunkKey,
            String category,
            String title,
            String content,
            String keywords,
            String metadataJson,
            String source,
            String sourceUrl,
            String confidence,
            String role,
            double[] embedding
    ) {
        public boolean hasEmbedding() {
            return embedding != null && embedding.length > 0;
        }
    }

    public record Snapshot(
            List<IndexedChunk> chunks,
            String embeddingModel,
            int dimensions,
            long version
    ) {
        static Snapshot empty() {
            return new Snapshot(List.of(), null, 0, 0);
        }
    }
}
