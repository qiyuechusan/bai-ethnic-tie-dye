import {
  fetchQuestions,
  submitAnswer as submitQuizAnswer,
  mockAnswer,
  mockQuestions,
} from './quiz-api.js';

const $ = (id) => document.getElementById(id);

const shell = document.querySelector('.quiz-shell');
const indexLabel = $('quizIndex');
const dotsBox = $('quizDots');
const scoreLabel = $('quizScore');
const categoryLabel = $('quizCategory');
const difficultyLabel = $('quizDifficulty');
const stemLabel = $('quizStem');
const optionsBox = $('quizOptions');
const submitButton = $('quizSubmit');
const nextButton = $('quizNext');
const feedbackBox = $('quizFeedback');
const verdictLabel = $('quizVerdict');
const explanationLabel = $('quizExplanation');
const sourceLabel = $('quizSource');
const knowledgeBox = $('quizKnowledge');
const errorPanel = $('quizError');
const errorText = $('quizErrorText');
const retryButton = $('quizRetry');
const mockButton = $('quizUseMock');
const dataBadge = $('quizDataBadge');
const topbar = $('quizTopbar');
const grid = $('quizGrid');
const resultBox = $('quizResult');
const resultScore = $('quizResultScore');
const resultText = $('quizResultText');
const restartButton = $('quizRestart');
const toast = $('toast');

let questions = [];
let answers = [];
let currentIndex = 0;
let selectedKey = null;
let answered = false;
let submitting = false;
let usingMock = false;

function pad(value) {
  return String(value).padStart(2, '0');
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-active');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-active'), 2600);
}

function difficultyText(value) {
  const level = Math.max(1, Math.min(3, Number(value) || 1));
  return `难度 ${'●'.repeat(level)}${'○'.repeat(3 - level)}`;
}

function score() {
  return answers.filter((answer) => answer === true).length;
}

function updateScore() {
  scoreLabel.textContent = String(score());
}

function renderDots() {
  dotsBox.replaceChildren();
  questions.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'quiz-dot';
    if (answers[index] === true) {
      dot.classList.add('is-correct');
    } else if (answers[index] === false) {
      dot.classList.add('is-wrong');
    }
    if (index === currentIndex) {
      dot.classList.add('is-active');
    }
    dot.setAttribute('aria-label', `第 ${index + 1} 题${answers[index] === true ? '，答对' : answers[index] === false ? '，答错' : ''}`);
    dotsBox.append(dot);
  });
}

function renderQuestion() {
  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  const question = questions[currentIndex];
  answered = false;
  selectedKey = null;

  topbar.hidden = false;
  grid.hidden = false;
  resultBox.hidden = true;
  feedbackBox.hidden = true;
  nextButton.hidden = true;
  verdictLabel.className = 'quiz-verdict';
  verdictLabel.textContent = '';
  explanationLabel.textContent = '';
  sourceLabel.textContent = '';
  knowledgeBox.replaceChildren();

  indexLabel.textContent = `${pad(currentIndex + 1)} / ${pad(questions.length)}`;
  categoryLabel.textContent = question.category || '综合';
  difficultyLabel.textContent = difficultyText(question.difficulty);
  stemLabel.textContent = question.stem;

  optionsBox.replaceChildren();
  (question.options || []).forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-option';
    button.dataset.key = option.key;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');

    const key = document.createElement('span');
    key.className = 'quiz-option-key';
    key.textContent = option.key;

    const text = document.createElement('span');
    text.className = 'quiz-option-text';
    text.textContent = option.content;

    button.append(key, text);
    button.addEventListener('click', () => selectOption(option.key));
    optionsBox.append(button);
  });

  submitButton.disabled = true;
  submitButton.querySelector('span').textContent = '提交答案';
  updateScore();
  renderDots();
}

function selectOption(key) {
  if (answered || submitting) return;
  selectedKey = key;
  optionsBox.querySelectorAll('.quiz-option').forEach((button) => {
    const active = button.dataset.key === key;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-checked', String(active));
  });
  submitButton.disabled = false;
}

function markOptions(result) {
  optionsBox.querySelectorAll('.quiz-option').forEach((button) => {
    const key = button.dataset.key;
    button.disabled = true;
    button.setAttribute('aria-checked', String(key === selectedKey));
    if (key === result.correctOptionKey) {
      button.classList.add('is-correct');
    } else if (key === selectedKey) {
      button.classList.add('is-wrong');
    }
  });
}

