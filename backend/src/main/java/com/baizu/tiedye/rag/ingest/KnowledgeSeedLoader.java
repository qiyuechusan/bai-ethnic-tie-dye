package com.baizu.tiedye.rag.ingest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.baizu.tiedye.rag.model.KnowledgeSeed;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 读取 classpath 下的 RAG 语料。旧语料没有 title/confidence/role，
 * 这里统一补齐：标题取正文首句，role 依据 chunkKey 归类。
 */
@Component
public class KnowledgeSeedLoader {

    private static final List<String> CHUNK_FILES = List.of(
            "rag/chunks/01_technique.json",
            "rag/chunks/02_oxidation.json",
            "rag/chunks/03_motif.json",
            "rag/chunks/04_differentiation.json",
            "rag/chunks/05_heritage_place.json",
            "rag/chunks/06_process.json",
            "rag/chunks/07_motif_semantics.json",
            "rag/chunks/08_differentiation_extra.json",
            "rag/chunks/09_faq.json",
            "rag/chunks/10_scenario.json");

    private static final String PROFILE_FILE = "rag/profiles/oxidation_profile_v1.json";

    private final ObjectMapper objectMapper;

    public KnowledgeSeedLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<KnowledgeSeed> loadChunks() {
        List<KnowledgeSeed> seeds = new ArrayList<>();
        Set<String> keys = new LinkedHashSet<>();
        for (String file : CHUNK_FILES) {
            JsonNode root = read(file);
            if (!root.isArray()) {
                continue;
            }
            for (JsonNode node : root) {
                KnowledgeSeed seed = toSeed(node);
                if (seed == null) {
                    continue;
                }
                if (!keys.add(seed.chunkKey())) {
                    throw new IllegalStateException("重复的 chunkKey: " + seed.chunkKey() + "（" + file + "）");
                }
                seeds.add(seed);
            }
        }
        return seeds;
    }

    public KnowledgeSeed loadProfile() {
        JsonNode root = read(PROFILE_FILE);
        return toSeed(root);
    }

    private KnowledgeSeed toSeed(JsonNode node) {
        if (node == null || node.isNull() || !node.isObject()) {
            return null;
        }
        String chunkKey = firstText(node, "chunkKey", "chunk_id");
        if (chunkKey == null || chunkKey.isBlank()) {
            return null;
        }
        String category = firstText(node, "category");
        if (category == null || category.isBlank()) {
            category = "fact";
        }
        String text = firstText(node, "text", "content");
        if (text == null) {
            text = "";
        }
        JsonNode metadata = node.path("metadata");
        if (!metadata.isObject()) {
            metadata = objectMapper.createObjectNode();
        }

        String title = firstText(node, "title");
        if (title == null || title.isBlank()) {
            title = deriveTitle(text);
        }

        List<String> keywords = new ArrayList<>();
        JsonNode keywordsNode = node.path("keywords");
        if (keywordsNode.isArray()) {
            keywordsNode.forEach(item -> keywords.add(item.asText()));
        } else if (keywordsNode.isTextual()) {
            for (String part : keywordsNode.asText().split("[,，、;；\\s]+")) {
                if (!part.isBlank()) {
                    keywords.add(part.trim());
                }
            }
        }
        JsonNode metaKeywords = metadata.path("keywords");
        if (metaKeywords.isArray()) {
            metaKeywords.forEach(item -> keywords.add(item.asText()));
        }

        String confidence = firstText(node, "confidence");
        if (confidence == null || confidence.isBlank()) {
            confidence = "B";
        }
        String role = firstText(node, "role");
        if (role == null || role.isBlank()) {
            role = deriveRole(chunkKey);
        }

        return new KnowledgeSeed(
                chunkKey.trim(),
                category.trim().toLowerCase(Locale.ROOT),
                title,
                text,
                keywords.stream().distinct().toList(),
                metadata,
                firstText(node, "source"),
                firstText(node, "sourceUrl", "source_url"),
                confidence.toUpperCase(Locale.ROOT),
                role);
    }

    private String deriveTitle(String text) {
        if (text == null || text.isBlank()) {
            return "未命名知识分片";
        }
        int end = text.indexOf('。');
        String head = end > 0 ? text.substring(0, end) : text;
        head = head.replaceAll("\\s+", " ").trim();
        return head.length() > 30 ? head.substring(0, 30) + "…" : head;
    }

    private static String deriveRole(String chunkKey) {
        if ("sim_oxidation_profile_v1".equals(chunkKey)) {
            return "simulation";
        }
        if (Set.of("diff_quiz_01", "diff_pairs_01").contains(chunkKey)) {
            return "quiz_meta";
        }
        if (Set.of("motif_symmetry_01", "motif_mapping_01").contains(chunkKey)) {
            return "agent_rule";
        }
        return "fact";
    }

    private static String firstText(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode value = node.get(name);
            if (value != null && !value.isNull() && value.isValueNode()) {
                String text = value.asText();
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return null;
    }

    private JsonNode read(String path) {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException("缺少 RAG 资源: " + path);
        }
        try (InputStream input = resource.getInputStream()) {
            return objectMapper.readTree(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        } catch (IOException ex) {
            throw new IllegalStateException("无法读取 RAG 资源: " + path, ex);
        }
    }
}
