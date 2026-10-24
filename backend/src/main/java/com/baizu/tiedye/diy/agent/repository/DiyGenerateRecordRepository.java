package com.baizu.tiedye.diy.agent.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.diy.agent.entity.DiyGenerateRecord;

public interface DiyGenerateRecordRepository extends JpaRepository<DiyGenerateRecord, Long> {

    Optional<DiyGenerateRecord> findTopBySessionIdOrderByCreatedAtDesc(Long sessionId);

    List<DiyGenerateRecord> findTop10BySessionIdOrderByCreatedAtDesc(Long sessionId);
}
