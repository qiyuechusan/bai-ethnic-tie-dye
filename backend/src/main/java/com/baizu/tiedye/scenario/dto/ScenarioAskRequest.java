package com.baizu.tiedye.scenario.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScenarioAskRequest(
        @NotBlank(message = "请选择情境") String scenarioId,
        @NotBlank(message = "请输入问题")
        @Size(min = 1, max = 500, message = "问题不能超过 500 个字符") String question) {
}
