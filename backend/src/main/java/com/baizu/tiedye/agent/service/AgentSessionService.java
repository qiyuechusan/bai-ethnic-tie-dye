package com.baizu.tiedye.agent.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.agent.entity.AgentChatHistory;
import com.baizu.tiedye.agent.entity.AgentSession;
import com.baizu.tiedye.agent.entity.AgentTrace;
import com.baizu.tiedye.agent.repository.AgentChatHistoryRepository;
import com.baizu.tiedye.agent.repository.AgentSessionRepository;
import com.baizu.tiedye.agent.repository.AgentTraceRepository;

@Service
public class AgentSessionService {

    private static final Duration SESSION_TTL = Duration.ofDays(30);
    private static final Pattern KEY_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{6,64}$");

    private final AgentSessionRepository sessionRepository;
    private final AgentChatHistoryRepository historyRepository;
    private final AgentTraceRepository traceRepository;

    public AgentSessionService(AgentSessionRepository sessionRepository,
                               AgentChatHistoryRepository historyRepository,
                               AgentTraceRepository traceRepository) {
        this.sessionRepository = sessionRepository;
        this.historyRepository = historyRepository;
        this.traceRepository = traceRepository;
    }

    @Transactional
    public AgentSession getOrCreate(String sessionKey, String kind, Long userId) {
        String key = normalizeSessionKey(sessionKey);
        AgentSession session = sessionRepository.findBySessionKey(key).orElseGet(() -> {
            AgentSession created = new AgentSession();
            created.setSessionKey(key);
            created.setKind(kind);
            created.setTurnCount(0);
            return created;
        });
        if (userId != null && session.getUserId() == null) {
            session.setUserId(userId);
        }
        if (kind != null && !kind.isBlank()) {
            if (session.getKind() == null) {
                session.setKind(kind);
            } else if (!session.getKind().equals(kind) && !"mixed".equals(session.getKind())) {
                // 同一个 sessionId 同时被模块 5 和模块 6 使用时标记为 mixed。
                session.setKind("mixed");
            }
        }
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        return sessionRepository.save(session);
    }

    public Optional<AgentSession> find(String sessionKey) {
        if (sessionKey == null || sessionKey.isBlank()) {
            return Optional.empty();
        }
        return sessionRepository.findBySessionKey(normalizeSessionKey(sessionKey));
    }

    public String actorKey(Long userId, String sessionKey) {
        return userId == null ? "s:" + normalizeSessionKey(sessionKey) : "u:" + userId;
    }

    @Transactional
    public void appendMessage(Long sessionId, int turnNo, String role, String content, String payloadJson) {
        AgentChatHistory history = new AgentChatHistory();
        history.setSessionId(sessionId);
        history.setTurnNo(turnNo);
        history.setRole(role);
        history.setContent(content);
        history.setPayloadJson(payloadJson);
        historyRepository.save(history);
    }

    @Transactional
    public void recordTrace(Long sessionId, int turnNo, int stepNo, String type, String toolName,
                            Integer latencyMs, Integer tokenIn, Integer tokenOut, String payloadJson) {
        AgentTrace trace = new AgentTrace();
        trace.setSessionId(sessionId);
        trace.setTurnNo(turnNo);
        trace.setStepNo(stepNo);
        trace.setType(type);
        trace.setToolName(toolName);
        trace.setLatencyMs(latencyMs);
        trace.setTokenIn(tokenIn);
        trace.setTokenOut(tokenOut);
        trace.setPayloadJson(truncate(payloadJson, 20000));
        traceRepository.save(trace);
    }

    @Transactional
    public void bumpTurn(AgentSession session) {
        session.setTurnCount((session.getTurnCount() == null ? 0 : session.getTurnCount()) + 1);
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        sessionRepository.save(session);
    }

    @Transactional
    public void updateSummary(AgentSession session, String title, String summary, boolean degraded, String contextJson) {
        if (title != null && !title.isBlank()) {
            session.setTitle(truncate(title, 120));
        }
        if (summary != null && !summary.isBlank()) {
            session.setSummary(truncate(summary, 2000));
        }
        if (contextJson != null) {
            session.setContextJson(contextJson);
        }
        session.setDegraded(degraded);
        sessionRepository.save(session);
    }

    public List<AgentChatHistory> recentHistory(Long sessionId, int turns) {
        List<AgentChatHistory> recent = historyRepository.findTop16BySessionIdOrderByTurnNoDescIdDesc(sessionId);
        int limit = Math.max(1, Math.min(turns * 2, recent.size()));
        if (recent.size() > limit) {
            recent = recent.subList(0, limit);
        }
        List<AgentChatHistory> ordered = new java.util.ArrayList<>(recent);
        java.util.Collections.reverse(ordered);
        return ordered;
    }

    public List<AgentChatHistory> allHistory(Long sessionId) {
        return historyRepository.findBySessionIdOrderByTurnNoAscIdAsc(sessionId);
    }

    public String normalizeSessionKey(String sessionKey) {
        if (sessionKey != null) {
            String trimmed = sessionKey.trim();
            if (KEY_PATTERN.matcher(trimmed).matches()) {
                return trimmed;
            }
        }
        return UUID.randomUUID().toString();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
