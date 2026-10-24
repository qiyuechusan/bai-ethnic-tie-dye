import { createDiyRenderer } from './renderer/index.js';

const $ = (id) => document.getElementById(id);

export function userBubble(text) {
  const message = document.createElement('article');
  message.className = 'tutor-msg is-user';
  const bubble = document.createElement('div');
  bubble.className = 'tutor-bubble';
  bubble.textContent = text;
  message.append(bubble);
  return message;
}

export function assistantBubble(data, handlers = {}) {
  const message = document.createElement('article');
  message.className = 'tutor-msg is-assistant';

  const avatar = document.createElement('span');
  avatar.className = 'tutor-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = '蓝';

  const bubble = document.createElement('div');
  bubble.className = 'tutor-bubble';

  const textBox = document.createElement('div');
  textBox.className = 'tutor-text';
  appendParagraphs(textBox, data.text || '');
  bubble.append(textBox);

  if (data.lowConfidence) {
    const note = document.createElement('p');
    note.className = 'tutor-low-confidence';
    note.textContent = '这条回答的知识覆盖面有限，建议点开引用或换个问法继续确认。';
    bubble.append(note);
  }

  const citations = renderCitations(data.citations || []);
  if (citations) {
    bubble.append(citations);
  }

  const cardsBox = document.createElement('div');
  cardsBox.className = 'tutor-cards';
  (data.cards || []).forEach((card) => {
    const element = renderCard(card, handlers);
    if (element) {
      cardsBox.append(element);
    }
  });
  if (cardsBox.childElementCount > 0) {
    bubble.append(cardsBox);
  }

  if (Array.isArray(data.relatedQuestions) && data.relatedQuestions.length > 0) {
    bubble.append(renderPromptGroup('相关问题', data.relatedQuestions, handlers));
  }
  if (Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0) {
    bubble.append(renderPromptGroup('继续问', data.suggestedPrompts, handlers));
  }

  message.append(avatar, bubble);
  return message;
}

export function historyBubble(item) {
  if (item.role === 'user') {
    return userBubble(item.content || '');
  }
  const payload = item.payload || {};
  return assistantBubble({
    text: item.content || '',
    citations: payload.citations || [],
    cards: [],
    relatedQuestions: [],
    suggestedPrompts: [],
    lowConfidence: Boolean(payload.lowConfidence),
  });
}

function renderCard(card, handlers) {
  switch (card.type) {
    case 'quiz':
      return renderQuizCard(card.quiz, handlers);
    case 'pattern':
      return renderPatternCard(card.pattern);
    case 'clarify':
      return renderClarifyCard(card.clarify, handlers);
    case 'grade':
      return renderGradeCard(card.grade);
    default:
      return null;
  }
}

