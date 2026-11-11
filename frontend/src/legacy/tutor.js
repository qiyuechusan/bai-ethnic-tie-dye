import {
  chatWithTutor,
  fetchAiStatus,
  fetchTutorCatalog,
  fetchTutorHistory,
  fetchTutorKnowledge,
  fetchTutorSessions,
  fetchTutorStats,
  submitTutorAnswer,
} from '@/api/tutor.js';
import { assistantBubble, historyBubble, userBubble } from '@/components/chat-renderer.js';

const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'lanbai_tutor_session_v1';

let messagesBox;
let emptyState;
let emptySuggestions;
let composer;
let input;
let sendButton;
let catalogBox;
let statsCard;
let statsBox;
let historyModal;
let historyList;
let newSessionButton;
let aiStatusBadge;
let aiStatusNote;
let knowledgeModal;
let knowledgeTitle;
let knowledgeSummary;
let knowledgeList;

let sessionId = readSession();
let catalog = null;
let busy = false;
let lastKnowledgeTrigger = null;

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
  if (newSessionButton) newSessionButton.disabled = value;
}

function renderAiStatus(status) {
  if (!aiStatusBadge) {
    return;
  }
  aiStatusBadge.classList.remove('is-online', 'is-warning', 'is-offline');

  if (!status) {
    aiStatusBadge.textContent = '状态未知';
    aiStatusBadge.classList.add('is-warning');
    if (aiStatusNote) {
      aiStatusNote.hidden = true;
      aiStatusNote.textContent = '';
    }
    return;
  }

  if (status.llmAvailable && !status.degraded) {
    aiStatusBadge.textContent = 'AI 在线';
    aiStatusBadge.classList.add('is-online');
    if (aiStatusNote) {
      aiStatusNote.hidden = true;
      aiStatusNote.textContent = '';
    }
    return;
  }

  aiStatusBadge.textContent = status.llmAvailable ? '检索可用 · AI 降级' : 'AI 服务未配置';
  aiStatusBadge.classList.add(status.llmAvailable ? 'is-warning' : 'is-offline');
  if (aiStatusNote) {
    const reason = status.degradedReason || '当前只能使用本地知识索引，生成类回答可能不可用。';
    aiStatusNote.textContent = `${reason}${status.knowledgeCount ? ` · 本地知识 ${status.knowledgeCount} 条` : ''}`;
    aiStatusNote.hidden = false;
  }
}

async function loadAiStatus() {
  try {
    renderAiStatus(await fetchAiStatus());
  } catch (error) {
    console.warn('[Tutor] AI 状态读取失败', error);
    renderAiStatus(null);
  }
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

    const browse = document.createElement('button');
    browse.type = 'button';
    browse.className = 'tutor-category-browse';
    browse.textContent = `阅览 ${category.count} 条知识 →`;
    browse.addEventListener('click', (event) => {
      openKnowledge(category, event.currentTarget);
    });
    item.append(browse);

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
  statsCard.hidden = false;
  statsBox.replaceChildren();

  if (attempts === 0) {
    const empty = document.createElement('p');
    empty.textContent = '还没有答题记录。先做一道辨析题，这里会记录正确率与掌握度。';
    const start = document.createElement('button');
    start.type = 'button';
    start.className = 'tutor-chip';
    start.textContent = '开始第一道练习';
    start.addEventListener('click', () => submitMessage('考我一道防染辨析题'));
    statsBox.append(empty, start);
    return;
  }

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

  const weakest = (stats.topics || []).reduce((current, topic) => {
    if (!current) return topic;
    return Number(topic.mastery) < Number(current.mastery) ? topic : current;
  }, null);
  if (weakest) {
    const category = catalog?.categories?.find((item) => item.key === weakest.topic);
    const practice = document.createElement('button');
    practice.type = 'button';
    practice.className = 'tutor-chip';
    practice.textContent = `针对「${category?.label || weakest.topic}」再练一题`;
    practice.addEventListener('click', () => {
      submitMessage(`围绕${category?.label || weakest.topic}再考我一道题`);
    });
    statsBox.append(practice);
  }
}

async function refreshStats() {
  try {
    const stats = await fetchTutorStats(sessionId || '');
    renderStats(stats);
  } catch (error) {
    console.warn('[Tutor] 学习画像读取失败', error);
  }
}

function closeKnowledge() {
  if (!knowledgeModal) {
    return;
  }
  knowledgeModal.hidden = true;
  lastKnowledgeTrigger?.focus?.({ preventScroll: true });
  lastKnowledgeTrigger = null;
}

