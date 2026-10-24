package com.baizu.tiedye.agent.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.agent.entity.AgentSession;

public interface AgentSessionRepository extends JpaRepository<AgentSession, Long> {

    Optional<AgentSession> findBySessionKey(String sessionKey);

    List<AgentSession> findTop20ByUserIdOrderByUpdatedAtDesc(Long userId);

    long deleteByExpiresAtBefore(Instant time);
}
