package com.baizu.tiedye.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "昵称不能为空")
        @Size(min = 2, max = 20, message = "昵称需要 2–20 个字符")
        String displayName,

        @NotBlank(message = "账号不能为空")
        String account,

        @NotBlank(message = "密码不能为空")
        @Size(min = 8, max = 72, message = "密码需要 8–72 个字符")
        String password
) {
}
