import {
  chatWithTutor,
  fetchTutorCatalog,
  fetchTutorHistory,
  fetchTutorSessions,
  fetchTutorStats,
  submitTutorAnswer,
} from './tutor-api.js';
import { assistantBubble, historyBubble, userBubble } from './chat-renderer.js';

const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'lanbai_tutor_session_v1';

const messagesBox = $('tutorMessages');
const emptyState = $('tutorEmpty');
const emptySuggestions = $('tutorEmptySuggestions');
const composer = $('tutorComposer');
const input = $('tutorInput');
const sendButton = $('tutorSend');
const catalogBox = $('tutorCatalog');
const statsCard = $('tutorStatsCard');
const statsBox = $('tutorStats');
const historyModal = $('tutorHistoryModal');
const historyList = $('tutorHistoryList');

let sessionId = readSession();
let catalog = null;
let busy = false;

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
    // 隐私模式下忽略，服务端仍会返回临时 sessionId。
  }
}

function scrollToBottom() {
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function setBusy(value) {
  busy = value;
  sendButton.disabled = value;
  input.disabled = value;
}

function showEmpty() {
  emptyState.hidden = false;
  if (!emptyState.isConnected) {
    messagesBox.prepend(emptyState);
  }
  messagesBox.querySelectorAll('.tutor-msg, .tutor-typing').forEach((item) => item.remove());
  scrollToBottom();
}

function renderEmptySuggestions() {
  if (!emptySuggestions) {
    return;
  }
  emptySuggestions.replaceChildren();
  const prompts = catalog?.suggestedPrompts || [];
  prompts.slice(0, 8).forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tutor-chip';
    button.textContent = prompt.text;
    button.addEventListener('click', () => submitMessage(prompt.text));
    emptySuggestions.append(button);
  });
}

function renderCatalog(nextCatalog) {
  catalog = nextCatalog;
  if (!catalogBox) {
    return;
  }
  catalogBox.replaceChildren();
  const summary = document.createElement('p');
  summary.className = 'tutor-catalog-summary';
  summary.textContent = `共 ${catalog.total || 0} 条知识分片，按主题浏览：`;
  catalogBox.append(summary);

  (catalog.categories || []).forEach((category) => {
    const item = document.createElement('div');
    item.className = 'tutor-category';

    const heading = document.createElement('strong');
    heading.textContent = category.label;
    const count = document.createElement('small');
    count.textContent = `${category.count} 条`;
    heading.append(count);
    item.append(heading);

    const description = document.createElement('p');
    description.textContent = category.description || '';
    item.append(description);

    const chips = document.createElement('div');
    chips.className = 'tutor-quick-chips';
    (category.samplePrompts || []).forEach((prompt) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tutor-chip';
      button.textContent = prompt;
      button.addEventListener('click', () => submitMessage(prompt));
      chips.append(button);
    });
    item.append(chips);

    if (Array.isArray(category.chunkTitles) && category.chunkTitles.length > 0) {
      const details = document.createElement('details');
      details.className = 'tutor-chunk-titles';
      const detailSummary = document.createElement('summary');
      detailSummary.textContent = '包含的知识分片';
      details.append(detailSummary);
      const list = document.createElement('ul');
      category.chunkTitles.forEach((title) => {
        const entry = document.createElement('li');
        entry.textContent = title;
        list.append(entry);
      });
      details.append(list);
      item.append(details);
    }
    catalogBox.append(item);
  });

  renderEmptySuggestions();
}

function renderStats(stats) {
  if (!statsCard || !statsBox) {
    return;
  }
  const attempts = Number(stats?.attempts) || 0;
  if (attempts === 0) {
    statsCard.hidden = true;
    statsBox.replaceChildren();
    return;
  }
  statsCard.hidden = false;
  statsBox.replaceChildren();

  const overview = document.createElement('p');
  const accuracy = Math.round((Number(stats.accuracy) || 0) * 100);
  overview.textContent = `累计作答 ${attempts} 题，答对 ${stats.correct || 0} 题，正确率 ${accuracy}%。`;
  statsBox.append(overview);

  (stats.topics || []).forEach((topic) => {
    const row = document.createElement('div');
    row.className = 'tutor-stat-row';
    const label = document.createElement('span');
    const category = catalog?.categories?.find((item) => item.key === topic.topic);
    label.textContent = category?.label || topic.topic;
    const value = document.createElement('small');
    value.textContent = `${topic.correct}/${topic.attempts} · 掌握度 ${Math.round((topic.mastery || 0) * 100)}%`;
    row.append(label, value);

    const bar = document.createElement('i');
    bar.style.width = `${Math.round((topic.mastery || 0) * 100)}%`;
    row.append(bar);
    statsBox.append(row);
  });
}

async function refreshStats() {
  if (!sessionId) {
    renderStats(null);
    return;
  }
  try {
    const stats = await fetchTutorStats(sessionId);
    renderStats(stats);
  } catch (error) {
    console.warn('[Tutor] 学习画像读取失败', error);
  }
}

function typingIndicator() {
  const element = document.createElement('article');
  element.className = 'tutor-msg is-assistant tutor-typing';
  const avatar = document.createElement('span');
  avatar.className = 'tutor-avatar';
  avatar.textContent = '蓝';
  const bubble = document.createElement('div');
  bubble.className = 'tutor-bubble';
  bubble.textContent = '正在检索知识库并思考…';
  element.append(avatar, bubble);
  return element;
}

