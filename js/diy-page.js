import { fetchDiyMethods, mockDiyMethods } from './diy-api.js';
import { createDiyRenderer } from './renderer/index.js';
import { createSeed } from './renderer/random.js';
import { USE_MOCK } from './config.js';

const $ = (id) => document.getElementById(id);

const canvas = $('diyCanvas');
const methodList = $('diyMethodList');
const methodName = $('diyMethodName');
const methodNote = $('diyMethodNote');
const methodCount = $('diyMethodCount');
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
const errorPanel = $('diyError');
const retryButton = $('diyRetry');
const mockButton = $('diyUseMock');
const dataBadge = $('diyDataBadge');
const toast = $('toast');

const renderer = createDiyRenderer(canvas, { width: 900, height: 1125 });

let methods = [];
let selectedIndex = -1;
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

function setBusy(value) {
  busy = value;
  startButton.disabled = value || selectedIndex < 0;
  againButton.disabled = value || !hasDyed;
  resetButton.disabled = value;
  downloadButton.disabled = value;
  reseedButton.disabled = value;
  document.querySelectorAll('.diy-method-card').forEach((button) => {
    button.disabled = value;
  });
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
  setPhase('PREVIEW', '选择扎结方式后，开始浸染', 0, '#c9d27c');
  startButton.querySelector('span').textContent = '开始浸染';
  startButton.disabled = selectedIndex < 0;
  againButton.disabled = true;
}

function renderMethodList() {
  methodList.replaceChildren();

  if (methods.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diy-loading';
    empty.textContent = '暂无可用的扎结方式。';
    methodList.append(empty);
    return;
  }

  methods.forEach((method, index) => {
    const item = document.createElement('div');
    item.className = 'diy-method-item';
    item.setAttribute('role', 'listitem');

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'diy-method-card';
    card.dataset.index = String(index);

    const indexLabel = document.createElement('span');
    indexLabel.className = 'diy-method-index';
    indexLabel.textContent = String(index + 1).padStart(2, '0');

    const copy = document.createElement('span');
    copy.className = 'diy-method-copy';
    const name = document.createElement('strong');
    name.textContent = method.name;
    const subtitle = document.createElement('small');
    subtitle.textContent = method.subtitle || method.description || '';
    copy.append(name, subtitle);

    const swatches = document.createElement('span');
    swatches.className = 'diy-method-swatches';
    (method.previewColors || []).slice(0, 4).forEach((color) => {
      const swatch = document.createElement('i');
      swatch.style.background = color;
      swatches.append(swatch);
    });

    const difficulty = document.createElement('span');
    difficulty.className = 'diy-method-difficulty';
    const level = Math.max(1, Math.min(3, Number(method.difficulty) || 1));
    difficulty.textContent = `${'●'.repeat(level)}${'○'.repeat(3 - level)}`;
    difficulty.setAttribute('aria-label', `难度 ${level} 星`);

    card.append(indexLabel, copy, swatches, difficulty);
    card.addEventListener('click', () => selectMethod(index));
    item.append(card);
    methodList.append(item);
  });
}

function selectMethod(index) {
  if (busy || !methods[index]) return;
  selectedIndex = index;
  const method = methods[index];

  methodList.querySelectorAll('.diy-method-card').forEach((card, cardIndex) => {
    const active = cardIndex === index;
    card.classList.toggle('is-active', active);
    card.setAttribute('aria-pressed', String(active));
  });

  renderer.setMethod(method);
  methodName.textContent = method.name;
  methodNote.textContent = method.description || '';
  updateSeedLabel();
  resetPreviewState();
}

function useMockMethods(message = '已切换到演示数据') {
  methods = mockDiyMethods;
  dataBadge.textContent = '演示数据';
  methodCount.textContent = String(methods.length).padStart(2, '0');
  errorPanel.hidden = true;
  renderMethodList();
  selectMethod(0);
  startButton.disabled = false;
  if (message) showToast(message);
}

async function loadMethods() {
  errorPanel.hidden = true;
  methodList.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'diy-loading';
  loading.textContent = '正在读取扎结方式…';
  methodList.append(loading);
  startButton.disabled = true;

  if (USE_MOCK) {
    useMockMethods('当前使用本地演示数据');
    return;
  }

  try {
    const data = await fetchDiyMethods();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('接口没有返回扎结方式数据');
    }
    methods = data;
    usingMock = false;
    dataBadge.textContent = '接口数据';
    methodCount.textContent = String(methods.length).padStart(2, '0');
    renderMethodList();
    selectMethod(0);
    startButton.disabled = false;
  } catch (error) {
    // 静态预览或后端尚未启动时仍可完整体验四种扎结方式。
    useMockMethods('后端暂未连接，已自动切换到演示数据');
  }
}

function startDye() {
  if (busy || selectedIndex < 0) return;

  setBusy(true);
  startButton.querySelector('span').textContent = '浸染中…';
  setPhase('DIP', '染液正在浸入布面…', 3, '#c9d27c');

  renderer.dye({
    dips,
    onProgress: ({ phase, progress, color }) => {
      if (phase === 'dip') {
        setPhase('DIP', '染液正在浸入布面…', progress * 35, '#c9d27c');
        return;
      }
      if (phase === 'oxidation') {
        setPhase('OXIDIZING', '取出布面，靛蓝正在氧化…', 35 + progress * 65, color);
        return;
      }
      setPhase('DONE', '氧化完成，纹样已定色', 100, color || '#0b3863');
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
      startButton.disabled = selectedIndex < 0;
      againButton.disabled = !hasDyed;
    });
}

startButton.addEventListener('click', startDye);
againButton.addEventListener('click', startDye);

resetButton.addEventListener('click', () => {
  if (busy || selectedIndex < 0) return;
  renderer.setMethod(methods[selectedIndex]);
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
  if (busy || selectedIndex < 0) return;
  const method = methods[selectedIndex];
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
  dips = Number(button.dataset.dips) || 1;
  document.querySelectorAll('#diyDips button').forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
});

retryButton.addEventListener('click', loadMethods);

mockButton.addEventListener('click', () => {
  useMockMethods();
});

updateSeedLabel();
resetPreviewState();
loadMethods();

window.addEventListener('beforeunload', () => renderer.destroy());
