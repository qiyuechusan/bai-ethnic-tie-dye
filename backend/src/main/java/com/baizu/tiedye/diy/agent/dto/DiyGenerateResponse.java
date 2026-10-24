package com.baizu.tiedye.diy.agent.dto;

import java.util.List;

import com.baizu.tiedye.rag.model.Citation;

public record DiyGenerateResponse(
        String sessionId,
        Long generationId,
        String mode,
        boolean degraded,
        String degradedReason,
        PatternPlanDto method,
        String seed,
        OxidationPlanDto oxidation,
        String explanation,
        List<Citation> citations,
        List<String> suggestedPrompts,
        boolean lowConfidence,
        List<String> warnings
) {
}
