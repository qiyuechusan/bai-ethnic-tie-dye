import { createDiyRenderer } from "./renderer/index.js";
import { DEFAULT_OXIDATION } from "./renderer/oxidation.js";

// ==================== 剧本数据 ====================
const SCENARIOS = {
  scam: {
    id: "scam",
    title: "白族染坊的“打假”剧本杀",
    mood: "悬疑解密风",
    icon: "🔍",
    award: "火眼金睛",
    awardDesc: "你识破了“百年老字号”的化学印花骗局！",
    role: "传承人",
    dialogue: [
      {
        speaker: "你",
        text: "（刚穿越到大理周城）咦，前面那个摊位围了好多人……",
      },
      {
        speaker: "奸商",
        text: "正宗百年老字号白族扎染！蓝白相间，手艺祖传，一块只要三百八！",
      },
      {
        speaker: "传承人",
        text: "（悄悄靠近你）那块布绝对有问题。你替我问问他破绽在哪，别让他骗了游客！",
      },
      {
        speaker: "传承人",
        text: "（提示）你可以问我：这块布为什么不是正宗扎染？怎么分辨扎染和蓝印花布？",
      },
      {
        speaker: "你",
        text: "（心里有了底）现在该向游客揭穿这个骗局了！",
      },
    ],
    // 闯关节点：nodeIndex 为对话下标；nodeIndex 等于 dialogue.length 表示“对话播完后的收尾题”
    challenges: [
      {
        id: "c1",
        nodeIndex: 3,
        question: "传承人让你找破绽，可你手里没有布。先想想：正宗白族扎染的花纹，边缘最典型的特征是什么？",
        hint: "染液顺着纤维慢慢渗透，花纹边缘会留下什么？",
        winGroups: [["色晕", "水波纹", "晕染", "渗"]],
      },
      {
        id: "c2",
        nodeIndex: 4,
        question: "真正的白族扎染，靠什么来防染出花纹？",
        hint: "扎染又叫绞缬，想一想是用什么把布“绑”起来的？",
        winGroups: [["绞缬", "针线", "扎缝", "捆扎", "缝合", "防染"]],
      },
      {
        id: "c3",
        nodeIndex: 5,
        question: "用一句话向游客揭穿：这块布为什么不是正宗扎染？",
        hint: "从“工艺”和“花纹特征”两个角度说。",
        winGroups: [["色晕", "水波纹", "晕染"], ["印花", "颜料", "整齐", "复制"]],
      },
    ],
  },
  rescue: {
    id: "rescue",
    title: "救救这块染坏的布",
    mood: "硬核工坊危机",
    icon: "🧵",
    award: "氧化大师",
    awardDesc: "你搞懂了氧化显色，救回了这块靛蓝！",
    role: "师傅",
    countdown: 90,
    dialogue: [
      {
        speaker: "你",
        text: "（今天在染坊当值，一个走神……）完了完了，白布怎么变成了黄绿色？！",
      },
      {
        speaker: "内心",
        text: "师傅马上就来检查了，染缸里的黄绿布还在滴汁……怎么办？！",
      },
      {
        speaker: "师傅",
        text: "（提示）别慌，先想清楚：染出来是黄绿色怎么办？靛白怎么变成靛蓝？",
      },
      {
        speaker: "师傅",
        text: "（催促）快！捞出来！到院子里透透风！",
      },
    ],
    challenges: [
      {
        id: "c1",
        nodeIndex: 2,
        question: "师傅说这是正常工序。为什么刚染好的布是黄绿色？",
        hint: "靛白是什么颜色？它现在缺了什么才不变蓝？",
        winGroups: [["靛白", "还原", "黄绿", "没氧化", "没"]],
      },
      {
        id: "c2",
        nodeIndex: 3,
        question: "现在第一步该做什么？",
        hint: "师傅的口头禅是什么？捞出来、透透风。",
        winGroups: [["捞", "通风", "透风", "摊开", "氧化", "晾"]],
      },
      {
        id: "c3",
        nodeIndex: 4,
        question: "为什么通风之后布会变成靛蓝？",
        hint: "靛白遇到了空气里的什么？",
        winGroups: [["氧化", "氧气", "空气", "靛蓝", "见风"]],
      },
    ],
  },
  haute: {
    id: "haute",
    title: "高定礼服定制局",
    mood: "脑洞创意风",
    icon: "🦋",
    award: "高定方案官",
    awardDesc: "你交付了“蝴蝶纹 + 植物染料”的创世神话方案！",
    role: "设计助手",
    dialogue: [
      {
        speaker: "神秘设计师",
        text: "我要一块代表“白族创世神话”的布，还要能体现“植物与生态”的呼吸感！",
      },
      { speaker: "神秘设计师", text: "这可是高定，独一无二。你接不接？" },
      {
        speaker: "设计助手",
        text: "（提示）先问我：白族有什么神话故事？可以对应什么纹样？用什么植物染料最环保？",
      },
      {
        speaker: "设计助手",
        text: "（补充）蝴蝶纹讲的是人类化蝶的创世传说，蓼蓝是最天然的植物染料。",
      },
    ],
    challenges: [
      {
        id: "c1",
        nodeIndex: 2,
        question: "设计师要“白族创世神话”的纹样。先想想：白族的创世神话和什么纹样有关？",
        hint: "传说里，人类的祖先变成了什么？",
        winGroups: [["蝴蝶", "化蝶", "蝶"]],
      },
      {
        id: "c2",
        nodeIndex: 3,
        question: "用什么植物染料最环保？",
        hint: "大理周城扎染的标配染料是什么？",
        winGroups: [["板蓝根", "蓼蓝", "植物", "靛"]],
      },
      {
        id: "c3",
        nodeIndex: 4,
        question: "把你的高定方案，一句话讲给设计师听。",
        hint: "纹样 + 染料，两样都要说。",
        winGroups: [["蝴蝶", "蝶纹", "化蝶"], ["板蓝根", "蓼蓝", "植物", "染料"]],
      },
    ],
  },
};

