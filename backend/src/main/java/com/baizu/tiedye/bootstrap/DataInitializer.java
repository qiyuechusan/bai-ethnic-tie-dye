package com.baizu.tiedye.bootstrap;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.artwork.entity.Artwork;
import com.baizu.tiedye.artwork.repository.ArtworkRepository;
import com.baizu.tiedye.atlas.entity.MapPlace;
import com.baizu.tiedye.atlas.entity.MapStat;
import com.baizu.tiedye.atlas.repository.MapPlaceRepository;
import com.baizu.tiedye.atlas.repository.MapStatRepository;
import com.baizu.tiedye.diy.entity.DyeTieMethod;
import com.baizu.tiedye.diy.repository.DyeTieMethodRepository;
import com.baizu.tiedye.pattern.entity.Pattern;
import com.baizu.tiedye.pattern.repository.PatternRepository;
import com.baizu.tiedye.quiz.entity.KnowledgeChunk;
import com.baizu.tiedye.quiz.entity.QuizOption;
import com.baizu.tiedye.quiz.entity.QuizQuestion;
import com.baizu.tiedye.quiz.repository.KnowledgeChunkRepository;
import com.baizu.tiedye.quiz.repository.QuizOptionRepository;
import com.baizu.tiedye.quiz.repository.QuizQuestionRepository;

