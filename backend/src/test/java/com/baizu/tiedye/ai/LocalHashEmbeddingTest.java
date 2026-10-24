package com.baizu.tiedye.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.baizu.tiedye.ai.client.EmbeddingPurpose;
import com.baizu.tiedye.ai.client.local.LocalHashEmbeddingClient;
import com.baizu.tiedye.rag.service.VectorSimilarityUtil;

class LocalHashEmbeddingTest {

    private final LocalHashEmbeddingClient client = new LocalHashEmbeddingClient(1024);

    @Test
    void embeddingIsDeterministic() {
        double[] first = client.embedOne("扎染和蜡染的区别", EmbeddingPurpose.DOCUMENT);
        double[] second = client.embedOne("扎染和蜡染的区别", EmbeddingPurpose.DOCUMENT);
        assertThat(first).hasSize(1024);
        assertThat(first).containsExactly(second);
    }

    @Test
    void relatedTextScoresHigherThanOutOfDomainText() {
        double[] query = client.embedOne("扎染与蜡染的防染差异", EmbeddingPurpose.QUERY);
        double[] related = client.embedOne("绞缬用线绳扎结防染，蜡缬用蜡层防染", EmbeddingPurpose.DOCUMENT);
        double[] unrelated = client.embedOne("Excel 表格求和与数据透视表", EmbeddingPurpose.DOCUMENT);

        double relatedScore = VectorSimilarityUtil.cosine(query, related);
        double unrelatedScore = VectorSimilarityUtil.cosine(query, unrelated);
        assertThat(relatedScore).isGreaterThan(unrelatedScore);
    }

    @Test
    void cosineHandlesZeroAndIdenticalVectors() {
        assertThat(VectorSimilarityUtil.cosine(new double[]{1, 0}, new double[]{1, 0})).isEqualTo(1.0);
        assertThat(VectorSimilarityUtil.cosine(new double[]{1, 0}, new double[]{0, 1})).isZero();
        assertThat(VectorSimilarityUtil.cosine(new double[]{0, 0}, new double[]{1, 1})).isZero();
    }
}
