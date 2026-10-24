package com.baizu.tiedye.diy.agent.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.SplittableRandom;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.diy.agent.model.DiyPlan;
import com.baizu.tiedye.rag.ingest.SimulationProfileCatalog;
import com.baizu.tiedye.rag.model.RagHit;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 无 Key / 模型失败时的确定性参数生成器。只依据召回文本与统一模拟口径，
 * 不编造工艺事实，保证答辩现场每条路径都能出图。
 */
@Component
public class DiyOfflinePlanner {

    private final ObjectMapper objectMapper;
    private final SimulationProfileCatalog profileCatalog;

    public DiyOfflinePlanner(ObjectMapper objectMapper, SimulationProfileCatalog profileCatalog) {
        this.objectMapper = objectMapper;
        this.profileCatalog = profileCatalog;
    }

    public DiyPlan plan(String prompt,
                        String fabric,
                        double concentration,
                        int width,
                        int height,
                        String seed,
                        List<RagHit> hits) {
        String normalizedPrompt = prompt == null ? "" : prompt.toLowerCase(Locale.ROOT);
        String motif = detectMotif(normalizedPrompt);
        String renderer;
        if (normalizedPrompt.contains("蝴蝶") || normalizedPrompt.contains("蝶")) {
            renderer = "stitch";
            motif = "butterfly";
        } else if (containsAny(normalizedPrompt, "螺旋", "漩涡", "星芒", "太阳", "放射")) {
            renderer = "spiral";
        } else if (containsAny(normalizedPrompt, "风琴", "折叠", "条纹")) {
            renderer = "accordion";
        } else if (containsAny(normalizedPrompt, "圆点", "豆结", "星空", "雨点", "点状")) {
            renderer = "bean";
        } else if (motif != null) {
            renderer = "motif";
        } else {
            renderer = switch (SimulationProfileCatalog.normalizeFabric(fabric)) {
                case "linen" -> "accordion";
                case "silk" -> "stitch";
                default -> "spiral";
            };
        }

        SplittableRandom random = new SplittableRandom(mix(prompt + "|" + fabric + "|" + concentration + "|" + seed));
        ObjectNode params = buildParams(renderer, motif, random);
        String methodName = methodName(renderer, motif);
        String subtitle = subtitle(renderer, motif);
        int difficulty = switch (renderer) {
            case "accordion" -> 1;
            case "stitch" -> 3;
            default -> 2;
        };

        boolean wantsDeep = containsAny(normalizedPrompt, "深", "浓", "重", "九浸", "多次", "厚");
        boolean wantsLight = containsAny(normalizedPrompt, "浅", "淡", "轻", "少", "薄");
        int dips = wantsDeep ? 3 : wantsLight ? 1 : 2;
        List<String> stops = profileCatalog.stops();
        String finalColor = profileCatalog.finalColor(fabric, concentration);
        int oxidationMs = profileCatalog.oxidationDurationMs();
        if ("linen".equals(SimulationProfileCatalog.normalizeFabric(fabric))) {
            oxidationMs = Math.min(5000, (int) Math.round(oxidationMs * 1.15));
        } else if ("silk".equals(SimulationProfileCatalog.normalizeFabric(fabric))) {
            oxidationMs = Math.max(1200, (int) Math.round(oxidationMs * 0.9));
        }

        String description = "根据「" + prompt + "」为" + SimulationProfileCatalog.fabricLabel(fabric)
                + "生成纹样，采用" + methodName + "；参数由本地规则与知识库命中片段推导。";
        String explanation = buildExplanation(hits, methodName);
        List<String> citations = new ArrayList<>();
        for (RagHit hit : hits) {
            if (!citations.contains(hit.chunkKey())) {
                citations.add(hit.chunkKey());
            }
            if (citations.size() >= 3) {
                break;
            }
        }
        if (!citations.contains("sim_oxidation_profile_v1")) {
            citations.add("sim_oxidation_profile_v1");
        }

        return new DiyPlan(
                renderer,
                "ai-" + (motif == null ? renderer : motif),
                methodName,
                subtitle,
                description,
                difficulty,
                params,
                stops,
                stops,
                finalColor,
                profileCatalog.dipDurationMs(),
                oxidationMs,
                profileCatalog.tintAlpha(),
                dips,
                "easeOutCubic",
                explanation,
                List.copyOf(citations),
                List.of("把纹样换成蝴蝶", "改用麻布，颜色浅一点", "再深一点，浸染三次", "换一个种子重新生成"));
    }

