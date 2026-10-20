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
