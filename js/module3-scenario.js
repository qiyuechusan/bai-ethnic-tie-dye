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
    // 通关：每一组内命中任意关键词即达成该组；所有组都达成 → 通关（问句或 AI 回答命中均可）
    winGroups: [
      ["绞缬", "扎染", "防染", "针线", "捆扎", "扎缝"],
      ["蓝印花布", "豆粉", "石灰", "刮浆", "灰缬"],
      ["色晕", "水波纹", "晕染", "印花", "颜料"],
    ],
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
    winGroups: [["黄绿", "靛白", "氧化", "通风", "显色", "变蓝", "见风"]],
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
    // 通关：两组都要命中（组内任一关键词即可）
    winGroups: [
      ["蝴蝶", "蝶纹", "化蝶", "创世", "神话"],
      [
        "板蓝根",
        "蓼蓝",
        "植物",
        "染料",
        "靛蓝",
        "红花",
        "苏木",
        "栀子",
        "环保",
      ],
    ],
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
    ],
  },
};

// ==================== 状态 ====================
const state = {
  view: "entry", // entry | quiz | scenario
  scenarioId: null,
  dialogueIndex: 0,
  countdownTimer: null,
  countdownLeft: 0,
  renderer: null,
};

let quizzesLoaded = false; // 竞答题目懒加载标记

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
  ["m3-entry", "m3-quiz", "m3-scenario"].forEach((v) => {
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
  state.view = "entry";
  showView("m3-entry");
}

function backToScenarioMenu() {
  stopCountdown();
  state.scenarioId = null;
  renderScenarioMenu();
  $id("m3-scenario-menu")?.classList.add("active");
  $id("m3-scenario-play")?.classList.remove("active");
}

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
  $id("m3-ask-log").innerHTML = "";
  $id("m3-ask-input").value = "";
  $id("m3-ask-role").textContent = s.role;
  $id("m3-rescue-canvas-wrap")?.classList.remove("active");
  if (state.renderer) {
    state.renderer.destroy();
    state.renderer = null;
  }

  $id("m3-scenario-menu")?.classList.remove("active");
  $id("m3-scenario-play")?.classList.add("active");
  $id("m3-scenario-title").textContent = `${s.icon} ${s.title}`;
  $id("m3-scenario-hint").textContent =
    `右框可随时向${s.role}提问，问对了就通关！`;

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
          `师傅已经走到染坊门口了！快抓紧最后的机会问问题——`,
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
  if (state.dialogueIndex < s.dialogue.length - 1) {
    state.dialogueIndex++;
    renderDialogue();
  }
}

function renderDialogue() {
  const s = SCENARIOS[state.scenarioId];
  if (!s) return;
  const wrap = $id("m3-stage");
  wrap.innerHTML = s.dialogue
    .slice(0, state.dialogueIndex + 1)
    .map(
      (d) => `
    <div class="m3-bubble ${d.speaker === "你" ? "m3-bubble-me" : ""}">
      <span class="m3-bubble-who">${escapeHtml(d.speaker)}</span>
      <span class="m3-bubble-text">${escapeHtml(d.text)}</span>
    </div>
  `,
    )
    .join("");
  const last = wrap.lastElementChild;
  if (last) last.scrollIntoView({ behavior: "smooth", block: "nearest" });
  $id("m3-stage-next")?.classList.toggle(
    "active",
    state.dialogueIndex < s.dialogue.length - 1,
  );
}

// ==================== AI 问答（模块三自己的接口） ====================
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
    checkScenarioWin(question, data.text);
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

// ==================== 通关判定（前端关键词） ====================
function checkScenarioWin(question, aiText) {
  const s = SCENARIOS[state.scenarioId];
  if (!s || !s.winGroups) return;
  const hay = (question || "") + (aiText || "");
  const allHit = s.winGroups.every((group) =>
    group.some((word) => hay.includes(word)),
  );
  if (allHit) {
    stopCountdown();
    $id("m3-countdown")?.classList.remove("active");
    showAward(s);
  }
}

// ==================== 成就卡 + 布料动画 ====================
function showAward(s) {
  $id("m3-award-icon").textContent = s.icon;
  $id("m3-award-name").textContent = s.award;
  $id("m3-award-desc").textContent = s.awardDesc;
  $id("m3-award-overlay")?.classList.add("active");
  if (s.id === "rescue") playRescueAnimation();
}

function closeAward() {
  $id("m3-award-overlay")?.classList.remove("active");
  backToScenarioMenu();
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
};