    private ObjectNode buildParams(String renderer, String motif, SplittableRandom random) {
        ObjectNode params = objectMapper.createObjectNode();
        switch (renderer) {
            case "spiral" -> {
                params.put("rings", between(random, 10, 20));
                params.put("gap", between(random, 6, 14));
                params.put("wobble", round(random.nextDouble(0.03, 0.10), 3));
                params.put("core", round(random.nextDouble(0.03, 0.08), 3));
                params.put("spokes", between(random, 4, 8));
            }
            case "stitch" -> {
                params.put("rows", between(random, 4, 8));
                params.put("cols", between(random, 4, 8));
                params.put("gap", between(random, 4, 9));
                params.put("angle", between(random, -20, 20));
            }
            case "accordion" -> {
                params.put("folds", between(random, 14, 30));
                params.put("amplitude", between(random, 6, 14));
                params.put("gap", between(random, 5, 10));
                params.put("slant", round(random.nextDouble(0.05, 0.20), 3));
            }
            case "bean" -> {
                int minRadius = between(random, 8, 16);
                params.put("count", between(random, 20, 50));
                params.put("minRadius", minRadius);
                params.put("maxRadius", minRadius + between(random, 8, 18));
                params.put("halo", round(random.nextDouble(1.4, 1.8), 2));
                params.put("clusters", between(random, 3, 7));
                params.put("spread", round(random.nextDouble(0.60, 0.85), 2));
            }
            default -> {
                String safeMotif = motif == null ? "wave" : motif;
                String symmetry = switch (safeMotif) {
                    case "butterfly", "fish", "plum" -> "mirror";
                    case "octagon", "coin", "lotus" -> "rotational";
                    case "sun" -> "radial";
                    default -> "none";
                };
                int axes = switch (safeMotif) {
                    case "octagon" -> 8;
                    case "plum", "lotus" -> 5;
                    case "coin" -> 3;
                    case "sun" -> 6;
                    default -> 1;
                };
                params.put("motifType", safeMotif);
                params.put("symmetry", symmetry);
                params.put("axes", axes);
                params.put("centerX", 0.5);
                params.put("centerY", 0.46);
                params.put("scale", round(random.nextDouble(0.20, 0.36), 3));
                params.put("repeat", between(random, 3, 8));
                params.put("spacing", round(random.nextDouble(0.10, 0.24), 3));
                params.put("rotation", "none".equals(symmetry) ? 0 : between(random, -12, 12));
                params.put("lineGap", between(random, 5, 10));
                params.put("partialRatio", round(random.nextDouble(0.25, 0.50), 2));
                params.put("jitter", round(random.nextDouble(0.02, 0.08), 3));
            }
        }
        return params;
    }

    private static String detectMotif(String prompt) {
        if (prompt.contains("洱海") || prompt.contains("水波") || prompt.contains("波浪") || prompt.contains("波纹")) {
            return "wave";
        }
        if (prompt.contains("鱼")) {
            return "fish";
        }
        if (prompt.contains("莲") || prompt.contains("荷")) {
            return "lotus";
        }
        if (prompt.contains("梅")) {
            return "plum";
        }
        if (prompt.contains("八角") || prompt.contains("八瓣")) {
            return "octagon";
        }
        if (prompt.contains("铜钱")) {
            return "coin";
        }
        if (prompt.contains("回纹")) {
            return "fret";
        }
        if (prompt.contains("冰裂")) {
            return "ice";
        }
        if (prompt.contains("几何") || prompt.contains("方格")) {
            return "geometric";
        }
        if (prompt.contains("蝴蝶") || prompt.contains("蝶")) {
            return "butterfly";
        }
        return null;
    }

    private static String methodName(String renderer, String motif) {
        if ("motif".equals(renderer)) {
            return switch (motif == null ? "wave" : motif) {
                case "fish" -> "AI·游鱼纹";
                case "lotus" -> "AI·莲瓣纹";
                case "plum" -> "AI·梅花纹";
                case "octagon" -> "AI·八角花";
                case "coin" -> "AI·铜钱纹";
                case "fret" -> "AI·回纹";
                case "ice" -> "AI·冰裂纹";
                case "geometric" -> "AI·几何方格";
                default -> "AI·洱海微波";
            };
        }
        return switch (renderer) {
            case "spiral" -> "AI·螺旋星芒";
            case "stitch" -> "AI·蝶翼缝扎";
            case "accordion" -> "AI·层叠水波";
            default -> "AI·豆结星点";
        };
    }

    private static String subtitle(String renderer, String motif) {
        if ("motif".equals(renderer)) {
            return "纹样生成 · " + (motif == null ? "wave" : motif);
        }
        return switch (renderer) {
            case "spiral" -> "旋转放射";
            case "stitch" -> "缝扎具象";
            case "accordion" -> "折叠条纹";
            default -> "点状晕染";
        };
    }

    private static String buildExplanation(List<RagHit> hits, String methodName) {
        StringBuilder builder = new StringBuilder();
        builder.append("依据你的描述选择「").append(methodName).append("」。");
        if (hits == null || hits.isEmpty()) {
            builder.append("知识库暂未命中高度相关的分片，以下参数使用项目演示预设。");
        } else {
            RagHit first = hits.get(0);
            builder.append("知识库中的相关说法：").append(shorten(first.content(), 96));
            if (hits.size() > 1) {
                RagHit second = hits.get(1);
                builder.append(" 另外，").append(shorten(second.content(), 56));
            }
            builder.append("。");
        }
        builder.append("氧化色值与时长采用项目统一模拟口径（黄绿→灰绿→蓝绿→靛蓝），")
                .append("属于演示参数，不是某一工坊的实测标准。");
        return builder.toString();
    }

    private static String shorten(String value, int max) {
        if (value == null) {
            return "";
        }
        String text = value.replaceAll("\\s+", "");
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    private static int between(SplittableRandom random, int min, int max) {
        return random.nextInt(min, max + 1);
    }

    private static double round(double value, int digits) {
        double scale = Math.pow(10, digits);
        return Math.round(value * scale) / scale;
    }

    private static boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private static long mix(String value) {
        long hash = 0xcbf29ce484222325L;
        for (int i = 0; i < value.length(); i++) {
            hash ^= value.charAt(i);
            hash *= 0x100000001b3L;
        }
        return hash;
    }
}
