package com.baizu.tiedye.diy.agent.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.agent.service.ActorResolver;
import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.diy.agent.dto.DiyGenerateRequest;
import com.baizu.tiedye.diy.agent.dto.DiyGenerateResponse;
import com.baizu.tiedye.diy.agent.dto.DiyHistoryItem;
import com.baizu.tiedye.diy.agent.dto.DiySuggestionDto;
import com.baizu.tiedye.diy.agent.service.DiyPatternAgentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * 模块 5：受限领域参数生成 Agent。
 */
@RestController
@RequestMapping("/api/diy/agent")
public class DiyAgentController {

    private final DiyPatternAgentService agentService;
    private final ActorResolver actorResolver;

    public DiyAgentController(DiyPatternAgentService agentService, ActorResolver actorResolver) {
        this.agentService = agentService;
        this.actorResolver = actorResolver;
    }

    @PostMapping("/pattern")
    public ApiResponse<DiyGenerateResponse> generate(@Valid @RequestBody DiyGenerateRequest request,
                                                     HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, request.sessionId());
        return ApiResponse.ok(agentService.generate(request, actor));
    }

    @GetMapping("/suggestions")
    public ApiResponse<List<DiySuggestionDto>> suggestions() {
        return ApiResponse.ok(agentService.suggestions());
    }

    @GetMapping("/history")
    public ApiResponse<List<DiyHistoryItem>> history(@RequestParam(required = false) String sessionId,
                                                     HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, sessionId);
        return ApiResponse.ok(agentService.history(sessionId, actor));
    }
}
