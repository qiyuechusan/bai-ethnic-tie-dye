package com.baizu.tiedye.quiz.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.quiz.entity.QuizOption;

public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {

    List<QuizOption> findByQuestionIdOrderBySortOrderAsc(Long questionId);

    Optional<QuizOption> findByQuestionIdAndOptionKey(Long questionId, String optionKey);

    long deleteByQuestionId(Long questionId);
}
