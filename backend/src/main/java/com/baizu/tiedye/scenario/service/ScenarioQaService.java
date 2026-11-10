package com.baizu.tiedye.scenario.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.baizu.tiedye.ai.client.AiUnavailableException;
import com.baizu.tiedye.ai.client.LlmClient;
import com.baizu.tiedye.ai.client.LlmMessage;
import com.baizu.tiedye.ai.client.LlmRequest;
import com.baizu.tiedye.ai.client.LlmResult;
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
    private final LlmClient llmClient;

    public ScenarioQaService(RagRetrievalService retrievalService, LlmClient llmClient) {
        this.retrievalService = retrievalService;
        this.llmClient = llmClient;
    }

    /**
     * 单轮问答：按情景过滤分类 → 混合检索 → LLM 按问题从证据里组织回答（未配 Key 自动降级为分片拼接）。
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
        String role = VOICE.getOrDefault(scenarioId, "传承人");
        return new ScenarioAskResponse(
                tryLlmAnswer(role, question, result.hits()),
                citations, result.lowConfidence());
    }

    private String tryLlmAnswer(String role, String question, List<RagHit> hits) {
        try {
            LlmResult llm = llmClient.chat(
                    LlmRequest.text("scenario_ask", buildMessages(role, question, hits), 0.4, 300));
            String content = llm.content();
            if (content != null && !content.isBlank()) {
                return "（" + role + "）" + content.trim();
            }
        } catch (AiUnavailableException ignored) {
            // 未配置 Key 或 DashScope 不可用 → 降级拼接
        }
        return buildAnswer(role, hits);
    }

    private List<LlmMessage> buildMessages(String role, String question, List<RagHit> hits) {
        String system = "你是白族扎染数字科普站情境剧本杀里的" + role + "。"
                + "根据给定的知识证据，用大白话直接回答游客的问题。"
                + "只挑与问题直接相关的要点，组织成连贯的 1-2 句话，口语化、像聊天，不要罗列引用编号。"
                + "证据不足以回答时如实说“这个我还拿不准”。";
        String user = "【游客问题】" + question + "\n【知识证据】\n" + buildEvidence(hits) + "\n请回答。";
        return List.of(LlmMessage.system(system), LlmMessage.user(user));
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

    /**
     * 降级：拼接前 3 条不同分片并带标题，确保与问题直接相关的内容一定出现在回答里，
     * 用户能根据标题找到自己要的要点。
     */
    private String buildAnswer(String role, List<RagHit> hits) {
        StringBuilder sb = new StringBuilder("（" + role + "）");
        String prevTitle = null;
        int count = 0;
        for (RagHit h : hits) {
            if (count >= 3) break;
            String t = h.title();
            if (t != null && t.equals(prevTitle)) continue;
            String c = h.content().trim();
            if (c.length() > 150) c = c.substring(0, 150) + "…";
            if (sb.length() + c.length() > 500) break;
            if (prevTitle != null) sb.append("；");
            sb.append("【").append(t).append("】").append(c);
            prevTitle = t;
            count++;
        }
        return sb.toString();
    }
}
