package com.baizu.tiedye.tutor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.tutor.entity.AgentQuizQuestion;

public interface AgentQuizQuestionRepository extends JpaRepository<AgentQuizQuestion, Long> {

    Optional<AgentQuizQuestion> findByQuizKeyAndSessionId(String quizKey, Long sessionId);

    Optional<AgentQuizQuestion> findFirstBySessionIdAndStatusOrderByCreatedAtDesc(Long sessionId, String status);

    List<AgentQuizQuestion> findBySessionIdOrderByCreatedAtDesc(Long sessionId);
}
