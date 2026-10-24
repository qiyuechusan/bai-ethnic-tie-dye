package com.baizu.tiedye.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.baizu.tiedye.quiz.entity.QuizQuestion;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByEnabledTrueOrderBySortOrderAsc();

    List<QuizQuestion> findByEnabledTrueAndCategoryOrderBySortOrderAsc(String category);

    List<QuizQuestion> findByEnabledTrueAndScopeOrderBySortOrderAsc(String scope);

    List<QuizQuestion> findByEnabledTrueAndScopeAndCategoryOrderBySortOrderAsc(String scope, String category);

    long countByEnabledTrue();

    long countByEnabledTrueAndScope(String scope);

    /**
     * 兼容合并前创建的旧题库：旧行没有 scope，统一归入 knowledge。
     */
    @Modifying
    @Query("update QuizQuestion q set q.scope = 'knowledge' where q.scope is null or q.scope = ''")
    int fillMissingScope();

    /**
     * 模块 6 旧版经典答题的题目；清理历史模拟数据时使用。
     */
    @Query("select q from QuizQuestion q where q.scope is null or q.scope <> 'pattern'")
    List<QuizQuestion> findNonPatternQuestions();
}
