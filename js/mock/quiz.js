/**
 * 后端未启动时的演示题库，字段结构与 /api/quiz/questions 和 /api/quiz/answer 一致。
 */
const CHUNKS = {
  differences: {
    id: 1,
    title: '绞缬、蜡缬与夹缬',
    content: '绞缬（扎染）用线绳扎结织物防染；蜡缬（蜡染）用蜡描绘防染；夹缬用雕刻木板夹持织物防染。三者都是中国传统防染印花工艺。',
    source: '中国非物质文化遗产网 · 白族扎染技艺',
  },
  origin: {
    id: 2,
    title: '白族扎染的核心产地',
    content: '白族扎染主要流传于云南大理白族自治州，以大理市喜洲镇周城村最具代表性，被称为“白族扎染之乡”。',
    source: '中国非物质文化遗产网 · 白族扎染技艺',
  },
  indigo: {
    id: 3,
    title: '蓝靛与氧化显色',
    content: '白族扎染多用板蓝根等植物发酵制靛。织物浸入还原态染液时呈黄绿色，取出接触空气后，靛蓝被氧化，颜色逐渐转为蓝色。',
    source: '《白族扎染技艺》相关研究',
  },
  resist: {
    id: 4,
    title: '扎结防染原理',
    content: '扎结使织物局部被紧紧束缚，染液难以进入；未被扎紧的部分充分接触染液而着色。解开扎线后，被防染的部分保留底色，形成深浅晕染的纹样。',
    source: '白族扎染工艺说明',
  },
  motif: {
    id: 5,
    title: '常见纹样寓意',
    content: '白族扎染常见蝴蝶纹、梅花纹、太阳纹、几何纹等。蝴蝶纹常寓意爱情、吉祥与美好，植物纹样多寄托对自然和生活的祝愿。',
    source: '大理白族扎染纹样研究',
  },
  heritage: {
    id: 6,
    title: '白族扎染的非遗级别',
    content: '白族扎染技艺于2006年列入第一批国家级非物质文化遗产名录，项目类别为传统技艺。',
    source: '中国非物质文化遗产网',
  },
};

const BANK = [
  {
    id: 1,
    stem: '绞缬（扎染）与蜡缬（蜡染）最主要的区别是什么？',
    category: '工艺辨析',
    difficulty: 1,
    options: [
      { key: 'A', content: '使用的染料完全不同' },
      { key: 'B', content: '防染方式不同：前者靠扎结，后者靠蜡' },
      { key: 'C', content: '只有白族使用绞缬' },
      { key: 'D', content: '蜡缬不需要浸染' },
    ],
    answer: 'B',
    explanation: '绞缬靠线绳扎结防染，蜡缬靠蜡层防染，夹缬靠雕花木板夹持防染，三者的核心区别是防染方式。',
    knowledge: CHUNKS.differences,
  },
  {
    id: 2,
    stem: '夹缬工艺主要借助什么工具实现防染？',
    category: '工艺辨析',
    difficulty: 1,
    options: [
      { key: 'A', content: '雕花木板' },
      { key: 'B', content: '扎线' },
      { key: 'C', content: '蜡刀' },
      { key: 'D', content: '石碾' },
    ],
    answer: 'A',
    explanation: '夹缬用两片雕刻相同花纹的木板夹住织物，花纹凸起处阻止染液进入，从而形成对称纹样。',
    knowledge: CHUNKS.differences,
  },
  {
    id: 3,
    stem: '白族扎染最具代表性的传承地是？',
    category: '历史源流',
    difficulty: 1,
    options: [
      { key: 'A', content: '云南大理周城' },
      { key: 'B', content: '贵州丹寨' },
      { key: 'C', content: '江苏苏州' },
      { key: 'D', content: '四川自贡' },
    ],
    answer: 'A',
    explanation: '白族扎染主要流传于云南大理，喜洲镇周城村是最具代表性的传承地。',
    knowledge: CHUNKS.origin,
  },
  {
    id: 4,
    stem: '白族扎染常用的蓝色染料主要来自？',
    category: '染色原理',
    difficulty: 2,
    options: [
      { key: 'A', content: '矿物蓝铜矿' },
      { key: 'B', content: '板蓝根等植物发酵制成的蓝靛' },
      { key: 'C', content: '化学合成靛蓝' },
      { key: 'D', content: '海藻提取物' },
    ],
    answer: 'B',
    explanation: '白族扎染传统上以板蓝根、蓼蓝等植物发酵制取蓝靛，属于植物染料。',
    knowledge: CHUNKS.indigo,
  },
  {
    id: 5,
    stem: '织物刚浸入染液时呈黄绿色，取出后逐渐变蓝，主要原因是？',
    category: '染色原理',
    difficulty: 2,
    options: [
      { key: 'A', content: '水分蒸发' },
      { key: 'B', content: '靛蓝被空气氧化' },
      { key: 'C', content: '染料与棉纤维发生化学反应' },
      { key: 'D', content: '阳光漂白' },
    ],
    answer: 'B',
    explanation: '靛蓝染料在染液中处于还原态，呈黄绿色；取出后与空气接触发生氧化，逐渐恢复蓝色。',
    knowledge: CHUNKS.indigo,
  },
  {
    id: 6,
    stem: '扎结处能够形成留白纹样，主要原理是？',
    category: '染色原理',
    difficulty: 2,
    options: [
      { key: 'A', content: '扎结处温度更高' },
      { key: 'B', content: '扎结处染液难以进入' },
      { key: 'C', content: '扎结改变了纤维颜色' },
      { key: 'D', content: '扎结处染料被烧掉' },
    ],
    answer: 'B',
    explanation: '扎结使局部纤维被紧紧束缚，染液难以渗入；解开后这些部位保留织物底色，形成留白纹样。',
    knowledge: CHUNKS.resist,
  },
  {
    id: 7,
    stem: '白族扎染中蝴蝶纹常被赋予的寓意是？',
    category: '纹样寓意',
    difficulty: 1,
    options: [
      { key: 'A', content: '长寿与战争' },
      { key: 'B', content: '爱情、吉祥与美好' },
      { key: 'C', content: '财富与权力' },
      { key: 'D', content: '离别与忧伤' },
    ],
    answer: 'B',
    explanation: '蝴蝶纹是白族扎染常见纹样，常寄托爱情、吉祥、美好等愿望。',
    knowledge: CHUNKS.motif,
  },
  {
    id: 8,
    stem: '白族扎染技艺列入国家级非物质文化遗产名录的时间是？',
    category: '历史源流',
    difficulty: 1,
    options: [
      { key: 'A', content: '2001年' },
      { key: 'B', content: '2006年' },
      { key: 'C', content: '2011年' },
      { key: 'D', content: '2018年' },
    ],
    answer: 'B',
    explanation: '白族扎染技艺于2006年列入第一批国家级非物质文化遗产名录。',
    knowledge: CHUNKS.heritage,
  },
];

export const mockQuestions = BANK.map(({ answer, explanation, knowledge, ...question }) => question);

export function mockAnswer(questionId, optionKey) {
  const question = BANK.find((item) => item.id === Number(questionId));
  if (!question) {
    throw new Error('题目不存在');
  }
  const key = String(optionKey || '').toUpperCase();
  const selected = question.options.find((option) => option.key === key);
  if (!selected) {
    throw new Error('选项不存在');
  }
  return {
    questionId: question.id,
    correct: key === question.answer,
    correctOptionKey: question.answer,
    explanation: question.explanation,
    source: question.knowledge.source,
    knowledge: question.knowledge,
  };
}