// ==================== 状态 ====================
const state = {
  view: "entry", // entry | quiz | scenario | awards
  scenarioId: null,
  dialogueIndex: 0,
  completedChallenges: [],
  blockedByChallenge: false,
  currentChallenge: null,
  attempts: 0,
  countdownTimer: null,
  countdownLeft: 0,
  renderer: null,
  extraLine: null,
};

let quizzesLoaded = false; // 竞答题目懒加载标记
const AWARDS_KEY = "m3Awards";

// ==================== 工具 ====================
function $id(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function showView(id) {
  ["m3-entry", "m3-quiz", "m3-scenario", "m3-awards"].forEach((v) => {
    const el = $id(v);
    if (el) el.classList.toggle("active", v === id);
  });
  if (id === "m3-scenario") {
    const playing = state.scenarioId != null;
    $id("m3-scenario-menu")?.classList.toggle("active", !playing);
    $id("m3-scenario-play")?.classList.toggle("active", playing);
  }
}

// ==================== 入口 / 视图切换 ====================
function enterQuiz() {
  state.view = "quiz";
  showView("m3-quiz");
  if (!quizzesLoaded) {
    quizzesLoaded = true;
    if (typeof window.loadQuiz === "function") window.loadQuiz();
  }
}

function enterScenarios() {
  state.view = "scenario";
  state.scenarioId = null;
  showView("m3-scenario");
  renderScenarioMenu();
}

function backToEntry() {
  stopCountdown();
  state.scenarioId = null;
  state.completedChallenges = [];
  state.blockedByChallenge = false;
  state.currentChallenge = null;
  state.extraLine = null;
  state.view = "entry";
  showView("m3-entry");
}

function backToScenarioMenu() {
  stopCountdown();
  state.scenarioId = null;
  state.completedChallenges = [];
  state.blockedByChallenge = false;
  state.currentChallenge = null;
  state.extraLine = null;
  renderScenarioMenu();
  $id("m3-scenario-menu")?.classList.add("active");
  $id("m3-scenario-play")?.classList.remove("active");
}

// ==================== 我的成就 ====================
function loadAwards() {
  try {
    return JSON.parse(localStorage.getItem(AWARDS_KEY) || "[]");
  } catch (err) {
    return [];
  }
}

function unlockAward(s) {
  const list = loadAwards();
  if (!list.some((a) => a.scenarioId === s.id)) {
    list.push({
      scenarioId: s.id,
      award: s.award,
      icon: s.icon,
      awardDesc: s.awardDesc,
      unlockedAt: new Date().toISOString().slice(0, 10),
    });
    localStorage.setItem(AWARDS_KEY, JSON.stringify(list));
  }
}

function openAwards() {
  state.view = "awards";
  showView("m3-awards");
  renderAwards();
}

function renderAwards() {
  const grid = $id("m3-awards-grid");
  if (!grid) return;
  const list = loadAwards();
  grid.innerHTML = Object.values(SCENARIOS)
    .map((s) => {
      const mine = list.find((a) => a.scenarioId === s.id);
      if (mine) {
        return `
      <div class="m3-award-tile unlocked">
        <span class="m3-award-tile-icon">${s.icon}</span>
        <span class="m3-award-tile-name">${mine.award}</span>
        <span class="m3-award-tile-desc">${mine.awardDesc}</span>
        <span class="m3-award-tile-date">${mine.unlockedAt} 解锁</span>
      </div>`;
      }
      return `
      <div class="m3-award-tile locked">
        <span class="m3-award-tile-icon">🔒</span>
        <span class="m3-award-tile-name">${s.award}</span>
        <span class="m3-award-tile-desc">通关「${s.title}」解锁</span>
      </div>`;
    })
    .join("");
}

// ==================== 情景菜单 ====================
function renderScenarioMenu() {
  const menu = $id("m3-scenario-menu");
  if (!menu) return;
  menu.innerHTML = Object.values(SCENARIOS)
    .map(
      (s) => `
    <button type="button" class="m3-scenario-card" onclick="window.module3.startScenario('${s.id}')">
      <span class="m3-scenario-icon">${s.icon}</span>
      <span class="m3-scenario-title">${s.title}</span>
      <span class="m3-scenario-mood">${s.mood}</span>
      <span class="m3-scenario-award">成就：${s.award}</span>
    </button>
  `,
    )
    .join("");
}

// ==================== 情境对局 ====================
function startScenario(id) {
  const s = SCENARIOS[id];
  if (!s) return;
  state.scenarioId = id;
  state.dialogueIndex = 0;
  state.completedChallenges = [];
  state.blockedByChallenge = false;
  state.currentChallenge = null;
  state.attempts = 0;
  state.extraLine = null;
  $id("m3-ask-log").innerHTML = "";
  $id("m3-ask-input").value = "";
  $id("m3-ask-role").textContent = s.role;
  $id("m3-challenge-role").textContent = s.role;
  $id("m3-rescue-canvas-wrap")?.classList.remove("active");
  if (state.renderer) {
    state.renderer.destroy();
    state.renderer = null;
  }

  $id("m3-scenario-menu")?.classList.remove("active");
  $id("m3-scenario-play")?.classList.add("active");
  $id("m3-scenario-title").textContent = `${s.icon} ${s.title}`;
  $id("m3-scenario-hint").textContent =
    `右框可随时向${s.role}提问，剧情节点要自己答题通关！`;

  renderDialogue();

  stopCountdown();
  if (s.countdown) {
    state.countdownLeft = s.countdown;
    $id("m3-countdown")?.classList.add("active");
    updateCountdown();
    state.countdownTimer = setInterval(() => {
      state.countdownLeft--;
      updateCountdown();
      if (state.countdownLeft <= 0) {
        stopCountdown();
        $id("m3-countdown")?.classList.remove("active");
        appendBotBubble(
          `师傅已经走到染坊门口了！快抓紧最后的机会答题——`,
          [],
          false,
        );
      }
    }, 1000);
  } else {
    $id("m3-countdown")?.classList.remove("active");
  }
}

function nextDialogue() {
  const s = SCENARIOS[state.scenarioId];
  if (!s) return;
  // 答题中断（去提问了）：点按钮重新弹出答题框
  if (state.blockedByChallenge) {
    if (state.currentChallenge) openChallenge(state.currentChallenge);
    return;
  }
  if (state.dialogueIndex < s.dialogue.length - 1) {
    state.dialogueIndex++;
    renderDialogue();
    maybeTriggerChallenge(s);
  } else {
    // 对话已播完：触发仍未完成的收尾题（nodeIndex >= dialogue.length）
    const last = s.challenges.find(
      (c) => c.nodeIndex >= s.dialogue.length && !state.completedChallenges.includes(c.id),
    );
    if (last) {
      state.blockedByChallenge = true;
      openChallenge(last);
    }
  }
}

function maybeTriggerChallenge(s) {
  const ch = s.challenges.find(
    (c) => c.nodeIndex === state.dialogueIndex && !state.completedChallenges.includes(c.id),
  );
  if (ch) {
    state.blockedByChallenge = true;
    openChallenge(ch);
  }
}

function renderDialogue() {
  const s = SCENARIOS[state.scenarioId];
  if (!s) return;
  const wrap = $id("m3-stage");
  const lines = s.dialogue
    .slice(0, state.dialogueIndex + 1)
    .map(
      (d) => `
    <div class="m3-bubble ${d.speaker === "你" ? "m3-bubble-me" : ""}">
      <span class="m3-bubble-who">${escapeHtml(d.speaker)}</span>
      <span class="m3-bubble-text">${escapeHtml(d.text)}</span>
    </div>
  `,
    );
  if (state.extraLine) {
    lines.push(`
    <div class="m3-bubble">
      <span class="m3-bubble-who">${escapeHtml(state.extraLine.speaker)}</span>
      <span class="m3-bubble-text">${escapeHtml(state.extraLine.text)}</span>
    </div>
  `);
  }
  wrap.innerHTML = lines.join("");
  const last = wrap.lastElementChild;
  if (last) last.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // “继续剧情 →”按钮状态：答题中断时可点击回到答题框
  const remaining = s.challenges.filter(
    (c) => !state.completedChallenges.includes(c.id),
  );
  const nextBtn = $id("m3-stage-next");
  if (state.blockedByChallenge && state.currentChallenge) {
    nextBtn.classList.add("active");
    nextBtn.textContent = "继续答题 →";
    nextBtn.disabled = false;
  } else if (state.dialogueIndex < s.dialogue.length - 1) {
    nextBtn.classList.add("active");
    nextBtn.textContent = "继续剧情 →";
    nextBtn.disabled = state.blockedByChallenge;
  } else if (remaining.length > 0) {
    nextBtn.classList.add("active");
    nextBtn.textContent = "迎接最终挑战 →";
    nextBtn.disabled = state.blockedByChallenge;
  } else {
    nextBtn.classList.remove("active");
  }
}

// ==================== 闯关答题 ====================
function openChallenge(ch) {
  state.currentChallenge = ch;
  state.attempts = 0;
  $id("m3-challenge-question").textContent = ch.question;
  $id("m3-challenge-input").value = "";
  $id("m3-challenge-feedback").textContent = "";
  $id("m3-challenge-hint").textContent = "";
  $id("m3-challenge-submit").disabled = false;
  $id("m3-challenge-overlay")?.classList.add("active");
  setTimeout(() => $id("m3-challenge-input")?.focus(), 60);
}

function closeChallenge() {
  $id("m3-challenge-overlay")?.classList.remove("active");
  state.currentChallenge = null;
  state.attempts = 0;
}

function dismissChallengeForAsk() {
  // 只是收起弹层去提问：保留当前关卡与锁定状态，提问后自动重开
  $id("m3-challenge-overlay")?.classList.remove("active");
  state.attempts = 0;
}

function askTutorFromChallenge() {
  dismissChallengeForAsk();
  const input = $id("m3-ask-input");
  input?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => input?.focus(), 260);
}

