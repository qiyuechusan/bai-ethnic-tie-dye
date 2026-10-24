package com.baizu.tiedye.tutor.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.agent.service.ActorResolver;
import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.rag.service.RagCatalogService;
import com.baizu.tiedye.tutor.dto.ChatRequest;
import com.baizu.tiedye.tutor.dto.ChatResponse;
import com.baizu.tiedye.tutor.dto.GenerateQuizRequest;
import com.baizu.tiedye.tutor.dto.QuizCardDto;
import com.baizu.tiedye.tutor.dto.SubmitAnswerRequest;
import com.baizu.tiedye.tutor.dto.SubmitAnswerResponse;
import com.baizu.tiedye.tutor.dto.TutorHistoryItem;
import com.baizu.tiedye.tutor.dto.TutorSessionItem;
import com.baizu.tiedye.tutor.dto.TutorStatsDto;
import com.baizu.tiedye.tutor.service.TutorAgentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * 模块 6：工具驱动的 Agentic RAG 导师。
 */
@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    private final TutorAgentService tutorAgentService;
    private final ActorResolver actorResolver;

    public TutorController(TutorAgentService tutorAgentService, ActorResolver actorResolver) {
        this.tutorAgentService = tutorAgentService;
        this.actorResolver = actorResolver;
    }

    @PostMapping("/chat")
    public ApiResponse<ChatResponse> chat(@Valid @RequestBody ChatRequest request,
                                          HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, request.sessionId());
        return ApiResponse.ok(tutorAgentService.chat(request, actor));
    }

    @PostMapping("/submit-answer")
    public ApiResponse<SubmitAnswerResponse> submitAnswer(@Valid @RequestBody SubmitAnswerRequest request,
                                                          HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, request.sessionId());
        return ApiResponse.ok(tutorAgentService.submitAnswer(request, actor));
    }

    @PostMapping("/quiz/generate")
    public ApiResponse<QuizCardDto> generateQuiz(@RequestBody GenerateQuizRequest request,
                                                 HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, request.sessionId());
        return ApiResponse.ok(tutorAgentService.generateQuiz(request, actor));
    }

    @GetMapping("/catalog")
    public ApiResponse<RagCatalogService.CatalogDto> catalog() {
        return ApiResponse.ok(tutorAgentService.catalog());
    }

    @GetMapping("/knowledge")
    public ApiResponse<RagCatalogService.KnowledgePageDto> knowledge(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.ok(tutorAgentService.knowledge(category, offset, limit));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<TutorSessionItem>> sessions(HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, null);
        return ApiResponse.ok(tutorAgentService.sessions(actor));
    }

    @GetMapping("/history")
    public ApiResponse<List<TutorHistoryItem>> history(@RequestParam String sessionId,
                                                       HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, sessionId);
        return ApiResponse.ok(tutorAgentService.history(sessionId, actor));
    }

    @GetMapping("/stats")
    public ApiResponse<TutorStatsDto> stats(@RequestParam(required = false) String sessionId,
                                            HttpServletRequest httpRequest) {
        ActorResolver.Actor actor = actorResolver.resolve(httpRequest, sessionId);
        return ApiResponse.ok(tutorAgentService.stats(sessionId, actor));
    }
}
