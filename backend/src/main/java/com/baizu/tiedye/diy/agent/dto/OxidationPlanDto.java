package com.baizu.tiedye.diy.agent.dto;

import java.util.List;

public record OxidationPlanDto(
        List<String> stops,
        String finalColor,
        Integer dipDurationMs,
        Integer oxidationDurationMs,
        Double tintAlpha,
        Integer dips,
        String fabric,
        Double concentration,
        String easing
) {
}
