package com.baizu.tiedye.rag.service;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.rag.service.QueryAliasExpander.QueryTerms;

/**
 * 关键词 + 元数据的启发式打分。向量分只占一部分，
 * 这样离线哈希向量质量一般时，检索仍然稳定。
 */
@Component
public class HybridScorer {

    public double keywordScore(String title, String keywords, String content, QueryTerms terms) {
        List<String> queryTerms = terms.terms();
        if (queryTerms.isEmpty()) {
            return 0.0;
        }
        double titleHit = hitRatio(title, queryTerms);
        double keywordHit = hitRatio(keywords, queryTerms);
        double contentHit = hitRatio(content, queryTerms);
        return clamp((1.0 * titleHit + 0.85 * keywordHit + 0.45 * contentHit) / 2.3);
    }

    public double metadataScore(String category,
                                String metadataJson,
                                QueryTerms terms,
                                Set<String> wantedCategories,
                                String fabric,
                                String motif) {
        double score = 0.0;
        if (category != null && wantedCategories != null && wantedCategories.contains(category)) {
            score += 0.40;
        }
        String metadata = metadataJson == null ? "" : metadataJson.toLowerCase();
        if (fabric != null && metadata.contains(fabric.toLowerCase())) {
            score += 0.20;
        }
        if (motif != null && metadata.contains(motif.toLowerCase())) {
            score += 0.20;
        }
        int metadataMatches = 0;
        for (String term : terms.terms()) {
            if (!term.isBlank() && metadata.contains(term.toLowerCase())) {
                metadataMatches++;
            }
        }
        score += Math.min(0.20, metadataMatches * 0.04);
        return clamp(score);
    }

    private static double hitRatio(String field, List<String> terms) {
        if (field == null || field.isBlank()) {
            return 0.0;
        }
        String value = field.toLowerCase();
        int matched = 0;
        for (String term : terms) {
            if (!term.isBlank() && value.contains(term.toLowerCase())) {
                matched++;
            }
        }
        int denominator = Math.min(terms.size(), 10);
        return denominator == 0 ? 0.0 : clamp((double) matched / denominator);
    }

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
}
