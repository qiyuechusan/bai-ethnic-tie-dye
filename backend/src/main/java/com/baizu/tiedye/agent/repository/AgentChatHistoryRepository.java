package com.baizu.tiedye.agent.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.agent.entity.AgentChatHistory;

public interface AgentChatHistoryRepository extends JpaRepository<AgentChatHistory, Long> {

    List<AgentChatHistory> findTop16BySessionIdOrderByTurnNoDescIdDesc(Long sessionId);

    List<AgentChatHistory> findBySessionIdOrderByTurnNoAscIdAsc(Long sessionId);
}