async function submitChallenge() {
  const s = SCENARIOS[state.scenarioId];
  const ch = state.currentChallenge;
  const input = $id("m3-challenge-input");
  const answer = (input?.value || "").trim();
  if (!answer || !ch || !s) return;

  const submitBtn = $id("m3-challenge-submit");
  const feedbackEl = $id("m3-challenge-feedback");
  submitBtn.disabled = true;

  try {
    const data = await window.LANBAI_API("/scenario/answer", {
      method: "POST",
      body: JSON.stringify({
        scenarioId: s.id,
        challengeId: ch.id,
        userAnswer: answer,
      }),
    });
    if (data.correct) {
      state.completedChallenges.push(ch.id);
      state.blockedByChallenge = false;
      feedbackEl.textContent = data.feedback || "答对了！";
      feedbackEl.style.color = "green";
      closeChallenge();
      handleChallengePassed(s, data.feedback);
    } else {
      state.attempts++;
      feedbackEl.textContent = data.feedback || "再想想。";
      feedbackEl.style.color = "#a06a00";
      if (state.attempts >= 2) {
        $id("m3-challenge-hint").textContent =
          "提示：" + (data.hint || ch.hint || "");
      }
      submitBtn.disabled = false;
      input.focus();
    }
  } catch (err) {
    if (err.status === 401) {
      alert("这个情境需要登录后才能答题，请先登录。");
      window.location.href = "index.html?loginRequired=1";
      return;
    }
    // 后端接口不可用时的本地关键词兜底，保证离线也能玩
    const allHit = ch.winGroups.every((group) =>
      group.some((word) => answer.includes(word)),
    );
    if (allHit) {
      state.completedChallenges.push(ch.id);
      state.blockedByChallenge = false;
      feedbackEl.textContent = "答对了！";
      feedbackEl.style.color = "green";
      closeChallenge();
      handleChallengePassed(s, "答对了！");
    } else {
      state.attempts++;
      feedbackEl.textContent =
        "（连不上判分服务，先按线索再想想）" + (err.message || "");
      feedbackEl.style.color = "#a06a00";
      if (state.attempts >= 2) {
        $id("m3-challenge-hint").textContent = "提示：" + (ch.hint || "");
      }
      submitBtn.disabled = false;
      input.focus();
    }
  }
}