function renderQuizCard(quiz, handlers) {
  const card = document.createElement('div');
  card.className = 'tutor-card quiz-card';

  const kicker = document.createElement('span');
  kicker.className = 'tutor-card-kicker';
  kicker.textContent = `辨析题 · ${difficultyText(quiz.difficulty)}`;
  card.append(kicker);

  const stem = document.createElement('h3');
  stem.textContent = quiz.stem || '辨析题';
  card.append(stem);

  const optionsBox = document.createElement('div');
  optionsBox.className = 'tutor-quiz-options';
  optionsBox.setAttribute('role', 'radiogroup');
  let selectedKey = null;

  (quiz.options || []).forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tutor-quiz-option';
    button.dataset.key = option.key;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');

    const key = document.createElement('b');
    key.textContent = option.key;
    const text = document.createElement('span');
    text.textContent = option.content;
    button.append(key, text);

    button.addEventListener('click', () => {
      if (card.dataset.answered === 'true') {
        return;
      }
      selectedKey = option.key;
      optionsBox.querySelectorAll('.tutor-quiz-option').forEach((item) => {
        const active = item.dataset.key === selectedKey;
        item.classList.toggle('is-selected', active);
        item.setAttribute('aria-checked', String(active));
      });
      submitButton.disabled = false;
    });
    optionsBox.append(button);
  });
  card.append(optionsBox);

  if (quiz.hint) {
    const hint = document.createElement('p');
    hint.className = 'tutor-quiz-hint';
    hint.textContent = `提示：${quiz.hint}`;
    card.append(hint);
  }

  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.className = 'lab-primary tutor-quiz-submit';
  submitButton.disabled = true;
  const submitText = document.createElement('span');
  submitText.textContent = '提交答案';
  submitButton.append(submitText);
  card.append(submitButton);

  const feedback = document.createElement('div');
  feedback.className = 'tutor-quiz-feedback';
  feedback.hidden = true;
  card.append(feedback);

  submitButton.addEventListener('click', async () => {
    if (!selectedKey || card.dataset.answered === 'true') {
      return;
    }
    submitButton.disabled = true;
    submitText.textContent = '判定中…';
    try {
      const result = await handlers.submitQuiz?.(quiz.quizId, selectedKey);
      renderQuizResult(card, feedback, result, handlers);
      card.dataset.answered = 'true';
      optionsBox.querySelectorAll('.tutor-quiz-option').forEach((button) => {
        button.disabled = true;
      });
      submitButton.hidden = true;
      handlers.onGraded?.(result);
    } catch (error) {
      submitButton.disabled = false;
      submitText.textContent = '提交答案';
      const failure = document.createElement('p');
      failure.className = 'tutor-error-line';
      failure.textContent = error.message || '提交失败，请重试';
      feedback.hidden = false;
      feedback.replaceChildren(failure);
    }
  });

  return card;
}

function renderQuizResult(card, feedback, result, handlers) {
  feedback.replaceChildren();
  feedback.hidden = false;

  const verdict = document.createElement('strong');
  verdict.className = result.correct ? 'is-correct' : 'is-wrong';
  verdict.textContent = result.correct ? '回答正确' : `回答错误，正确答案是 ${result.correctOptionKey}`;
  feedback.append(verdict);

  const explanation = document.createElement('p');
  explanation.textContent = result.explanation || '';
  feedback.append(explanation);

  const citations = renderCitations(result.citations || []);
  if (citations) {
    feedback.append(citations);
  }

  if (result.followUp) {
    const followUp = document.createElement('p');
    followUp.className = 'tutor-follow-up';
    followUp.textContent = result.followUp;
    feedback.append(followUp);
  }
  if (Array.isArray(result.followUpPrompts) && result.followUpPrompts.length > 0) {
    feedback.append(renderPromptGroup('接下来', result.followUpPrompts, handlers));
  }

  // 标记选项对错
  const correctKey = result.correctOptionKey;
  const selected = card.querySelector('.tutor-quiz-option.is-selected');
  const selectedKey = selected?.dataset.key;
  card.querySelectorAll('.tutor-quiz-option').forEach((button) => {
    if (button.dataset.key === correctKey) {
      button.classList.add('is-correct');
    } else if (button.dataset.key === selectedKey) {
      button.classList.add('is-wrong');
    }
  });
}

function renderPatternCard(pattern) {
  if (!pattern) {
    return null;
  }
  const card = document.createElement('div');
  card.className = 'tutor-card pattern-card';

  const kicker = document.createElement('span');
  kicker.className = 'tutor-card-kicker';
  kicker.textContent = `纹样 · ${pattern.methodName || '智能生成'}`;
  card.append(kicker);

  const wrap = document.createElement('div');
  wrap.className = 'tutor-pattern-wrap';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', `${pattern.methodName || '扎染'}纹样预览`);
  wrap.append(canvas);
  card.append(wrap);

  if (pattern.explanation) {
    const explanation = document.createElement('p');
    explanation.className = 'tutor-pattern-note';
    explanation.textContent = pattern.explanation;
    card.append(explanation);
  }

  const actions = document.createElement('div');
  actions.className = 'tutor-pattern-actions';
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'lab-quiet';
  replay.textContent = '重播氧化';
  actions.append(replay);
  card.append(actions);

  let renderer = null;
  const setup = () => {
    if (renderer) {
      renderer.destroy();
    }
    renderer = createDiyRenderer(canvas, { width: 600, height: 750 });
    renderer.setMethod({
      code: 'tutor-pattern',
      name: pattern.methodName,
      patternType: pattern.patternType,
      params: pattern.params || {},
      previewColors: pattern.previewColors || [],
    });
    renderer.setSeed(pattern.seed || 'TUTOR');
    if (pattern.oxidation) {
      renderer.setOxidationConfig(pattern.oxidation);
    }
    renderer.dye({ dips: pattern.oxidation?.dips || 1 });
  };

  requestAnimationFrame(() => {
    setup();
    replay.addEventListener('click', setup);
  });

  return card;
}

