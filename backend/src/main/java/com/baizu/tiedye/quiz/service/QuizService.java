package com.baizu.tiedye.quiz.service;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.quiz.dto.AnswerRequest;
import com.baizu.tiedye.quiz.dto.AnswerResultDto;
import com.baizu.tiedye.quiz.dto.OptionDto;
import com.baizu.tiedye.quiz.dto.QuestionDto;
import com.baizu.tiedye.quiz.dto.QuestionListDto;
import com.baizu.tiedye.quiz.entity.QuizOption;
import com.baizu.tiedye.quiz.entity.QuizQuestion;
import com.baizu.tiedye.quiz.repository.QuizOptionRepository;
import com.baizu.tiedye.quiz.repository.QuizQuestionRepository;

@Service
@Transactional(readOnly = true)
public class QuizService {

    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;

    public QuizService(QuizQuestionRepository questionRepository,
                       QuizOptionRepository optionRepository) {
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
    }

    public QuestionListDto listQuestions(int limit, String category, String scope) {
        String normalizedCategory = category == null ? null : category.trim();
        String normalizedScope = (scope == null || scope.isBlank()) ? "pattern" : scope.trim().toLowerCase(Locale.ROOT);
        List<QuizQuestion> questions = (normalizedCategory == null || normalizedCategory.isEmpty())
                ? questionRepository.findByEnabledTrueAndScopeOrderBySortOrderAsc(normalizedScope)
                : questionRepository.findByEnabledTrueAndScopeAndCategoryOrderBySortOrderAsc(
                        normalizedScope, normalizedCategory);

        int safeLimit = limit <= 0 ? 8 : Math.min(limit, 50);
        List<QuestionDto> items = questions.stream()
                .limit(safeLimit)
                .map(this::toQuestionDto)
                .toList();

        return new QuestionListDto(questions.size(), items);
    }

    public AnswerResultDto answer(AnswerRequest request) {
        QuizQuestion question = questionRepository.findById(request.questionId())
                .filter(q -> Boolean.TRUE.equals(q.getEnabled()))
                .orElseThrow(() -> new ApiException(40401, "题目不存在", HttpStatus.NOT_FOUND));

        List<QuizOption> options = optionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId());
        String selectedKey = request.optionKey().trim().toUpperCase(Locale.ROOT);
        QuizOption selected = options.stream()
                .filter(option -> option.getOptionKey().equalsIgnoreCase(selectedKey))
                .findFirst()
                .orElseThrow(() -> new ApiException(40001, "选项不存在", HttpStatus.BAD_REQUEST));

        QuizOption correctOption = options.stream()
                .filter(option -> Boolean.TRUE.equals(option.getCorrect()))
                .findFirst()
                .orElseThrow(() -> new ApiException(50000, "题目缺少正确答案", HttpStatus.INTERNAL_SERVER_ERROR));

        return new AnswerResultDto(
                question.getId(),
                Boolean.TRUE.equals(selected.getCorrect()),
                correctOption.getOptionKey(),
                question.getExplanation(),
                question.getPatternId()
        );
    }

    private QuestionDto toQuestionDto(QuizQuestion question) {
        List<OptionDto> options = optionRepository.findByQuestionIdOrderBySortOrderAsc(question.getId())
                .stream()
                .map(option -> new OptionDto(option.getOptionKey(), option.getContent()))
                .toList();
        return new QuestionDto(
                question.getId(),
                question.getStem(),
                question.getCategory(),
                question.getDifficulty(),
                question.getPatternId(),
                options
        );
    }

}
