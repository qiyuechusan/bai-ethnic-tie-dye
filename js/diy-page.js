import { createDiyRenderer } from './renderer/index.js';
import { createSeed } from './renderer/random.js';
import { createDiyAiPanel } from './diy-ai.js';

const $ = (id) => document.getElementById(id);

const canvas = $('diyCanvas');
const methodName = $('diyMethodName');
const seedLabel = $('diySeed');
const statusLabel = $('diyStatus');
const phaseLabel = $('diyPhase');
const progressBar = $('diyProgressBar');
const oxidationDot = $('diyOxidationDot');
const startButton = $('diyStart');
const againButton = $('diyAgain');
const resetButton = $('diyReset');
const downloadButton = $('diyDownload');
const reseedButton = $('diyReseed');
const toast = $('toast');

const renderer = createDiyRenderer(canvas, { width: 900, height: 1125 });

let method = null;
let oxidation = null;
let dips = 1;
let busy = false;
let hasDyed = false;

function updateSeedLabel() {
  seedLabel.textContent = renderer.getSeed();
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-active');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-active'), 2600);
}

function setDips(value) {
  const safe = Math.max(1, Math.min(4, Number(value) || 1));
  dips = safe;
  document.querySelectorAll('#diyDips button').forEach((button) => {
    const active = Number(button.dataset.dips) === safe;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setBusy(value) {
  busy = value;
  startButton.disabled = value || !method;
  againButton.disabled = value || !hasDyed;
  resetButton.disabled = value;
  downloadButton.disabled = value;
  reseedButton.disabled = value;
  document.querySelectorAll('#diyDips button').forEach((button) => {
    button.disabled = value;
  });
}

function setPhase(label, text, progress, color) {
  phaseLabel.textContent = label;
  statusLabel.textContent = text;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  if (color) {
    oxidationDot.style.background = color;
  }
}

function resetPreviewState() {
  hasDyed = false;
  setPhase('预览', method ? '参数已生成，点击「开始浸染」' : '描述纹样后生成参数', 0, '#c9d27c');
  startButton.querySelector('span').textContent = '开始浸染';
  startButton.disabled = !method;
  againButton.disabled = true;
}

function applyAiResult(nextMethod, nextOxidation, seed) {
  method = { ...nextMethod };
  oxidation = nextOxidation;
  renderer.setMethod(method);
  if (seed) {
    renderer.setSeed(seed);
  }
  renderer.setOxidationConfig(oxidation);
  methodName.textContent = method.name;
  updateSeedLabel();
  resetPreviewState();
  setBusy(false);
  startButton.disabled = false;
}

function startDye() {
  if (busy || !method) return;

  const config = renderer.getOxidationConfig();
  const dipColor = config.stops?.[0] || '#c9d27c';
  setBusy(true);
  startButton.querySelector('span').textContent = '浸染中…';
  setPhase('浸染', '染液正在浸入布面…', 3, dipColor);

  renderer.dye({
    dips,
    onProgress: ({ phase, progress, color }) => {
      if (phase === 'dip') {
        setPhase('浸染', '染液正在浸入布面…', progress * 35, dipColor);
        return;
      }
      if (phase === 'oxidation') {
        setPhase('氧化中', '取出布面，靛蓝正在氧化…', 35 + progress * 65, color);
        return;
      }
      setPhase('完成', '氧化完成，纹样已定色', 100, color || '#0b3863');
    },
  })
    .then(() => {
      hasDyed = true;
      startButton.querySelector('span').textContent = '再染一次';
      againButton.disabled = false;
    })
    .catch((error) => {
      showToast(error.message || '浸染失败，请重试');
      resetPreviewState();
    })
    .finally(() => {
      setBusy(false);
      startButton.disabled = !method;
      againButton.disabled = !hasDyed;
    });
}

startButton.addEventListener('click', startDye);
againButton.addEventListener('click', startDye);

resetButton.addEventListener('click', () => {
  if (busy || !method) return;
  renderer.setMethod(method);
  if (oxidation) {
    renderer.setOxidationConfig(oxidation);
  }
  updateSeedLabel();
  resetPreviewState();
});

reseedButton.addEventListener('click', () => {
  if (busy) return;
  renderer.setSeed(createSeed());
  updateSeedLabel();
  resetPreviewState();
});

downloadButton.addEventListener('click', async () => {
  if (busy || !method) return;
  try {
    await renderer.exportPng(`蓝白之境-${method?.code || 'diy'}-${renderer.getSeed()}.png`);
    showToast('作品已开始下载');
  } catch (error) {
    showToast(error.message || '导出失败，请重试');
  }
});

$('diyDips').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-dips]');
  if (!button || busy) return;
  setDips(button.dataset.dips);
});

const aiPanel = createDiyAiPanel({
  renderer,
  showToast,
  onBusy: setBusy,
  onApply: (nextMethod, nextOxidation, seed) => applyAiResult(nextMethod, nextOxidation, seed),
  onDipsChange: setDips,
  onSeedChange: updateSeedLabel,
  onResetPreview: resetPreviewState,
});

async function requireLogin() {
  try {
    const session = await window.LANBAI_API('/session');
    if (session?.role === 'user') {
      return true;
    }
  } catch (error) {
    console.warn('[DIY] 登录状态读取失败', error);
  }
  window.location.href = 'index.html?loginRequired=1';
  return false;
}

async function init() {
  if (!(await requireLogin())) {
    return;
  }
  aiPanel.load();
  updateSeedLabel();
  resetPreviewState();
}

init();

window.addEventListener('beforeunload', () => renderer.destroy());
