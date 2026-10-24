package com.baizu.tiedye.diy.agent.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DiyGenerateRequest(
        String sessionId,
        @NotBlank(message = "请描述想要的纹样")
        @Size(min = 2, max = 300, message = "描述需要 2–300 个字符")
        String prompt,
        String fabric,
        Double concentration,
        @Valid CanvasSize canvas,
        @Size(max = 16, message = "seed 过长")
        String seed,
        Long parentGenerationId
) {

    public record CanvasSize(Integer width, Integer height) {
    }
}
