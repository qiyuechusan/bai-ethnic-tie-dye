package com.baizu.tiedye.rag.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.ai.runtime.AiRuntimeStatus;
import com.baizu.tiedye.rag.entity.DyeKnowledgeChunk;
import com.baizu.tiedye.rag.repository.DyeKnowledgeChunkRepository;

/**
 * 知识可发现性：把“库里有什么”直接变成前端可展示的分类、条数、示例问题与分片标题。
 */
@Service
public class RagCatalogService {

    private static final List<CategoryMeta> CATEGORIES = List.of(
            new CategoryMeta("differentiation", "易混辨析", "扎染、蜡染、夹缬、蓝印花布的区别",
                    List.of("扎染和蜡染怎么区分？", "蓝印花布是扎染吗？", "夹缬和灰缬有什么不同？")),
            new CategoryMeta("technique", "扎结技法", "捆扎、缝扎、缚扎、撮扎、夹扎与防染原理",
                    List.of("捆扎和缝扎出来的纹样有什么不同？", "扎得紧和扎得松会怎样？", "有哪些常见的扎结方法？")),
            new CategoryMeta("oxidation", "氧化显色", "蓝靛、隐色体、氧化时间与面料差异",
                    List.of("为什么刚出缸是黄绿色？", "棉麻丝染色有什么差别？", "要浸染几次颜色才够深？")),
            new CategoryMeta("motif", "纹样语义", "蝴蝶、洱海、八角花、梅花等纹样的寓意与工艺",
                    List.of("蝴蝶纹有什么寓意？", "洱海波纹是怎么扎出来的？", "八角花为什么是八瓣？")),
            new CategoryMeta("heritage", "非遗与传承", "国家级非遗条目、传承人与保护方式",
                    List.of("白族扎染什么时候列入国家级非遗？", "段银开是谁？", "现在还有哪些传承方式？")),
            new CategoryMeta("place", "产地与风物", "大理、周城、喜洲、巍山的地理与手艺",
                    List.of("周城为什么被称为扎染之乡？", "喜洲的扎染有什么特点？", "巍山也做扎染吗？")),
            new CategoryMeta("process", "工艺流程", "14 道工序、脱浆、扎花、九浸九晒",
                    List.of("扎染的完整工序有哪些？", "为什么要脱浆？", "扎花为什么要从中心向外？")),
            new CategoryMeta("faq", "常见问答", "入门体验、颜色深浅、清洗保养",
                    List.of("第一次体验扎染选哪种扎法？", "为什么每件颜色不一样？", "蓝染布怎么清洗？")));

    private final DyeKnowledgeChunkRepository chunkRepository;
    private final AiRuntimeStatus runtimeStatus;
    private final RagIndexService indexService;

    public RagCatalogService(DyeKnowledgeChunkRepository chunkRepository,
                             AiRuntimeStatus runtimeStatus,
                             RagIndexService indexService) {
        this.chunkRepository = chunkRepository;
        this.runtimeStatus = runtimeStatus;
        this.indexService = indexService;
    }

