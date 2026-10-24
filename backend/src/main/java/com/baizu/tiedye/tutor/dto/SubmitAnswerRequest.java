package com.baizu.tiedye.tutor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubmitAnswerRequest(
        String sessionId,
        @NotBlank(message = "quizId 不能为空")
        String quizId,
        @NotBlank(message = "请选择一个答案")
        @Pattern(regexp = "[A-Za-z]", message = "选项格式不正确")
        String optionKey
) {
}
