(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function createDyeCanvas() {
    const canvas = document.getElementById("dyeCanvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const isLogin = document.body.classList.contains("page-login");
    const maxDpr = 1.5;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let blooms = [];
    let lastSpawn = 0;

    const palette = isLogin
      ? [
          [22, 77, 127],
          [63, 127, 159],
          [118, 162, 170],
          [151, 170, 133]
        ]
      : [
          [16, 71, 121],
          [49, 108, 147],
          [131, 169, 171],
          [165, 182, 133]
        ];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedBlooms();
    }

    function makeBloom(initial = false) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      const edgeBias = Math.random();
      let x;
      let y;

      if (edgeBias < 0.38) {
        x = Math.random() * width;
        y = Math.random() > 0.5 ? -30 : height + 30;
      } else if (edgeBias < 0.7) {
        x = Math.random() > 0.5 ? -40 : width + 40;
        y = Math.random() * height;
      } else {
        x = width * (0.05 + Math.random() * 0.9);
        y = height * (0.05 + Math.random() * 0.9);
      }

      const life = initial ? Math.random() * 350 : 0;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.075,
        vy: (Math.random() - 0.5) * 0.06,
        radius: 70 + Math.random() * 185,
        wobble: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002,
        alpha: (isLogin ? 0.045 : 0.026) + Math.random() * 0.055,
        life,
        maxLife: 520 + Math.random() * 480,
        color,
        veil: Math.random() > 0.78
      };
    }

    function seedBlooms() {
      blooms = [];
      const amount = reduceMotion ? 6 : width < 700 ? 8 : 13;
      for (let index = 0; index < amount; index += 1) {
        blooms.push(makeBloom(true));
      }
    }

    function drawBloom(bloom) {
      const fade = Math.sin(Math.min(bloom.life / bloom.maxLife, 1) * Math.PI);
      if (fade <= 0) return;

      const pulse = 1 + Math.sin(bloom.wobble) * 0.12;
      const r = bloom.radius * pulse;
      const [red, green, blue] = bloom.color;

      context.save();
      context.translate(bloom.x, bloom.y);
      context.scale(1, 0.7 + Math.sin(bloom.wobble * 0.7) * 0.08);

      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, r);
      gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${bloom.alpha * fade * 1.18})`);
      gradient.addColorStop(0.33, `rgba(${red}, ${green}, ${blue}, ${bloom.alpha * fade * 0.76})`);
      gradient.addColorStop(0.68, `rgba(${red}, ${green}, ${blue}, ${bloom.alpha * fade * 0.28})`);
      gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, r, 0, Math.PI * 2);
      context.fill();

      if (bloom.veil) {
        context.globalCompositeOperation = "destination-out";
        const hole = context.createRadialGradient(r * 0.12, -r * 0.08, 1, r * 0.12, -r * 0.08, r * 0.28);
        hole.addColorStop(0, `rgba(0, 0, 0, ${0.13 * fade})`);
        hole.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = hole;
        context.beginPath();
        context.arc(r * 0.12, -r * 0.08, r * 0.3, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    }

    function update(time) {
      if (!reduceMotion) {
        frame += 1;
        context.clearRect(0, 0, width, height);

        if (time - lastSpawn > 2500 && blooms.length < 18) {
          blooms.push(makeBloom());
          lastSpawn = time;
        }

        blooms.forEach((bloom) => {
          bloom.life += 1;
          bloom.wobble += bloom.speed * 16;
          bloom.x += bloom.vx + Math.sin(bloom.wobble * 0.43) * 0.07;
          bloom.y += bloom.vy + Math.cos(bloom.wobble * 0.37) * 0.05;
          drawBloom(bloom);
        });

        blooms = blooms.filter((bloom) => bloom.life <= bloom.maxLife);
        frame = window.requestAnimationFrame(update);
      } else {
        context.clearRect(0, 0, width, height);
        blooms.forEach(drawBloom);
      }
    }

    resize();
    if (!reduceMotion) {
      frame = window.requestAnimationFrame(update);
    } else {
      blooms.forEach(drawBloom);
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        window.cancelAnimationFrame(frame);
        resize();
        if (!reduceMotion) {
          frame = window.requestAnimationFrame(update);
        } else {
          blooms.forEach(drawBloom);
        }
      }, 180);
    });
  }

  function setupLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    const account = document.getElementById("account");
    const password = document.getElementById("password");
    const accountError = document.getElementById("accountError");
    const passwordError = document.getElementById("passwordError");
    const submit = form.querySelector(".login-submit");
    const submitText = submit.querySelector("span");
    const toggle = form.querySelector(".password-toggle");
    const forgot = document.getElementById("forgotButton");
    const wash = document.querySelector(".page-wash");
    const toast = document.getElementById("toast");
    let toastTimer;

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-active");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("is-active"), 2600);
    }

    function markField(input, errorElement, message) {
      const field = input.closest(".field");
      errorElement.textContent = message;
      field.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validate() {
      let valid = true;
      if (!account.value.trim()) {
        markField(account, accountError, "请留下你的账号，再进入染坊。");
        valid = false;
      } else {
        markField(account, accountError, "");
      }

      if (!password.value) {
        markField(password, passwordError, "密码还没有填写。");
        valid = false;
      } else {
        markField(password, passwordError, "");
      }
      return valid;
    }

    [account, password].forEach((input) => {
      input.addEventListener("input", () => {
        const error = input === account ? accountError : passwordError;
        if (input.closest(".field").classList.contains("has-error")) {
          markField(input, error, input.value ? "" : error.textContent);
        }
      });
    });

    toggle.addEventListener("click", () => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      toggle.classList.toggle("is-visible", show);
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
      password.focus({ preventScroll: true });
    });

    forgot.addEventListener("click", () => {
      showToast("这是界面预览，找回密码功能尚未接入。");
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate()) {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submit.disabled = true;
      submitText.textContent = "靛蓝正在浸染…";
      try {
        window.localStorage.setItem("lanbai-visitor", account.value.trim());
      } catch {
        // Local file previews can restrict storage; the visual flow still works.
      }

      window.setTimeout(() => {
        wash.classList.add("is-active");
      }, 180);

      window.setTimeout(() => {
        window.location.href = "home.html";
      }, 1050);
    });
  }

  function setupHome() {
    if (!document.body.classList.contains("page-home")) return;

    const header = document.getElementById("siteHeader");
    const menuButton = document.getElementById("menuButton");
    const nav = document.getElementById("mainNav");

    const onScroll = () => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 18);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (menuButton && nav) {
      const closeMenu = () => {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "打开菜单");
        nav.classList.remove("is-open");
      };

      menuButton.addEventListener("click", () => {
        const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
        menuButton.setAttribute("aria-expanded", String(willOpen));
        menuButton.setAttribute("aria-label", willOpen ? "关闭菜单" : "打开菜单");
        nav.classList.toggle("is-open", willOpen);
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      document.addEventListener("click", (event) => {
        if (!nav.contains(event.target) && !menuButton.contains(event.target)) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });
    }

    const revealItems = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
      );
      revealItems.forEach((item) => observer.observe(item));
      window.setTimeout(() => {
        revealItems.forEach((item) => item.classList.add("is-visible"));
      }, 1200);
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }
  }

  createDyeCanvas();
  setupLogin();
  setupHome();
})();
// ==========================================
// 阶段四：前后端联调逻辑
// ==========================================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  if (modalId === 'modal-pattern') {
    loadPatterns();
    loadQuiz();
  } else if (modalId === 'modal-ask') {
    loadArtworks();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// ---------------- 模块 3：图鉴与答题 ----------------
let allPatterns = [];
let allQuestions = [];
let currentQuizIndex = 0;
let unlockedIds = JSON.parse(localStorage.getItem('unlockedPatterns') || '[]');

async function loadPatterns() {
  if (allPatterns.length > 0) return renderPatterns();
  try {
    const res = await fetch('http://localhost:8080/api/patterns');
    allPatterns = await res.json();
    renderPatterns();
  } catch (err) {
    console.error('获取纹样失败', err);
  }
}

function renderPatterns() {
  const grid = document.getElementById('pattern-grid');
  grid.innerHTML = allPatterns.map(p => {
    const isUnlocked = unlockedIds.includes(p.id);
    // 由于你的图片路径是 assets/xxx.png，可以直接用
    return `
      <div class="pattern-card ${isUnlocked ? 'unlocked' : ''}">
        <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='assets/indigo-textile.svg'">
        <h4>${isUnlocked ? p.name : '未解锁'}</h4>
        <p>${isUnlocked ? p.meaning : '答对题目解锁'}</p>
      </div>
    `;
  }).join('');
}

async function loadQuiz() {
  if (allQuestions.length > 0) return renderQuiz();
  try {
    const res = await fetch('http://localhost:8080/api/quiz/questions');
    allQuestions = await res.json();
    renderQuiz();
  } catch (err) {
    console.error('获取题目失败', err);
  }
}

function renderQuiz() {
  const q = allQuestions[currentQuizIndex];
  if (!q) {
    document.getElementById('quiz-question').textContent = "恭喜！所有题目已完成。";
    document.getElementById('quiz-options').innerHTML = "";
    return;
  }
  
  document.getElementById('quiz-question').textContent = `第 ${currentQuizIndex + 1} 题：${q.questionText}`;
  document.getElementById('quiz-options').innerHTML = `
    <button onclick="checkAnswer('A', '${q.correctAnswer}', ${q.patternId}, '${q.explanation}')">A. ${q.optionA}</button>
    <button onclick="checkAnswer('B', '${q.correctAnswer}', ${q.patternId}, '${q.explanation}')">B. ${q.optionB}</button>
    <button onclick="checkAnswer('C', '${q.correctAnswer}', ${q.patternId}, '${q.explanation}')">C. ${q.optionC}</button>
    <button onclick="checkAnswer('D', '${q.correctAnswer}', ${q.patternId}, '${q.explanation}')">D. ${q.optionD}</button>
  `;
  document.getElementById('quiz-feedback').textContent = "";
}

function checkAnswer(selected, correct, patternId, explanation) {
  const feedback = document.getElementById('quiz-feedback');
  if (selected === correct) {
    feedback.style.color = "green";
    feedback.textContent = `回答正确！${explanation}`;
    
    if (patternId && !unlockedIds.includes(patternId)) {
      unlockedIds.push(patternId);
      localStorage.setItem('unlockedPatterns', JSON.stringify(unlockedIds));
      renderPatterns(); // 实时更新图鉴解锁状态
    }
    
    setTimeout(() => {
      currentQuizIndex++;
      renderQuiz();
    }, 2000);
  } else {
    feedback.style.color = "red";
    feedback.textContent = `回答错误，请再试一次。`;
  }
}

// ---------------- 模块 4：作品墙 ----------------
let currentArtworks = []; // 缓存当前获取的数据，用于筛选

function toggleUploadForm() {
  const container = document.getElementById('upload-form-container');
  container.style.display = container.style.display === 'none' ? 'flex' : 'none';
}

// 预览上传的图片
function previewImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('previewImg').style.display = 'block';
      document.getElementById('previewText').style.display = 'none';
    }
    reader.readAsDataURL(input.files[0]);
  }
}

async function loadArtworks() {
  try {
    const res = await fetch('http://localhost:8080/api/artworks');
    currentArtworks = await res.json();
    renderArtworks(currentArtworks);
  } catch (err) {
    console.error('获取作品失败', err);
  }
}

// 渲染画廊
function renderArtworks(artworks) {
  const grid = document.getElementById('artwork-grid');
  if(artworks.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted); width:100%; text-align:center;">暂时还没有作品，快来挂上第一张拍立得吧！</p>';
    return;
  }

  grid.innerHTML = artworks.map(a => {
    let imgSrc = a.imageUrl;
    if (imgSrc.startsWith('/uploads/')) {
      imgSrc = 'http://localhost:8080' + imgSrc;
    }
    const likes = a.likes || 0;

    // 注意这里加了 onclick="openLightbox(${a.id})" 以及对应的事件
    return `
      <div class="polaroid-card" onclick="openLightbox(${a.id})">
        <div class="clip"></div>
        <img class="polaroid-image" src="${imgSrc}" alt="${a.title}" onerror="this.src='assets/indigo-textile.svg'">
        <div class="polaroid-caption">
          <div class="polaroid-title">${a.title}</div>
          <div class="polaroid-desc">${a.description || '这位匠人很懒，没有留下感悟。'}</div>
          <div class="polaroid-author">—— ${a.authorName} · ${a.tieMethod}</div>
          
          <!-- 这里加了一个 event.stopPropagation()，防止点击点赞时触发灯箱弹出 -->
          <div class="like-vat" onclick="event.stopPropagation(); likeArtwork(${a.id}, this)">
            <i class="vat-icon"></i>
            <span class="like-count">${likes}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 筛选功能
