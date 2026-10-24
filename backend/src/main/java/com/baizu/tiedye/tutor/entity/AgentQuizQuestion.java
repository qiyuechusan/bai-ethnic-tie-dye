package com.baizu.tiedye.tutor.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * 模块 6 动态生成的题目。正确答案只留在服务端，判题后才返回。
 */
@Entity
@Table(name = "agent_quiz_question",
        uniqueConstraints = @UniqueConstraint(name = "uk_aqq_quiz_key", columnNames = "quiz_key"),
        indexes = @Index(name = "idx_aqq_session_status", columnList = "session_id, status"))
public class AgentQuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quiz_key", nullable = false, length = 36)
    private String quizKey;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "actor_key", length = 96)
    private String actorKey;

    @Column(length = 64)
    private String topic;

    @Column(nullable = false)
    private Integer difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String stem;

    @Column(name = "options_json", nullable = false, columnDefinition = "LONGTEXT")
    private String optionsJson;

    @Column(name = "correct_key", nullable = false, length = 1)
    private String correctKey;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "citations_json", columnDefinition = "LONGTEXT")
    private String citationsJson;

    @Column(length = 16)
    private String origin;

    @Column(length = 16)
    private String status;

    @Column(name = "selected_key", length = 1)
    private String selectedKey;

    private Boolean correct;

    @Column(name = "answered_at")
    private Instant answeredAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuizKey() {
        return quizKey;
    }

    public void setQuizKey(String quizKey) {
        this.quizKey = quizKey;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getActorKey() {
        return actorKey;
    }

    public void setActorKey(String actorKey) {
        this.actorKey = actorKey;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }

    public String getStem() {
        return stem;
    }

    public void setStem(String stem) {
        this.stem = stem;
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public void setOptionsJson(String optionsJson) {
        this.optionsJson = optionsJson;
    }

    public String getCorrectKey() {
        return correctKey;
    }

    public void setCorrectKey(String correctKey) {
        this.correctKey = correctKey;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getCitationsJson() {
        return citationsJson;
    }

    public void setCitationsJson(String citationsJson) {
        this.citationsJson = citationsJson;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSelectedKey() {
        return selectedKey;
    }

    public void setSelectedKey(String selectedKey) {
        this.selectedKey = selectedKey;
    }

    public Boolean getCorrect() {
        return correct;
    }

    public void setCorrect(Boolean correct) {
        this.correct = correct;
    }

    public Instant getAnsweredAt() {
        return answeredAt;
    }

    public void setAnsweredAt(Instant answeredAt) {
        this.answeredAt = answeredAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
