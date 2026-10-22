package com.baizu.tiedye.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record AnswerRequest(
        @NotNull(message = "questionId 不能为空")
        Long questionId,

        @NotBlank(message = "optionKey 不能为空")
        @Pattern(regexp = "[A-Za-z]", message = "optionKey 格式不正确")
        String optionKey
) {
}
