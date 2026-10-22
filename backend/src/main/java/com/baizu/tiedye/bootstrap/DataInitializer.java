package com.baizu.tiedye.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.diy.entity.DyeTieMethod;
import com.baizu.tiedye.diy.repository.DyeTieMethodRepository;
import com.baizu.tiedye.quiz.entity.KnowledgeChunk;
import com.baizu.tiedye.quiz.entity.QuizOption;
import com.baizu.tiedye.quiz.entity.QuizQuestion;
import com.baizu.tiedye.quiz.repository.KnowledgeChunkRepository;
import com.baizu.tiedye.quiz.repository.QuizOptionRepository;
import com.baizu.tiedye.quiz.repository.QuizQuestionRepository;

/**
 * 首次启动时写入模块 5 / 6 自己的种子数据。
 * 只操作 C 负责的表：dye_tie_method、knowledge_chunk、quiz_question、quiz_option。
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String DEFAULT_SOURCE = "中国非物质文化遗产网 · 白族扎染技艺";

    private final DyeTieMethodRepository methodRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;

    private int questionSortOrder = 10;

    public DataInitializer(DyeTieMethodRepository methodRepository,
                           KnowledgeChunkRepository chunkRepository,
                           QuizQuestionRepository questionRepository,
                           QuizOptionRepository optionRepository) {
        this.methodRepository = methodRepository;
        this.chunkRepository = chunkRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedDiyMethods();
        seedQuiz();
    }

    private void seedDiyMethods() {
        if (methodRepository.count() > 0) {
            return;
        }

        addMethod("spiral", "螺旋绞缬", "星芒螺旋",
                "从布面中心提起并旋转扎紧，染液沿折痕渗入，展开后形成放射状螺旋。",
                "spiral", 2,
                "{\"rings\":14,\"spacing\":1.04,\"gap\":9,\"wobble\":0.06,\"core\":0.05,\"spokes\":6,\"twist\":0.18}",
                "[\"#f7f3e8\",\"#c9d27c\",\"#7e9a70\",\"#2d6d8e\",\"#0b3863\"]", 10);

        addMethod("stitch", "缝扎蝴蝶", "蝶翼缝线",
                "用针线沿蝴蝶轮廓缝合并抽紧，线迹阻挡染液，留下细腻的蝶翼纹样。",
                "stitch", 3,
                "{\"motif\":\"butterfly\",\"cellWidth\":150,\"cellHeight\":170,\"gap\":6,\"angle\":-18,\"rows\":6,\"cols\":5}",
                "[\"#f7f3e8\",\"#d7dc9a\",\"#6f9588\",\"#24648e\",\"#082a4c\"]", 20);

        addMethod("accordion", "风琴折叠", "层叠水波",
                "将织物反复折叠成风琴状，再用线绳分段扎紧，形成连续的波纹与折痕。",
                "accordion", 1,
                "{\"folds\":22,\"amplitude\":10,\"gap\":7,\"taper\":0.18,\"slant\":0.12}",
                "[\"#f7f3e8\",\"#c9d27c\",\"#7e9a70\",\"#2d6d8e\",\"#0b3863\"]", 30);

        addMethod("bean", "豆结扎染", "豆粒圆纹",
                "以豆粒或石子包裹布面后扎紧，形成大小不一的圆点，晕染后像散落的豆纹。",
                "bean", 2,
                "{\"count\":34,\"minRadius\":10,\"maxRadius\":26,\"halo\":1.55,\"clusters\":5,\"spread\":0.72}",
                "[\"#f7f3e8\",\"#d7dc9a\",\"#7e9a70\",\"#24648e\",\"#0b3863\"]", 40);

        log.info("Seeded {} dye tie methods", methodRepository.count());
    }

    private void addMethod(String code, String name, String subtitle, String description,
                           String patternType, int difficulty, String params,
                           String previewColors, int sortOrder) {
        DyeTieMethod method = new DyeTieMethod();
        method.setCode(code);
        method.setName(name);
        method.setSubtitle(subtitle);
        method.setDescription(description);
        method.setPatternType(patternType);
        method.setDifficulty(difficulty);
        method.setParams(params);
        method.setPreviewColors(previewColors);
        method.setSortOrder(sortOrder);
        method.setEnabled(true);
        methodRepository.save(method);
    }

    private void seedQuiz() {
        KnowledgeChunk differences = ensureChunk(
                "绞缬、蜡缬与夹缬",
                "绞缬（扎染）用线绳扎结织物防染；蜡缬（蜡染）用蜡描绘防染；夹缬用雕刻木板夹持织物防染。三者都是中国传统防染印花工艺。",
                DEFAULT_SOURCE,
                "绞缬,蜡缬,夹缬,防染");

        KnowledgeChunk origin = ensureChunk(
                "白族扎染的核心产地",
                "白族扎染主要流传于云南大理白族自治州，以大理市喜洲镇周城村最具代表性，被称为“白族扎染之乡”。",
                DEFAULT_SOURCE,
                "大理,周城,白族,扎染");

        KnowledgeChunk indigo = ensureChunk(
                "蓝靛与氧化显色",
                "白族扎染多用板蓝根等植物发酵制靛。织物浸入还原态染液时呈黄绿色，取出接触空气后，靛蓝被氧化，颜色逐渐转为蓝色。",
                "《白族扎染技艺》相关研究",
                "蓝靛,板蓝根,氧化,显色");

        KnowledgeChunk resist = ensureChunk(
                "扎结防染原理",
                "扎结使织物局部被紧紧束缚，染液难以进入；未被扎紧的部分充分接触染液而着色。解开扎线后，被防染的部分保留底色，形成深浅晕染的纹样。",
                "白族扎染工艺说明",
                "扎结,防染,浸染,纹样");

        KnowledgeChunk motif = ensureChunk(
                "常见纹样寓意",
                "白族扎染常见蝴蝶纹、梅花纹、太阳纹、几何纹等。蝴蝶纹常寓意爱情、吉祥与美好，植物纹样多寄托对自然和生活的祝愿。",
                "大理白族扎染纹样研究",
                "蝴蝶纹,梅花纹,纹样,寓意");

        KnowledgeChunk heritage = ensureChunk(
                "白族扎染的非遗级别",
                "白族扎染技艺于2006年列入第一批国家级非物质文化遗产名录，项目类别为传统技艺。",
                DEFAULT_SOURCE,
                "国家级,非物质文化遗产,2006");

        if (questionRepository.count() > 0) {
            return;
        }

        addQuestion(
                "绞缬（扎染）与蜡缬（蜡染）最主要的区别是什么？",
                "工艺辨析", 1,
                "绞缬靠线绳扎结防染，蜡缬靠蜡层防染，夹缬靠雕花木板夹持防染，三者的核心区别是防染方式。",
                differences, "B",
                "使用的染料完全不同",
                "防染方式不同：前者靠扎结，后者靠蜡",
                "只有白族使用绞缬",
                "蜡缬不需要浸染");

        addQuestion(
                "夹缬工艺主要借助什么工具实现防染？",
                "工艺辨析", 1,
                "夹缬用两片雕刻相同花纹的木板夹住织物，花纹凸起处阻止染液进入，从而形成对称纹样。",
                differences, "A",
                "雕花木板",
                "扎线",
                "蜡刀",
                "石碾");

        addQuestion(
                "白族扎染最具代表性的传承地是？",
                "历史源流", 1,
                "白族扎染主要流传于云南大理，喜洲镇周城村是最具代表性的传承地。",
                origin, "A",
                "云南大理周城",
                "贵州丹寨",
                "江苏苏州",
                "四川自贡");

        addQuestion(
                "白族扎染常用的蓝色染料主要来自？",
                "染色原理", 2,
                "白族扎染传统上以板蓝根、蓼蓝等植物发酵制取蓝靛，属于植物染料。",
                indigo, "B",
                "矿物蓝铜矿",
                "板蓝根等植物发酵制成的蓝靛",
                "化学合成靛蓝",
                "海藻提取物");

        addQuestion(
                "织物刚浸入染液时呈黄绿色，取出后逐渐变蓝，主要原因是？",
                "染色原理", 2,
                "靛蓝染料在染液中处于还原态，呈黄绿色；取出后与空气接触发生氧化，逐渐恢复蓝色。",
                indigo, "B",
                "水分蒸发",
                "靛蓝被空气氧化",
                "染料与棉纤维发生化学反应",
                "阳光漂白");

        addQuestion(
                "扎结处能够形成留白纹样，主要原理是？",
                "染色原理", 2,
                "扎结使局部纤维被紧紧束缚，染液难以渗入；解开后这些部位保留织物底色，形成留白纹样。",
                resist, "B",
                "扎结处温度更高",
                "扎结处染液难以进入",
                "扎结改变了纤维颜色",
                "扎结处染料被烧掉");

        addQuestion(
                "白族扎染中蝴蝶纹常被赋予的寓意是？",
                "纹样寓意", 1,
                "蝴蝶纹是白族扎染常见纹样，常寄托爱情、吉祥、美好等愿望。",
                motif, "B",
                "长寿与战争",
                "爱情、吉祥与美好",
                "财富与权力",
                "离别与忧伤");

        addQuestion(
                "白族扎染技艺列入国家级非物质文化遗产名录的时间是？",
                "历史源流", 1,
                "白族扎染技艺于2006年列入第一批国家级非物质文化遗产名录。",
                heritage, "B",
                "2001年",
                "2006年",
                "2011年",
                "2018年");

        log.info("Seeded {} quiz questions", questionRepository.count());
    }

    private KnowledgeChunk ensureChunk(String title, String content, String source, String keywords) {
        return chunkRepository.findByTitle(title).orElseGet(() -> {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setTitle(title);
            chunk.setContent(content);
            chunk.setSource(source);
            chunk.setKeywords(keywords);
            return chunkRepository.save(chunk);
        });
    }

    private void addQuestion(String stem, String category, int difficulty, String explanation,
                             KnowledgeChunk chunk, String correctKey, String... optionTexts) {
        QuizQuestion question = new QuizQuestion();
        question.setStem(stem);
        question.setCategory(category);
        question.setDifficulty(difficulty);
        question.setExplanation(explanation);
        question.setChunkId(chunk.getId());
        question.setSortOrder(questionSortOrder);
        question.setEnabled(true);
        question = questionRepository.save(question);

        String[] keys = {"A", "B", "C", "D"};
        for (int i = 0; i < optionTexts.length; i++) {
            QuizOption option = new QuizOption();
            option.setQuestionId(question.getId());
            option.setOptionKey(keys[i]);
            option.setContent(optionTexts[i]);
            option.setCorrect(keys[i].equals(correctKey));
            option.setSortOrder((i + 1) * 10);
            optionRepository.save(option);
        }
        questionSortOrder += 10;
    }
}
