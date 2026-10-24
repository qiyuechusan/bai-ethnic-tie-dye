package com.baizu.tiedye.tutor.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * 按学习者 + 主题累计的答题画像，驱动自适应难度。
 */
@Entity
@Table(name = "user_quiz_stat",
        uniqueConstraints = @UniqueConstraint(name = "uk_uqs_actor_topic", columnNames = {"actor_key", "topic"}),
        indexes = {
                @Index(name = "idx_uqs_user", columnList = "user_id"),
                @Index(name = "idx_uqs_session", columnList = "session_id")
        })
public class UserQuizStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_key", nullable = false, length = 96)
    private String actorKey;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(nullable = false, length = 64)
    private String topic;

    @Column(nullable = false)
    private Integer attempts = 0;

    @Column(nullable = false)
    private Integer correct = 0;

    @Column(nullable = false)
    private Integer streak = 0;

    @Column(name = "best_streak", nullable = false)
    private Integer bestStreak = 0;

    @Column(name = "last_difficulty")
    private Integer lastDifficulty;

    @Column(nullable = false)
    private Double mastery = 0.5;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getActorKey() {
        return actorKey;
    }

    public void setActorKey(String actorKey) {
        this.actorKey = actorKey;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Integer getCorrect() {
        return correct;
    }

    public void setCorrect(Integer correct) {
        this.correct = correct;
    }

    public Integer getStreak() {
        return streak;
    }

    public void setStreak(Integer streak) {
        this.streak = streak;
    }

    public Integer getBestStreak() {
        return bestStreak;
    }

    public void setBestStreak(Integer bestStreak) {
        this.bestStreak = bestStreak;
    }

    public Integer getLastDifficulty() {
        return lastDifficulty;
    }

    public void setLastDifficulty(Integer lastDifficulty) {
        this.lastDifficulty = lastDifficulty;
    }

    public Double getMastery() {
        return mastery;
    }

    public void setMastery(Double mastery) {
        this.mastery = mastery;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
