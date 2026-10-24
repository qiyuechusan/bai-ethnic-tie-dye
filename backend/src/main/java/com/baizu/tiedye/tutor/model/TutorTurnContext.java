package com.baizu.tiedye.tutor.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.baizu.tiedye.agent.entity.AgentChatHistory;
import com.baizu.tiedye.agent.entity.AgentSession;
import com.baizu.tiedye.agent.service.ActorResolver;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.tutor.dto.QuizStatDto;
import com.baizu.tiedye.tutor.dto.TutorCardDto;
import com.baizu.tiedye.tutor.entity.AgentQuizQuestion;

/**
 * 一轮导师对话的可变上下文。ReAct 循环、离线 planner、工具共享同一份证据与卡片。
 */
public class TutorTurnContext {

    private final AgentSession session;
    private final ActorResolver.Actor actor;
    private final String message;
    private final String scope;
    private final int turnNo;
    private final List<RagHit> evidence = new ArrayList<>();
    private final List<TutorCardDto> cards = new ArrayList<>();
    private final List<String> observations = new ArrayList<>();
    private final Map<String, Integer> toolCounts = new HashMap<>();
    private final List<QuizStatDto> stats = new ArrayList<>();
    private List<AgentChatHistory> history = List.of();
    private AgentQuizQuestion pendingQuiz;

    private String intentType = "qa";
    private String topic;
    private double intentConfidence = 0.6;
    private String answerText;
    private List<String> answerCitationKeys = List.of();
    private List<String> relatedQuestions = List.of();
    private List<String> suggestedPrompts = List.of();
    private boolean lowConfidence;

    public TutorTurnContext(AgentSession session,
                            ActorResolver.Actor actor,
                            String message,
                            String scope,
                            int turnNo) {
        this.session = session;
        this.actor = actor;
        this.message = message;
        this.scope = scope;
        this.turnNo = turnNo;
    }

    public void addEvidence(List<RagHit> hits) {
        if (hits == null) {
            return;
        }
        Set<String> existing = new LinkedHashSet<>(evidenceKeys());
        for (RagHit hit : hits) {
            if (existing.add(hit.chunkKey())) {
                evidence.add(hit);
            }
        }
    }

    public Set<String> evidenceKeys() {
        Set<String> keys = new LinkedHashSet<>();
        evidence.forEach(hit -> keys.add(hit.chunkKey()));
        return keys;
    }

    public void addCard(TutorCardDto card) {
        cards.add(card);
    }

    public void addObservation(String observation) {
        observations.add(observation);
    }

    public void incrementTool(String name) {
        toolCounts.merge(name, 1, Integer::sum);
    }

    public int toolCount(String name) {
        return toolCounts.getOrDefault(name, 0);
    }

    public int totalToolCalls() {
        return toolCounts.values().stream().mapToInt(Integer::intValue).sum();
    }

    public AgentSession getSession() {
        return session;
    }

    public ActorResolver.Actor getActor() {
        return actor;
    }

    public String getMessage() {
        return message;
    }

    public String getScope() {
        return scope;
    }

    public int getTurnNo() {
        return turnNo;
    }

    public List<RagHit> getEvidence() {
        return evidence;
    }

    public List<TutorCardDto> getCards() {
        return cards;
    }

    public List<String> getObservations() {
        return observations;
    }

    public List<QuizStatDto> getStats() {
        return stats;
    }

    public void setStats(List<QuizStatDto> stats) {
        this.stats.clear();
        if (stats != null) {
            this.stats.addAll(stats);
        }
    }

    public List<AgentChatHistory> getHistory() {
        return history;
    }

    public void setHistory(List<AgentChatHistory> history) {
        this.history = history == null ? List.of() : List.copyOf(history);
    }

    public AgentQuizQuestion getPendingQuiz() {
        return pendingQuiz;
    }

    public void setPendingQuiz(AgentQuizQuestion pendingQuiz) {
        this.pendingQuiz = pendingQuiz;
    }

    public String getIntentType() {
        return intentType;
    }

    public void setIntentType(String intentType) {
        this.intentType = intentType;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public double getIntentConfidence() {
        return intentConfidence;
    }

    public void setIntentConfidence(double intentConfidence) {
        this.intentConfidence = intentConfidence;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public List<String> getAnswerCitationKeys() {
        return answerCitationKeys;
    }

    public void setAnswerCitationKeys(List<String> answerCitationKeys) {
        this.answerCitationKeys = answerCitationKeys == null ? List.of() : List.copyOf(answerCitationKeys);
    }

    public List<String> getRelatedQuestions() {
        return relatedQuestions;
    }

    public void setRelatedQuestions(List<String> relatedQuestions) {
        this.relatedQuestions = relatedQuestions == null ? List.of() : List.copyOf(relatedQuestions);
    }

    public List<String> getSuggestedPrompts() {
        return suggestedPrompts;
    }

    public void setSuggestedPrompts(List<String> suggestedPrompts) {
        this.suggestedPrompts = suggestedPrompts == null ? List.of() : List.copyOf(suggestedPrompts);
    }

    public boolean isLowConfidence() {
        return lowConfidence;
    }

    public void setLowConfidence(boolean lowConfidence) {
        this.lowConfidence = lowConfidence;
    }
}
