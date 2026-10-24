package com.baizu.tiedye.ai.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.ai.runtime.AiRuntimeStatus;
import com.baizu.tiedye.common.ApiResponse;

/**
 * 前端降级徽标与答辩现场状态检查使用。
 */
@RestController
@RequestMapping("/api/ai")
public class AiStatusController {

    private final AiRuntimeStatus runtimeStatus;
    private final AiProperties properties;

    public AiStatusController(AiRuntimeStatus runtimeStatus, AiProperties properties) {
        this.runtimeStatus = runtimeStatus;
        this.properties = properties;
    }

    @GetMapping("/status")
    public ApiResponse<StatusDto> status() {
        String embeddingModel = runtimeStatus.getIndexEmbeddingModel() == null
                ? runtimeStatus.getConfiguredEmbeddingModel()
                : runtimeStatus.getIndexEmbeddingModel();
        StatusDto dto = new StatusDto(
                runtimeStatus.getMode(),
                runtimeStatus.isLlmAvailable(),
                runtimeStatus.isRemoteEmbedding(),
                runtimeStatus.getChatModel(),
                embeddingModel,
                runtimeStatus.getKnowledgeCount(),
                runtimeStatus.isDegraded(),
                runtimeStatus.getDegradedReason(),
                properties.getRag().getTopK(),
                properties.getAgent().getMaxIterations());
        return ApiResponse.ok(dto);
    }

    public record StatusDto(
            String mode,
            boolean llmAvailable,
            boolean remoteEmbedding,
            String chatModel,
            String embeddingModel,
            int knowledgeCount,
            boolean degraded,
            String degradedReason,
            int topK,
            int maxIterations
    ) {
    }
}
