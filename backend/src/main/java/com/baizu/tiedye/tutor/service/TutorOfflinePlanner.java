package com.baizu.tiedye.tutor.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.rag.model.RagHit;
import com.baizu.tiedye.rag.model.RetrievalResult;
import com.baizu.tiedye.rag.service.RagCatalogService;
import com.baizu.tiedye.rag.service.RagRetrievalService;
import com.baizu.tiedye.tutor.dto.GradeCardDto;
import com.baizu.tiedye.tutor.dto.QuizStatDto;
import com.baizu.tiedye.tutor.dto.TutorCardDto;
import com.baizu.tiedye.tutor.model.TutorTurnContext;
import com.baizu.tiedye.tutor.tool.ToolRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * 无 Key 时的规则版导师：意图识别、抽取式回答、预置出题、画图与判题。
 * 回答只拼接检索到的原文，宁可说“未收录”也不编造。
 */
@Service
public class TutorOfflinePlanner {

    private static final Pattern OPTION_PATTERN =
            Pattern.compile("(?i)(?:我\\s*选|选\\s*|答案\\s*(?:是|为)?\\s*)([ABCD])");
    private static final Pattern BARE_OPTION = Pattern.compile("^\\s*([ABCD])\\s*$", Pattern.CASE_INSENSITIVE);

    private final ToolRegistry toolRegistry;
    private final RagCatalogService catalogService;
    private final RagRetrievalService retrievalService;
    private final AiProperties properties;
    private final ObjectMapper objectMapper;

