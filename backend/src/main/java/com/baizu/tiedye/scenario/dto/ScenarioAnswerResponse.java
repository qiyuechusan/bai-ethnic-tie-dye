package com.baizu.tiedye.scenario.dto;

public record ScenarioAnswerResponse(
        boolean correct,
        String feedback,
        String hint,
        String learned,
        String mode) {
}
