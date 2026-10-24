package com.baizu.tiedye.diy.agent.service;

import java.util.List;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.ai.client.JsonOutputMode;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.rag.ingest.SimulationProfileCatalog;
import com.baizu.tiedye.rag.model.RagHit;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 模块 5 的提示词。结构化输出使用 JSON Object 模式 + 明确字段说明，
 * 避免不同 Qwen 型号对 json_schema 支持差异导致请求失败。
 */
@Component
public class DiyPromptBuilder {

    private final ObjectMapper objectMapper;
    private final JsonNode schema;

    public DiyPromptBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.schema = readSchema(objectMapper);
    }

    public LlmRequest buildRequest(String prompt,
                                   String fabric,
                                   double concentration,
                                   int width,
                                   int height,
                                   String seed,
                                   List<RagHit> hits,
                                   JsonNode previousPlan) {
        StringBuilder user = new StringBuilder();
        user.append("【用户需求】").append(prompt).append('\n');
        user.append("【面料】").append(SimulationProfileCatalog.fabricLabel(fabric))
                .append("（").append(SimulationProfileCatalog.normalizeFabric(fabric)).append("）\n");
        user.append("【染料浓度】").append(concentration).append('\n');
        user.append("【画布】").append(width).append('x').append(height).append('\n');
        user.append("【种子】").append(seed).append('\n');
        if (previousPlan != null && !previousPlan.isNull()) {
            user.append("【上一轮参数（用户正在微调，请在此基础上修改）】\n")
                    .append(previousPlan.toPrettyString()).append('\n');
        }
        user.append("【知识证据】\n");
        if (hits == null || hits.isEmpty()) {
            user.append("- 无命中。请使用演示预设，并在 explanation 中明确说明。\n");
        } else {
            for (RagHit hit : hits) {
                user.append("- [").append(hit.chunkKey()).append("] ")
                        .append(hit.title()).append("：")
                        .append(trim(hit.content(), 220)).append('\n');
            }
        }
        user.append("【输出要求】只输出一个 JSON 对象，字段如下：\n");
        user.append(schema.toPrettyString());

        List<LlmMessage> messages = List.of(
                LlmMessage.system(systemPrompt()),
                LlmMessage.user(user.toString()));
        return new LlmRequest("diy_pattern", messages, JsonOutputMode.JSON_OBJECT, null, 0.55, 1200);
    }

    public LlmRequest buildFixRequest(JsonNode original, List<String> errors) {
        String user = "原 JSON：\n" + original.toPrettyString()
                + "\n校验错误：\n- " + String.join("\n- ", errors)
                + "\n请只返回修正后的 JSON，保持字段完整，不要输出解释。";
        List<LlmMessage> messages = List.of(
                LlmMessage.system(systemPrompt()),
                LlmMessage.user(user));
        return new LlmRequest("diy_pattern_fix", messages, JsonOutputMode.JSON_OBJECT, null, 0.3, 1200);
    }

    public JsonNode schema() {
        return schema;
    }

    private static String systemPrompt() {
        return """
                你是“蓝白之境”白族扎染数字实验室的扎结与氧化参数设计师。
                你只做一件事：把用户的自然语言需求，转换成前端 Canvas 可以执行的纹样参数与氧化动画参数。

                硬性规则：
                1. 只输出 JSON，不要 Markdown、不要代码围栏、不要前后解释。
                2. 事实只能来自【知识证据】。没有证据时，明确在 explanation 里写“使用演示预设”，不得编造文献、传承人或历史。
                3. 氧化色值和时长以证据中的统一模拟口径为准，并在 explanation 中说明它们是“模拟参数”。
                4. rendererType 只能是 spiral、stitch、accordion、bean、motif 之一。
                5. 优先映射：蝴蝶→stitch；螺旋/漩涡/星芒/太阳→spiral；风琴/折叠/条纹→accordion；圆点/豆结/星空→bean；鱼/莲/梅/八角/铜钱/回纹/冰裂/水波/几何→motif。
                6. citationChunkKeys 只能使用【知识证据】里出现过的 chunkKey。
                7. 所有用户可见文字使用简体中文。
                8. 输出必须是合法 JSON。JSON 对象中必须包含 rendererType、methodCode、methodName、subtitle、description、difficulty、params、previewColors、oxidation、explanation、citationChunkKeys、suggestedPrompts。

                各 renderer 的 params 字段：
                - spiral：rings(6-40), gap(2-30), wobble(0-0.3), core(0-0.2), spokes(0-16)
                - stitch：rows(1-20), cols(1-20), gap(1-20), angle(-90..90)
                - accordion：folds(4-60), amplitude(1-40), gap(1-30), slant(-0.5..0.5)
                - bean：count(5-100), minRadius(2-40), maxRadius(3-60), halo(1-3), clusters(1-12), spread(0-1)，且 maxRadius>minRadius
                - motif：motifType(butterfly|fish|lotus|plum|sun|octagon|wave|coin|fret|ice|geometric),
                  symmetry(mirror|rotational|radial|none), axes(1-12), centerX(0-1), centerY(0-1),
                  scale(0.08-0.6), repeat(1-12), spacing(0-0.5), rotation(-180..180),
                  lineGap(2-20), partialRatio(0-1), jitter(0-0.15)

                oxidation 字段：stops(3-5 个 #RRGGBB，首段偏黄绿、末段靛蓝), finalColor(#RRGGBB),
                dipDurationMs(350-1200), oxidationDurationMs(1200-5000), tintAlpha(0.6-1.0),
                dips(1-4), easing(linear|easeOutQuad|easeOutCubic|easeInOutCubic)。

                example 输出形状：
                {"rendererType":"motif","methodCode":"ai-wave","methodName":"AI·洱海微波",
                 "subtitle":"水波缝缚","description":"...","difficulty":2,
                 "params":{"motifType":"wave","symmetry":"none","axes":1,"centerX":0.5,"centerY":0.46,
                 "scale":0.32,"repeat":6,"spacing":0.18,"rotation":0,"lineGap":8,
                 "partialRatio":0.35,"jitter":0.04},
                 "previewColors":["#c9d27c","#7e9a70","#2d6d8e","#0b3863"],
                 "oxidation":{"stops":["#c9d27c","#7e9a70","#2d6d8e","#0b3863"],
                 "finalColor":"#1a3660","dipDurationMs":620,"oxidationDurationMs":2400,
                 "tintAlpha":0.92,"dips":2,"easing":"easeOutCubic"},
                 "explanation":"...","citationChunkKeys":["motif_erhai_01"],
                 "suggestedPrompts":["改用麻布，颜色浅一点"]}
                """;
    }

    private static JsonNode readSchema(ObjectMapper objectMapper) {
        String json = """
                {
                  "rendererType": "string (spiral|stitch|accordion|bean|motif)",
                  "methodCode": "string",
                  "methodName": "string (中文)",
                  "subtitle": "string",
                  "description": "string",
                  "difficulty": "integer 1-3",
                  "params": "object，字段取决于 rendererType",
                  "previewColors": ["#RRGGBB"],
                  "oxidation": {
                    "stops": ["#RRGGBB"],
                    "finalColor": "#RRGGBB",
                    "dipDurationMs": 620,
                    "oxidationDurationMs": 2400,
                    "tintAlpha": 0.92,
                    "dips": 2,
                    "easing": "easeOutCubic"
                  },
                  "explanation": "string (中文，说明依据与模拟参数)",
                  "citationChunkKeys": ["chunkKey"],
                  "suggestedPrompts": ["string"]
                }
                """;
        try {
            return objectMapper.readTree(json);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String trim(String value, int max) {
        if (value == null) {
            return "";
        }
        String text = value.replaceAll("\\s+", " ");
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