async function submitMessage(rawText) {
  const text = String(rawText || '').trim();
  if (!text || busy) {
    return;
  }
  if (!emptyState.isConnected) {
    messagesBox.prepend(emptyState);
  }
  emptyState.hidden = true;
  messagesBox.append(userBubble(text));
  input.value = '';
  scrollToBottom();

  setBusy(true);
  const typing = typingIndicator();
  messagesBox.append(typing);
  scrollToBottom();

  try {
    const data = await chatWithTutor({ sessionId: sessionId || undefined, message: text });
    typing.remove();
    sessionId = data.sessionId || sessionId;
    writeSession(sessionId);
    const bubble = assistantBubble(
      {
        text: data.answer?.text,
        citations: data.answer?.citations,
        cards: data.cards,
        relatedQuestions: data.answer?.relatedQuestions,
        suggestedPrompts: data.answer?.suggestedPrompts,
        lowConfidence: data.lowConfidence,
        degraded: data.degraded,
      },
      handlers,
    );
    messagesBox.append(bubble);
    scrollToBottom();
    refreshStats();
  } catch (error) {
    typing.remove();
    if (error?.status === 401) {
      window.location.href = 'index.html?loginRequired=1';
      return;
    }
    const bubble = assistantBubble({
      text: `智能导师服务暂时不可用：${error.message || '请稍后重试。'}`,
      citations: [],
      cards: [],
      relatedQuestions: [],
      suggestedPrompts: [],
      lowConfidence: true,
      degraded: false,
    }, handlers);
    messagesBox.append(bubble);
    scrollToBottom();
  } finally {
    setBusy(false);
  }
}

const handlers = {
  submitQuiz: (quizId, optionKey) => submitTutorAnswer({
    sessionId,
    quizId,
    optionKey,
  }),
  onGraded: () => refreshStats(),
  onPrompt: (prompt) => submitMessage(prompt),
};

async function loadHistory(targetSessionId = sessionId) {
  if (!targetSessionId) {
    showEmpty();
    renderStats(null);
    return;
  }
  try {
    const items = await fetchTutorHistory(targetSessionId);
    if (!Array.isArray(items) || items.length === 0) {
      showEmpty();
      return;
    }
    emptyState.hidden = true;
    messagesBox.querySelectorAll('.tutor-msg, .tutor-typing').forEach((item) => item.remove());
    items.forEach((item) => {
      messagesBox.append(historyBubble(item));
    });
    scrollToBottom();
  } catch (error) {
    console.warn('[Tutor] 历史记录读取失败', error);
    showEmpty();
  }
}

function formatTime(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function openHistory() {
  if (!historyModal || !historyList) {
    return;
  }
  historyModal.hidden = false;
  historyModal.classList.add('is-open');
  historyList.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'tutor-history-empty';
  loading.textContent = '正在读取历史会话…';
  historyList.append(loading);

  try {
    const items = await fetchTutorSessions();
    historyList.replaceChildren();
    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'tutor-history-empty';
      empty.textContent = '还没有历史会话。先问一个问题吧。';
      historyList.append(empty);
      return;
    }
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tutor-history-item';
      if (item.sessionId === sessionId) {
        button.classList.add('is-active');
      }

      const title = document.createElement('strong');
      title.textContent = item.title || '未命名会话';
      const summary = document.createElement('p');
      summary.textContent = item.summary || '这次会话还没有摘要。';
      const meta = document.createElement('small');
      meta.textContent = [
        item.updatedAt ? formatTime(item.updatedAt) : '',
        item.turnCount ? `${item.turnCount} 轮` : '',
      ].filter(Boolean).join(' · ');

      button.append(title, summary, meta);
      button.addEventListener('click', async () => {
        sessionId = item.sessionId;
        writeSession(sessionId);
        closeHistory();
        await loadHistory(sessionId);
        refreshStats();
      });
      historyList.append(button);
    });
  } catch (error) {
    historyList.replaceChildren();
    const failed = document.createElement('p');
    failed.className = 'tutor-history-empty';
    failed.textContent = error.message || '历史会话读取失败，请稍后重试。';
    historyList.append(failed);
  }
}

function closeHistory() {
  if (!historyModal) {
    return;
  }
  historyModal.hidden = true;
  historyModal.classList.remove('is-open');
}

async function init() {
  if (!(await requireLogin())) {
    return;
  }
  try {
    const nextCatalog = await fetchTutorCatalog();
    renderCatalog(nextCatalog);
  } catch (error) {
    console.warn('[Tutor] 知识导览读取失败', error);
    if (catalogBox) {
      catalogBox.replaceChildren();
      const failed = document.createElement('p');
      failed.className = 'tutor-catalog-summary';
      failed.textContent = error.message || '知识导览暂时不可用。';
      catalogBox.append(failed);
    }
  }
  await Promise.all([loadHistory(), refreshStats()]);

  const params = new URLSearchParams(window.location.search);
  const initialQuestion = params.get('q');
  if (initialQuestion && initialQuestion.trim()) {
    input.value = initialQuestion.trim();
    await submitMessage(initialQuestion.trim());
  }
}

async function requireLogin() {
  try {
    const session = await window.LANBAI_API('/session');
    if (session?.role === 'user') {
      return true;
    }
  } catch (error) {
    console.warn('[Tutor] 登录状态读取失败', error);
  }
  window.location.href = 'index.html?loginRequired=1';
  return false;
}

function newSession() {
  sessionId = '';
  writeSession('');
  showEmpty();
  renderStats(null);
  input.focus();
}

composer?.addEventListener('submit', (event) => {
  event.preventDefault();
  submitMessage(input.value);
});

input?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

document.querySelectorAll('[data-quick]').forEach((button) => {
  button.addEventListener('click', () => submitMessage(button.dataset.quick));
});

$('tutorNewSession')?.addEventListener('click', newSession);
$('tutorHistoryButton')?.addEventListener('click', openHistory);
$('tutorHistoryClose')?.addEventListener('click', closeHistory);
$('tutorHistoryBackdrop')?.addEventListener('click', closeHistory);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeHistory();
  }
});

init();
