package com.baizu.tiedye.quiz.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.quiz.dto.AnswerRequest;
import com.baizu.tiedye.quiz.dto.AnswerResultDto;
import com.baizu.tiedye.quiz.dto.QuestionListDto;
import com.baizu.tiedye.quiz.service.QuizService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    /**
     * 获取答题列表。响应中不包含正确答案与解析。
     */
    @GetMapping("/questions")
    public ApiResponse<QuestionListDto> questions(
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "knowledge") String scope) {
        return ApiResponse.ok(quizService.listQuestions(limit, category, scope));
    }

    /**
     * 提交答案，由后端判定并返回解析、来源和相关知识块。
     */
    @PostMapping("/answer")
    public ApiResponse<AnswerResultDto> answer(@Valid @RequestBody AnswerRequest request) {
        return ApiResponse.ok(quizService.answer(request));
    }
}
