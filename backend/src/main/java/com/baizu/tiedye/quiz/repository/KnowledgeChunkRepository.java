package com.baizu.tiedye.quiz.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.quiz.entity.KnowledgeChunk;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, Long> {

    Optional<KnowledgeChunk> findByTitle(String title);
}
