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

    const requestedPlace = new URLSearchParams(window.location.search).get("place");
    const requestedIndex = places.findIndex((place) => place.id === requestedPlace);
    renderPlace(requestedIndex >= 0 ? requestedIndex : 0);
  }

     async function setupPlaceDetail() {
    if (!document.body.classList.contains("page-place-detail")) return;

    const detailData = {
      zhoucheng: {
        name: "周城",
        kicker: "核心传承地 · 白族扎染",
        lead: "苍山脚下、洱海西岸的白族村落。这里不仅是最大的白族自然村，更是名副其实的“白族扎染之乡”。",
        note: "周城扎染的历史可追溯至明末清初，世代相传。这里的白族妇女几乎人人都会扎花，染布不仅是生计，更是融入血脉的生活方式。",
        highlight: "非遗博物馆、原生态染缸、白族传统院落、蓝白交错的大型晾布架",
        currentState: "目前周城已形成集非遗保护、研学体验、文创开发于一体的产业链，年产值超1.6亿元，但依然保留着传统的家庭手工作坊模式。",
        master: "段银开（国家级）、张翰敏（州级）",
        pattern: [
          { img: "assets/pattern-butterfly.jpg", title: "蝴蝶纹", desc: "源自白族“人类化蝶”的创世神话，寓意生命轮回与美好爱情。针脚细密，常作为扎染中的主花。" },
          { img: "assets/pattern-plum.jpg", title: "梅花纹", desc: "象征白族人在恶劣环境中的坚韧品格。大理风大，梅花迎风傲雪，常被缝扎在衣襟与袖口。" },
          { img: "assets/pattern-coin.jpg", title: "铜钱纹", desc: "寄托招财进宝的朴素愿望。铜钱纹常出现在商贾人家的布匹中，隐喻财源广进。" }
        ],
        quote: "“白族女儿会说话就会唱歌，会拿针就会扎花。”",
        storyTitle: "家家有染缸的传奇",
        storyDesc: "明末清初起，周城人便在茶马古道的节点上经营着扎染。这里没有单一的工厂，而是“家家有染缸，户户有织机”。推开一扇斑驳的木门，天井里必定是蓝白交错。这里的扎染不仅是养家糊口的手艺，更是白族女性从少女到暮年的生命刻度，她们将蝴蝶与山水的想象，缝进了一块块布里。",
        storyImg: "assets/zhoucheng-story.jpg",
        tour: [
          { text: "璞真白族扎染博物馆：了解扎染历史", img: "assets/museum.jpg" },
          { text: "亲手体验：在传承人指导下扎花、浸染一块方巾", img: "assets/data-study.jpg" },
          { text: "逛古戏台与村落", img: "assets/zhoucheng-2.jpg" },
          { text: "品尝白族土八碗", img: "assets/zhoucheng-3.jpg" }
        ],
        photos: [
          "assets/zhoucheng.jpg",
          "assets/zhoucheng-2.jpg",
          "assets/zhoucheng-3.jpg"
        ],
        tourImg: "assets/zhoucheng.jpg",
        exploreData: {
          master: "<p>段银开，国家级非遗传承人，自幼随长辈学习扎染，精通全套72道扎染工序，创办璞真染坊并扩建为博物馆，带动上千名白族妇女就业。</p><p style='margin-top: 10px;'>张翰敏，州级传承人，创立“蓝续”品牌，将现代审美与国际视野带入传统扎染，让周城扎染登上了国际时装周。</p>",
          pattern: [
            { img: "assets/pattern-butterfly.jpg", title: "蝴蝶纹", desc: "源自白族“人类化蝶”的创世神话，寓意生命轮回与美好爱情。在扎染中，蝴蝶纹常作为主花，针脚细密，象征着白族人对自然与生命的敬畏。" },
            { img: "assets/pattern-plum.jpg", title: "梅花纹", desc: "象征白族人在恶劣环境中的坚韧品格。大理风大，梅花迎风傲雪，常被缝扎在衣襟与袖口，寄托着对美好生活的向往与不屈的精神。" },
            { img: "assets/pattern-coin.jpg", title: "铜钱纹", desc: "寄托了招财进宝的朴素愿望。喜洲商帮走南闯北，铜钱纹常在商贾人家的布匹中出现，隐喻财源广进，是世俗生活与手工艺术的完美结合。" }
          ],
          see: [
            { img: "assets/museum.jpg", title: "璞真白族扎染博物馆", desc: "璞真白族扎染博物馆位于周城村，是白族扎染的核心展示与传承地。馆内设有扎染原料展示、古法靛蓝染缸、成品布艺展厅等多个区域，系统呈现板蓝根种植、发酵制靛、扎花缝扎、浸染氧化的完整工艺流程。博物馆以 ‘璞真’ 为名，寓意还原本真、守护匠心，既是游客了解白族扎染的第一站，也是国家级非遗白族扎染技艺活态传承的重要场所。" },
            { img: "assets/indigo-vat.jpg", title: "原生态染缸", desc: "周城原生态染缸多用老木桶，以板蓝根发酵的土靛为染料，染液呈深青墨绿色。这些染缸常年养护、世代延续，不能断 ‘活靛’，是白族扎染的灵魂所在。白布入缸浸染后捞出，接触空气氧化，才慢慢呈现标志性的 ‘大理蓝’，需反复浸染多次颜色才沉稳厚重。周城素有 ‘家家有染缸、户户扎花’ 之称，染缸正是周城扎染工坊最核心、最原生态的器具。" },
            { img: "assets/zhoucheng-yard.jpg", title: "传统院落与晾布架", desc: "周城白族民居院落中常设竹木晾布架，是扎染布匹完成浸染、漂洗后自然风干固色的场所。刚出锅的蓝白扎染布垂挂架上，借助苍山来风与日光自然晾干，氧化定型。蓝布随风轻扬，与白墙、青瓦、彩绘照壁相映成趣，既是生产工序的一环，也是周城 ‘家家有染缸、户户扎花’ 活态传承最经典的画面。" }
          ],
          now: "周城现拥有扎染经营户200多家，从业人员超4000人，年产值超1.6亿元。通过“非遗+研学+文创”的模式，传统手艺不仅没有消亡，反而成为了带动地方经济和乡村振兴的支柱产业，但依然保留着家庭作坊的活态传承。"
        }
      },
                xizhou: {
        name: "喜洲",
        kicker: "白族聚落 · 生活图景",
        lead: "从周城向南，苍山与洱海之间的白族院落、商道与集市，构成了理解扎染生活语境的一页。",
        note: "喜洲是大理白族民居保存最完好的地方。旧时喜洲商帮走南闯北，也将扎染带向了更远的地方，这里的扎染往往与精美的木雕、照壁结合。",
        highlight: "严家大院、白族三坊一照壁、四方街、古院落晾布",
        currentState: "依托古镇文旅，喜洲的扎染作坊多向“非遗+民宿”、“非遗+研学”转型，让游客在古院落中体验扎染。",
        master: "喜洲院落染坊传承群体",
        pattern: [
          { img: "assets/pattern-butterfly.jpg", title: "蝴蝶纹", desc: "源自白族“人类化蝶”的创世神话，寓意生命轮回与美好爱情。在扎染中，蝴蝶纹常作为主花，针脚细密，象征着白族人对自然与生命的敬畏。" },
          { img: "assets/pattern-plum.jpg", title: "菊花纹", desc: "受白族传统建筑影响，喜洲的菊花纹常与当地商帮文化结合，构图严谨对称，寓意富贵与长寿，体现了白族人“中正平和”的审美意趣。" },
          { img: "assets/pattern-jihe.jpg", title: "几何连续纹", desc: "几何连续纹常出现在喜洲白族院落的照壁和门窗上，扎染布上的几何图案与白族木雕相呼应，让布面像一段不断延伸的生活叙事。" }
        ],
        quote: "“大理三千户，户户有染缸。”",
        storyTitle: "商帮走出的雅致光影",
        storyDesc: "喜洲是旧时白族商帮的聚集地。走南闯北的马帮不仅带回了财富，也带回了对生活品味的讲究。这里的扎染，少了些粗犷，多了一份与白族木雕、照壁相呼应的规整与雅致。在严家大院的飞檐下，晾晒的扎染布仿佛也沾染了书香气，成为连接传统建筑与生活美学的桥梁。",
        storyImg: "assets/xizhou-story.jpg",
        tour: [
          { text: "逛严家大院看白族建筑", img: "assets/yanjia.jpg" },
          { text: "在四方街吃喜洲粑粑", img: "assets/baba.jpg" },
          { text: "寻找古院落里的巨型晾布架", img: "assets/juxing.jpg" },
          { text: "在院落作坊体验一次扎染", img: "assets/tiyan.jpg" }
        ],
        photos: ["assets/xizhou.jpg", "assets/xizhou-2.jpg", "assets/xizhou-3.jpg"],
        tourImg: "assets/xizhou.jpg",
        exploreData: {
          master: "喜洲的扎染传承多以家族院落为单位。老手艺人们将扎染与白族木雕、照壁艺术相融合。他们开设院落作坊，让游客在百年老宅的天井里体验扎染，在保留传统技法的同时，让古老手艺在现代文旅中焕发了新的生机。",
          see: [
            { img: "assets/yanjia.jpg", title: "严家大院", desc: "严家大院是喜洲白族民居的典范，始建于清末，采用三坊一照壁、四合五天井格局，木雕彩绘精致，是当年喜洲商帮的代表宅院。" },
            { img: "assets/sifang.jpg", title: "四方街", desc: "四方街是喜洲古镇的商贸中心，四条古街在此交汇，广场中央立有名题坊。这里曾是茶马古道上重要的布匹集市，古时周边的染衣巷出产的白族扎染布，都汇集到四方街交易。" }
          ],
          now: "依托喜洲古镇的文旅优势，这里的扎染作坊多向“非遗+民宿”、“非遗+研学”转型。扎染不再是单一的布料买卖，而是成为游客深度体验白族文化、留住乡愁的重要载体。"
        }
      },
      weishan: {
        name: "巍山",
        kicker: "山地古城 · 手艺记忆",
        lead: "沿苍洱向南进入巍山，古城与山地村落保留着另一种节奏。扎染在这里与刺绣、织布等手艺共同构成地方记忆。",
        note: "巍山是南诏国的发祥地。这里的扎染融合了彝族等少数民族的审美，与传统的挑花、刺绣紧密结合，形成了独特的山地风格。",
        highlight: "南诏古街、拱辰楼、传统手工染缸、彝族刺绣",
        currentState: "巍山通过非遗街区建设，将传统扎染与古城旅游深度绑定，传统家庭作坊焕发了新的生机。",
        master: "熊文杰（省级）、熊天艳（县级）",
         pattern: [
        { img: "assets/weishan-sun.jpg", title: "太阳纹", desc: "象征光明与生机，彝族图腾常见元素。" },
        { img: "assets/weishan-flower.jpg", title: "八角花", desc: "彝族服饰中常见的吉祥图案。" },
        { img: "assets/weishan-hui.jpg", title: "回纹", desc: "寓意连绵不断，结合挑花与刺绣。" }
      ],
        quote: "“一根面扯出千年史，一尺布染出南诏风。”",
        storyTitle: "南诏古巷的革故鼎新",
        storyDesc: "巍山的扎染，融合了彝族的图腾与审美，带着一股山地民族的坚韧与厚重。如今，年轻一代的传承人从城市返乡，在古城的老街上开起新式体验馆。他们改良了植物配方，丰富了色谱，让曾经只在深闺与山地间流传的扎染，成为了南诏古街上最鲜活的文化符号。",
        storyImg: "assets/weishan-story.jpg",
        tour: [
          { text: "沿拱辰楼走进古城", img: "assets/gongchen.jpg" },
          { text: "逛南诏古街", img: "assets/nanzhao.jpg" },
          { text: "找一家家庭作坊看传统染缸", img: "assets/chuantong.jpg" },
          { text: "尝一碗地道的一根面", img: "assets/mian.jpg" }
        ],
        photos: [
          "assets/weishan.jpg",
          "assets/weishan-2.jpg",
          "assets/weishan-3.jpg"
        ],
        tourImg: "assets/weishan.jpg",
        exploreData: {
          master: "熊文杰，巍山扎染技艺省级代表性传承人。他结合彝族文化创新了多种染布技法，发明了扎花机，大大提高了产能，创立了兴巍工艺厂，产品远销海外。女儿熊天艳返乡接班，在古城开设体验馆，让巍山扎染成为当地文旅的新名片。",
          pattern: "巍山是彝族回族自治县，这里的扎染融合了自然花草纹与彝族图腾。太阳纹象征光明与生机；八角花是彝族服饰中常见的吉祥图案；回纹则寓意连绵不断。结合传统的挑花、刺绣，形成了独特的山地风格。",
          see: [
            { img: "assets/nanzhao.jpg", title: "南诏古街", desc: "南诏古街是巍山古城中轴线，也是云南第一条 “中国历史文化名街”，青石板路面绵延悠长，两侧保留明清土木古民居。这里自古布匹、手作店铺林立，彝族扎染作坊散落街巷深处，千百年来，扎染技艺就在这条古街上代代流转。" },
            { img: "assets/gongchen.jpg", title: "拱辰楼", desc: "拱辰楼是巍山古城地标，始建于明洪武二十三年，为重檐歇山式城楼，高悬 “魁雄六诏”“万里瞻天” 两块匾额，见证南诏故地千年风云。登楼可俯瞰整条南诏古街与古城民居，是巍山扎染文化的历史背景象征。" },
            { img: "assets/shougong.jpg", title: "传统家庭染缸", desc: "巍山彝族扎染以家庭染坊为传承载体，老式木桶染缸就地养靛。除板蓝根蓝靛之外，还会取用麻栗壳、黑头草、黄栗树皮等多种山野植物熬汁，实现特色彩染。" }
          ],
          now: "巍山通过非遗街区建设，将传统扎染与古城旅游深度绑定，让游客在逛古城的同时，能够亲手体验扎染。传统家庭作坊与现代文旅的结合，让古老的南诏技艺焕发了新的生机。"
        }
      }
    };

    const keys = Object.keys(detailData);
    let places = keys.map((id) => ({ id, ...detailData[id] }));
    const requested = new URLSearchParams(window.location.search).get("place");
    let index = Math.max(0, keys.indexOf(requested || "zhoucheng"));

    try {
      const response = await fetch("/api/map/places", {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload.places) && payload.places.length >= 3) {
          places = payload.places.map((apiPlace) => {
            const localPlace = detailData[apiPlace.id] || {};
            return {
              ...apiPlace,
              ...localPlace, // 保证本地故事、图片不丢失
              exploreData: localPlace.exploreData || apiPlace.exploreData
            };
          });
          const apiIndex = places.findIndex((place) => place.id === requested);
          index = apiIndex >= 0 ? apiIndex : 0;
        }
      }
    } catch {
      // 静态预览
    }

    // ⚠️ 关键：先把 place 实例化，后面所有的代码才能使用它！
    const place = places[index];
    const previous = places[(index - 1 + places.length) % places.length];
    const next = places[(index + 1) % places.length];

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    window.currentPlaceData = place;
    window.currentPatternData = Array.isArray(place.pattern)
      ? place.pattern
      : (Array.isArray(place.exploreData?.pattern) ? place.exploreData.pattern : []);

    // --- 1. 基础信息渲染 ---
    document.title = `${place.name}地方手记 | 蓝白之境`;
    document.body.dataset.place = place.id;
    setText("detailKicker", place.kicker || "");
    setText("detailName", place.name || "");
    setText("detailLead", place.lead || "");
    setText("detailMaster", place.master || "");
    setText("detailPattern", place.pattern ? (Array.isArray(place.pattern) ? "特色纹样" : place.pattern) : "");
    setText("detailCaption", `云南大理 · ${place.name || "地点"}扎染文化现场`);
    setText("detailMarginName", place.name || "");
    setText("placeQuote", place.quote || "");
    setText("detailNote", place.note || "");
    setText("placeMaster", place.master || "");
        // 自动提取纹样名称
    let patternDisplay = place.pattern;
    if (Array.isArray(place.pattern)) {
      patternDisplay = place.pattern.map(p => p.title).join('、');
    }
    setText("placePattern", patternDisplay || "特色纹样");
    setText("detailSee", place.highlight || "");
    setText("detailNow", place.currentState || "");

    if (!Array.isArray(place.tour)) {
      setText("placeTour", place.tour || "");
    }

    // --- 2. 左侧故事区块渲染 ---
    setText("detailStoryTitle", place.storyTitle || "地方故事");
    setText("detailStoryDesc", place.storyDesc || "暂无故事。");
    const detailStoryImg = document.getElementById("detailStoryImg");
    if (detailStoryImg && place.storyImg) {
      detailStoryImg.src = place.storyImg;
      detailStoryImg.alt = `${place.name}故事配图`;
    }

    // --- 3. 轮播图片逻辑 ---
    let currentPhotoIndex = 0;
    let currentPhotos = Array.isArray(place.photos) && place.photos.length > 0
      ? place.photos : [place.photo || "assets/zhoucheng.jpg"];

    const detailPhoto = document.getElementById("detailPhoto");
    const tourImage = document.getElementById("placeTourImg");
    const photoPrevBtn = document.getElementById("photoPrevBtn");
    const photoNextBtn = document.getElementById("photoNextBtn");
    const detailIndexEl = document.getElementById("detailIndex");

    const updatePhoto = () => {
      if (!detailPhoto) return;
      detailPhoto.src = currentPhotos[currentPhotoIndex];
      detailPhoto.alt = `${place.name}实景 ${currentPhotoIndex + 1}`;
      if (detailIndexEl) detailIndexEl.textContent = `${currentPhotoIndex + 1} / ${currentPhotos.length}`;

      if (currentPhotos.length <= 1) {
        if (photoPrevBtn) photoPrevBtn.style.display = "none";
        if (photoNextBtn) photoNextBtn.style.display = "none";
      } else {
        if (photoPrevBtn) photoPrevBtn.style.display = "flex";
        if (photoNextBtn) photoNextBtn.style.display = "flex";
      }
    };

    if (photoPrevBtn) {
      photoPrevBtn.onclick = (e) => {
        e.preventDefault();
        currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
        updatePhoto();
      };
    }
    if (photoNextBtn) {
      photoNextBtn.onclick = (e) => {
        e.preventDefault();
        currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
        updatePhoto();
      };
    }
    updatePhoto();

    if (tourImage) {
      tourImage.src = place.tourImg || place.photo || "assets/zhoucheng.jpg";
    }

    // --- 4. 游览指南打卡清单 ---
    const checklistContainer = document.getElementById("tourChecklist");
    const tourPhotoEmpty = document.getElementById("tourPhotoEmpty");
    const tourPhotoReveal = document.getElementById("tourPhotoReveal");
    const tourAchievement = document.getElementById("tourAchievement");

    if (checklistContainer && Array.isArray(place.tour)) {
      checklistContainer.innerHTML = "";
      if (tourPhotoEmpty) tourPhotoEmpty.style.display = "flex";
      if (tourPhotoReveal) tourPhotoReveal.style.display = "none";
      if (tourAchievement) tourAchievement.style.display = "none";

      place.tour.forEach((item, idx) => {
        const div = document.createElement("div");
        div.className = "tour-check-item";
        const textStr = typeof item === 'string' ? item : item.text;
        const imgUrl = typeof item === 'string' ? (place.photo || "assets/zhoucheng.jpg") : item.img;

        div.innerHTML = `
          <span class="check-icon">✓</span>
          <span class="check-num">0${idx + 1}</span>
          <span class="check-text">${textStr}</span>
        `;

        div.addEventListener("click", () => {
          div.classList.toggle("is-done");

          if (div.classList.contains("is-done")) {
            if (tourPhotoEmpty) tourPhotoEmpty.style.display = "none";
            if (tourPhotoReveal && imgUrl) {
              tourPhotoReveal.src = imgUrl;
              tourPhotoReveal.style.display = "block";
              tourPhotoReveal.style.animation = "none";
              tourPhotoReveal.offsetHeight;
              tourPhotoReveal.style.animation = "fadeIn 0.5s ease forwards";
            }
          } else {
            const anyDone = Array.from(checklistContainer.children).some(child => child.classList.contains("is-done"));
            if (!anyDone) {
              if (tourPhotoEmpty) tourPhotoEmpty.style.display = "flex";
              if (tourPhotoReveal) tourPhotoReveal.style.display = "none";
            }
          }

          const allDone = Array.from(checklistContainer.children).every(child => child.classList.contains("is-done"));
          if (allDone) {
            window.setTimeout(() => {
              if (tourPhotoReveal) tourPhotoReveal.style.display = "none";
              const placeNameEl = document.getElementById("achievementPlace");
              if (placeNameEl) placeNameEl.textContent = place.name;
              if (tourAchievement) tourAchievement.style.display = "flex";
            }, 600);
          } else {
            if (tourAchievement) tourAchievement.style.display = "none";
            if (tourPhotoReveal && div.classList.contains("is-done")) {
               tourPhotoReveal.style.display = "block";
            }
          }
        });
        checklistContainer.appendChild(div);
      });
    }

    // --- 5. 植物染氧化交互模拟器 ---
    const oxidationSlider = document.getElementById("oxidationSlider");
    const dyeClothSim = document.getElementById("dyeClothSim");
    const dyeStatusText = document.getElementById("dyeStatusText");

    if (oxidationSlider && dyeClothSim && dyeStatusText) {
      oxidationSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        const r = Math.round(170 + (11 - 170) * (val / 100));
        const g = Math.round(183 + (56 - 183) * (val / 100));
        const b = Math.round(127 + (98 - 127) * (val / 100));
        const brightness = 100 - (val * 0.1);

        dyeClothSim.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        dyeClothSim.style.filter = `brightness(${brightness}%)`;

        if (val < 20) dyeStatusText.textContent = "黄绿色 · 湿润";
        else if (val < 60) dyeStatusText.textContent = "青蓝色 · 氧化中";
        else if (val < 90) dyeStatusText.textContent = "深蓝色 · 渐干";
        else dyeStatusText.textContent = "靛蓝色 · 固色完成";
      });
      oxidationSlider.value = 0;
      oxidationSlider.dispatchEvent(new Event('input'));
    }

    // --- 6. 纹样卡片翻转 ---
    document.querySelectorAll('.flip-card').forEach(card => {
      card.onclick = function() {
        this.classList.toggle('is-flipped');
      };
    });

        // --- 7. 产业数据 ECharts 图表渲染与卡片点击弹窗 ---
    window.refreshIndustryChart = function() {
      const chartDom = document.getElementById('industryChart');
      if (!chartDom || !window.echarts) return;

      // 核心防错：如果容器隐藏时宽度为 0，则延迟执行
      if (chartDom.offsetWidth === 0) {
        setTimeout(window.refreshIndustryChart, 100);
        return;
      }

      const existingChart = window.echarts.getInstanceByDom(chartDom);
      if (existingChart) existingChart.dispose();

      const chart = window.echarts.init(chartDom);
      const placeId = window.currentPlaceData ? window.currentPlaceData.id : 'zhoucheng';

      let mockData = [];
      if (placeId === 'zhoucheng') mockData = [3.2, 5.8, 8.5, 12.1, 18.5];
      else if (placeId === 'xizhou') mockData = [1.5, 2.8, 4.1, 6.5, 9.8];
      else mockData = [0.5, 1.2, 2.8, 4.5, 6.2];

      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: ['2019', '2020', '2021', '2022', '2023'], axisLine: { lineStyle: { color: 'rgba(13, 57, 89, 0.2)' } }, axisLabel: { color: '#6f8184', fontSize: 12 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: 'rgba(13, 57, 89, 0.1)' } }, axisLabel: { color: '#6f8184', fontSize: 12 } },
        series: [{
          name: '研学人次', type: 'line', smooth: true, symbolSize: 6, data: mockData,
          itemStyle: { color: '#0b3863' }, lineStyle: { width: 3, color: '#24648e' },
          areaStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(36, 100, 142, 0.3)' }, { offset: 1, color: 'rgba(36, 100, 142, 0)' }]) }
        }]
      });
    };

    // 初始尝试渲染一次
    setTimeout(window.refreshIndustryChart, 300);

    // 数据卡片填充
    setText("detailWorkers", Number(place.id === "zhoucheng" ? 4000 : place.id === "xizhou" ? 1200 : 650).toLocaleString("zh-CN"));
    setText("detailWorkshops", Number(place.id === "zhoucheng" ? 200 : place.id === "xizhou" ? 85 : 40).toLocaleString("zh-CN"));
    setText("detailOutput", place.id === "zhoucheng" ? "1.6" : place.id === "xizhou" ? "0.8" : "0.3");
    setText("detailOutputUnit", "亿元");
    setText("detailSourceNote", "数据口径：本地预览数据 · 启动 npm start 后可读取数据库接口");

        // 卡片点击弹窗图表逻辑
    window.showDataModal = function(type) {
      const modal = document.getElementById("dataModal");
      const chartDom = document.getElementById("dataModalChart");
      const titleEl = document.getElementById("dataModalTitle");
      const textEl = document.getElementById("dataModalText");
      const kickerEl = document.getElementById("dataModalKicker");

      if (!modal || !window.echarts) return;

      const placeId = window.currentPlaceData?.id || 'zhoucheng';
      const placeName = window.currentPlaceData?.name || "周城";
      kickerEl.textContent = `${placeName} · 产业深度观察`;
      modal.hidden = false;
      document.body.classList.add("modal-open");

      const existingChart = window.echarts.getInstanceByDom(chartDom);
      if (existingChart) existingChart.dispose();
      const chart = window.echarts.init(chartDom);

      if (type === 'workers') {
        titleEl.textContent = "从业人数与结构";

        if (placeId === 'zhoucheng') {
          textEl.innerHTML = `<strong>周城观察：</strong>周城拥有超 4000 名扎染从业人员。这里打破了传统的家族传授限制，形成了“老中青”三代同堂的传承梯队。大量白族妇女实现了“家门口就业”，扎染真正成为了周城乡村振兴的支柱。`;
          chart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%' },
            series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
              data: [
                { value: 45, name: '扎花女工', itemStyle: { color: '#0b3863' } },
                { value: 30, name: '浸染与晾晒', itemStyle: { color: '#24648e' } },
                { value: 15, name: '设计与文创', itemStyle: { color: '#a9b784' } },
                { value: 10, name: '研学讲解', itemStyle: { color: '#7f9d91' } }
              ]
            }]
          });
        } else if (placeId === 'xizhou') {
          textEl.innerHTML = `<strong>喜洲观察：</strong>喜洲约有 1200 名从业者，他们多依托于白族传统院落。这里的从业者不仅是手艺人，更是“建筑美学的守护者”，他们将扎染与木雕、照壁结合，让扎染成为了喜洲文旅体验的重要一环。`;
          chart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%' },
            series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
              data: [
                { value: 60, name: '院落体验指导', itemStyle: { color: '#24648e' } },
                { value: 40, name: '文创布匹制作', itemStyle: { color: '#a9b784' } }
              ]
            }]
          });
        } else {
          textEl.innerHTML = `<strong>巍山观察：</strong>巍山约有 650 名核心从业者。这里的扎染从业者多为彝族家庭作坊，他们保留了独特的“豌豆扎”等山地技法，结合刺绣与挑花，从业人数虽少，但技艺的独特性极高。`;
          chart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%' },
            series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
              data: [
                { value: 50, name: '传统家庭染坊', itemStyle: { color: '#0b3863' } },
                { value: 30, name: '古城体验馆', itemStyle: { color: '#24648e' } },
                { value: 20, name: '手工艺合作社', itemStyle: { color: '#7f9d91' } }
              ]
            }]
          });
        }
      } else if (type === 'workshops') {
        titleEl.textContent = "经营作坊与模式";

        if (placeId === 'zhoucheng') {
          textEl.innerHTML = `<strong>周城观察：</strong>周城拥有 200 多家经营作坊，形成了“前店后厂”、“非遗博物馆”、“高端定制”等多种业态。从家庭小作坊到现代化染坊，这里保留了最完整的活态传承，是扎染商业化最成熟的地区。`;
          chart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['家庭小作坊', '研学体验坊', '规模染坊', '品牌文创店'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [120, 40, 20, 20], itemStyle: { color: '#24648e', borderRadius: [4, 4, 0, 0] } }]
          });
        } else if (placeId === 'xizhou') {
          textEl.innerHTML = `<strong>喜洲观察：</strong>喜洲的 85 家作坊以“院落民宿+非遗体验”为主。这里的作坊大多隐藏在百年老宅中，比起大批量生产，他们更注重提供深度的文化体验，将扎染融入白族生活美学。`;
          chart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['院落体验坊', '民宿结合店', '传统家庭染坊'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [45, 25, 15], itemStyle: { color: '#7f9d91', borderRadius: [4, 4, 0, 0] } }]
          });
        } else {
          textEl.innerHTML = `<strong>巍山观察：</strong>巍山的 40 家作坊以古城内的传统手工作坊为主，规模较小但极具民族特色。这些作坊依托南诏古街，将彝族文化元素深深烙印在每一件扎染制品中。`;
          chart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['古城传统作坊', '新式体验馆', '综合工艺厂'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [25, 10, 5], itemStyle: { color: '#a9b784', borderRadius: [4, 4, 0, 0] } }]
          });
        }
      } else if (type === 'output') {
        titleEl.textContent = "年产值与文旅转化";

        if (placeId === 'zhoucheng') {
          textEl.innerHTML = `<strong>周城观察：</strong>周城年产值高达 1.6 亿元！其中，研学体验与文旅服务的收入已经超过了单纯的布料销售，占到了 45%。扎染已经成为带动地方经济、实现乡村振兴的超级引擎。`;
          chart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%' },
            series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
              data: [
                { value: 40, name: '布料销售', itemStyle: { color: '#0b3863' } },
                { value: 45, name: '研学文旅', itemStyle: { color: '#24648e' } },
                { value: 15, name: '文创衍生', itemStyle: { color: '#a9b784' } }
              ]
            }]
          });
        } else if (placeId === 'xizhou') {
          textEl.innerHTML = `<strong>喜洲观察：</strong>喜洲的产值主要来源于“高端民宿+扎染体验”的复合型消费。虽然数据仍在进一步统计中，但游客在这里愿意为“沉浸式体验”和“古院落审美”付出更高的客单价，产值转化极具潜力。`;
          chart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%' },
            series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
              data: [
                { value: 60, name: '民宿联动体验', itemStyle: { color: '#24648e' } },
                { value: 25, name: '特色文创', itemStyle: { color: '#a9b784' } },
                { value: 15, name: '传统布匹', itemStyle: { color: '#7f9d91' } }
              ]
            }]
          });
        } else {
          textEl.innerHTML = `<strong>巍山观察：</strong>巍山正通过“非遗街区”的建设，将扎染与古城旅游深度绑定。虽然目前的年产值规模还在爬坡期，但家庭手工作坊的零售额与游客体验消费正逐年上升。`;
          chart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%' },
            series: [{ type: 'pie', radius: ['40%', '70%'], itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
              data: [
                { value: 50, name: '古城门店销售', itemStyle: { color: '#0b3863' } },
                { value: 30, name: '手作体验收费', itemStyle: { color: '#a9b784' } },
                { value: 20, name: '外地批发订单', itemStyle: { color: '#7f9d91' } }
              ]
            }]
          });
        }
      }
    };

    window.closeDataModal = function() {
      const modal = document.getElementById("dataModal");
      if (modal) modal.hidden = true;
      document.body.classList.remove("modal-open");
    };

    window.addEventListener("resize", () => {
      const chartDom = document.getElementById('industryChart');
      if (chartDom && window.echarts) {
        const chart = window.echarts.getInstanceByDom(chartDom);
        if (chart) chart.resize();
      }
    });
    // --- 8. 底部地图链接与上一处/下一处 ---
    const detailMapLink = document.getElementById("detailMapLink");
    const detailBackMap = document.getElementById("detailBackMap");
    const mapUrl = `map.html?place=${encodeURIComponent(place.id)}`;
    if (detailMapLink) detailMapLink.href = mapUrl;
    if (detailBackMap) detailBackMap.href = mapUrl;

    const previousLink = document.getElementById("detailPrevious");
    const nextLink = document.getElementById("detailNext");
    if (previousLink) {
      previousLink.href = `place.html?place=${encodeURIComponent(previous.id)}`;
      previousLink.querySelector("strong").textContent = previous.name;
    }
    if (nextLink) {
      nextLink.href = `place.html?place=${encodeURIComponent(next.id)}`;
      nextLink.querySelector("strong").textContent = next.name;
    }
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
    const placeGeo = document.getElementById("placeGeo");
    const placeLandmark = document.getElementById("placeLandmark");
    const placeColor = document.getElementById("placeColor");
    const placeLead = document.getElementById("placeLead");
    const placeMaster = document.getElementById("placeMaster");
    const placePattern = document.getElementById("placePattern");
    const placeQuote = document.getElementById("placeQuote");
    const placeDetailLink = document.getElementById("placeDetailLink");
    const routeCount = document.getElementById("routeCount");
    const routeDots = Array.from(document.querySelectorAll("#routeDots i"));
    const nextStop = document.getElementById("nextStop");
    const nextStopLabel = document.getElementById("nextStopLabel");
    const previousStop = document.getElementById("previousStop");
    const chartContainer = document.getElementById("chartContainer");
    const chartFallback = document.getElementById("chartFallback");
    const chartCaption = document.getElementById("chartCaption");
    const chartSource = document.getElementById("chartSource");
    const sidebarTabs = Array.from(document.querySelectorAll("[data-map-tab]"));
    const sidebarPanels = Array.from(document.querySelectorAll("[data-map-panel]"));
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
        master: "段银开、张翰敏",
        pattern: [
          { img: "assets/pattern-butterfly.jpg", title: "蝴蝶纹", desc: "源自白族“人类化蝶”的创世神话，寓意生命轮回与美好爱情。" },
          { img: "assets/pattern-plum.jpg", title: "梅花纹", desc: "象征白族人在恶劣环境中的坚韧品格，也寄托对美好生活的向往。" },
          { img: "assets/pattern-coin.jpg", title: "铜钱纹", desc: "寄托招财进宝的朴素愿望，常见于商贾人家的布匹纹样。" }
        ],
        persons: [
          {
            name: "段银开",
            role: "国家级代表性传承人",
            img: "assets/person-duanyinkai.jpg",
            desc: "段银开，国家级非物质文化遗产白族扎染技艺代表性传承人。她自幼随长辈学习扎染，精通全套72道扎染工序。1999年创办璞真染坊，后扩建为博物馆。她打破了“传内不传外”的规矩，广收学徒，带动周边上千名白族妇女就业。"
          },
          {
            name: "张翰敏",
            role: "州级代表性传承人",
            img: "assets/person-zhanghanmin.jpg",
            desc: "张翰敏，白族扎染州级代表性传承人。她辞去北京的高薪工作回到家乡，创立了“蓝续”品牌。她将现代审美与国际视野带入传统扎染，开发出数百种符合现代人审美的文创产品，并让周城扎染登上了国际时装周，让世界看到了大理的蓝。"
          }
        ],
        quote: "白族女儿会说话就会唱歌，会走路就会跳舞。",
        tour: "走进院落染坊看扎花与晾布，亲手染一块方巾；沿村巷走到古戏台，看蓝布怎样回到日常生活。",
        tourImg: "assets/zhoucheng.jpg",
        photo: "assets/zhoucheng.jpg",
        // 👇 修改了这里 👇
        geoInfo: [
          { img: "assets/地理风光.jpg", text: "周城村隶属于喜洲镇，西枕苍山云弄峰，东临洱海，北邻蝴蝶泉，霞移溪从苍山奔流而下穿村而过，是苍山洱海之间得天独厚的白族村落。依山傍湖的地理环境，为板蓝根生长、古法制靛提供了优越条件。村内石板巷道交错纵横，溪水沿街流淌，白墙青瓦的民居连片铺展，远山、湖水、古村相融，这份山水滋养，正是白族扎染技艺在此扎根千年的自然根基。" }
        ],
        landmarks: [
          { img: "assets/museum.jpg", text: "璞真白族扎染博物馆坐落于大理喜洲镇周城村，是白族扎染技艺国家级非物质文化遗产的核心展示与传承基地，也是了解大理扎染文化的第一站。馆内设原料与工艺展区，展示板蓝根、蓝靛泥、土靛发酵过程及扎花用的线、针、夹板等工具，完整呈现从种蓝、制靛、扎花、浸染到氧化固色的古法流程；保留原生态老木桶染缸，游客可现场观看匠人浸染、氧化、漂洗的真实操作；成品布艺展厅陈列桌布、围巾、壁挂、服饰等扎染作品，集中展示梅花纹、铜钱纹、蝴蝶纹等白族经典纹样；体验互动区则由匠人指导参观者亲手完成捆扎、浸染、拆线，制作属于自己的扎染作品。馆名’璞真‘ 寓意返璞归真、守护匠心，博物馆既是扎染历史、纹样、技艺的系统记录者，也是非遗活态传承的重要场所，让古老的白族绞缬工艺在当代继续被看见、被体验、被延续。" },
          { img: "assets/guxi.jpg", text: "古戏台：白族人民集会、唱戏的地方，见证着村落的烟火与变迁。" }
        ],
        colorPalette: [
          { img: "assets/pattern-closeup.jpg", text: "纯正的苍山靛蓝，氧化后呈现深邃的靛蓝色，经历岁月洗礼愈发温柔。" }
        ],
        // 👆 修改了这里 👆
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
        master: "杨氏染坊、院落手艺人",
         pattern: [
          { img: "assets/pattern-butterfly.jpg", title: "蝴蝶纹", desc: "源自白族“人类化蝶”的创世神话，寓意生命轮回与美好爱情。在扎染中，蝴蝶纹常作为主花，针脚细密，象征着白族人对自然与生命的敬畏。" },
          { img: "assets/pattern-plum.jpg", title: "菊花纹", desc: "受白族传统建筑影响，喜洲的菊花纹常与当地商帮文化结合，构图严谨对称，寓意富贵与长寿，体现了白族人“中正平和”的审美意趣。" },
          { img: "assets/pattern-jihe.jpg", title: "几何连续纹", desc: "几何连续纹常出现在喜洲白族院落照壁和门窗上，扎染布上的几何图案与白族木雕相呼应，让布面像一段不断延伸的生活叙事。" }
        ],
        persons: [
          {
            name: "杨氏染坊传承群体",
            role: "院落手艺人",
            img: "assets/person-xizhou.jpg",
            desc: "喜洲的扎染传承多以家族院落为单位。老手艺人们将扎染与白族木雕、照壁艺术相融合，开设院落作坊，让游客在百年老宅里体验扎染，让古老手艺在现代文旅中焕发新生。"
          }
        ],
        quote: "三坊一照壁，四合五天井；院里晾蓝布，门外是苍山。",
        tour: "逛严家大院与喜洲老街，观察照壁和木雕，再在院落作坊体验扎染；顺路尝一口喜洲粑粑。",
        tourImg: "assets/xizhou.jpg",
        photo: "assets/xizhou.jpg",
        // 👇 修改了这里 👇
        geoInfo: [
          { img: "assets/喜洲地理风光.jpg", text: "喜洲位于大理白族自治州大理市北部，西倚苍山五台峰、莲花峰，东临洱海，是洱海西岸最古老的白族聚居古镇之一，也是大理文化、商业与白族建筑的重镇。镇内三坊一照壁、四合五天井的白族民居连片分布，严家大院、董家大院等宅院木雕彩绘精美，四方街是茶马古道上历史悠久的商贸中心。古镇背靠苍山、面朝洱海，大片稻田与白墙青瓦相映，转角楼、古戏台、染衣巷散落其间，山水与人文交融，既是白族文化的活态博物馆，也是白族扎染技艺向外传播的重要源头。" }
        ],
        landmarks: [
          { img: "assets/yanjia.jpg", text: "严家大院坐落于喜洲四方街旁，始建于清光绪三十二年，是喜洲商帮代表人物严子珍的宅院，也是白族民居建筑的典范。大院以 “三坊一照壁”“四合五天井”“走马转角楼” 布局，院院相连，木雕彩绘精致考究，后院还建有一栋西式小楼，中西风格相融。这里既是喜洲商帮文化的见证，也展现了白族匠人高超的营造技艺，如今作为博物馆，诉说着茶马古道上的商贸往事。" },
          { img: "assets/sifang.jpg", text: "四方街是喜洲古镇的中心，四条古街在此交汇，广场中央立有名题坊，是茶马古道上重要的集市。古时这里汇集周边染衣巷产出的白族扎染布，是布匹交易集散地，喜洲商帮从这里将扎染布匹运往各地。时至今日，街巷两侧商铺林立，喜洲粑粑、手作小店遍布，依旧保留着古镇热闹的市井气息，是喜洲扎染文化传播的起点。" }
        ],
        colorPalette: [
          { img: "assets/pattern-closeup.jpg", text: "结合建筑审美的素雅蓝白，常配以大地色系，显得温润平和。" }
        ],
        // 👆 修改了这里 👆
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
        master: "熊文杰、熊天艳",
        pattern: [
          { img: "assets/weishan-sun.jpg", title: "太阳纹", desc: "太阳纹象征光明与生机，是巍山彝族扎染中常见的自然图腾。" },
          { img: "assets/weishan-flower.jpg", title: "八角花", desc: "八角花常出现在彝族服饰与扎染布上，表达吉祥、圆满与族群记忆。" },
          { img: "assets/weishan-hui.jpg", title: "回纹", desc: "回纹连续延展，寓意生生不息、福泽绵长。" }
        ],
                persons: [
          {
            name: "熊文杰",
            role: "省级代表性传承人",
            img: "assets/person-xiongwenjie.jpg",
            desc: "熊文杰，巍山扎染技艺省级代表性传承人。他结合彝族文化创新了多种染布技法，发明了扎花机，大大提高了产能，创立了兴巍工艺厂，产品远销海外。"
          },
          {
            name: "熊天艳",
            role: "县级代表性传承人",
            img: "assets/person-xiongtianyan.jpg",
            desc: "熊天艳，熊文杰之女，巍山扎染县级代表性传承人。她返乡接班，在古城非遗街区开设扎染体验馆，用年轻人的方式让巍山扎染成为当地文旅的新名片。"
          }
        ],
        quote: "一座巍山城，半部南诏史；一根面里，也能吃出古城的日子。",
        tour: [
          { text: "沿拱辰楼走进古城", img: "assets/gongchen.jpg" },
          { text: "逛南诏古街", img: "assets/nanzhao.jpg" },
          { text: "找一家家庭作坊看传统染缸", img: "assets/shougong.jpg" },
          { text: "尝一碗地道的一根面", img: "assets/mian.jpg" }
        ],
        tourImg: "assets/weishan.jpg",
        photo: "assets/weishan.jpg",
        // 👇 修改了这里 👇
        geoInfo: [
          { img: "assets/巍山自然风光.jpg", text: "巍山地处大理州南部，是南诏国的发祥地，境内山地、河谷、坝子交错，巍宝山环抱古城，山林幽深、古木繁茂，素有 “巍宝天下幽” 的美誉。西河蜿蜒流淌穿过坝区，良田村舍散布山间，立体气候造就丰富的山野草木，为彝族扎染提供多样的天然染料。青山环抱中的巍山古城藏于这片山水之间，清幽古朴的自然环境，滋养出风格粗犷、富有图腾特色的巍山彝族扎染技艺。" }
        ],
        landmarks: [
          { img: "assets/gongchen.jpg", text: "拱辰楼始建于明洪武二十三年，是巍山古城的核心地标，为重檐歇山式木结构城楼，楼下是城门通道。楼檐南北分别悬挂 “魁雄六诏”“万里瞻天” 两块匾额，古朴雄浑，登楼便可俯瞰整片古城与南诏古街，见证着南诏发祥地六百余年的岁月变迁，是巍山历史文化的重要象征。" },
          { img: "assets/nanzhao.jpg", text: "南诏古街是国家级历史文化名街，由北街、日昇街、月华街、南街相连而成，以拱辰楼为起点贯穿古城中轴线，完整保留明清棋盘式街巷格局。青石板路两侧是前店后院的土木民居，彝族扎染作坊、特色小吃店铺散落街巷，古街承载商贸与民俗，是巍山彝族扎染技艺代代传承的生活空间。" }
        ],
        colorPalette: [
          { img: "assets/pattern-closeup.jpg", text: "融合彝族审美的多层次色晕，偏深沉厚重，带有山野的粗犷之气。" }
        ],
        // 👆 修改了这里 👆
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
    let lastStats = null;
    let lastStatsPlace = null;

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
      if (!chartContainer) return;
      lastStats = stats;
      lastStatsPlace = place;
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

    const setSidebarTab = (tabName) => {
      sidebarTabs.forEach((tab) => {
        const active = tab.dataset.mapTab === tabName;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      sidebarPanels.forEach((panel) => {
        panel.hidden = panel.dataset.mapPanel !== tabName;
        panel.classList.toggle("is-active", panel.dataset.mapPanel === tabName);
      });

      if (tabName === "data") {
        window.requestAnimationFrame(() => {
          if (lastStats && lastStatsPlace?.id === places[currentIndex]?.id) {
            renderChart(lastStats, lastStatsPlace);
          } else {
            loadStats(places[currentIndex]);
          }
        });
      }
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

      try {
        const place = places[currentIndex];

        puzzlePlace.textContent = `${place.name} · 人物图鉴`;
        puzzleTitle.textContent = place.master || "地方传承人";

        const container = document.getElementById("puzzleContent");
        container.innerHTML = ""; // 清空旧内容

        // 遍历数组，生成多个卡片
        if (place.persons && Array.isArray(place.persons)) {
          place.persons.forEach(person => {
            const card = document.createElement("div");
            card.style.marginBottom = "30px";
            card.style.borderBottom = "1px dashed rgba(13,55,87,0.1)";
            card.style.paddingBottom = "20px";

            let imgHTML = "";
            if (person.img) {
              imgHTML = `<img src="${person.img}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">`;
            }

            card.innerHTML = `
              ${imgHTML}
              <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 24px; margin-bottom: 5px;">${person.name}</h3>
              <p style="color: #24648e; font-size: 12px; margin-bottom: 12px; font-weight: bold; letter-spacing: 0.05em;">${person.role}</p>
              <p style="color: #5c6f73; font-size: 15px; line-height: 1.8;">${person.desc}</p>
            `;
            container.appendChild(card);
          });
        } else {
          container.innerHTML = `<p style="color: #5c6f73; font-size: 15px; line-height: 1.8;">${place.note}</p>`;
        }

        puzzleModal.hidden = false;
        document.body.classList.add("modal-open");
        puzzleModal.querySelector(".puzzle-close")?.focus();
      } catch (error) {
        console.error("弹窗渲染出错：", error);
      }
    };
    const closePuzzle = () => {
      if (!puzzleModal) return;
      puzzleModal.hidden = true;
      document.body.classList.remove("modal-open");
      puzzleButton?.focus();
    };
          // ==========================================
    // 地图页：卡片详情弹窗渲染
    // ==========================================
    window.showExploreModal = function(type) {
      const place = places[currentIndex];
      const modal = document.getElementById("exploreModal");
      const kicker = document.getElementById("exploreModalKicker");
      const title = document.getElementById("exploreModalTitle");
      const container = document.getElementById("exploreModalContent");

      if (!modal || !container) return;

      const titles = {
        master: "代表性传承人",
        pattern: "特色纹样寓意",
        geo: "地理风土",
        landmark: "文化地标",
        color: "当地色谱"
      };
      kicker.textContent = `${place.name} · 详细档案`;
      title.textContent = titles[type] || "详细档案";

      let htmlContent = "";

      // 1. 特色纹样：读取当前地点的 pattern 数组
      if (type === "pattern") {
        const patterns = Array.isArray(place.pattern) ? place.pattern : [];
        htmlContent = patterns.length
          ? patterns.map((item, index) => `
              <div style="margin-bottom: ${index === patterns.length - 1 ? "0" : "24px"}; border-bottom: ${index === patterns.length - 1 ? "0" : "1px dashed rgba(13,55,87,0.15)"}; padding-bottom: ${index === patterns.length - 1 ? "0" : "20px"};">
                <img src="${item.img || "assets/pattern-closeup.jpg"}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" alt="${item.title || "特色纹样"}">
                <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 20px; margin-bottom: 8px;">${item.title || "特色纹样"}</h3>
                <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">${item.desc || ""}</p>
              </div>
            `).join("")
          : `<p style="color: #5c6f73; font-size: 15px; line-height: 1.9;">暂无特色纹样资料。</p>`;
      }
      // 2. 传承人
      else if (type === "master" && place.persons && place.persons.length) {
        htmlContent = place.persons.map(person => `
          <div style="margin-bottom: 24px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
            <img src="${person.img || 'assets/data-master.jpg'}" style="width: 100%; height: 210px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 24px; margin-bottom: 5px;">${person.name}</h3>
            <p style="color: #24648e; font-size: 12px; margin-bottom: 12px; font-weight: bold;">${person.role}</p>
            <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">${person.desc}</p>
          </div>
        `).join("");
      }
      // 3. 风土、地标、色谱（配合你刚加的 geo、landmark、color）
      else {
        const fieldMap = {
          geo: "geoInfo",
          landmark: "landmarks",
          color: "colorPalette"
        };

        const dataList = place[fieldMap[type]];

        if (Array.isArray(dataList)) {
          htmlContent = dataList.map(item => `
            <div style="margin-bottom: 24px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
              <div style="margin-bottom: 12px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <img src="${item.img || 'assets/placeholder.jpg'}" style="width: 100%; height: 180px; object-fit: cover;">
              </div>
              <p style="color: #435c67; font-size: 16px; line-height: 1.9; text-align: justify; font-weight: 500;">
                ${item.text}
              </p>
            </div>
          `).join("");
        } else {
          let bgImage = "assets/zhoucheng-2.jpg";
          if (type === "geo") bgImage = "assets/zhoucheng-2.jpg";
          if (type === "landmark") bgImage = "assets/museum.jpg";
          if (type === "color") bgImage = "assets/pattern-closeup.jpg";

          htmlContent = `
            <div style="margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <img src="${bgImage}" style="width: 100%; height: 200px; object-fit: cover;">
            </div>
            <p style="color: #435c67; font-size: 16px; line-height: 1.9; text-align: justify; font-weight: 500;">
              ${dataList || "暂无详细档案。"}
            </p>
          `;
        }
      }

      container.innerHTML = htmlContent;
      modal.hidden = false;
      document.body.classList.add("modal-open");
    };

    window.closeExploreModal = function() {
      const modal = document.getElementById("exploreModal");
      if (modal) modal.hidden = true;
      document.body.classList.remove("modal-open");
    };

    // 监听 ESC 键关闭
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") window.closeExploreModal();
    });
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
            // 👇 新增：动态更新数据面板
      const statWorkersEl = document.getElementById("statWorkers");
      const statWorkshopsEl = document.getElementById("statWorkshops");
      const statOutputEl = document.getElementById("statOutput");
      const statStudentsEl = document.getElementById("statStudents");
      const insightTextEl = document.getElementById("dataInsightText");

      if (statWorkersEl) {
        if (place.id === "zhoucheng") {
          statWorkersEl.textContent = "4,000+";
          statWorkshopsEl.textContent = "200+";
          statOutputEl.innerHTML = "1.6<small style='font-size:12px;'>亿</small>";
          statStudentsEl.innerHTML = "10<small style='font-size:12px;'>万+</small>";
          insightTextEl.innerHTML = "<strong>数据洞察：</strong>周城已形成“保护+研学+文创”的闭环。扎染不仅是文化符号，更是支撑地方经济的核心产业。";
        } else if (place.id === "xizhou") {
          statWorkersEl.textContent = "1,200+";
          statWorkshopsEl.textContent = "85+";
          statOutputEl.innerHTML = "0.8<small style='font-size:12px;'>亿</small>";
          statStudentsEl.innerHTML = "5<small style='font-size:12px;'>万+</small>";
          insightTextEl.innerHTML = "<strong>数据洞察：</strong>喜洲依托古镇文旅，将扎染体验与白族院落、木雕完美结合，高端民宿带动的体验消费正在成为产业新增长极。";
        } else {
          statWorkersEl.textContent = "650+";
          statWorkshopsEl.textContent = "40+";
          statOutputEl.innerHTML = "0.3<small style='font-size:12px;'>亿</small>";
          statStudentsEl.textContent = "2万+";
          insightTextEl.innerHTML = "<strong>数据洞察：</strong>巍山通过非遗街区建设，将彝族扎染与南诏古城旅游深度绑定，独特的山地民族风格让这里的手工制品备受青睐。";
        }
      }
      // 👆 更新结束
      placeKicker.textContent = place.kicker;
      placeName.textContent = place.name;
      placeLead.textContent = place.lead;
            if (placeMaster) placeMaster.textContent = place.master;
      if (placePattern) placePattern.textContent = place.pattern;
      if (placeGeo) placeGeo.textContent = "点击查看";
      if (placeLandmark) placeLandmark.textContent = "点击查看";
      if (placeColor) placeColor.textContent = "点击查看";
      placeQuote.textContent = place.quote;
        window.currentMapPlaceData = place;
      placeDetailLink.href = `place.html?place=${encodeURIComponent(place.id)}`;
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

    sidebarTabs.forEach((tab) => {
      tab.addEventListener("click", () => setSidebarTab(tab.dataset.mapTab));
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
        places = data.places.map((apiPlace) => {
          const localPlace = fallbackPlaces.find((place) => place.id === apiPlace.id) || {};
          return {
            ...localPlace,
            ...apiPlace,
            pattern: localPlace.pattern || apiPlace.pattern
          };
        });
      }
    } catch {
      // 静态预览或接口暂不可用时，继续使用内置地点数据。
    }

    const requestedPlace = new URLSearchParams(window.location.search).get("place");
    const requestedIndex = places.findIndex((place) => place.id === requestedPlace);
    renderPlace(requestedIndex >= 0 ? requestedIndex : 0);
  }

  createDyeCanvas();
  setupLogin();
  setupAccountState();
  setupHome();
  setupCraftStory();
  setupAtlas();
  setupPlaceDetail();
})();
