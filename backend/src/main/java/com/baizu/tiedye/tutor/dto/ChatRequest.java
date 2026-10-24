package com.baizu.tiedye.tutor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        String sessionId,
        @NotBlank(message = "请输入问题")
        @Size(min = 1, max = 500, message = "问题不能超过 500 个字符")
        String message,
        String scope
) {
}