function handleChallengePassed(s, feedbackText) {
  const allDone = s.challenges.every((c) =>
    state.completedChallenges.includes(c.id),
  );
  if (allDone) {
    stopCountdown();
    $id("m3-countdown")?.classList.remove("active");
    showAward(s);
  } else {
    state.extraLine = {
      speaker: s.role,
      text: "（肯定）" + (feedbackText || "对，就是这样！"),
    };
    renderDialogue();
  }
}

// ==================== AI 问答（模块三自己的接口，只给线索） ====================
async function askScenario() {
  const input = $id("m3-ask-input");
  const question = input.value.trim();
  if (!question || !state.scenarioId) return;
  input.value = "";
  pushAskUser(question);
  pushAskBot("……");

  try {
    const data = await window.LANBAI_API("/scenario/ask", {
      method: "POST",
      body: JSON.stringify({ scenarioId: state.scenarioId, question }),
    });
    replacePendingBot(data.text, data.citations || [], data.lowConfidence);
    // 不再自动弹出答题框：让用户先读完线索，点“继续答题 →”再回到答题
  } catch (err) {
    if (err.status === 401) {
      alert("这个情境需要登录后才能提问，请先登录。");
      window.location.href = "index.html?loginRequired=1";
      return;
    }
    removePendingBot();
    appendBotBubble(`（暂时连不上，稍后再试）${err.message || ""}`, [], false);
  }
}

