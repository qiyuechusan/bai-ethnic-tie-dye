package com.baizu.tiedye.scenario.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.scenario.dto.ScenarioAnswerRequest;
import com.baizu.tiedye.scenario.dto.ScenarioAnswerResponse;
import com.baizu.tiedye.scenario.dto.ScenarioAskRequest;
import com.baizu.tiedye.scenario.dto.ScenarioAskResponse;
import com.baizu.tiedye.scenario.service.ScenarioGradingService;
import com.baizu.tiedye.scenario.service.ScenarioQaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/scenario")
public class ScenarioController {

    private final ScenarioQaService scenarioQaService;
    private final ScenarioGradingService scenarioGradingService;

    public ScenarioController(ScenarioQaService scenarioQaService,
                              ScenarioGradingService scenarioGradingService) {
        this.scenarioQaService = scenarioQaService;
        this.scenarioGradingService = scenarioGradingService;
    }

    @PostMapping("/ask")
    public ApiResponse<ScenarioAskResponse> ask(@Valid @RequestBody ScenarioAskRequest request) {
        return ApiResponse.ok(scenarioQaService.ask(request.scenarioId(), request.question()));
    }

    @PostMapping("/answer")
    public ApiResponse<ScenarioAnswerResponse> answer(@Valid @RequestBody ScenarioAnswerRequest request) {
        return ApiResponse.ok(
                scenarioGradingService.grade(request.scenarioId(), request.challengeId(), request.userAnswer()));
    }
}
