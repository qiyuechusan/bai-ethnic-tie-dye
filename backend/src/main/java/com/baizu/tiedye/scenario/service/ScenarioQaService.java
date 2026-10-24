package com.baizu.tiedye.scenario.service;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.baizu.tiedye.rag.model.Citation;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.scenario.dto.ScenarioAskResponse;

@Service
public class ScenarioQaService {

    /** 情景 → 检索时限定的知识分类（只查模块三自己的 scenario_* 分类，与模块五六共享库隔离） */
    private static final Map<String, Set<String>> SCENARIO_CATEGORIES = Map.of(
            "scam", Set.of("scenario_scam"),
            "rescue", Set.of("scenario_rescue"),
            "haute", Set.of("scenario_haute"));

    /** 情景 → 角色口吻 */
    private static final Map<String, String> VOICE = Map.of(
            "scam", "传承人", "rescue", "师傅", "haute", "设计助手");

    /** 检索默认角色集合：与 RagRetrievalService 默认一致（fact + simulation） */
    private static final Set<String> DEFAULT_ROLES = Set.of("fact", "simulation");

    private final RagRetrievalService retrievalService;

    public ScenarioQaService(RagRetrievalService retrievalService) {
        this.retrievalService = retrievalService;
    }

    /**
     * 单轮问答：按情景过滤分类 → 混合检索 → 角色口吻组装回答 + 引用。
     * 无会话状态；检索不到明确说“没收录”，不编答案。
     */
    public ScenarioAskResponse ask(String scenarioId, String question) {
        Set<String> categories = SCENARIO_CATEGORIES.getOrDefault(scenarioId, Set.of());
        RetrievalResult result = retrievalService.retrieve(question, 5, categories, DEFAULT_ROLES, null, null, null);
        if (!result.matched() || result.hits().isEmpty()) {
            return new ScenarioAskResponse(
                    "（" + VOICE.getOrDefault(scenarioId, "传承人") + "）这个问题知识库里暂时没收录，换个问法试试。",
                    List.of(), true);
        }
        List<Citation> citations = result.hits().stream().map(Citation::from).toList();
        return new ScenarioAskResponse(
                buildAnswer(VOICE.getOrDefault(scenarioId, "传承人"), result.hits()),
                citations, result.lowConfidence());
    }

    private String buildAnswer(String role, List<RagHit> hits) {
        StringBuilder sb = new StringBuilder("（" + role + "）");
        sb.append(hits.get(0).content());
        return sb.toString();
    }
}