function pushAskUser(text) {
  const div = document.createElement("div");
  div.className = "m3-ask-row m3-ask-user";
  div.innerHTML = `<div class="m3-ask-bubble">${escapeHtml(text)}</div>`;
  $id("m3-ask-log").appendChild(div);
  scrollAsk();
}

function pushAskBot(text) {
  const div = document.createElement("div");
  div.className = "m3-ask-row m3-ask-bot m3-ask-bot-pending";
  div.innerHTML = `<div class="m3-ask-bubble">${escapeHtml(text)}</div>`;
  $id("m3-ask-log").appendChild(div);
  scrollAsk();
}

function replacePendingBot(text, citations, lowConfidence) {
  const pending = $id("m3-ask-log").querySelector(".m3-ask-bot-pending");
  const html = renderBotBubble(text, citations, lowConfidence);
  if (pending) {
    pending.outerHTML = `<div class="m3-ask-row m3-ask-bot">${html}</div>`;
  } else {
    appendBotBubble(text, citations, lowConfidence);
  }
  scrollAsk();
}

function removePendingBot() {
  const pending = $id("m3-ask-log").querySelector(".m3-ask-bot-pending");
  if (pending) pending.remove();
}

function appendBotBubble(text, citations, lowConfidence) {
  const div = document.createElement("div");
  div.className = "m3-ask-row m3-ask-bot";
  div.innerHTML = renderBotBubble(text, citations, lowConfidence);
  $id("m3-ask-log").appendChild(div);
  scrollAsk();
}