function renderFeedback(result) {
  verdictLabel.textContent = result.correct ? '回答正确' : '回答错误';
  verdictLabel.className = `quiz-verdict ${result.correct ? 'is-correct' : 'is-wrong'}`;
  explanationLabel.textContent = result.explanation || '';
  sourceLabel.textContent = result.source ? `资料来源：${result.source}` : '';

  knowledgeBox.replaceChildren();
  if (result.knowledge) {
    const card = document.createElement('div');
    card.className = 'quiz-knowledge-card';

    const title = document.createElement('strong');
    title.textContent = result.knowledge.title || '相关知识块';

    const content = document.createElement('p');
    content.textContent = result.knowledge.content || '';

    card.append(title, content);

    if (result.knowledge.source) {
      const source = document.createElement('small');
      source.textContent = result.knowledge.source;
      card.append(source);
    }
    knowledgeBox.append(card);
  }

  feedbackBox.hidden = false;
  nextButton.hidden = false;
  nextButton.textContent = currentIndex === questions.length - 1 ? '查看结果' : '下一题';
}

async function submitCurrentAnswer() {
  if (!selectedKey || answered || submitting) return;
  const question = questions[currentIndex];

  submitting = true;
  submitButton.disabled = true;
  submitButton.querySelector('span').textContent = '判定中…';

  try {
    const result = usingMock
      ? mockAnswer(question.id, selectedKey)
      : await submitQuizAnswer(question.id, selectedKey);

    answered = true;
    answers[currentIndex] = Boolean(result.correct);
    markOptions(result);
    renderFeedback(result);
    updateScore();
    renderDots();
  } catch (error) {
    showToast(error.message || '提交失败，请重试');
  } finally {
    submitting = false;
    submitButton.querySelector('span').textContent = '提交答案';
    submitButton.disabled = answered ? true : !selectedKey;
  }
}

function nextQuestion() {
  if (!answered) return;
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
    shell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showResult();
  }
}

function showResult() {
  grid.hidden = true;
  topbar.hidden = true;
  resultBox.hidden = false;

  const total = questions.length;
  const correct = score();
  const ratio = total === 0 ? 0 : correct / total;
  resultScore.textContent = `${correct} / ${total}`;

  if (ratio === 1) {
    resultText.textContent = '你已经能辨认扎结、浸染与氧化之间的关键差别。可以回到展区，继续看纹样背后的故事。';
  } else if (ratio >= 0.75) {
    resultText.textContent = '大部分知识点已经建立起来。回看错题对应的知识块，会让理解更扎实。';
  } else if (ratio >= 0.5) {
    resultText.textContent = '基础方向是对的。建议重点回看防染原理和蓝靛氧化，再来一轮。';
  } else {
    resultText.textContent = '别急着记答案，先读一遍解析里的知识块，再回来答一轮。';
  }
}

function restart() {
  currentIndex = 0;
  answers = new Array(questions.length).fill(null);
  selectedKey = null;
  answered = false;
  submitting = false;
  resultBox.hidden = true;
  grid.hidden = false;
  topbar.hidden = false;
  renderQuestion();
  shell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showLoadError(error) {
  errorText.textContent = error?.message || '暂时无法读取题库。';
  errorPanel.hidden = false;
  stemLabel.textContent = '暂时无法读取题目。';
  optionsBox.replaceChildren();
  submitButton.disabled = true;
  nextButton.hidden = true;
  feedbackBox.hidden = true;
  dotsBox.replaceChildren();
  indexLabel.textContent = '-- / --';
  dataBadge.textContent = '未连接';
}

async function loadQuestions() {
  errorPanel.hidden = true;
  optionsBox.replaceChildren();
  submitButton.disabled = true;
  nextButton.hidden = true;
  feedbackBox.hidden = true;
  resultBox.hidden = true;
  grid.hidden = false;
  topbar.hidden = false;
  stemLabel.textContent = '正在读取题目…';
  categoryLabel.textContent = '加载中';
  difficultyLabel.textContent = '难度 ···';
  indexLabel.textContent = '-- / --';
  dotsBox.replaceChildren();

  try {
    const data = await fetchQuestions({ limit: 8 });
    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('题库暂时为空');
    }
    questions = data.questions;
    answers = new Array(questions.length).fill(null);
    currentIndex = 0;
    usingMock = false;
    dataBadge.textContent = '接口题库';
    renderQuestion();
  } catch (error) {
    showLoadError(error);
  }
}

function useMockQuestions() {
  questions = mockQuestions;
  answers = new Array(questions.length).fill(null);
  currentIndex = 0;
  usingMock = true;
  dataBadge.textContent = '演示题库';
  errorPanel.hidden = true;
  renderQuestion();
  showToast('已切换到演示题库');
}

submitButton.addEventListener('click', submitCurrentAnswer);
nextButton.addEventListener('click', nextQuestion);
restartButton.addEventListener('click', restart);
retryButton.addEventListener('click', loadQuestions);
mockButton.addEventListener('click', useMockQuestions);

loadQuestions();
