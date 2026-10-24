package com.baizu.tiedye.bootstrap;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.quiz.entity.QuizQuestion;
import com.baizu.tiedye.quiz.repository.QuizOptionRepository;
import com.baizu.tiedye.quiz.repository.QuizQuestionRepository;

/**
 * 清理模块 5/6 旧版演示数据与旧表：
 * - 旧经典答题题目；
 * - dye_tie_method（手动扎结）；
 * - knowledge_chunk（旧知识块）；
 * - quiz_confuse_pair（离线预置辨析题）。
 *
 * 生产默认执行；测试环境（allow-offline-fallback=true）保留，便于离线场景测试。
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class LegacyMockDataCleaner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyMockDataCleaner.class);

    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;
    private final AiProperties properties;
    private final JdbcTemplate jdbcTemplate;

    public LegacyMockDataCleaner(QuizQuestionRepository questionRepository,
                                 QuizOptionRepository optionRepository,
                                 AiProperties properties,
                                 JdbcTemplate jdbcTemplate) {
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.properties = properties;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (properties.isAllowOfflineFallback()) {
            return;
        }

        List<QuizQuestion> legacyQuestions = questionRepository.findNonPatternQuestions();
        for (QuizQuestion question : legacyQuestions) {
            optionRepository.deleteByQuestionId(question.getId());
            questionRepository.delete(question);
        }
        questionRepository.flush();

        dropLegacyTables();
        log.info("Cleaned legacy module 5/6 mock data: knowledge_questions={}", legacyQuestions.size());
    }

    private void dropLegacyTables() {
        try {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");
        } catch (Exception ignored) {
            // 非 MySQL 环境忽略。
        }
        try {
            dropQuizChunkColumn();
            try {
                jdbcTemplate.execute("ALTER TABLE agent_quiz_question DROP COLUMN pair_key");
            } catch (Exception ignored) {
                // 新库或已清理过时列不存在。
            }
            jdbcTemplate.execute("DROP TABLE IF EXISTS knowledge_chunk");
            jdbcTemplate.execute("DROP TABLE IF EXISTS quiz_confuse_pair");
            jdbcTemplate.execute("DROP TABLE IF EXISTS dye_tie_method");
        } catch (Exception ex) {
            log.warn("旧表清理未完全执行: {}", ex.getMessage());
        } finally {
            try {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");
            } catch (Exception ignored) {
                // 非 MySQL 环境忽略。
            }
        }
    }

    private void dropQuizChunkColumn() {
        try {
            List<String> constraints = jdbcTemplate.queryForList(
                    "select CONSTRAINT_NAME from information_schema.KEY_COLUMN_USAGE "
                            + "where TABLE_SCHEMA = DATABASE() and TABLE_NAME = 'quiz_question' "
                            + "and COLUMN_NAME = 'chunk_id' and REFERENCED_TABLE_NAME = 'knowledge_chunk'",
                    String.class);
            for (String constraint : constraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE quiz_question DROP FOREIGN KEY `" + constraint + "`");
                } catch (Exception ignored) {
                    // 约束可能由 Hibernate 以其他名字创建，最后统一请求已关闭外键检查。
                }
            }
        } catch (Exception ignored) {
            // 非 MySQL 环境忽略。
        }
        try {
            jdbcTemplate.execute("ALTER TABLE quiz_question DROP COLUMN chunk_id");
        } catch (Exception ignored) {
            // 列可能已经不存在。
        }
    }
}
