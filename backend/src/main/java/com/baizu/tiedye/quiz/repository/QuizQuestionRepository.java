package com.baizu.tiedye.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.quiz.entity.QuizQuestion;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByEnabledTrueOrderBySortOrderAsc();

    List<QuizQuestion> findByEnabledTrueAndCategoryOrderBySortOrderAsc(String category);

    long countByEnabledTrue();
}
