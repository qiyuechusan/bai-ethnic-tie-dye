package com.baizu.tiedye.scenario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScenarioAnswerRequest(
        @NotBlank(message = "请选择情境") String scenarioId,
        @NotBlank(message = "缺少关卡编号") String challengeId,
        @NotBlank(message = "请输入答案")
        @Size(min = 1, max = 300, message = "答案不能超过 300 个字符") String userAnswer) {
}
