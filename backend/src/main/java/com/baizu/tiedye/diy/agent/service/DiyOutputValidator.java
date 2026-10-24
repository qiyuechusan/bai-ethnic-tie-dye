package com.baizu.tiedye.diy.agent.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.diy.agent.model.DiyPlan;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Agent 输出的最后一道闸：参数值域、枚举、颜色、时长、引用来源。
 * 校验失败时把错误列表交给 LLM 修正，最多两轮。
 */
@Component
public class DiyOutputValidator {

    private static final Pattern HEX = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final Set<String> RENDERERS = Set.of("spiral", "stitch", "accordion", "bean", "motif");
    private static final Set<String> MOTIFS = Set.of(
            "butterfly", "fish", "lotus", "plum", "sun", "octagon",
            "wave", "coin", "fret", "ice", "geometric");
    private static final Set<String> SYMMETRIES = Set.of("mirror", "rotational", "radial", "none");
    private static final Set<String> EASINGS = Set.of("linear", "easeOutQuad", "easeOutCubic", "easeInOutCubic");

    public ValidationResult validate(DiyPlan plan, Set<String> allowedCitations) {
        List<String> errors = new ArrayList<>();
        if (plan == null) {
            return ValidationResult.fail(List.of("输出为空"));
        }
        String renderer = plan.rendererType();
        if (renderer == null || !RENDERERS.contains(renderer)) {
            errors.add("rendererType 必须是 " + RENDERERS);
        }
        requireText(errors, "methodCode", plan.methodCode());
        requireText(errors, "methodName", plan.methodName());
        requireText(errors, "explanation", plan.explanation());
        if (plan.difficulty() == null || plan.difficulty() < 1 || plan.difficulty() > 3) {
            errors.add("difficulty 必须在 1–3");
        }
        validateColors(errors, "previewColors", plan.previewColors(), 1, 5);

        JsonNode params = plan.params();
        if (params == null || !params.isObject()) {
            errors.add("params 必须是 JSON 对象");
        } else if (renderer != null) {
            switch (renderer) {
                case "spiral" -> {
                    requireRange(errors, params, "rings", 6, 40);
                    requireRange(errors, params, "gap", 2, 30);
                    requireRange(errors, params, "wobble", 0, 0.3);
                    requireRange(errors, params, "core", 0, 0.2);
                    requireRange(errors, params, "spokes", 0, 16);
                }
                case "stitch" -> {
                    requireRange(errors, params, "rows", 1, 20);
                    requireRange(errors, params, "cols", 1, 20);
                    requireRange(errors, params, "gap", 1, 20);
                    requireRange(errors, params, "angle", -90, 90);
                }
                case "accordion" -> {
                    requireRange(errors, params, "folds", 4, 60);
                    requireRange(errors, params, "amplitude", 1, 40);
                    requireRange(errors, params, "gap", 1, 30);
                    requireRange(errors, params, "slant", -0.5, 0.5);
                }
                case "bean" -> {
                    requireRange(errors, params, "count", 5, 100);
                    requireRange(errors, params, "minRadius", 2, 40);
                    requireRange(errors, params, "maxRadius", 3, 60);
                    requireRange(errors, params, "halo", 1, 3);
                    requireRange(errors, params, "clusters", 1, 12);
                    requireRange(errors, params, "spread", 0, 1);
                    if (params.path("minRadius").isNumber() && params.path("maxRadius").isNumber()
                            && params.path("maxRadius").asDouble() <= params.path("minRadius").asDouble()) {
                        errors.add("params.maxRadius 必须大于 minRadius");
                    }
                }
                case "motif" -> validateMotif(errors, params);
                default -> {
                }
            }
        }

        validateColors(errors, "oxidation.stops", plan.stops(), 3, 5);
        if (plan.finalColor() == null || !HEX.matcher(plan.finalColor()).matches()) {
            errors.add("oxidation.finalColor 必须是 #RRGGBB");
        }
        requireInt(errors, "oxidation.dipDurationMs", plan.dipDurationMs(), 350, 1200);
        requireInt(errors, "oxidation.oxidationDurationMs", plan.oxidationDurationMs(), 1200, 5000);
        if (plan.tintAlpha() == null || plan.tintAlpha() < 0.6 || plan.tintAlpha() > 1.0) {
            errors.add("oxidation.tintAlpha 必须在 0.6–1.0");
        }
        requireInt(errors, "oxidation.dips", plan.dips(), 1, 4);
        if (plan.easing() != null && !EASINGS.contains(plan.easing())) {
            errors.add("oxidation.easing 不在允许范围内");
        }

        List<String> citations = plan.citationChunkKeys();
        if (allowedCitations != null && !allowedCitations.isEmpty()) {
            if (citations == null || citations.isEmpty()) {
                errors.add("citationChunkKeys 不能为空");
            } else {
                for (String key : citations) {
                    if (!allowedCitations.contains(key)) {
                        errors.add("citationChunkKeys 含未召回的分片: " + key);
                    }
                }
            }
        }
        return errors.isEmpty() ? ValidationResult.ok() : ValidationResult.fail(errors);
    }

    private void validateMotif(List<String> errors, JsonNode params) {
        String motifType = params.path("motifType").asText("");
        if (!MOTIFS.contains(motifType)) {
            errors.add("params.motifType 必须是 " + MOTIFS);
        }
        String symmetry = params.path("symmetry").asText("");
        if (!SYMMETRIES.contains(symmetry)) {
            errors.add("params.symmetry 必须是 " + SYMMETRIES);
        }
        requireRange(errors, params, "axes", 1, 12);
        requireRange(errors, params, "centerX", 0, 1);
        requireRange(errors, params, "centerY", 0, 1);
        requireRange(errors, params, "scale", 0.08, 0.6);
        requireRange(errors, params, "repeat", 1, 12);
        requireRange(errors, params, "spacing", 0, 0.5);
        requireRange(errors, params, "rotation", -180, 180);
        requireRange(errors, params, "lineGap", 2, 20);
        requireRange(errors, params, "partialRatio", 0, 1);
        requireRange(errors, params, "jitter", 0, 0.15);
    }

    private static void requireRange(List<String> errors, JsonNode params, String field, double min, double max) {
        JsonNode node = params.get(field);
        if (node == null || node.isNull() || !node.isNumber()) {
            errors.add("params." + field + " 缺失或不是数字");
            return;
        }
        double value = node.asDouble();
        if (value < min || value > max) {
            errors.add("params." + field + " 必须在 " + min + "–" + max + "，当前 " + value);
        }
    }

    private static void requireInt(List<String> errors, String field, Integer value, int min, int max) {
        if (value == null || value < min || value > max) {
            errors.add(field + " 必须在 " + min + "–" + max);
        }
    }

    private static void requireText(List<String> errors, String field, String value) {
        if (value == null || value.isBlank()) {
            errors.add(field + " 不能为空");
        }
    }

    private static void validateColors(List<String> errors, String field, List<String> colors, int min, int max) {
        if (colors == null || colors.size() < min || colors.size() > max) {
            errors.add(field + " 需要 " + min + "–" + max + " 个颜色");
            return;
        }
        for (String color : colors) {
            if (color == null || !HEX.matcher(color).matches()) {
                errors.add(field + " 含非法颜色: " + color);
            }
        }
    }
}
