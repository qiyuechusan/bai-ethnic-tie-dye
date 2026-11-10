package com.baizu.tiedye.scenario.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.JsonOutputMode;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.ai.client.LlmResult;
import com.baizu.tiedye.ai.json.JsonOutputParser;
import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.scenario.dto.ScenarioAnswerResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 剧本杀闯关答题判定：AI 语义判定 + 关键词兜底。
 * 判定必须由服务端完成：参考答案只存在这里，前端拿不到答案。
 */
@Service
public class ScenarioGradingService {

    private record Challenge(String question, String reference, String hint,
                             List<List<String>> winGroups, String role) {
    }

    /** 情景 → 检索时限定的知识分类（与模块三 ask 接口同源，隔离模块五六） */
    private static final Map<String, Set<String>> SCENARIO_CATEGORIES = Map.of(
            "scam", Set.of("scenario_scam"),
            "rescue", Set.of("scenario_rescue"),
            "haute", Set.of("scenario_haute"));

    private static final Set<String> DEFAULT_ROLES = Set.of("fact", "simulation");

    /** 每个情景的关卡定义：question 题目 / reference 参考答案要点 / winGroups 关键词兜底 */
    private static final Map<String, Map<String, Challenge>> CHALLENGES = Map.of(
            "scam", Map.of(
                    "c1", new Challenge(
                            "传承人让你找破绽，可你手里没有布。先想想：正宗白族扎染的花纹，边缘最典型的特征是什么？",
                            "正宗扎染花纹边缘有自然晕开的水波纹色晕，边界虚而不规则，每一块都独一无二；这是染液沿纤维渗透形成的。",
                            "染液顺着纤维慢慢渗透，花纹边缘会留下什么？",
                            List.of(List.of("色晕", "水波纹", "晕染", "渗")),
                            "传承人"),
                    "c2", new Challenge(
                            "真正的白族扎染，靠什么来防染出花纹？",
                            "绞缬，用针线扎缝、捆扎、缝合布料来防染，扎紧的部位染液进不去，拆线后显出花纹。",
                            "扎染又叫绞缬，想一想是用什么把布“绑”起来的？",
                            List.of(List.of("绞缬", "针线", "扎缝", "捆扎", "缝合", "防染")),
                            "传承人"),
                    "c3", new Challenge(
                            "用一句话向游客揭穿：这块布为什么不是正宗扎染？",
                            "正宗扎染靠针线防染，花纹有自然色晕水波纹、独一无二；这块布边缘硬挺整齐、无色晕、可批量复制，是化学印花。",
                            "从“工艺”和“花纹特征”两个角度说。",
                            List.of(List.of("色晕", "水波纹", "晕染"), List.of("印花", "颜料", "整齐", "复制")),
                            "传承人")),
            "rescue", Map.of(
                    "c1", new Challenge(
                            "师傅说这是正常工序。为什么刚染好的布是黄绿色？",
                            "靛白（还原态的靛素）本身是黄绿色，还没接触空气氧化，所以不是染坏了；染缸内是还原环境。",
                            "靛白是什么颜色？它现在缺了什么才不变蓝？",
                            List.of(List.of("靛白", "还原", "黄绿", "没氧化", "没")),
                            "师傅"),
                    "c2", new Challenge(
                            "现在第一步该做什么？",
                            "把布捞出来，摊开放到通风处，让靛白接触空气氧化。",
                            "师傅的口头禅是什么？捞出来、透透风。",
                            List.of(List.of("捞", "通风", "透风", "摊开", "氧化", "晾")),
                            "师傅"),
                    "c3", new Challenge(
                            "为什么通风之后布会变成靛蓝？",
                            "靛白和空气中的氧气发生氧化反应，转变成靛蓝；见风才变蓝。",
                            "靛白遇到了空气里的什么？",
                            List.of(List.of("氧化", "氧气", "空气", "靛蓝", "见风")),
                            "师傅")),
            "haute", Map.of(
                    "c1", new Challenge(
                            "设计师要“白族创世神话”的纹样。先想想：白族的创世神话和什么纹样有关？",
                            "蝴蝶：白族创世传说中先祖化生为蝴蝶，蝴蝶象征生命繁衍、万物共生，适合做主纹样。",
                            "传说里，人类的祖先变成了什么？",
                            List.of(List.of("蝴蝶", "化蝶", "蝶")),
                            "设计助手"),
                    "c2", new Challenge(
                            "用什么植物染料最环保？",
                            "板蓝根（蓼蓝），原生植物发酵制靛，没有化工污染，是大理周城扎染的标配染料。",
                            "大理周城扎染的标配染料是什么？",
                            List.of(List.of("板蓝根", "蓼蓝", "植物", "靛")),
                            "设计助手"),
                    "c3", new Challenge(
                            "把你的高定方案，一句话讲给设计师听。",
                            "蝴蝶纹（创世神话）+ 板蓝根/蓼蓝植物染料，体现植物与生态的呼吸感。",
                            "纹样 + 染料，两样都要说。",
                            List.of(List.of("蝴蝶", "蝶纹", "化蝶"), List.of("板蓝根", "蓼蓝", "植物", "染料")),
                            "设计助手")));