function renderBotBubble(text, citations, lowConfidence) {
  const citeHtml =
    citations && citations.length
      ? `<details class="m3-citations"><summary>引用 ${citations.length} 条</summary>${citations
          .map(
            (c) =>
              `<div class="m3-cite-item"><b>${escapeHtml(c.title || c.chunkKey || "")}</b><span>${escapeHtml(c.source || "")} · ${escapeHtml(c.confidence || "")}</span></div>`,
          )
          .join("")}</details>`
      : "";
  const lowHtml = lowConfidence
    ? '<div class="m3-lowconf">（知识库相关性较低，仅供参考）</div>'
    : "";
  return `<div class="m3-ask-bubble">${escapeHtml(text)}${citeHtml}${lowHtml}</div>`;
}

function scrollAsk() {
  const log = $id("m3-ask-log");
  log.scrollTop = log.scrollHeight;
}

// ==================== 成就卡 + 布料动画 ====================
function showAward(s) {
  unlockAward(s);
  $id("m3-award-icon").textContent = s.icon;
  $id("m3-award-name").textContent = s.award;
  $id("m3-award-desc").textContent = s.awardDesc;
  const replay = $id("m3-award-replay");
  if (replay) replay.style.display = s.id === "rescue" ? "inline-block" : "none";
  $id("m3-award-overlay")?.classList.add("active");
  if (s.id === "rescue") playRescueAnimation();
}

function closeAward() {
  // 关闭成就卡后停留在剧情页：成就已存档可在“我的成就”回看，救援动画留在下方可回看
  $id("m3-award-overlay")?.classList.remove("active");
}

function replayRescueAnimation() {
  playRescueAnimation();
}

function playRescueAnimation() {
  const wrap = $id("m3-rescue-canvas-wrap");
  const canvas = $id("m3-rescue-canvas");
  if (!wrap || !canvas) return;
  wrap.classList.add("active");
  if (state.renderer) state.renderer.destroy();
  state.renderer = createDiyRenderer(canvas, {
    width: 560,
    height: 420,
    oxidation: DEFAULT_OXIDATION,
  });
  state.renderer.setOxidationConfig(DEFAULT_OXIDATION);
  state.renderer.dye({
    dips: 1,
    onProgress: (p) => {
      const status = $id("m3-rescue-status");
      if (status)
        status.textContent = p >= 1 ? "靛蓝！危机解除 ✓" : "正在通风氧化……";
    },
  });
}

// ==================== 纹样卡牌奖励（供 app.js 调用） ====================
function showPatternCard(patternId) {
  const list = window.allPatterns || [];
  const p = list.find((item) => String(item.id) === String(patternId));
  if (!p) return;
  const img = $id("m3-pattern-card-img");
  img.src = window.LANBAI_ASSET_URL
    ? window.LANBAI_ASSET_URL(p.imageUrl)
    : p.imageUrl;
  img.alt = p.name || "";
  $id("m3-pattern-card-name").textContent = p.name || "";
  $id("m3-pattern-card-meaning").textContent = p.meaning || "";
  $id("m3-pattern-card-desc").textContent = p.description || "";
  $id("m3-pattern-card-overlay")?.classList.add("active");
}

function closePatternCard() {
  $id("m3-pattern-card-overlay")?.classList.remove("active");
}

// ==================== 倒计时 ====================
function updateCountdown() {
  const el = $id("m3-countdown");
  if (!el) return;
  const s = SCENARIOS[state.scenarioId];
  const total = (s && s.countdown) || 1;
  const pct = Math.max(0, Math.min(100, (state.countdownLeft / total) * 100));
  const bar = el.querySelector(".m3-countdown-bar");
  const num = el.querySelector(".m3-countdown-num");
  if (bar) bar.style.width = pct + "%";
  if (num) num.textContent = state.countdownLeft + "s";
}

function stopCountdown() {
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
  }
}

// ==================== 导出（与经典脚本桥接） ====================
window.module3 = {
  enterQuiz,
  enterScenarios,
  backToEntry,
  backToScenarioMenu,
  startScenario,
  nextDialogue,
  askScenario,
  showPatternCard,
  closePatternCard,
  closeAward,
  openAwards,
  submitChallenge,
  closeChallenge,
  askTutorFromChallenge,
  replayRescueAnimation,
};
