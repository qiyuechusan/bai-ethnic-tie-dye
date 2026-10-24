package com.baizu.tiedye.rag.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.rag.entity.DyeKnowledgeChunk;

public interface DyeKnowledgeChunkRepository extends JpaRepository<DyeKnowledgeChunk, Long> {

    Optional<DyeKnowledgeChunk> findByChunkKey(String chunkKey);

    List<DyeKnowledgeChunk> findByEnabledTrue();

    List<DyeKnowledgeChunk> findByEnabledTrueAndCategory(String category);

    List<DyeKnowledgeChunk> findByEnabledTrueAndCategoryOrderByChunkKeyAsc(String category);

    long countByEnabledTrue();

    long countByEnabledTrueAndCategory(String category);
}
