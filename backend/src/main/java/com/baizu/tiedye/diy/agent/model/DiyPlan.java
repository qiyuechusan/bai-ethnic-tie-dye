package com.baizu.tiedye.diy.agent.model;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 模块 5 Agent 的统一输出模型，在线 LLM 与离线 planner 共用。
 */
public record DiyPlan(
        String rendererType,
        String methodCode,
        String methodName,
        String subtitle,
        String description,
        Integer difficulty,
        JsonNode params,
        List<String> previewColors,
        List<String> stops,
        String finalColor,
        Integer dipDurationMs,
        Integer oxidationDurationMs,
        Double tintAlpha,
        Integer dips,
        String easing,
        String explanation,
        List<String> citationChunkKeys,
        List<String> suggestedPrompts
) {
}
