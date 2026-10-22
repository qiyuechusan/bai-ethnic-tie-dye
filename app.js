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
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    if (!loginForm || !registerForm) return;

    const card = document.querySelector(".login-card");
    const loginPanel = document.getElementById("loginPanel");
    const registerPanel = document.getElementById("registerPanel");
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    const showRegister = document.getElementById("showRegister");
    const showLogin = document.getElementById("showLogin");
    const authKicker = document.getElementById("authKicker");
    const authTitle = document.getElementById("entry-title");
    const authSubtitle = document.getElementById("authSubtitle");
    const account = document.getElementById("account");
    const password = document.getElementById("password");
    const accountError = document.getElementById("accountError");
    const passwordError = document.getElementById("passwordError");
    const loginStatus = document.getElementById("loginStatus");
    const registerStatus = document.getElementById("registerStatus");
    const displayName = document.getElementById("displayName");
    const registerAccount = document.getElementById("registerAccount");
    const registerPassword = document.getElementById("registerPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const displayNameError = document.getElementById("displayNameError");
    const registerAccountError = document.getElementById("registerAccountError");
    const registerPasswordError = document.getElementById("registerPasswordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const loginSubmit = loginForm.querySelector(".login-submit");
    const registerSubmit = registerForm.querySelector(".register-submit");
    const loginSubmitText = loginSubmit.querySelector("span");
    const registerSubmitText = registerSubmit.querySelector("span");
    const forgot = document.getElementById("forgotButton");
    const guestButton = document.getElementById("guestButton");
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

    function setStatus(element, message, isError = false) {
      element.textContent = message;
      element.classList.toggle("is-error", isError);
    }

    function setButtonBusy(button, busy, text, buttonText, loadingText) {
      button.disabled = busy;
      text.textContent = busy ? loadingText : buttonText;
    }

    function setMode(mode, focusTab = false) {
      const isLogin = mode === "login";
      loginPanel.hidden = !isLogin;
      registerPanel.hidden = isLogin;
      loginTab.classList.toggle("is-active", isLogin);
      registerTab.classList.toggle("is-active", !isLogin);
      loginTab.setAttribute("aria-selected", String(isLogin));
      registerTab.setAttribute("aria-selected", String(!isLogin));
      loginTab.tabIndex = isLogin ? 0 : -1;
      registerTab.tabIndex = isLogin ? -1 : 0;
      card.dataset.authMode = mode;
      authKicker.textContent = isLogin ? "WELCOME BACK" : "FIRST VISIT";
      authTitle.textContent = isLogin ? "回到染坊" : "新添一枚名字";
      authSubtitle.textContent = isLogin
        ? "继续探索那一抹正在氧化的蓝。"
        : "先留下一个可被记住的称呼。";
      setStatus(loginStatus, "");
      setStatus(registerStatus, "");
      if (focusTab) (isLogin ? loginTab : registerTab).focus();
      if (!isLogin) window.setTimeout(() => displayName.focus(), 80);
    }

    async function requestJson(url, body) {
      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } catch {
        throw new Error("无法连接登录服务，请先运行 npm start。");
      }

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("服务器返回了无法识别的响应。");
      }

      if (!response.ok) {
        const error = new Error(data.message || "请求未能完成，请稍后重试。");
        error.status = response.status;
        error.data = data;
        throw error;
      }
      return data;
    }

    function validAccount(value) {
      return /^1[3-9]\d{9}$/.test(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value);
    }

    function validateLogin() {
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

    function validateRegistration() {
      let valid = true;
      const normalizedAccount = registerAccount.value.trim().toLowerCase();

      if (displayName.value.trim().length < 2 || displayName.value.trim().length > 20) {
        markField(displayName, displayNameError, "昵称需要 2–20 个字符。");
        valid = false;
      } else {
        markField(displayName, displayNameError, "");
      }

      if (!validAccount(normalizedAccount)) {
        markField(registerAccount, registerAccountError, "请输入有效的手机号或邮箱。");
        valid = false;
      } else {
        markField(registerAccount, registerAccountError, "");
      }

      if (registerPassword.value.length < 8 || registerPassword.value.length > 72) {
        markField(registerPassword, registerPasswordError, "密码需要 8–72 个字符。");
        valid = false;
      } else {
        markField(registerPassword, registerPasswordError, "");
      }

      if (!confirmPassword.value) {
        markField(confirmPassword, confirmPasswordError, "请再次输入密码。");
        valid = false;
      } else if (confirmPassword.value !== registerPassword.value) {
        markField(confirmPassword, confirmPasswordError, "两次输入的密码不一致。");
        valid = false;
      } else {
        markField(confirmPassword, confirmPasswordError, "");
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

    [displayName, registerAccount, registerPassword, confirmPassword].forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (!field.classList.contains("has-error")) return;
        const errorMap = new Map([
          [displayName, displayNameError],
          [registerAccount, registerAccountError],
          [registerPassword, registerPasswordError],
          [confirmPassword, confirmPasswordError]
        ]);
        markField(input, errorMap.get(input), "");
      });
    });

    document.querySelectorAll(".password-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const input = toggle.closest(".field").querySelector("input");
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        toggle.classList.toggle("is-visible", show);
        toggle.setAttribute("aria-pressed", String(show));
        toggle.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
        input.focus({ preventScroll: true });
      });
    });

    [loginTab, registerTab].forEach((tab) => {
      tab.addEventListener("click", () => {
        setMode(tab === loginTab ? "login" : "register");
      });
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        setMode(tab === loginTab ? "register" : "login", true);
      });
    });

    showRegister.addEventListener("click", () => setMode("register"));
    showLogin.addEventListener("click", () => setMode("login"));

    forgot.addEventListener("click", () => {
      showToast("当前版本暂不支持自助找回密码，请联系项目管理员。");
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(loginStatus, "");
      if (!validateLogin()) {
        const firstInvalid = loginForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      setButtonBusy(loginSubmit, true, loginSubmitText, "进入蓝白之境", "正在核对染谱…");

      try {
        await requestJson("/api/login", {
          account: account.value.trim(),
          password: password.value,
          remember: Boolean(loginForm.elements.remember.checked)
        });

        window.setTimeout(() => wash.classList.add("is-active"), 120);
        window.setTimeout(() => {
          window.location.href = "home.html";
        }, 880);
      } catch (error) {
        setStatus(loginStatus, error.message, true);
        setButtonBusy(loginSubmit, false, loginSubmitText, "进入蓝白之境", "正在核对染谱…");
        if (error.status === 401) password.focus();
      }
    });

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(registerStatus, "");
      if (!validateRegistration()) {
        const firstInvalid = registerForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      setButtonBusy(registerSubmit, true, registerSubmitText, "创建我的账号", "靛蓝正在落款…");

      try {
        const data = await requestJson("/api/register", {
          displayName: displayName.value.trim(),
          account: registerAccount.value.trim().toLowerCase(),
          password: registerPassword.value
        });

        account.value = data.user.account;
        password.value = "";
        registerForm.reset();
        setMode("login");
        setStatus(loginStatus, "账号已写入染谱，请使用新账号登录。");
        showToast("注册成功，现在可以登录了。");
        account.focus();
      } catch (error) {
        setStatus(registerStatus, error.message, true);
      } finally {
        setButtonBusy(registerSubmit, false, registerSubmitText, "创建我的账号", "靛蓝正在落款…");
      }
    });

    guestButton.addEventListener("click", async (event) => {
      event.preventDefault();
      guestButton.setAttribute("aria-busy", "true");
      try {
        await requestJson("/api/guest", {});
      } catch {
        // 访客入口始终可用；服务暂不可达时仍允许打开本地页面。
      }
      window.location.href = "home.html";
    });
  }

  async function setupAccountState() {
    const visitorState = document.querySelector(".visitor-state");
    const loginLink = document.querySelector(".header-login");
    if (!visitorState || !loginLink) return;

    const setIdentity = (name) => {
      const dot = document.createElement("i");
      visitorState.replaceChildren(dot, document.createTextNode(name));
    };

    const setLoginLabel = (label) => {
      Array.from(loginLink.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .forEach((node) => node.remove());
      loginLink.appendChild(document.createTextNode(label));
    };

    try {
      const response = await fetch("/api/session", {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) return;
      const session = await response.json();

      if (session.role === "user" && session.user) {
        setIdentity(`${session.user.displayName} · 已登录`);
        setLoginLabel("退出");
        loginLink.href = "#";
        loginLink.title = "退出登录";
        loginLink.addEventListener("click", async (event) => {
          event.preventDefault();
          loginLink.setAttribute("aria-busy", "true");
          try {
            await fetch("/api/logout", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: "{}"
            });
          } finally {
            window.location.href = "index.html";
          }
        });
      } else if (session.role === "guest") {
        setIdentity("访客漫游中");
      } else {
        setIdentity("尚未登录");
      }
    } catch {
      setIdentity("本地预览模式");
    }
  }

  function setupHome() {
    const header = document.getElementById("siteHeader");
    const menuButton = document.getElementById("menuButton");
    const nav = document.getElementById("mainNav");
    if (!header) return;

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

  function setupCraftStory() {
    const bookBody = document.getElementById("bookBody");
    const steps = Array.from(document.querySelectorAll(".book-step"));
    if (!bookBody || steps.length === 0) return;

    let ticking = false;

    const updateThread = () => {
      const rect = bookBody.getBoundingClientRect();
      const stitchPoint = window.innerHeight * 0.53;
      const rawProgress = ((stitchPoint - rect.top) / rect.height) * 100;
      const progress = Math.max(0, Math.min(100, rawProgress));
      bookBody.style.setProperty("--book-progress", `${progress.toFixed(2)}%`);
      ticking = false;
    };

    const requestThreadUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateThread);
    };

    window.addEventListener("scroll", requestThreadUpdate, { passive: true });
    window.addEventListener("resize", requestThreadUpdate);

    if ("IntersectionObserver" in window && !reduceMotion) {
      const stepObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            steps.forEach((step) => step.classList.remove("is-current"));
            entry.target.classList.add("is-current");
          });
        },
        {
          rootMargin: "-24% 0px -36% 0px",
          threshold: 0.08
        }
      );

      steps.forEach((step) => stepObserver.observe(step));
    } else {
      steps.forEach((step) => step.classList.add("is-current"));
    }

    window.addEventListener("viewchange", (event) => {
      if (event.detail?.viewName !== "craft") return;
      window.setTimeout(requestThreadUpdate, 80);
      window.setTimeout(requestThreadUpdate, 620);
    });

    updateThread();
  }

  function setupLegacyAtlas() {
    const atlas = document.querySelector(".atlas-layout");
    if (!atlas) return;

    const placeData = {
      zhoucheng: {
        name: "周城",
        kicker: "核心传承地 · 白族扎染",
        coordinate: "25.85°N / 100.13°E",
        lead: "苍山脚下、洱海西岸的白族村落。院落里的染缸与晾架，把扎染留在日常生活之中。",
        see: "扎花针脚、板蓝根靛缸、院落晾布",
        person: "段银开 · 白族扎染技艺代表性传承人",
        now: "家庭染坊、研学体验与文创产品并行",
        note: "先看一双手怎样把线缝进布里，再看蓝如何在空气里慢慢显出来。",
        mapX: "1%",
        mapY: "1%",
        scale: "1.08"
      },
      xizhou: {
        name: "喜洲",
        kicker: "白族聚落 · 生活图景",
        coordinate: "25.85°N / 100.10°E",
        lead: "从周城向南，苍山与洱海之间的白族院落、商道与集市，构成了理解扎染生活语境的一页。",
        see: "白族院落、照壁、传统商街与地方手艺",
        person: "地方匠人 · 院落中的家庭传承",
        now: "文化旅行与传统民居体验让手工艺被更多人看见",
        note: "不只盯着布上的花纹，也看看花纹回到何处：屋檐、衣襟与日常生活。",
        mapX: "8%",
        mapY: "-12%",
        scale: "1.32"
      },
      weishan: {
        name: "巍山",
        kicker: "山地古城 · 手艺记忆",
        coordinate: "25.23°N / 100.31°E",
        lead: "沿苍洱向南进入巍山，古城与山地村落保存着另一种节奏。扎染在这里与刺绣、织布等手艺共同构成地方记忆。",
        see: "古城街巷、白族民居与山地手工艺",
        person: "地方手艺传承者 · 家庭作坊",
        now: "古城文旅与小型手作体验延续地方技艺",
        note: "把视野从一匹布移向它所生长的土地，蓝色就有了地方的方向。",
        mapX: "-14%",
        mapY: "-19%",
        scale: "1.42"
      }
    };

    const placeOrder = ["zhoucheng", "xizhou", "weishan"];
    const markers = Array.from(document.querySelectorAll(".place-marker"));
    const placeVisual = document.getElementById("placeVisual");
    const placeCoordinate = document.getElementById("placeCoordinate");
    const placeKicker = document.getElementById("placeKicker");
    const placeName = document.getElementById("placeName");
    const placeLead = document.getElementById("placeLead");
    const placeSee = document.getElementById("placeSee");
    const placePerson = document.getElementById("placePerson");
    const placeNow = document.getElementById("placeNow");
    const placeNote = document.getElementById("placeNote");
    const routeCount = document.getElementById("routeCount");
    const routeDots = Array.from(document.querySelectorAll("#routeDots i"));
    const nextStop = document.getElementById("nextStop");
    const nextStopLabel = document.getElementById("nextStopLabel");
    const previousStop = document.getElementById("previousStop");
    const mapStage = document.getElementById("mapStage");
    const sidebar = document.getElementById("atlasSidebar");
    let currentIndex = 0;

    const renderPlace = (index, shouldFocus = true) => {
      currentIndex = (index + placeOrder.length) % placeOrder.length;
      const placeKey = placeOrder[currentIndex];
      const place = placeData[placeKey];
      const nextKey = placeOrder[(currentIndex + 1) % placeOrder.length];

      markers.forEach((marker) => {
        const active = marker.dataset.place === placeKey;
        marker.classList.toggle("is-active", active);
        marker.setAttribute("aria-pressed", String(active));
      });

      placeVisual.dataset.place = placeKey;
      placeVisual.classList.remove("is-switching");
      void placeVisual.offsetWidth;
      placeVisual.classList.add("is-switching");

      placeCoordinate.textContent = place.coordinate;
      placeKicker.textContent = place.kicker;
      placeName.textContent = place.name;
      placeLead.textContent = place.lead;
      placeSee.textContent = place.see;
      placePerson.textContent = place.person;
      placeNow.textContent = place.now;
      placeNote.textContent = place.note;
      routeCount.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(placeOrder.length).padStart(2, "0")}`;

      routeDots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === currentIndex));

      nextStopLabel.textContent =
        currentIndex === placeOrder.length - 1
          ? `回到 · ${placeData[nextKey].name}`
          : `下一站 · ${placeData[nextKey].name}`;

      if (shouldFocus && mapStage) {
        mapStage.style.setProperty("--map-x", place.mapX);
        mapStage.style.setProperty("--map-y", place.mapY);
        mapStage.style.setProperty("--map-scale", place.scale);
      }

      sidebar.classList.remove("is-updating");
      void sidebar.offsetWidth;
      sidebar.classList.add("is-updating");
    };

    markers.forEach((marker) => {
      marker.addEventListener("click", () => {
        renderPlace(placeOrder.indexOf(marker.dataset.place));
      });
    });

    nextStop.addEventListener("click", () => renderPlace(currentIndex + 1));
    previousStop.addEventListener("click", () => renderPlace(currentIndex - 1));

    window.addEventListener("viewchange", (event) => {
      if (event.detail?.viewName !== "map") return;
      renderPlace(currentIndex, false);
      window.setTimeout(() => {
        if (mapStage) {
          const place = placeData[placeOrder[currentIndex]];
          mapStage.style.setProperty("--map-x", place.mapX);
          mapStage.style.setProperty("--map-y", place.mapY);
          mapStage.style.setProperty("--map-scale", place.scale);
        }
      }, 80);
    });

    renderPlace(0);
  }

  async function setupAtlas() {
    if (!document.body.classList.contains("page-atlas")) return;

    const atlas = document.querySelector(".atlas-layout");
    const mapStage = document.getElementById("mapStage");
    const atlasViewport = document.getElementById("atlasViewport");
    const markers = Array.from(document.querySelectorAll(".place-marker"));
    const routeSegments = Array.from(document.querySelectorAll("[data-route-segment]"));
    const placeVisual = document.getElementById("placeVisual");
    const placePhoto = document.getElementById("placePhoto");
    const photoButton = document.getElementById("togglePhotoBtn");
    const placeCoordinate = document.getElementById("placeCoordinate");
    const placeKicker = document.getElementById("placeKicker");
    const placeName = document.getElementById("placeName");
    const placeLead = document.getElementById("placeLead");
    const placeSee = document.getElementById("placeSee");
    const placePerson = document.getElementById("placePerson");
    const placeNow = document.getElementById("placeNow");
    const placeNote = document.getElementById("placeNote");
    const routeCount = document.getElementById("routeCount");
    const routeDots = Array.from(document.querySelectorAll("#routeDots i"));
    const nextStop = document.getElementById("nextStop");
    const nextStopLabel = document.getElementById("nextStopLabel");
    const previousStop = document.getElementById("previousStop");
    const chartContainer = document.getElementById("chartContainer");
    const chartFallback = document.getElementById("chartFallback");
    const chartCaption = document.getElementById("chartCaption");
    const chartSource = document.getElementById("chartSource");
    const puzzleButton = document.getElementById("puzzleButton");
    const puzzleModal = document.getElementById("puzzleModal");
    const puzzlePlace = document.getElementById("puzzlePlace");
    const puzzleTitle = document.getElementById("puzzleTitle");
    const puzzleRole = puzzleModal?.querySelector(".puzzle-role");
    const puzzleDescription = document.getElementById("puzzleDescription");

    if (!atlas || !mapStage || !atlasViewport || markers.length === 0) return;

    const fallbackPlaces = [
      {
        id: "zhoucheng",
        name: "周城",
        kicker: "核心传承地 · 白族扎染",
        lead: "苍山脚下、洱海西岸的白族村落。院落里的染缸与晾架，把扎染留在日常生活之中。",
        highlight: "扎花针脚、板蓝根靛缸、院落晾布",
        person: "段银开 · 白族扎染技艺代表性传承人",
        currentState: "家庭染坊、研学体验与文创产品并行",
        note: "先看一双手怎样把线缝进布里，再看蓝如何在空气里慢慢显出来。",
        photo: "assets/zhoucheng.jpg",
        latitude: 25.85,
        longitude: 100.13,
        mapX: 53.2,
        mapY: 45.3,
        mapScale: 1.08
      },
      {
        id: "xizhou",
        name: "喜洲",
        kicker: "白族聚落 · 生活图景",
        lead: "从周城向南，苍山与洱海之间的白族院落、商道与集市，构成了理解扎染生活语境的一页。",
        highlight: "白族院落、照壁、传统商街与地方手艺",
        person: "地方匠人 · 院落中的家庭传承",
        currentState: "文化旅行与传统民居体验让手工艺被更多人看见",
        note: "推开一扇雕花木门，院子里挂着的不仅是布，也是喜洲人家的体面。",
        photo: "assets/xizhou.jpg",
        latitude: 25.72,
        longitude: 100.08,
        mapX: 40.8,
        mapY: 62.7,
        mapScale: 1.3
      },
      {
        id: "weishan",
        name: "巍山",
        kicker: "山地古城 · 手艺记忆",
        lead: "沿苍洱向南进入巍山，古城与山地村落保留着另一种节奏。扎染在这里与刺绣、织布等手艺共同构成地方记忆。",
        highlight: "古城街巷、白族民居与山地手工艺",
        person: "地方手艺传承者 · 家庭作坊",
        currentState: "古城文旅与小型手作体验延续地方技艺",
        note: "在巍山，染布不是孤立的，它和织布、挑花一起，缝进了古城的生活。",
        photo: "assets/weishan.jpg",
        latitude: 25.23,
        longitude: 100.31,
        mapX: 74.5,
        mapY: 76.6,
        mapScale: 1.3
      }
    ];

    const fallbackStats = {
      zhoucheng: {
        workers: 4000,
        workshops: 200,
        annualOutput: "待调研",
        annualOutputUnit: "万元",
        sourceNote: "本地预览数据 · 启动 npm start 后可读取数据库接口"
      },
      xizhou: {
        workers: 1200,
        workshops: 85,
        annualOutput: "待调研",
        annualOutputUnit: "万元",
        sourceNote: "本地预览数据 · 启动 npm start 后可读取数据库接口"
      },
      weishan: {
        workers: 650,
        workshops: 40,
        annualOutput: "待调研",
        annualOutputUnit: "万元",
        sourceNote: "本地预览数据 · 启动 npm start 后可读取数据库接口"
      }
    };

    let places = fallbackPlaces;
    let currentIndex = 0;
    let photoVisible = false;
    let chart = null;
    const statsCache = new Map();
    let activeMarker = null;
    let statsRequestId = 0;

    const fetchJson = async (url) => {
      const response = await fetch(url, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("地图数据暂时无法读取");
      return response.json();
    };

    const updateCamera = (place) => {
      const rect = atlasViewport.getBoundingClientRect();
      const scale = Math.max(1.12, Number(place.mapScale) || 1.2);
      const pointX = rect.width * (Number(place.mapX) / 100);
      const pointY = rect.height * (Number(place.mapY) / 100);
      const targetX = rect.width * 0.5 - pointX * scale;
      const targetY = rect.height * 0.48 - pointY * scale;
      const minX = rect.width * (1 - scale);
      const minY = rect.height * (1 - scale);
      const translateX = Math.max(minX, Math.min(0, targetX));
      const translateY = Math.max(minY, Math.min(0, targetY));

      mapStage.style.transform =
        `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale})`;
    };

    const updateRoute = (index) => {
      routeSegments.forEach((segment, segmentIndex) => {
        const length = segment.getTotalLength();
        segment.style.strokeDasharray = `${length}`;
        segment.style.strokeDashoffset = segmentIndex < index ? "0" : `${length}`;
        segment.classList.toggle("is-visible", segmentIndex < index);
      });
    };

    const renderFallbackChart = (stats) => {
      chartFallback.replaceChildren();
      const rows = [
        ["从业人数", stats.workers, "人", "#0b3863"],
        ["经营作坊", stats.workshops, "家", "#7fa596"]
      ];
      const maxValue = Math.max(stats.workers, stats.workshops, 1);

      rows.forEach(([label, value, unit, color]) => {
        const row = document.createElement("div");
        row.className = "fallback-chart-row";
        const heading = document.createElement("span");
        heading.textContent = `${label} ${Number(value).toLocaleString("zh-CN")} ${unit}`;
        const track = document.createElement("i");
        const bar = document.createElement("b");
        bar.style.width = `${Math.max(4, (value / maxValue) * 100)}%`;
        bar.style.background = color;
        track.appendChild(bar);
        row.append(heading, track);
        chartFallback.appendChild(row);
      });
      chartFallback.hidden = false;
      chartContainer.hidden = true;
    };

    const renderChart = (stats, place) => {
      chartCaption.textContent =
        `${place.name} · 从业 ${Number(stats.workers).toLocaleString("zh-CN")} 人`;
      chartSource.textContent =
        `年产值：${stats.annualOutput ?? "待调研"}${stats.annualOutput && stats.annualOutput !== "待调研" ? ` ${stats.annualOutputUnit || ""}` : ""} · ${stats.sourceNote}`;
      chartContainer.setAttribute(
        "aria-label",
        `${place.name}拥有约${stats.workers}名扎染从业者和${stats.workshops}家经营作坊`
      );

      if (!window.echarts) {
        renderFallbackChart(stats);
        return;
      }

      chartFallback.hidden = true;
      chartContainer.hidden = false;
      if (!chart) chart = window.echarts.init(chartContainer);

      chart.setOption({
        animationDuration: 900,
        grid: [
          { left: 72, right: 26, top: 16, height: 24 },
          { left: 72, right: 26, top: 70, height: 24 }
        ],
        xAxis: [
          { type: "value", gridIndex: 0, max: Math.max(stats.workers * 1.18, 1), show: false },
          { type: "value", gridIndex: 1, max: Math.max(stats.workshops * 1.18, 1), show: false }
        ],
        yAxis: [
          {
            type: "category",
            gridIndex: 0,
            data: ["从业人数"],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#607378", fontSize: 10 }
          },
          {
            type: "category",
            gridIndex: 1,
            data: ["经营作坊"],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#607378", fontSize: 10 }
          }
        ],
        series: [
          {
            type: "bar",
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: [stats.workers],
            barWidth: 14,
            itemStyle: { color: "#0b3863", borderRadius: [0, 7, 7, 0] },
            label: {
              show: true,
              position: "right",
              color: "#0b3863",
              fontSize: 11,
              formatter: ({ value }) => `${Number(value).toLocaleString("zh-CN")} 人`
            }
          },
          {
            type: "bar",
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: [stats.workshops],
            barWidth: 14,
            itemStyle: { color: "#7f9d91", borderRadius: [0, 7, 7, 0] },
            label: {
              show: true,
              position: "right",
              color: "#5b746e",
              fontSize: 11,
              formatter: ({ value }) => `${Number(value).toLocaleString("zh-CN")} 家`
            }
          }
        ]
      }, true);
      chart.resize();
    };

    const loadStats = async (place) => {
      const requestId = ++statsRequestId;
      try {
        let stats = statsCache.get(place.id);
        if (!stats) {
          stats = await fetchJson(`/api/map/stats?place=${encodeURIComponent(place.id)}`);
          statsCache.set(place.id, stats);
        }
        if (requestId !== statsRequestId) return;
        renderChart(stats, place);
      } catch {
        if (requestId !== statsRequestId) return;
        renderChart(fallbackStats[place.id] || {
          workers: 0,
          workshops: 0,
          annualOutput: "待调研",
          annualOutputUnit: "万元",
          sourceNote: "暂无可用统计数据"
        }, place);
      }
    };

    const parsePerson = (value) => {
      const [name, ...role] = String(value || "地方传承者").split("·");
      return {
        name: name.trim() || "地方传承者",
        role: role.join("·").trim() || "扎染技艺的地方传承者"
      };
    };

    const openPuzzle = () => {
      if (!puzzleModal) return;
      const place = places[currentIndex];
      const person = parsePerson(place.person);
      puzzlePlace.textContent = `${place.name} · 人物图鉴`;
      puzzleTitle.textContent = person.name;
      if (puzzleRole) puzzleRole.textContent = person.role;
      puzzleDescription.textContent =
        `${place.name}的扎染记忆，藏在针脚、靛缸与日常使用之间。${place.note}`;
      puzzleModal.hidden = false;
      document.body.classList.add("modal-open");
      puzzleModal.querySelector(".puzzle-close")?.focus();
    };

    const closePuzzle = () => {
      if (!puzzleModal) return;
      puzzleModal.hidden = true;
      document.body.classList.remove("modal-open");
      puzzleButton?.focus();
    };

    const renderPlace = (nextIndex) => {
      currentIndex = (nextIndex + places.length) % places.length;
      const place = places[currentIndex];
      const nextPlace = places[(currentIndex + 1) % places.length];
      const coordinate = `${Number(place.latitude).toFixed(2)}°N / ${Number(place.longitude).toFixed(2)}°E`;

      markers.forEach((marker) => {
        const active = marker.dataset.place === place.id;
        marker.classList.toggle("is-active", active);
        marker.setAttribute("aria-pressed", String(active));
      });

      if (activeMarker && activeMarker !== markers[currentIndex]) activeMarker.blur();
      activeMarker = markers[currentIndex] || null;

      placeVisual.dataset.place = place.id;
      placeVisual.classList.remove("is-switching");
      void placeVisual.offsetWidth;
      placeVisual.classList.add("is-switching");
      placeCoordinate.textContent = coordinate;
      placeKicker.textContent = place.kicker;
      placeName.textContent = place.name;
      placeLead.textContent = place.lead;
      placeSee.textContent = place.highlight;
      placePerson.textContent = place.person;
      placeNow.textContent = place.currentState;
      placeNote.textContent = place.note;
      routeCount.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(places.length).padStart(2, "0")}`;
      routeDots.forEach((dot, index) => dot.classList.toggle("is-active", index === currentIndex));
      nextStopLabel.textContent =
        currentIndex === places.length - 1
          ? `回到 · ${nextPlace.name}`
          : `下一站 · ${nextPlace.name}`;

      if (placePhoto) {
        placePhoto.src = place.photo;
        placePhoto.alt = `${place.name}扎染实景`;
        placePhoto.style.opacity = photoVisible ? "1" : "0";
      }
      photoButton.textContent = photoVisible ? "看手绘" : "看实景";
      photoButton.setAttribute("aria-pressed", String(photoVisible));

      updateRoute(currentIndex);
      updateCamera(place);
      loadStats(place);
    };

    markers.forEach((marker) => {
      marker.addEventListener("click", () => {
        const index = places.findIndex((place) => place.id === marker.dataset.place);
        if (index >= 0) renderPlace(index);
      });
    });

    nextStop?.addEventListener("click", () => renderPlace(currentIndex + 1));
    previousStop?.addEventListener("click", () => renderPlace(currentIndex - 1));

    photoButton?.addEventListener("click", () => {
      photoVisible = !photoVisible;
      placePhoto.style.opacity = photoVisible ? "1" : "0";
      photoButton.textContent = photoVisible ? "看手绘" : "看实景";
      photoButton.setAttribute("aria-pressed", String(photoVisible));
    });

    puzzleButton?.addEventListener("click", openPuzzle);
    puzzleModal?.querySelectorAll("[data-close-puzzle]").forEach((button) => {
      button.addEventListener("click", closePuzzle);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && puzzleModal && !puzzleModal.hidden) closePuzzle();
    });

    window.addEventListener("resize", () => {
      renderPlace(currentIndex);
      if (chart) chart.resize();
    });

    try {
      const data = await fetchJson("/api/map/places");
      if (Array.isArray(data.places) && data.places.length >= 3) {
        places = data.places;
      }
    } catch {
      // 静态预览或接口暂不可用时，继续使用内置地点数据。
    }

    renderPlace(0);
  }

  createDyeCanvas();
  setupLogin();
  setupAccountState();
  setupHome();
  setupCraftStory();
  setupAtlas();
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