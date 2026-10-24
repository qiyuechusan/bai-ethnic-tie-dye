package com.baizu.tiedye.agent.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.agent.entity.AgentTrace;

public interface AgentTraceRepository extends JpaRepository<AgentTrace, Long> {

    List<AgentTrace> findBySessionIdOrderByTurnNoAscStepNoAsc(Long sessionId);
}
