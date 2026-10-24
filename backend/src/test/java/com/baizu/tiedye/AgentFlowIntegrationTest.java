package com.baizu.tiedye;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 离线模式端到端：知识入库 → RAG 问答 → 出题/判题 → 模块 5 画纹样。
 * 不依赖 DashScope Key 和本地 MySQL，使用 H2 内存库。
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:tiedye;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.ai.mode=offline",
                "app.ai.api-key="
        })
@ActiveProfiles("test")
class AgentFlowIntegrationTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void offlineRagAndAgentFlowWorks() {
        JsonNode status = get("/api/ai/status");
        assertThat(status.path("code").asInt()).isZero();
        assertThat(status.path("data").path("mode").asText()).isEqualTo("offline");
        assertThat(status.path("data").path("knowledgeCount").asInt()).isGreaterThanOrEqualTo(60);

        JsonNode catalog = get("/api/tutor/catalog");
        assertThat(catalog.path("data").path("total").asInt()).isGreaterThanOrEqualTo(60);
        assertThat(catalog.path("data").path("categories").size()).isEqualTo(8);

        JsonNode qa = post("/api/tutor/chat", Map.of(
                "message", "扎染和蜡染怎么区分？"
        ));
        assertThat(qa.path("code").asInt()).isZero();
        String answer = qa.path("data").path("answer").path("text").asText();
        assertThat(answer).isNotBlank();
        assertThat(qa.path("data").path("answer").path("citations").size()).isGreaterThan(0);
        assertThat(qa.path("data").path("lowConfidence").asBoolean()).isFalse();

        String sessionId = qa.path("data").path("sessionId").asText();
        assertThat(sessionId).isNotBlank();

        // 生产模式不提供离线模拟题；测试环境也不再把预置题库当作正常数据源。
        JsonNode quizChat = post("/api/tutor/chat", Map.of(
                "sessionId", sessionId,
                "message", "考我一道防染辨析题"
        ));
        assertThat(findCard(quizChat, "quiz")).isNull();

        JsonNode drawChat = post("/api/tutor/chat", Map.of(
                "sessionId", sessionId,
                "message", "画一个蝴蝶纹看看"
        ));
        JsonNode patternCard = findCard(drawChat, "pattern");
        assertThat(patternCard).isNotNull();
        assertThat(patternCard.path("pattern").path("params").isObject()).isTrue();
        assertThat(patternCard.path("pattern").path("oxidation").path("stops").size()).isGreaterThanOrEqualTo(3);

        JsonNode generated = post("/api/diy/agent/pattern", Map.of(
                "prompt", "用棉布做一块洱海波纹的围巾，浓度高一点",
                "fabric", "cotton",
                "concentration", 0.85,
                "canvas", Map.of("width", 900, "height", 1125)
        ));
        assertThat(generated.path("code").asInt()).isZero();
        JsonNode method = generated.path("data").path("method");
        assertThat(method.path("patternType").asText()).isNotBlank();
        assertThat(method.path("params").isObject()).isTrue();
        assertThat(generated.path("data").path("degraded").asBoolean()).isTrue();
        assertThat(generated.path("data").path("oxidation").path("stops").size()).isGreaterThanOrEqualTo(3);

        JsonNode history = get("/api/tutor/history?sessionId=" + sessionId);
        assertThat(history.path("code").asInt()).isZero();
        assertThat(history.path("data").size()).isGreaterThanOrEqualTo(2);

        JsonNode stats = get("/api/tutor/stats?sessionId=" + sessionId);
        assertThat(stats.path("code").asInt()).isZero();
    }

    private JsonNode get(String path) {
        ResponseEntity<JsonNode> response = rest.getForEntity(path, JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private JsonNode post(String path, Map<String, ?> body) {
        ResponseEntity<JsonNode> response = rest.postForEntity(path, body, JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private static JsonNode findCard(JsonNode response, String type) {
        JsonNode cards = response.path("data").path("cards");
        if (!cards.isArray()) {
            return null;
        }
        for (JsonNode card : cards) {
            if (type.equals(card.path("type").asText())) {
                return card;
            }
        }
        return null;
    }
}
