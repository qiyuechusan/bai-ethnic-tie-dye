package com.baizu.tiedye.scenario.dto;
import java.util.List;

import com.baizu.tiedye.rag.model.Citation;

public record ScenarioAskResponse(
        String text,
        List<Citation> citations,
        boolean lowConfidence) {
}