/**
 * 首次启动时写入所有模块的演示数据。
 *
 * <p>所有方法都是幂等的：目标表已有数据时直接跳过。
 * 如果数据库中已有旧版 lanbai-backend 留下的表，建议先删除并重建 baizu_tiedye。</p>
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String DEFAULT_SOURCE = "中国非物质文化遗产网 · 白族扎染技艺";
    private static final String DEMO_AUTHOR = "蓝白之境 · 演示作品";

    private final DyeTieMethodRepository methodRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;
    private final PatternRepository patternRepository;
    private final ArtworkRepository artworkRepository;
    private final MapPlaceRepository placeRepository;
    private final MapStatRepository statRepository;

    private int knowledgeSortOrder = 10;
    private int patternSortOrder = 100;

    public DataInitializer(DyeTieMethodRepository methodRepository,
                           KnowledgeChunkRepository chunkRepository,
                           QuizQuestionRepository questionRepository,
                           QuizOptionRepository optionRepository,
                           PatternRepository patternRepository,
                           ArtworkRepository artworkRepository,
                           MapPlaceRepository placeRepository,
                           MapStatRepository statRepository) {
        this.methodRepository = methodRepository;
        this.chunkRepository = chunkRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.patternRepository = patternRepository;
        this.artworkRepository = artworkRepository;
        this.placeRepository = placeRepository;
        this.statRepository = statRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedDiyMethods();
        seedPatterns();
        seedKnowledgeQuiz();
        seedPatternQuiz();
        seedMap();
        seedArtworks();
    }

    // ==================== 模块 5：扎结方式 ====================

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

    // ==================== 模块 3：纹样图鉴 ====================

    private void seedPatterns() {
        if (patternRepository.count() > 0) {
            return;
        }

        addPattern("蝴蝶纹", "assets/pattern-butterfly.png", "爱情、吉祥与美好",
                "动物纹", "蝴蝶成双成对，是白族扎染中最常见的吉祥纹样之一。", 10);
        addPattern("鱼纹", "assets/pattern-fish.png", "年年有余、丰饶",
                "动物纹", "鱼与“余”谐音，寄托对生活富足的祝愿。", 20);
        addPattern("冰裂纹", "assets/pattern-ice.png", "自然肌理、偶然之美",
                "自然纹", "染液沿折痕渗入形成不规则裂纹，强调手工与偶然。", 30);
        addPattern("山水纹", "assets/pattern-landscape.png", "苍洱风物、家园",
                "风景纹", "把苍山洱海的轮廓收进布面，是地方生活的缩影。", 40);
        addPattern("莲花纹", "assets/pattern-lotus.png", "清雅、洁净",
                "植物纹", "莲花出淤泥而不染，常用来表达清雅与吉祥。", 50);
        addPattern("八角纹", "assets/pattern-octagon.png", "几何秩序、太阳崇拜",
                "几何纹", "八角对称结构常见于白族民居与扎染几何纹样。", 60);
        addPattern("梅花纹", "assets/pattern-plum.png", "坚韧、高洁",
                "植物纹", "梅花凌寒而开，被赋予坚韧、高洁的品格。", 70);
        addPattern("太阳纹", "assets/pattern-sun.png", "光明、生命力",
                "几何纹", "放射状太阳纹象征光明与生命力，也常见于白族服饰。", 80);
        addPattern("水波纹", "assets/pattern-wave.png", "生生不息",
                "自然纹", "连续水波象征绵延不绝的生命与生活。", 90);

        log.info("Seeded {} patterns", patternRepository.count());
    }

    private void addPattern(String name, String imageUrl, String meaning,
                            String category, String description, int sortOrder) {
        Pattern pattern = new Pattern();
        pattern.setName(name);
        pattern.setImageUrl(imageUrl);
        pattern.setMeaning(meaning);
        pattern.setCategory(category);
        pattern.setDescription(description);
        pattern.setSortOrder(sortOrder);
        patternRepository.save(pattern);
    }

    private void seedPatternQuiz() {
        if (questionRepository.countByEnabledTrueAndScope("pattern") > 0) {
            return;
        }

        Pattern butterfly = patternRepository.findByName("蝴蝶纹").orElse(null);
        Pattern plum = patternRepository.findByName("梅花纹").orElse(null);
        Pattern wave = patternRepository.findByName("水波纹").orElse(null);
        Pattern sun = patternRepository.findByName("太阳纹").orElse(null);
        Pattern fish = patternRepository.findByName("鱼纹").orElse(null);
        if (butterfly == null || plum == null || wave == null || sun == null || fish == null) {
            log.warn("Pattern seed data is incomplete; pattern quiz seeding skipped");
            return;
        }

        addQuestion("pattern", butterfly.getId(), null,
                "白族扎染中的蝴蝶纹通常寄托什么愿望？",
                "纹样寓意", 1,
                "蝴蝶纹常成双出现，寓意爱情、吉祥与美好。",
                "B",
                "长寿与战争",
                "爱情、吉祥与美好",
                "财富与权力",
                "离别与忧伤");

        addQuestion("pattern", plum.getId(), null,
                "梅花纹在扎染中常象征什么品格？",
                "纹样寓意", 1,
                "梅花凌寒而开，常被赋予坚韧、高洁的品格。",
                "A",
                "坚韧与高洁",
                "富贵与权力",
                "速度与力量",
                "丰收与富足");

        addQuestion("pattern", wave.getId(), null,
                "连续水波纹通常表达什么寓意？",
                "纹样寓意", 1,
                "连续水波象征绵延不绝、生生不息。",
                "C",
                "离别与思念",
                "战争与胜利",
                "生生不息",
                "财富与地位");

        addQuestion("pattern", sun.getId(), null,
                "太阳纹的放射状结构最常象征什么？",
                "纹样寓意", 1,
                "太阳纹象征光明、温暖与生命力。",
                "A",
                "光明与生命力",
                "雨水与丰收",
                "夜晚与安静",
                "山川与道路");

        addQuestion("pattern", fish.getId(), null,
                "鱼纹在民间纹样中常借助谐音表达什么？",
                "纹样寓意", 1,
                "“鱼”与“余”谐音，寓意年年有余、生活富足。",
                "D",
                "平安与健康",
                "智慧与勇气",
                "团圆与思念",
                "年年有余、丰饶");

        log.info("Seeded {} pattern quiz questions", questionRepository.countByEnabledTrueAndScope("pattern"));
    }

    // ==================== 模块 6：非遗问答 ====================

    private void seedKnowledgeQuiz() {
        // 兼容合并前创建的旧题库：旧行没有 scope，统一归入 knowledge。
        questionRepository.fillMissingScope();

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

        if (questionRepository.countByEnabledTrueAndScope("knowledge") > 0) {
            return;
        }

        addQuestion("knowledge", null, differences,
                "绞缬（扎染）与蜡缬（蜡染）最主要的区别是什么？",
                "工艺辨析", 1,
                "绞缬靠线绳扎结防染，蜡缬靠蜡层防染，夹缬靠雕花木板夹持防染，三者的核心区别是防染方式。",
                "B",
                "使用的染料完全不同",
                "防染方式不同：前者靠扎结，后者靠蜡",
                "只有白族使用绞缬",
                "蜡缬不需要浸染");

        addQuestion("knowledge", null, differences,
                "夹缬工艺主要借助什么工具实现防染？",
                "工艺辨析", 1,
                "夹缬用两片雕刻相同花纹的木板夹住织物，花纹凸起处阻止染液进入，从而形成对称纹样。",
                "A",
                "雕花木板",
                "扎线",
                "蜡刀",
                "石碾");

        addQuestion("knowledge", null, origin,
                "白族扎染最具代表性的传承地是？",
                "历史源流", 1,
                "白族扎染主要流传于云南大理，喜洲镇周城村是最具代表性的传承地。",
                "A",
                "云南大理周城",
                "贵州丹寨",
                "江苏苏州",
                "四川自贡");

        addQuestion("knowledge", null, indigo,
                "白族扎染常用的蓝色染料主要来自？",
                "染色原理", 2,
                "白族扎染传统上以板蓝根、蓼蓝等植物发酵制取蓝靛，属于植物染料。",
                "B",
                "矿物蓝铜矿",
                "板蓝根等植物发酵制成的蓝靛",
                "化学合成靛蓝",
                "海藻提取物");

        addQuestion("knowledge", null, indigo,
                "织物刚浸入染液时呈黄绿色，取出后逐渐变蓝，主要原因是？",
                "染色原理", 2,
                "靛蓝染料在染液中处于还原态，呈黄绿色；取出后与空气接触发生氧化，逐渐恢复蓝色。",
                "B",
                "水分蒸发",
                "靛蓝被空气氧化",
                "染料与棉纤维发生化学反应",
                "阳光漂白");

        addQuestion("knowledge", null, resist,
                "扎结处能够形成留白纹样，主要原理是？",
                "染色原理", 2,
                "扎结使局部纤维被紧紧束缚，染液难以渗入；解开后这些部位保留织物底色，形成留白纹样。",
                "B",
                "扎结处温度更高",
                "扎结处染液难以进入",
                "扎结改变了纤维颜色",
                "扎结处染料被烧掉");

        addQuestion("knowledge", null, motif,
                "白族扎染中蝴蝶纹常被赋予的寓意是？",
                "纹样寓意", 1,
                "蝴蝶纹是白族扎染常见纹样，常寄托爱情、吉祥、美好等愿望。",
                "B",
                "长寿与战争",
                "爱情、吉祥与美好",
                "财富与权力",
                "离别与忧伤");

        addQuestion("knowledge", null, heritage,
                "白族扎染技艺列入国家级非物质文化遗产名录的时间是？",
                "历史源流", 1,
                "白族扎染技艺于2006年列入第一批国家级非物质文化遗产名录。",
                "B",
                "2001年",
                "2006年",
                "2011年",
                "2018年");

        log.info("Seeded {} knowledge quiz questions", questionRepository.countByEnabledTrueAndScope("knowledge"));
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

    /**
     * 写入一道题及四个选项。scope = knowledge 时 chunk 必填；
     * scope = pattern 时 patternId 必填，chunk 可以为 null。
     */
    private void addQuestion(String scope, Long patternId, KnowledgeChunk chunk,
                             String stem, String category, int difficulty, String explanation,
                             String correctKey, String... optionTexts) {
        if (optionTexts.length != 4) {
            throw new IllegalArgumentException("每道题必须提供 4 个选项");
        }

        QuizQuestion question = new QuizQuestion();
        question.setStem(stem);
        question.setCategory(category);
        question.setDifficulty(difficulty);
        question.setExplanation(explanation);
        question.setChunkId(chunk == null ? null : chunk.getId());
        question.setScope(scope);
        question.setPatternId(patternId);
        question.setSortOrder("pattern".equals(scope) ? patternSortOrder : knowledgeSortOrder);
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

        if ("pattern".equals(scope)) {
            patternSortOrder += 10;
        } else {
            knowledgeSortOrder += 10;
        }
    }

    // ==================== 模块 5：非遗地图 ====================

    private void seedMap() {
        if (placeRepository.count() == 0) {
            addPlace("zhoucheng", "周城", "核心传承地 · 白族扎染",
                    "苍山脚下、洱海西岸的白族村落。院落里的染缸与晾架，把扎染留在日常生活之中。",
                    "扎花针脚、板蓝根靛缸、院落晾布",
                    "段银开 · 白族扎染技艺代表性传承人",
                    "家庭染坊、研学体验与文创产品并行",
                    "先看一双手怎样把线缝进布里，再看蓝如何在空气里慢慢显出来。",
                    "assets/zhoucheng.jpg",
                    "25.85", "100.13", "53.2", "45.3", "1.08", 1);

            addPlace("xizhou", "喜洲", "白族聚落 · 生活图景",
                    "从周城向南，苍山与洱海之间的白族院落、商道与集市，构成了理解扎染生活语境的一页。",
                    "白族院落、照壁、传统商街与地方手艺",
                    "地方匠人 · 院落中的家庭传承",
                    "文化旅行与传统民居体验让手工艺被更多人看见",
                    "在喜洲，染布不是孤立的，它和建筑、商帮与日常生活一起被记住。",
                    "assets/xizhou.jpg",
                    "25.72", "100.08", "40.8", "62.7", "1.30", 2);

            addPlace("weishan", "巍山", "山地古城 · 手艺记忆",
                    "沿苍洱向南进入巍山，古城与山地村落保留着另一种节奏。扎染在这里与刺绣、织布等手艺共同构成地方记忆。",
                    "古城街巷、白族民居与山地手工艺",
                    "地方手艺传承者 · 家庭作坊",
                    "古城文旅与小型手作体验延续地方技艺",
                    "在巍山，染布不是孤立的，它和织布、挑花一起，缝进了古城的生活。",
                    "assets/weishan.jpg",
                    "25.23", "100.31", "74.5", "76.6", "1.30", 3);

            log.info("Seeded {} map places", placeRepository.count());
        }

        if (statRepository.count() == 0) {
            addStat("zhoucheng", 4000, 200, "待调研");
            addStat("xizhou", 1200, 85, "待调研");
            addStat("weishan", 650, 40, "待调研");
            log.info("Seeded {} map stats", statRepository.count());
        }
    }

    private void addPlace(String id, String name, String kicker, String lead, String highlight,
                          String person, String currentState, String note, String photo,
                          String latitude, String longitude, String mapX, String mapY,
                          String mapScale, int sortOrder) {
        MapPlace place = new MapPlace();
        place.setId(id);
        place.setName(name);
        place.setKicker(kicker);
        place.setLead(lead);
        place.setHighlight(highlight);
        place.setPerson(person);
        place.setCurrentState(currentState);
        place.setNote(note);
        place.setPhoto(photo);
        place.setLatitude(new BigDecimal(latitude));
        place.setLongitude(new BigDecimal(longitude));
        place.setMapX(new BigDecimal(mapX));
        place.setMapY(new BigDecimal(mapY));
        place.setMapScale(new BigDecimal(mapScale));
        place.setSortOrder(sortOrder);
        placeRepository.save(place);
    }

    private void addStat(String placeId, int workers, int workshops, String annualOutput) {
        MapStat stat = new MapStat();
        stat.setPlaceId(placeId);
        stat.setWorkers(workers);
        stat.setWorkshops(workshops);
        stat.setAnnualOutput(annualOutput);
        stat.setSourceNote("演示统计口径 · 正式发布前请以实地调研数据替换");
        stat.setUpdatedAt(LocalDate.of(2026, 10, 22));
        statRepository.save(stat);
    }

    // ==================== 模块 4：作品墙演示数据 ====================

    private void seedArtworks() {
        if (artworkRepository.count() > 0) {
            return;
        }

        String[] titles = {
                "蝶翼初蓝", "风琴水波", "豆粒星图", "螺旋星芒", "缝线山影",
                "板蓝小札", "苍洱一角", "扎花手记", "一匹慢蓝"
        };
        String[] methods = {"缝扎", "折叠夹扎", "捆扎", "捆扎", "缝扎", "捆扎", "折叠夹扎", "缝扎", "折叠夹扎"};
        String[] descriptions = {
                "沿着蝶翼轮廓缝合，再让靛蓝慢慢渗进线迹。",
                "反复折叠后分段扎紧，展开是一层层水波。",
                "豆粒包住布面，染出大小不一的圆点。",
                "从中心提起旋转，展开后像一枚星芒。",
                "线迹把山影留在布上，也把时间留在布里。",
                "第一次试着控制浸染次数，蓝色深浅全凭手感。",
                "把苍山洱海的轮廓收进一块方巾。",
                "扎花时留下的针脚，是这块布最诚实的记录。",
                "不急着显色，等它在空气里慢慢变蓝。"
        };

        for (int i = 0; i < titles.length; i++) {
            Artwork artwork = new Artwork();
            artwork.setTitle(titles[i]);
            artwork.setImageUrl("assets/art-" + (i + 1) + ".jpg");
            artwork.setDescription(descriptions[i]);
            artwork.setTieMethod(methods[i]);
            artwork.setAuthorName(DEMO_AUTHOR);
            artwork.setStatus(1);
            artwork.setLikes(0);
            artworkRepository.save(artwork);
        }

        log.info("Seeded {} demo artworks", artworkRepository.count());
    }
}
