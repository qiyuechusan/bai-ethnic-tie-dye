package com.baizu.tiedye.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.baizu.tiedye.ai.json.JsonOutputParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

class JsonOutputParserTest {

    private final JsonOutputParser parser = new JsonOutputParser(new ObjectMapper());

    @Test
    void parsesPlainObject() {
        ObjectNode node = parser.parseObject("{\"action\":\"final_answer\",\"n\":1}");
        assertThat(node.path("action").asText()).isEqualTo("final_answer");
    }

    @Test
    void parsesFencedObjectWithPrefix() {
        String raw = "好的，结果如下：\n```json\n{\"action\":\"retrieve\",\"actionInput\":{\"query\":\"扎染\"}}\n```\n";
        ObjectNode node = parser.parseObject(raw);
        assertThat(node.path("actionInput").path("query").asText()).isEqualTo("扎染");
    }

    @Test
    void rejectsNonJson() {
        assertThatThrownBy(() -> parser.parseObject("不是 JSON"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