function renderClarifyCard(clarify, handlers) {
  const card = document.createElement('div');
  card.className = 'tutor-card clarify-card';
  const question = document.createElement('p');
  question.textContent = clarify.question || '你想了解哪一方面？';
  card.append(question);
  const chips = document.createElement('div');
  chips.className = 'tutor-quick-chips';
  (clarify.options || []).forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tutor-chip';
    button.textContent = option;
    button.addEventListener('click', () => handlers.onPrompt?.(option));
    chips.append(button);
  });
  card.append(chips);
  return card;
}

function renderGradeCard(grade) {
  if (!grade) {
    return null;
  }
  const card = document.createElement('div');
  card.className = `tutor-card grade-card ${grade.correct ? 'is-correct' : 'is-wrong'}`;
  const verdict = document.createElement('strong');
  verdict.textContent = grade.correct ? '回答正确' : `回答错误，正确答案是 ${grade.correctOptionKey}`;
  card.append(verdict);
  if (grade.explanation) {
    const explanation = document.createElement('p');
    explanation.textContent = grade.explanation;
    card.append(explanation);
  }
  const citations = renderCitations(grade.citations || []);
  if (citations) {
    card.append(citations);
  }
  return card;
}

function renderCitations(citations) {
  if (!Array.isArray(citations) || citations.length === 0) {
    return null;
  }
  const details = document.createElement('details');
  details.className = 'tutor-citations';
  const summary = document.createElement('summary');
  summary.textContent = `知识依据 · ${citations.length} 条`;
  details.append(summary);

  const list = document.createElement('ul');
  citations.forEach((citation) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = citation.title || citation.chunkKey || '知识分片';
    const snippet = document.createElement('p');
    snippet.textContent = citation.snippet || '';
    const meta = document.createElement('small');
    meta.textContent = [citation.source, citation.confidence ? `可信度 ${citation.confidence}` : '']
      .filter(Boolean)
      .join(' · ');
    item.append(title, snippet);
    if (meta.textContent) {
      item.append(meta);
    }
    list.append(item);
  });
  details.append(list);
  return details;
}

function renderPromptGroup(label, prompts, handlers) {
  const group = document.createElement('div');
  group.className = 'tutor-prompt-group';
  const title = document.createElement('span');
  title.textContent = label;
  group.append(title);
  const chips = document.createElement('div');
  chips.className = 'tutor-quick-chips';
  prompts.forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tutor-chip';
    button.textContent = prompt;
    button.addEventListener('click', () => handlers.onPrompt?.(prompt));
    chips.append(button);
  });
  group.append(chips);
  return group;
}

function appendParagraphs(container, text) {
  const lines = String(text || '').split('\n');
  let paragraph = null;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraph = null;
      return;
    }
    paragraph = document.createElement('p');
    paragraph.textContent = trimmed;
    container.append(paragraph);
  });
  if (container.childElementCount === 0) {
    const empty = document.createElement('p');
    empty.textContent = '（没有返回文字内容）';
    container.append(empty);
  }
}

function difficultyText(value) {
  const level = Math.max(1, Math.min(3, Number(value) || 1));
  return `${'●'.repeat(level)}${'○'.repeat(3 - level)}`;
}
