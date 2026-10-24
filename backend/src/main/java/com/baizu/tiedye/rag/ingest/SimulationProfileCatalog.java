package com.baizu.tiedye.rag.ingest;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.rag.model.KnowledgeSeed;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * 统一模拟氧化口径。所有动画色值/时长以这里为准，避免不同入口各说一套。
 */
@Component
public class SimulationProfileCatalog {

    private static final List<String> DEFAULT_STOPS =
            List.of("#c9d27c", "#7e9a70", "#2d6d8e", "#0b3863");

    private final JsonNode metadata;

    public SimulationProfileCatalog(KnowledgeSeedLoader loader) {
        KnowledgeSeed profile = loader.loadProfile();
        this.metadata = profile.metadata();
    }

    public List<String> stops() {
        JsonNode stops = metadata.path("base").path("stops");
        if (!stops.isArray() || stops.isEmpty()) {
            return DEFAULT_STOPS;
        }
        List<String> values = new ArrayList<>();
        stops.forEach(item -> values.add(item.asText()));
        return values;
    }

    public int dipDurationMs() {
        return metadata.path("base").path("dipDurationMs").asInt(620);
    }

    public int oxidationDurationMs() {
        return metadata.path("base").path("oxidationDurationMs").asInt(2400);
    }

    public double tintAlpha() {
        return metadata.path("base").path("tintAlpha").asDouble(0.92);
    }

    public String finalColor(String fabric, double concentration) {
        String key = normalizeFabric(fabric);
        String fabricColor = metadata.path("fabrics").path(key).path("finalColor").asText("#0b3863");
        if (concentration <= 0.35) {
            return metadata.path("concentration").path("low").asText("#3a5f8a");
        }
        if (concentration >= 0.8) {
            String high = metadata.path("concentration").path("high").asText("#142c54");
            // 高浓度下优先保留面料色调，避免所有面料都被拉成同一个颜色。
            return blend(fabricColor, high, 0.55);
        }
        return fabricColor;
    }

    public double kValue(String fabric) {
        return metadata.path("fabrics").path(normalizeFabric(fabric)).path("k").asDouble(0.20);
    }

    public double dipMultiplier(String fabric) {
        return metadata.path("fabrics").path(normalizeFabric(fabric)).path("dipMultiplier").asDouble(1.0);
    }

    public static String normalizeFabric(String fabric) {
        if (fabric == null || fabric.isBlank()) {
            return "cotton";
        }
        return switch (fabric.trim().toLowerCase(Locale.ROOT)) {
            case "linen", "ma", "麻", "麻布" -> "linen";
            case "silk", "si", "丝", "丝绸", "蚕丝" -> "silk";
            default -> "cotton";
        };
    }

    public static String fabricLabel(String fabric) {
        return switch (normalizeFabric(fabric)) {
            case "linen" -> "亚麻";
            case "silk" -> "蚕丝";
            default -> "棉";
        };
    }

    private static String blend(String left, String right, double ratio) {
        try {
            int r1 = Integer.parseInt(left.substring(1, 3), 16);
            int g1 = Integer.parseInt(left.substring(3, 5), 16);
            int b1 = Integer.parseInt(left.substring(5, 7), 16);
            int r2 = Integer.parseInt(right.substring(1, 3), 16);
            int g2 = Integer.parseInt(right.substring(3, 5), 16);
            int b2 = Integer.parseInt(right.substring(5, 7), 16);
            int r = (int) Math.round(r1 * (1 - ratio) + r2 * ratio);
            int g = (int) Math.round(g1 * (1 - ratio) + g2 * ratio);
            int b = (int) Math.round(b1 * (1 - ratio) + b2 * ratio);
            return String.format("#%02x%02x%02x", r, g, b);
        } catch (RuntimeException ex) {
            return right;
        }
    }
}
