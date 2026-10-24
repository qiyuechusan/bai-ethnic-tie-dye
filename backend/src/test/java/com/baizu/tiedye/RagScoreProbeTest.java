package com.baizu.tiedye;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagRetrievalService;

/**
 * 校准离线哈希向量 + 关键词检索的分数区间：域内问题能被召回，
 * 域外问题不误命中，避免把正确命中误判为低置信。
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:tiedye-probe;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.ai.mode=offline",
        "app.ai.api-key="
})
@ActiveProfiles("test")
class RagScoreProbeTest {

    @Autowired
    private RagRetrievalService retrievalService;

    @Test
    void domainQuestionsHitAndOutOfDomainMiss() {
        assertTop("扎染和蜡染怎么区分？", "diff_jiaola_01", true);
        assertTop("蝴蝶纹有什么寓意？", "motif_semantics_butterfly_01", true);
        assertTop("扎染的14道工序有哪些？", "process_14steps_01", true);
        assertTop("周城为什么被称为扎染之乡？", "place_zhoucheng_01", true);
        assertTop("第一次体验扎染选哪种扎法？", "faq_beginner_01", true);
        assertTop("Excel 怎么求和？", null, false);
        assertTop("今天天气怎么样？", null, false);
    }

    private void assertTop(String query, String expectedKey, boolean matched) {
        RetrievalResult result = retrievalService.retrieve(query, 6, null);
        RagHit top = result.hits().isEmpty() ? null : result.hits().get(0);
        System.out.println("PROBE|" + query + "|"
                + (top == null ? "none" : top.chunkKey()) + "|"
                + (top == null ? 0 : top.score()) + "|"
                + result.matched() + "|" + result.lowConfidence());
        assertThat(result.matched()).as(query).isEqualTo(matched);
        if (expectedKey != null) {
            assertThat(top).as(query).isNotNull();
            assertThat(top.chunkKey()).as(query).isEqualTo(expectedKey);
            assertThat(result.lowConfidence()).as(query).isFalse();
        }
    }
}
