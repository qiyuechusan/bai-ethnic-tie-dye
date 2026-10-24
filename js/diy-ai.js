import { createSeed } from './renderer/random.js';
import { fetchDiySuggestions, generateDiyPattern } from './diy-api.js';

const SESSION_KEY = 'lanbai_diy_ai_session_v1';

export function createDiyAiPanel({
  renderer,
  showToast,
  onBusy,
  onApply,
  onDipsChange,
  onSeedChange,
  onResetPreview,
}) {
  const $ = (id) => document.getElementById(id);
  const promptInput = $('diyPrompt');
  const fabricSelect = $('diyFabric');
  const concentrationInput = $('diyConcentration');
  const concentrationValue = $('diyConcentrationValue');
  const suggestionsBox = $('diySuggestions');
  const generateButton = $('diyGenerate');
  const statusLabel = $('diyAiStatus');
  const resultBox = $('diyAiResult');
  const explanationLabel = $('diyAiExplanation');
  const citationsList = $('diyAiCitations');
  const reseedButton = $('diyAiReseed');
  const newSessionButton = $('diyAiNewSession');

  let busy = false;
  let sessionId = readSession();
  let lastGenerationId = null;
  let suggestionsLoaded = false;

  function readSession() {
    try {
      return window.localStorage.getItem(SESSION_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function writeSession(value) {
    try {
      if (value) {
        window.localStorage.setItem(SESSION_KEY, value);
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      // 隐私模式下忽略即可，后端仍会返回临时 sessionId。
    }
  }

  async function loadSuggestions() {
    if (suggestionsLoaded) {
      return;
    }
    suggestionsLoaded = true;
    try {
      const data = await fetchDiySuggestions();
      if (Array.isArray(data) && data.length > 0) {
        renderSuggestions(data.slice(0, 4));
      }
    } catch (error) {
      console.warn('[DIY] 灵感描述读取失败', error);
      setStatus(error.message || '灵感描述读取失败，可以直接输入描述。', 'error');
    }
  }

  function renderSuggestions(items) {
    suggestionsBox.replaceChildren();
    items.forEach((item) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ai-chip';
      chip.textContent = item.text;
      chip.addEventListener('click', () => {
        promptInput.value = item.text || '';
        if (item.fabric) {
          fabricSelect.value = item.fabric;
        }
        const value = Number(item.concentration);
        if (Number.isFinite(value)) {
          concentrationInput.value = String(value);
          updateConcentrationLabel();
        }
        promptInput.focus();
      });
      suggestionsBox.append(chip);
    });
  }

  function updateConcentrationLabel() {
    concentrationValue.textContent = Number(concentrationInput.value).toFixed(2);
  }

  function setStatus(message, tone = '') {
    statusLabel.textContent = message;
    statusLabel.dataset.tone = tone;
  }

  function renderResult(result) {
    resultBox.hidden = false;
    explanationLabel.textContent = result.explanation || '';
    citationsList.replaceChildren();
    (result.citations || []).forEach((citation) => {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = citation.title || citation.chunkKey || '知识依据';
      const snippet = document.createElement('p');
      snippet.textContent = citation.snippet || '';
      const meta = document.createElement('small');
      meta.textContent = [citation.source, citation.confidence ? `可信度 ${citation.confidence}` : '']
        .filter(Boolean)
        .join(' · ');
      item.append(title, snippet, meta);
      citationsList.append(item);
    });
    if (!result.citations || result.citations.length === 0) {
      const item = document.createElement('li');
      item.textContent = '本轮没有可展示的知识引用。';
      citationsList.append(item);
    }
  }

  async function generate() {
    if (busy) {
      return;
    }
    const prompt = promptInput.value.trim();
    if (prompt.length < 2) {
      showToast?.('请先描述想要的纹样');
      promptInput.focus();
      return;
    }

    busy = true;
    onBusy?.(true);
    generateButton.disabled = true;
    setStatus('正在检索知识库并生成参数…', 'busy');
    resultBox.hidden = true;

    try {
      const result = await generateDiyPattern({
        sessionId: sessionId || undefined,
        prompt,
        fabric: fabricSelect.value,
        concentration: Number(concentrationInput.value),
        canvas: { width: 900, height: 1125 },
        seed: renderer.getSeed(),
        parentGenerationId: lastGenerationId,
      });

      sessionId = result.sessionId || sessionId;
      writeSession(sessionId);
      lastGenerationId = result.generationId || null;

      onApply?.(result.method, result.oxidation, result.seed);
      onDipsChange?.(result.oxidation.dips);

      renderResult(result);
      const warning = result.lowConfidence ? '知识库命中度偏低，建议补充描述。' : '';
      setStatus(`已生成「${result.method.name}」。${warning}`, result.lowConfidence ? 'warn' : 'ok');
      showToast?.('参数已应用到画布');
    } catch (error) {
      console.warn('[DIY] 生成失败', error);
      setStatus(error.message || '生成失败，请稍后重试', 'error');
      showToast?.(error.message || '生成失败，请稍后重试');
    } finally {
      busy = false;
      onBusy?.(false);
      generateButton.disabled = false;
    }
  }

  function reseed() {
    const seed = createSeed();
    renderer.setSeed(seed);
    onSeedChange?.(seed);
    onResetPreview?.();
    setStatus('已换一个种子，参数不变，纹样的随机细节会重新生成。', 'ok');
  }

  function newSession() {
    sessionId = '';
    lastGenerationId = null;
    writeSession('');
    resultBox.hidden = true;
    setStatus('已开启新会话。下一句描述会作为新的上下文起点。', 'ok');
    showToast?.('已开启新会话');
  }

  concentrationInput.addEventListener('input', updateConcentrationLabel);
  generateButton.addEventListener('click', generate);
  reseedButton.addEventListener('click', reseed);
  newSessionButton.addEventListener('click', newSession);

  updateConcentrationLabel();

  return {
    load: () => loadSuggestions(),
    isBusy: () => busy,
  };
}