    private final LlmClient llmClient;
    private final RagRetrievalService retrievalService;
    private final JsonOutputParser jsonOutputParser;

    public ScenarioGradingService(LlmClient llmClient,
                                  RagRetrievalService retrievalService,
                                  JsonOutputParser jsonOutputParser) {
        this.llmClient = llmClient;
        this.retrievalService = retrievalService;
        this.jsonOutputParser = jsonOutputParser;
    }

    public ScenarioAnswerResponse grade(String scenarioId, String challengeId, String userAnswer) {
        Challenge challenge = resolve(scenarioId, challengeId);
        RetrievalResult result = retrievalService.retrieve(
                challenge.question(), 5,
                SCENARIO_CATEGORIES.getOrDefault(scenarioId, Set.of()),
                DEFAULT_ROLES, null, null, null);
        String evidence = buildEvidence(result.hits());
        try {
            LlmResult llm = llmClient.chat(buildRequest(challenge, evidence, userAnswer));
            ObjectNode node = jsonOutputParser.parseObject(llm.content());
            boolean correct = node.path("correct").asBoolean(false);
            return new ScenarioAnswerResponse(
                    correct,
                    text(node, "feedback", correct ? "答对了！" : "再想想。"),
                    text(node, "hint", challenge.hint()),
                    text(node, "learned", challenge.reference()),
                    "llm");
        } catch (AiUnavailableException ex) {
            // 未配置 Key 或 DashScope 不可用 → 关键词兜底判定
            return fallback(challenge, userAnswer);
        }
    }

    private Challenge resolve(String scenarioId, String challengeId) {
        Map<String, Challenge> map = CHALLENGES.get(scenarioId);
        if (map == null || !map.containsKey(challengeId)) {
            throw new ApiException(40401, "关卡不存在", HttpStatus.NOT_FOUND);
        }
        return map.get(challengeId);
    }

    private LlmRequest buildRequest(Challenge ch, String evidence, String userAnswer) {
        String system = """
                你是白族扎染数字科普站情境剧本杀的“阅卷导师”，口吻符合【角色】。
                判断用户答案是否答对了当前关卡：答案必须实质命中【参考答案要点】，
                允许口语化、同义表达（如“吹吹风”“见风变蓝”都算对），
                只要方向正确、要点覆盖就算对，不要逐字匹配。
                只输出 JSON，不要 Markdown 或解释。输出字段：
                correct(boolean),
                feedback(字符串：答对给一句角色口吻的肯定+知识点；答错给一句引导，不直接公布答案),
                hint(字符串：给卡关用户的方向提示，不含完整答案),
                learned(字符串：一句本关知识点总结)。
                """;
        String user = "【角色】" + ch.role()
                + "\n【关卡题目】" + ch.question()
                + "\n【参考答案要点】" + ch.reference()
                + "\n【知识证据】\n" + (evidence.isBlank() ? "（无）" : evidence)
                + "\n【用户答案】" + userAnswer
                + "\n请判定并输出 JSON。";
        return new LlmRequest(
                "scenario_grade",
                List.of(LlmMessage.system(system), LlmMessage.user(user)),
                JsonOutputMode.JSON_OBJECT,
                null,
                0.3,
                500);
    }

    private String buildEvidence(List<RagHit> hits) {
        StringBuilder sb = new StringBuilder();
        for (RagHit hit : hits) {
            String content = hit.content();
            if (content.length() > 220) {
                content = content.substring(0, 220);
            }
            sb.append("- [").append(hit.chunkKey()).append("] ")
                    .append(hit.title()).append("：").append(content).append('\n');
        }
        return sb.toString();
    }

    private ScenarioAnswerResponse fallback(Challenge ch, String userAnswer) {
        boolean allHit = ch.winGroups().stream()
                .allMatch(group -> group.stream().anyMatch(userAnswer::contains));
        if (allHit) {
            return new ScenarioAnswerResponse(
                    true, "答对了！" + ch.reference(), ch.hint(), ch.reference(), "fallback");
        }
        return new ScenarioAnswerResponse(
                false, "再想想，方向还差一点。", ch.hint(), ch.reference(), "fallback");
    }

    private static String text(JsonNode node, String field, String def) {
        JsonNode v = node.path(field);
        return v.isTextual() && !v.asText().isBlank() ? v.asText().trim() : def;
    }
}