    public TutorOfflinePlanner(ToolRegistry toolRegistry,
                               RagCatalogService catalogService,
                               RagRetrievalService retrievalService,
                               AiProperties properties,
                               ObjectMapper objectMapper) {
        this.toolRegistry = toolRegistry;
        this.catalogService = catalogService;
        this.retrievalService = retrievalService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public boolean run(TutorTurnContext context) {
        String message = context.getMessage() == null ? "" : context.getMessage().trim();
        String intent = detectIntent(message, context);
        String topic = detectTopic(message);
        context.setIntentType(intent);
        context.setTopic(topic);

        switch (intent) {
            case "grade" -> handleGrade(context, message);
            case "quiz" -> handleQuiz(context);
            case "draw" -> handleDraw(context, message);
            case "capability" -> handleCapability(context);
            case "clarify" -> handleClarify(context, topic);
            default -> handleQa(context, topic);
        }
        applySuggestions(context, topic);
        return true;
    }

    public String detectIntent(String message, TutorTurnContext context) {
        if (containsAny(message, "你能做什么", "你会什么", "你有哪些资料", "能问什么", "知识范围", "介绍一下你自己")) {
            return "capability";
        }
        if (extractOption(message) != null && context.getPendingQuiz() != null) {
            return "grade";
        }
        if (containsAny(message, "出题", "考我", "来一道", "练习", "测验", "测试", "再考")) {
            return "quiz";
        }
        boolean product = containsAny(message, "围巾", "桌旗", "方巾");
        boolean drawVerb = containsAny(message, "画", "生成", "做一块", "来一张", "渲染");
        boolean motifWord = containsAny(message, "纹样", "扎染", "蓝染", "蝴蝶", "洱海", "八角",
                "梅花", "鱼", "莲", "水波", "几何");
        if (product || (drawVerb && motifWord)) {
            return "draw";
        }
        if (message.length() <= 2 && context.getPendingQuiz() == null) {
            return "clarify";
        }
        return "qa";
    }

    private void handleGrade(TutorTurnContext context, String message) {
        String option = extractOption(message);
        if (option == null || context.getPendingQuiz() == null) {
            handleClarify(context, "differentiation");
            return;
        }
        ObjectNode input = objectMapper.createObjectNode();
        input.put("quizId", context.getPendingQuiz().getQuizKey());
        input.put("optionKey", option);
        toolRegistry.find("grade_answer").ifPresent(tool -> {
            context.addObservation(tool.execute(context, input).summary());
        });
        GradeCardDto grade = context.getCards().stream()
                .filter(card -> "grade".equals(card.type()))
                .map(TutorCardDto::grade)
                .findFirst()
                .orElse(null);
        if (grade == null) {
            context.setAnswerText("这道题暂时无法判分，请换一道题再试。");
            return;
        }
        if (grade.correct()) {
            context.setAnswerText("答对了。你已经能抓住这个辨析点的核心差别。想继续的话，我可以出一道更难的同类题。");
        } else {
            String source = grade.citations().isEmpty() ? "" : "先回看《" + grade.citations().get(0).title() + "》。";
            context.setAnswerText("这题的正确答案是 " + grade.correctOptionKey() + "。" + source
                    + "解析已放在下方卡片里，弄懂后再来一道同类题。");
        }
        context.setAnswerCitationKeys(grade.citations().stream().map(citation -> citation.chunkKey()).toList());
        context.setLowConfidence(false);
    }

    private void handleQuiz(TutorTurnContext context) {
        int difficulty = context.getStats().stream()
                .filter(stat -> "differentiation".equals(stat.topic()))
                .map(QuizStatDto::nextDifficulty)
                .findFirst()
                .orElse(2);
        ObjectNode input = objectMapper.createObjectNode();
        input.put("difficulty", difficulty);
        input.put("topic", "differentiation");
        toolRegistry.find("gen_quiz").ifPresent(tool -> {
            context.addObservation(tool.execute(context, input).summary());
        });
        boolean hasQuiz = context.getCards().stream().anyMatch(card -> "quiz".equals(card.type()));
        context.setAnswerText(hasQuiz
                ? "我根据你的学习画像出了一道 " + difficulty + " 星辨析题。先自己判断，选好后提交答案，判分会由服务端完成。"
                : "题库暂时不可用，稍后再试一次。");
        context.setLowConfidence(false);
    }

    private void handleDraw(TutorTurnContext context, String message) {
        ObjectNode input = objectMapper.createObjectNode();
        input.put("prompt", message);
        input.put("fabric", detectFabric(message));
        input.put("concentration", detectConcentration(message));
        toolRegistry.find("draw_pattern").ifPresent(tool -> {
            context.addObservation(tool.execute(context, input).summary());
        });
        boolean hasPattern = context.getCards().stream().anyMatch(card -> "pattern".equals(card.type()));
        context.setAnswerText(hasPattern
                ? "已按你的描述生成纹样参数，画布与氧化动画会使用同一组数据。你可以继续用一句话微调，或点「换一个种子」看随机细节。"
                : "这次纹样生成没有成功，可以换一种描述再试。");
        context.setLowConfidence(false);
    }

    private void handleCapability(TutorTurnContext context) {
        RagCatalogService.CatalogDto catalog = catalogService.catalog();
        StringBuilder builder = new StringBuilder("我目前掌握的白族扎染知识分为以下几类：\n");
        for (RagCatalogService.CategoryDto category : catalog.categories()) {
            builder.append("- ").append(category.label())
                    .append("（").append(category.count()).append(" 条）：")
                    .append(category.description()).append('\n');
        }
        builder.append("\n你可以直接问工艺、纹样、产地、传承人，也可以让我出题或画纹样。");
        context.setAnswerText(builder.toString());
        context.setAnswerCitationKeys(List.of());
        context.setRelatedQuestions(catalog.suggestedPrompts().stream()
                .map(RagCatalogService.PromptDto::text).limit(4).toList());
        context.setLowConfidence(false);
    }

    private void handleClarify(TutorTurnContext context, String topic) {
        RagCatalogService.CatalogDto catalog = catalogService.catalog();
        List<String> options = catalog.categories().stream()
                .limit(4)
                .map(RagCatalogService.CategoryDto::label)
                .toList();
        ObjectNode input = objectMapper.createObjectNode();
        input.put("question", "我还不确定你想问哪一方面，可以选一个方向：");
        var array = input.putArray("options");
        options.forEach(array::add);
        toolRegistry.find("clarify").ifPresent(tool -> {
            context.addObservation(tool.execute(context, input).summary());
        });
        context.setAnswerText("我可以从工艺、纹样、氧化显色、非遗与产地、易混辨析或常见问答几个方向帮你。"
                + "你也可以直接描述想了解的内容，我会先检索知识库。");
        context.setLowConfidence(true);
    }

    private void handleQa(TutorTurnContext context, String topic) {
        String level = evaluateEvidence(context);
        if ("none".equals(level)) {
            ObjectNode input = objectMapper.createObjectNode();
            input.put("query", context.getMessage());
            if (topic != null) {
                input.put("category", topic);
            }
            input.put("topK", properties.getRag().getTopK());
            toolRegistry.find("retrieve").ifPresent(tool -> {
                context.addObservation(tool.execute(context, input).summary());
            });
            level = evaluateEvidence(context);
        }

        if ("none".equals(level) || context.getEvidence().isEmpty()) {
            RagCatalogService.CatalogDto catalog = catalogService.catalog();
            String labels = catalog.categories().stream()
                    .map(RagCatalogService.CategoryDto::label)
                    .reduce((left, right) -> left + "、" + right)
                    .orElse("扎结技法、纹样语义");
            // 先挂澄清卡，再用“未收录”文案覆盖，避免被通用引导语盖掉。
            handleClarify(context, topic);
            context.setAnswerText("我暂时没有在知识库里找到足够相关的资料，不想凭空编一个答案。"
                    + "目前已收录的范围包括：" + labels + "。你可以换个问法，或从右侧「知识范围」点一个示例问题。");
            context.setLowConfidence(true);
            context.setAnswerCitationKeys(List.of());
            return;
        }

        List<RagHit> hits = context.getEvidence().stream()
                .filter(hit -> topic == null || topic.equals(hit.category()) || "faq".equals(hit.category()))
                .limit(3)
                .toList();
        if (hits.isEmpty()) {
            hits = context.getEvidence().stream().limit(3).toList();
        }
        List<String> citationKeys = new ArrayList<>();
        StringBuilder builder = new StringBuilder();
        if ("warn".equals(level)) {
            builder.append("知识库里没有完全对应的问题，下面是最接近的资料，供你参考。\n\n");
        } else {
            builder.append("可以从这些资料来理解：\n\n");
        }
        for (int i = 0; i < hits.size(); i++) {
            RagHit hit = hits.get(i);
            citationKeys.add(hit.chunkKey());
            // 标题通常取自正文首句，这里只放正文，避免同一句话重复两遍。
            builder.append(i + 1).append(". ").append(shorten(hit.content(), 240)).append('\n');
        }
        builder.append("\n以上内容来自知识库分片，点开引用可以查看来源。");
        context.setAnswerText(builder.toString());
        context.setAnswerCitationKeys(citationKeys);
        context.setLowConfidence("warn".equals(level));
        context.setRelatedQuestions(catalogService.promptsForCategory(topic).stream()
                .filter(prompt -> !prompt.equals(context.getMessage()))
                .limit(3)
                .toList());
    }

    private String evaluateEvidence(TutorTurnContext context) {
        if (context.getEvidence().isEmpty()) {
            return "none";
        }
        double top = context.getEvidence().stream().mapToDouble(RagHit::score).max().orElse(0.0);
        if (top < properties.getRag().getMinScore()) {
            return "none";
        }
        if (top < properties.getRag().getLowConfidence()) {
            return "warn";
        }
        return "ok";
    }

    private void applySuggestions(TutorTurnContext context, String topic) {
        RagCatalogService.CatalogDto catalog = catalogService.catalog();
        if (context.getSuggestedPrompts().isEmpty()) {
            List<String> prompts = catalog.suggestedPrompts().stream()
                    .map(RagCatalogService.PromptDto::text)
                    .limit(4)
                    .toList();
            context.setSuggestedPrompts(prompts);
        }
        if (context.getRelatedQuestions().isEmpty()) {
            context.setRelatedQuestions(catalogService.promptsForCategory(topic));
        }
    }

    public static String detectTopic(String message) {
        if (containsAny(message, "蜡染", "蜡缬", "夹缬", "灰缬", "蓝印花布", "区别", "辨析", "怎么分")) {
            return "differentiation";
        }
        if (containsAny(message, "氧化", "蓝靛", "板蓝根", "变蓝", "颜色深浅", "浸染")) {
            return "oxidation";
        }
        if (containsAny(message, "蝴蝶", "纹样", "寓意", "洱海", "八角", "梅花", "铜钱", "回纹", "水波")) {
            return "motif";
        }
        if (containsAny(message, "周城", "喜洲", "巍山", "大理", "传承人", "非遗", "博物馆", "产地")) {
            return "place";
        }
        if (containsAny(message, "工序", "脱浆", "扎花", "针距", "蜂蜡", "固色", "拆线")) {
            return "process";
        }
        if (containsAny(message, "捆扎", "缝扎", "缚扎", "撮扎", "夹扎", "防染", "扎结")) {
            return "technique";
        }
        if (containsAny(message, "保养", "清洗", "新手", "体验", "入门")) {
            return "faq";
        }
        return null;
    }

    private static String extractOption(String message) {
        Matcher matcher = OPTION_PATTERN.matcher(message);
        if (matcher.find()) {
            return matcher.group(1).toUpperCase(Locale.ROOT);
        }
        Matcher bare = BARE_OPTION.matcher(message);
        if (bare.find()) {
            return bare.group(1).toUpperCase(Locale.ROOT);
        }
        return null;
    }

    private static String detectFabric(String message) {
        if (containsAny(message, "麻", "亚麻")) {
            return "linen";
        }
        if (containsAny(message, "丝", "绸", "蚕丝")) {
            return "silk";
        }
        return "cotton";
    }

    private static double detectConcentration(String message) {
        if (containsAny(message, "深", "浓", "重", "多次", "九浸")) {
            return 0.9;
        }
        if (containsAny(message, "浅", "淡", "轻", "少")) {
            return 0.4;
        }
        return 0.8;
    }

    private static boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private static String shorten(String value, int max) {
        if (value == null) {
            return "";
        }
        String text = value.replaceAll("\\s+", " ");
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
