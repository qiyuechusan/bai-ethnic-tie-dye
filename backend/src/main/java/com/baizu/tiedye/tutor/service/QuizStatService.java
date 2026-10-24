package com.baizu.tiedye.tutor.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.tutor.dto.QuizStatDto;
import com.baizu.tiedye.tutor.dto.TutorStatsDto;
import com.baizu.tiedye.tutor.entity.UserQuizStat;
import com.baizu.tiedye.tutor.repository.UserQuizStatRepository;

/**
 * 学习画像：按 actor + topic 累计正确率、连击、掌握度，并给出下一题难度。
 */
@Service
public class QuizStatService {

    private static final String DEFAULT_TOPIC = "differentiation";

    private final UserQuizStatRepository repository;

    public QuizStatService(UserQuizStatRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public QuizStatDto record(String actorKey,
                              Long userId,
                              Long sessionId,
                              String topic,
                              Integer difficulty,
                              boolean correct) {
        String safeTopic = topic == null || topic.isBlank() ? DEFAULT_TOPIC : topic;
        UserQuizStat stat = repository.findByActorKeyAndTopic(actorKey, safeTopic).orElseGet(() -> {
            UserQuizStat created = new UserQuizStat();
            created.setActorKey(actorKey);
            created.setTopic(safeTopic);
            created.setAttempts(0);
            created.setCorrect(0);
            created.setStreak(0);
            created.setBestStreak(0);
            created.setMastery(0.5);
            return created;
        });
        if (userId != null) {
            stat.setUserId(userId);
        }
        if (sessionId != null) {
            stat.setSessionId(sessionId);
        }
        int attempts = (stat.getAttempts() == null ? 0 : stat.getAttempts()) + 1;
        int totalCorrect = (stat.getCorrect() == null ? 0 : stat.getCorrect()) + (correct ? 1 : 0);
        int streak = correct ? (stat.getStreak() == null ? 0 : stat.getStreak()) + 1 : 0;
        int bestStreak = Math.max(stat.getBestStreak() == null ? 0 : stat.getBestStreak(), streak);
        int lastDifficulty = difficulty == null ? 2 : Math.max(1, Math.min(3, difficulty));
        stat.setAttempts(attempts);
        stat.setCorrect(totalCorrect);
        stat.setStreak(streak);
        stat.setBestStreak(bestStreak);
        stat.setLastDifficulty(lastDifficulty);
        stat.setMastery((totalCorrect + 1.0) / (attempts + 2.0));
        int nextDifficulty = nextDifficulty(attempts, totalCorrect, lastDifficulty);
        repository.save(stat);
        return toDto(stat, nextDifficulty);
    }

    @Transactional(readOnly = true)
    public TutorStatsDto overview(String actorKey) {
        List<UserQuizStat> rows = repository.findByActorKeyOrderByUpdatedAtDesc(actorKey);
        int attempts = rows.stream().mapToInt(row -> row.getAttempts() == null ? 0 : row.getAttempts()).sum();
        int correct = rows.stream().mapToInt(row -> row.getCorrect() == null ? 0 : row.getCorrect()).sum();
        double accuracy = attempts == 0 ? 0.0 : (double) correct / attempts;
        List<QuizStatDto> topics = rows.stream()
                .map(row -> toDto(row, nextDifficulty(
                        row.getAttempts() == null ? 0 : row.getAttempts(),
                        row.getCorrect() == null ? 0 : row.getCorrect(),
                        row.getLastDifficulty() == null ? 2 : row.getLastDifficulty())))
                .toList();
        return new TutorStatsDto(actorKey, attempts, correct, accuracy, topics);
    }

    @Transactional(readOnly = true)
    public String weakestTopic(String actorKey) {
        return repository.findByActorKeyOrderByUpdatedAtDesc(actorKey).stream()
                .min((left, right) -> {
                    double l = left.getMastery() == null ? 0.5 : left.getMastery();
                    double r = right.getMastery() == null ? 0.5 : right.getMastery();
                    if (Math.abs(l - r) > 1e-9) {
                        return Double.compare(l, r);
                    }
                    int la = left.getAttempts() == null ? 0 : left.getAttempts();
                    int ra = right.getAttempts() == null ? 0 : right.getAttempts();
                    return Integer.compare(la, ra);
                })
                .map(UserQuizStat::getTopic)
                .orElse(DEFAULT_TOPIC);
    }

    @Transactional(readOnly = true)
    public int nextDifficulty(String actorKey, String topic) {
        return repository.findByActorKeyAndTopic(actorKey, topic == null ? DEFAULT_TOPIC : topic)
                .map(row -> nextDifficulty(
                        row.getAttempts() == null ? 0 : row.getAttempts(),
                        row.getCorrect() == null ? 0 : row.getCorrect(),
                        row.getLastDifficulty() == null ? 2 : row.getLastDifficulty()))
                .orElse(2);
    }

    private static int nextDifficulty(int attempts, int correct, int current) {
        if (attempts < 2) {
            return Math.max(1, Math.min(3, current));
        }
        double accuracy = (double) correct / attempts;
        if (accuracy < 0.5) {
            return Math.max(1, current - 1);
        }
        if (accuracy > 0.8) {
            return Math.min(3, current + 1);
        }
        return Math.max(1, Math.min(3, current));
    }

    private static QuizStatDto toDto(UserQuizStat stat, int nextDifficulty) {
        int attempts = stat.getAttempts() == null ? 0 : stat.getAttempts();
        int correct = stat.getCorrect() == null ? 0 : stat.getCorrect();
        double accuracy = attempts == 0 ? 0.0 : (double) correct / attempts;
        double mastery = stat.getMastery() == null ? 0.5 : stat.getMastery();
        return new QuizStatDto(
                stat.getTopic(),
                attempts,
                correct,
                accuracy,
                mastery,
                stat.getStreak() == null ? 0 : stat.getStreak(),
                stat.getBestStreak() == null ? 0 : stat.getBestStreak(),
                nextDifficulty);
    }
}
