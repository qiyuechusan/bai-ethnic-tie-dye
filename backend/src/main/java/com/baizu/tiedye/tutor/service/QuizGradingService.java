package com.baizu.tiedye.tutor.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.agent.entity.AgentSession;
import com.baizu.tiedye.agent.service.ActorResolver;
import com.baizu.tiedye.agent.service.AgentSessionService;
import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.rag.model.Citation;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.tutor.dto.QuizStatDto;
import com.baizu.tiedye.tutor.dto.SubmitAnswerResponse;
import com.baizu.tiedye.tutor.entity.AgentQuizQuestion;
import com.baizu.tiedye.tutor.repository.AgentQuizQuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 判题必须由服务端完成：正确答案只存在 agent_quiz_question 里。
 */
@Service
public class QuizGradingService {

    private static final Set<String> KEYS = Set.of("A", "B", "C", "D");

    private final AgentSessionService sessionService;
    private final AgentQuizQuestionRepository questionRepository;
    private final QuizStatService statService;
    private final RagRetrievalService retrievalService;
    private final ObjectMapper objectMapper;

    public QuizGradingService(AgentSessionService sessionService,
                              AgentQuizQuestionRepository questionRepository,
                              QuizStatService statService,
                              RagRetrievalService retrievalService,
                              ObjectMapper objectMapper) {
        this.sessionService = sessionService;
        this.questionRepository = questionRepository;
        this.statService = statService;
        this.retrievalService = retrievalService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SubmitAnswerResponse grade(String sessionKey,
                                      ActorResolver.Actor actor,
                                      String quizId,
                                      String optionKey) {
        AgentSession session = sessionService.find(sessionKey)
                .orElseThrow(() -> new ApiException(40401, "会话不存在，请先开始一轮对话", HttpStatus.NOT_FOUND));
        if (actor.userId() != null && session.getUserId() != null
                && !actor.userId().equals(session.getUserId())) {
            throw new ApiException(40301, "无权访问该会话", HttpStatus.FORBIDDEN);
        }
        AgentQuizQuestion question = questionRepository.findByQuizKeyAndSessionId(quizId, session.getId())
                .orElseThrow(() -> new ApiException(40401, "题目不存在", HttpStatus.NOT_FOUND));
        if (!"pending".equals(question.getStatus())) {
            throw new ApiException(40901, "这道题已经作答过了", HttpStatus.CONFLICT);
        }
        String selected = optionKey == null ? "" : optionKey.trim().toUpperCase(Locale.ROOT);
        if (!KEYS.contains(selected)) {
            throw new ApiException(40001, "选项必须是 A/B/C/D", HttpStatus.BAD_REQUEST);
        }
        boolean correct = question.getCorrectKey().equalsIgnoreCase(selected);
        question.setStatus("answered");
        question.setSelectedKey(selected);
        question.setCorrect(correct);
        question.setAnsweredAt(Instant.now());
        questionRepository.save(question);

        String actorKey = sessionService.actorKey(actor.userId(), session.getSessionKey());
        QuizStatDto stat = statService.record(
                actorKey,
                actor.userId(),
                session.getId(),
                question.getTopic(),
                question.getDifficulty(),
                correct);

        List<Citation> citations = resolveCitations(question.getCitationsJson());
        String followUp;
        List<String> prompts;
        if (correct) {
            followUp = "答对了。你已经抓住了这道辨析题的核心差别，可以试试更难的同类题。";
            prompts = List.of("出更难的同类题", "画一个相关纹样", "再来一道");
        } else {
            String source = citations.isEmpty() ? "" : "先回看《" + citations.get(0).title() + "》。";
            followUp = "这题的正确答案是 " + question.getCorrectKey() + "。" + source + "弄懂之后我再出一道同类题。";
            prompts = List.of("再解释一下", "出同类题", "画出来看看");
        }
        return new SubmitAnswerResponse(
                question.getQuizKey(),
                correct,
                question.getCorrectKey(),
                question.getExplanation(),
                citations,
                stat,
                followUp,
                prompts);
    }

    public List<Citation> resolveCitations(String citationsJson) {
        List<Citation> citations = new ArrayList<>();
        if (citationsJson == null || citationsJson.isBlank()) {
            return citations;
        }
        try {
            JsonNode node = objectMapper.readTree(citationsJson);
            if (!node.isArray()) {
                return citations;
            }
            for (JsonNode item : node) {
                if (!item.isTextual()) {
                    continue;
                }
                RagHit hit = retrievalService.hitByKey(item.asText());
                if (hit != null) {
                    citations.add(Citation.from(hit));
                }
            }
        } catch (Exception ignored) {
            return citations;
        }
        return citations;
    }
}