function filterArtworks(method, btnElement) {
  // 切换按钮样式
  document.querySelectorAll('.filter-tags button').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  // 过滤数据
  if (method === '全部') {
    renderArtworks(currentArtworks);
  } else {
    const filtered = currentArtworks.filter(a => a.tieMethod === method);
    renderArtworks(filtered);
  }
}

// 点赞功能
async function likeArtwork(id, element) {
  // 防止重复点击
  if(element.classList.contains('active')) return;
  
  try {
    const res = await fetch(`http://localhost:8080/api/artworks/${id}/like`, { method: 'POST' });
    if (res.ok) {
      // 前端体验：数字加1，触发水波纹动画
      const countSpan = element.querySelector('.like-count');
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
      element.classList.add('active');
      
      // 同步更新缓存数据，免得切筛选时点赞数又变回去了
      const artwork = currentArtworks.find(a => a.id === id);
      if(artwork) artwork.likes = parseInt(countSpan.textContent);
    }
  } catch (err) {
    console.error('点赞失败', err);
  }
}

async function handleUpload(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  
  // 提交按钮变文字
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '悬挂中...';
  submitBtn.disabled = true;

  try {
    const res = await fetch('http://localhost:8080/api/artworks/upload', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      // 清空表单和预览
      event.target.reset();
      document.getElementById('previewImg').style.display = 'none';
      document.getElementById('previewText').style.display = 'block';
      
      toggleUploadForm();
      loadArtworks(); // 刷新列表
    } else {
      alert('上传失败');
    }
  } catch (err) {
    console.error(err);
    alert('网络错误');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
// ===== 灯箱交互逻辑 =====
let currentLightboxId = null;

function openLightbox(id) {
  const artwork = currentArtworks.find(a => a.id === id);
  if (!artwork) return;

  currentLightboxId = id;
  let imgSrc = artwork.imageUrl;
  if (imgSrc.startsWith('/uploads/')) {
    imgSrc = 'http://localhost:8080' + imgSrc;
  }

  document.getElementById('lightbox-img').src = imgSrc;
  document.getElementById('lightbox-title').textContent = artwork.title;
  document.getElementById('lightbox-desc').textContent = artwork.description || '这位匠人很懒，没有留下感悟。';
  document.getElementById('lightbox-author').textContent = `作者：${artwork.authorName} · 技法：${artwork.tieMethod}`;
  
  const likeSpan = document.getElementById('lightbox-likes');
  likeSpan.textContent = artwork.likes || 0;
  
  // 如果已经点过赞（颜色变深），这里也要同步
  const likeVat = document.getElementById('lightbox-like');
  if (artwork.liked) {
    likeVat.classList.add('active');
  } else {
    likeVat.classList.remove('active');
  }

  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox(event) {
  // 如果点击的是外部背景，或者是关闭按钮，则关闭
  if (!event || event.target.id === 'lightbox' || event.target.classList.contains('lightbox-close')) {
    document.getElementById('lightbox').classList.remove('active');
    currentLightboxId = null;
  }
}

// 从灯箱里点赞
async function likeFromLightbox(event) {
  event.stopPropagation();
  const likeVat = document.getElementById('lightbox-like');
  if (likeVat.classList.contains('active')) return; // 防止重复点

  const id = currentLightboxId;
  try {
    const res = await fetch(`http://localhost:8080/api/artworks/${id}/like`, { method: 'POST' });
    if (res.ok) {
      // 更新灯箱里的数字和状态
      const countSpan = document.getElementById('lightbox-likes');
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
      likeVat.classList.add('active');
      
      // 同步更新底层画廊的数据和UI
      const artwork = currentArtworks.find(a => a.id === id);
      if(artwork) {
        artwork.likes = parseInt(countSpan.textContent);
        artwork.liked = true; 
      }
      
      // 找到背后的卡片，更新它的点赞UI
      const cards = document.querySelectorAll('.polaroid-card');
      cards.forEach(card => {
        if (card.getAttribute('onclick').includes(`(${id})`)) {
          const miniLike = card.querySelector('.like-vat');
          if (miniLike) {
            miniLike.querySelector('.like-count').textContent = artwork.likes;
            miniLike.classList.add('active');
          }
        }
      });
    }
  } catch (err) {
    console.error('点赞失败', err);
  }
}