    @Transactional(readOnly = true)
    public CatalogDto catalog() {
        indexService.awaitReady(20, TimeUnit.SECONDS);
        int total = (int) chunkRepository.countByEnabledTrue();
        List<CategoryDto> categories = new ArrayList<>();
        Map<String, Integer> byCategory = new LinkedHashMap<>();
        for (CategoryMeta meta : CATEGORIES) {
            int count = (int) chunkRepository.countByEnabledTrueAndCategory(meta.key());
            byCategory.put(meta.key(), count);
            List<DyeKnowledgeChunk> chunks =
                    chunkRepository.findByEnabledTrueAndCategoryOrderByChunkKeyAsc(meta.key());
            List<String> titles = chunks.stream().limit(4).map(DyeKnowledgeChunk::getTitle).toList();
            categories.add(new CategoryDto(meta.key(), meta.label(), count, meta.description(),
                    meta.samplePrompts(), titles));
        }

        List<PromptDto> prompts = new ArrayList<>();
        int index = 1;
        for (CategoryMeta meta : CATEGORIES) {
            for (String prompt : meta.samplePrompts()) {
                prompts.add(new PromptDto("qa-" + index++, prompt, meta.key(), "qa"));
                if (prompts.size() >= 8) {
                    break;
                }
            }
            if (prompts.size() >= 8) {
                break;
            }
        }
        prompts.add(new PromptDto("quiz-1", "考我一道防染辨析题", "differentiation", "quiz"));
        prompts.add(new PromptDto("draw-1", "用棉布做一块洱海波纹的围巾", "motif", "draw"));

        List<PairDto> pairs = List.of();

        return new CatalogDto(
                runtimeStatus.getMode(),
                runtimeStatus.isDegraded(),
                runtimeStatus.getDegradedReason(),
                total,
                byCategory,
                categories,
                prompts,
                pairs,
                "2026-10-24.1");
    }

    @Transactional(readOnly = true)
    public KnowledgePageDto knowledge(String category, int offset, int limit) {
        indexService.awaitReady(20, TimeUnit.SECONDS);
        List<DyeKnowledgeChunk> chunks = (category == null || category.isBlank())
                ? chunkRepository.findByEnabledTrue()
                : chunkRepository.findByEnabledTrueAndCategoryOrderByChunkKeyAsc(category);
        int safeOffset = Math.max(0, offset);
        int safeLimit = Math.max(1, Math.min(limit <= 0 ? 20 : limit, 50));
        List<KnowledgeItemDto> items = chunks.stream()
                .skip(safeOffset)
                .limit(safeLimit)
                .map(chunk -> new KnowledgeItemDto(
                        chunk.getChunkKey(),
                        chunk.getTitle(),
                        chunk.getCategory(),
                        summarize(chunk.getContent()),
                        splitKeywords(chunk.getKeywords()),
                        chunk.getSource(),
                        chunk.getConfidence(),
                        promptsForCategory(chunk.getCategory())))
                .toList();
        return new KnowledgePageDto(chunks.size(), items);
    }

    public List<String> promptsForCategory(String category) {
        return CATEGORIES.stream()
                .filter(meta -> meta.key().equals(category))
                .findFirst()
                .map(CategoryMeta::samplePrompts)
                .orElse(List.of());
    }

    public Set<String> knownCategories() {
        return CATEGORIES.stream().map(CategoryMeta::key).collect(java.util.stream.Collectors.toSet());
    }

    private static String summarize(String content) {
        if (content == null) {
            return "";
        }
        return content.length() > 120 ? content.substring(0, 120) + "…" : content;
    }

    private static List<String> splitKeywords(String keywords) {
        if (keywords == null || keywords.isBlank()) {
            return List.of();
        }
        return List.of(keywords.split(","));
    }

    private record CategoryMeta(String key, String label, String description, List<String> samplePrompts) {
    }

    public record CatalogDto(
            String mode,
            boolean degraded,
            String degradedReason,
            int total,
            Map<String, Integer> knowledgeCount,
            List<CategoryDto> categories,
            List<PromptDto> suggestedPrompts,
            List<PairDto> confusePairs,
            String version
    ) {
    }

    public record CategoryDto(
            String key,
            String label,
            int count,
            String description,
            List<String> samplePrompts,
            List<String> chunkTitles
    ) {
    }

    public record PromptDto(String id, String text, String scope, String mode) {
    }

    public record PairDto(String pairKey, String left, String right, Integer difficulty, String topic) {
    }

    public record KnowledgePageDto(long total, List<KnowledgeItemDto> items) {
    }

    public record KnowledgeItemDto(
            String chunkKey,
            String title,
            String category,
            String summary,
            List<String> keywords,
            String source,
            String confidence,
            List<String> relatedPrompts
    ) {
    }
}
