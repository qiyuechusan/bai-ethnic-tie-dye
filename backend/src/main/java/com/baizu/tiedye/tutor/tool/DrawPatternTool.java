package com.baizu.tiedye.tutor.tool;

import org.springframework.stereotype.Component;

import java.util.List;

import com.baizu.tiedye.diy.agent.dto.DiyGenerateRequest;
import com.baizu.tiedye.diy.agent.dto.DiyGenerateResponse;
import com.baizu.tiedye.diy.agent.service.DiyPatternAgentService;
import com.baizu.tiedye.rag.model.Citation;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.tutor.dto.PatternCardDto;
import com.baizu.tiedye.tutor.dto.TutorCardDto;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 模块 6 的工具：把“画一个蝴蝶纹看看”转成模块 5 的生成请求。
 * 通过 AgentTool 接口直调服务，避免 HTTP 自调用依赖端口；后续可无痛换成 REST。
 */
@Component
public class DrawPatternTool implements AgentTool {

    private final DiyPatternAgentService diyPatternAgentService;
    private final ObjectMapper objectMapper;

    public DrawPatternTool(DiyPatternAgentService diyPatternAgentService, ObjectMapper objectMapper) {
        this.diyPatternAgentService = diyPatternAgentService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "draw_pattern";
    }

    @Override
    public ToolResult execute(TutorTurnContext context, JsonNode input) {
        if (context.toolCount(name()) >= 1) {
            return ToolResult.error("本轮已经生成过一张纹样");
        }
        String prompt = input == null ? null : input.path("prompt").asText(null);
        if (prompt == null || prompt.isBlank()) {
            prompt = context.getMessage();
        }
        String fabric = input == null ? "cotton" : input.path("fabric").asText("cotton");
        fabric = switch (fabric.toLowerCase(java.util.Locale.ROOT)) {
            case "linen", "麻", "亚麻" -> "linen";
            case "silk", "丝", "丝绸", "蚕丝" -> "silk";
            default -> "cotton";
        };
        double concentration = input != null && input.path("concentration").isNumber()
                ? input.path("concentration").asDouble()
                : 0.8;
        if (!Double.isFinite(concentration)) {
            concentration = 0.8;
        }
        concentration = Math.max(0.1, Math.min(1.0, concentration));
        DiyGenerateRequest request = new DiyGenerateRequest(
                context.getSession().getSessionKey(),
                prompt,
                fabric,
                concentration,
                new DiyGenerateRequest.CanvasSize(900, 1125),
                null,
                null);
        DiyGenerateResponse response = diyPatternAgentService.generate(request, context.getActor());
        for (Citation citation : response.citations()) {
            context.addEvidence(List.of(new RagHit(
                    citation.chunkKey(),
                    citation.title(),
                    citation.category(),
                    citation.snippet(),
                    citation.source(),
                    citation.sourceUrl(),
                    citation.confidence(),
                    "fact",
                    0.9,
                    0.9,
                    0.9,
                    0.9)));
        }
        ObjectNode oxidation = objectMapper.valueToTree(response.oxidation());
        PatternCardDto card = new PatternCardDto(
                response.generationId(),
                response.method().name(),
                response.method().patternType(),
                response.method().params(),
                response.method().previewColors(),
                oxidation,
                response.seed(),
                response.explanation());
        context.addCard(TutorCardDto.pattern(card));
        context.incrementTool(name());

        ObjectNode data = objectMapper.createObjectNode();
        data.put("generationId", response.generationId());
        data.put("methodName", response.method().name());
        data.put("seed", response.seed());
        return ToolResult.ok("已生成纹样参数：" + response.method().name(), data);
    }
}