function renderKnowledgePage(page, category) {
  if (!knowledgeList || !knowledgeSummary) {
    return;
  }
  knowledgeSummary.textContent = `「${category.label}」共 ${page.total ?? 0} 条分片，展示前 ${page.items?.length ?? 0} 条。`;
  knowledgeList.replaceChildren();

  if (!Array.isArray(page.items) || page.items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'tutor-history-empty';
    empty.textContent = '这个分类暂时没有可展示的知识分片。';
    knowledgeList.append(empty);
    return;
  }

  page.items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'tutor-knowledge-item';

    const title = document.createElement('h3');
    title.textContent = item.title || '知识分片';
    const meta = document.createElement('div');
    meta.className = 'tutor-knowledge-meta';
    [item.source, item.confidence ? `可信度 ${item.confidence}` : '', item.chunkKey]
      .filter(Boolean)
      .forEach((text) => {
        const tag = document.createElement('span');
        tag.textContent = text;
        meta.append(tag);
      });
    const summary = document.createElement('p');
    summary.textContent = item.summary || '';
    article.append(title, meta, summary);

    if (Array.isArray(item.keywords) && item.keywords.length > 0) {
      const keywordText = document.createElement('p');
      keywordText.textContent = `关键词：${item.keywords.join(' · ')}`;
      article.append(keywordText);
    }

    if (Array.isArray(item.relatedPrompts) && item.relatedPrompts.length > 0) {
      const actions = document.createElement('div');
      actions.className = 'tutor-knowledge-actions';
      item.relatedPrompts.slice(0, 3).forEach((prompt) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tutor-chip';
        button.textContent = prompt;
        button.addEventListener('click', () => {
          closeKnowledge();
          submitMessage(prompt);
        });
        actions.append(button);
      });
      article.append(actions);
    }

    knowledgeList.append(article);
  });
}

async function openKnowledge(category, trigger = null) {
  if (!knowledgeModal || !knowledgeList || !knowledgeTitle) {
    return;
  }
  lastKnowledgeTrigger = trigger;
  knowledgeTitle.textContent = category.label || '知识分片';
  knowledgeSummary.textContent = '正在读取知识分片…';
  knowledgeList.replaceChildren();
  knowledgeModal.hidden = false;
  $('tutorKnowledgeClose')?.focus({ preventScroll: true });

  try {
    const page = await fetchTutorKnowledge({ category: category.key, limit: 50 });
    renderKnowledgePage(page, category);
  } catch (error) {
    knowledgeList.replaceChildren();
    const failed = document.createElement('p');
    failed.className = 'tutor-history-empty';
    failed.textContent = error.message || '知识分片读取失败，请稍后重试。';
    knowledgeList.append(failed);
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

async function submitMessage(rawText, options = {}) {
  const text = String(rawText || '').trim();
  if (!text || busy) {
    return;
  }
  if (!emptyState.isConnected) {
    messagesBox.prepend(emptyState);
  }
  emptyState.hidden = true;
  if (!options.reuseUserMessage) {
    messagesBox.append(userBubble(text));
  }
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
      window.location.href = '/login?loginRequired=1';
      return;
    }

    const staleSession = error?.status === 403;
    if (staleSession) {
      sessionId = '';
      writeSession('');
      renderStats(null);
    }

    let failureBubble = null;
    failureBubble = assistantBubble({
      text: staleSession
        ? '上一个会话已经失效，或不属于当前账号。我已经为你切换到新会话，可以直接重试这次问题。'
        : `智能导师服务暂时不可用：${error.message || '请稍后重试。'}`,
      citations: [],
      cards: [],
      relatedQuestions: [],
      suggestedPrompts: [],
      lowConfidence: true,
      degraded: false,
      onRetry: () => {
        if (busy || !failureBubble) return;
        failureBubble.remove();
        submitMessage(text, { reuseUserMessage: true });
      },
    }, handlers);
    messagesBox.append(failureBubble);
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
      messagesBox.append(historyBubble(item, handlers));
    });
    scrollToBottom();
  } catch (error) {
    console.warn('[Tutor] 历史记录读取失败', error);
    if (error?.status === 403) {
      sessionId = '';
      writeSession('');
    }
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
  await Promise.all([loadAiStatus(), loadHistory(), refreshStats()]);

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
  window.location.href = '/login?loginRequired=1';
  return false;
}

function newSession() {
  if (busy) {
    return;
  }
  sessionId = '';
  writeSession('');
  showEmpty();
  refreshStats();
  input.focus();
}

export async function initTutorPage() {
  messagesBox = $('tutorMessages')
  emptyState = $('tutorEmpty')
  emptySuggestions = $('tutorEmptySuggestions')
  composer = $('tutorComposer')
  input = $('tutorInput')
  sendButton = $('tutorSend')
  catalogBox = $('tutorCatalog')
  statsCard = $('tutorStatsCard')
  statsBox = $('tutorStats')
  historyModal = $('tutorHistoryModal')
  historyList = $('tutorHistoryList')
  newSessionButton = $('tutorNewSession')
  aiStatusBadge = $('tutorAiStatus')
  aiStatusNote = $('tutorAiStatusNote')
  knowledgeModal = $('tutorKnowledgeModal')
  knowledgeTitle = $('tutorKnowledgeTitle')
  knowledgeSummary = $('tutorKnowledgeSummary')
  knowledgeList = $('tutorKnowledgeList')

composer?.addEventListener('submit', (event) => {
  event.preventDefault();
  submitMessage(input.value);
});

input?.addEventListener('keydown', (event) => {
  if (event.isComposing || event.keyCode === 229) {
    return;
  }
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
$('tutorKnowledgeClose')?.addEventListener('click', closeKnowledge);
$('tutorKnowledgeBackdrop')?.addEventListener('click', closeKnowledge);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeHistory();
    closeKnowledge();
  }
});

await init();
}

