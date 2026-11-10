(() => {
  const root = document.getElementById("dyeClinic");
  if (!root) return;

  const cases = [
    {
      id: "bleed",
      short: "白花变毛边",
      label: "留白渗蓝",
      symptom: "想要留白的花瓣边缘被蓝色吃掉，轮廓像墨迹一样向外晕开。",
      clothClass: "symptom-bleed",
      question: "重新检查时，最应该先看哪一步？",
      options: [
        "拆线以后漂洗的次数不够",
        "扎线或缝线没有真正收紧，染液从褶缝渗进去了",
        "晾晒时没有把布完全拉平",
      ],
      correct: 1,
      hint: "留白边界首先由“防染层”决定。先想想染液最容易从哪里绕进布里。",
      diagnosis: "问题多半出在扎结这道“闸门”没有关严。",
      prescription: [
        "棉线贴近布面收紧，打结后轻提布料，确认没有松脱",
        "缝扎时针脚保持均匀，收线后把布面拢紧再入缸",
        "若布料太滑，可在扎线处多绕两圈，避免浸染时滑动",
      ],
      prevent: "染前可先用少量清水润湿布料再扎紧，但不要让褶缝积满水。",
    },
    {
      id: "muddy",
      short: "纹样糊成团",
      label: "纹路粘连",
      symptom: "本来想做连续的几何纹，拆线后线条却黏在一起，分不清折痕和留白。",
      clothClass: "symptom-muddy",
      question: "这种“糊成一片”的翻车，最可能漏掉了什么动作？",
      options: [
        "折叠时没有压实折痕，捆扎线也没有顺着折线固定",
        "拆线的速度太快，伤到了布面纤维",
        "染后没有立刻用热水清洗浮色",
      ],
      correct: 0,
      hint: "纹样不是画出来的，而是靠折叠和捆扎“预先留出来”的。先看折痕有没有真正形成边界。",
      diagnosis: "折叠层没有压实，防线在入缸前就已经散了。",
      prescription: [
        "每折一次都用掌根压平，让折痕成为清晰的防染边界",
        "折叠后用夹板、木片或棉线沿折线固定，避免层与层回弹",
        "图案越复杂，捆扎间距越要均匀，不要只扎布团的两端",
      ],
      prevent: "先在废布上练习折一次、扎一次、展开一次，确认纹样逻辑再做整幅作品。",
    },
    {
      id: "gray",
      short: "蓝色发灰发浅",
      label: "显色不足",
      symptom: "刚出缸时颜色很深，晾干后却发灰、发浅，边缘还带着不均匀的青绿色。",
      clothClass: "symptom-gray",
      question: "颜色没有稳定落进布里，下一步最该调整什么？",
      options: [
        "把拆线后的布放到更强烈的阳光下暴晒",
        "每轮出缸后没有给足空气氧化时间，就急着再次入缸",
        "把染液加热到接近沸腾再继续浸泡",
      ],
      correct: 1,
      hint: "靛蓝不是“泡得久就固定”。它需要先从还原态接触空气，才会转成稳定的蓝色。",
      diagnosis: "氧化显色没有走完，蓝色还没有在布面真正“长出来”。",
      prescription: [
        "出缸后轻轻沥去多余染液，再让布面与空气充分接触",
        "观察颜色由黄绿转为青蓝后，再进行下一轮浸染",
        "需要加深时优先增加“浸染—氧化”的轮次，不要只延长单次浸泡",
      ],
      prevent: "把氧化当作染色的一部分，而不是两个步骤之间的等待时间。",
    },
    {
      id: "pale",
      short: "颜色一直不够深",
      label: "色阶偏浅",
      symptom: "已经浸染数次，成品仍然像洗旧的浅灰蓝，和预计的深靛色差得很远。",
      clothClass: "symptom-pale",
      question: "下一块布最值得先改变哪一个操作？",
      options: [
        "增加浸染轮次，并确保每轮都充分浸透、充分氧化",
        "在拆线以后用更热的水反复揉搓",
        "把布料拧得越干，颜色就会越深",
      ],
      correct: 0,
      hint: "靛蓝的深浅主要靠一层一层叠上去。单次浸泡很久，不如多轮稳定浸染。",
      diagnosis: "色阶没有叠够，问题不在拆线，而在浸染节奏。",
      prescription: [
        "先检查染缸状态和染液浓度，再安排多轮短时浸染",
        "每轮确保布纤维被染液充分浸润，出缸后完成氧化再复染",
        "对不同面料分别记录轮次和显色结果，避免套用同一套时间",
      ],
      prevent: "把染缸状态、浸染轮次和氧化时长写进染谱，下一次才有可比性。",
    },
  ];

  const caseList = document.getElementById("clinicCases");
  const caseCount = document.getElementById("clinicCaseCount");
  const progressText = document.getElementById("clinicProgressText");
  const progressBar = document.getElementById("clinicProgressBar");
  const panel = document.getElementById("clinicPanel");
  const symptomTag = document.getElementById("clinicSymptomTag");
  const cloth = document.getElementById("clinicCloth");
  const symptom = document.getElementById("clinicSymptom");
  const questionNo = document.getElementById("clinicQuestionNo");
  const question = document.getElementById("clinicQuestion");
  const options = document.getElementById("clinicOptions");
  const feedback = document.getElementById("clinicFeedback");
  const feedbackTitle = document.getElementById("clinicFeedbackTitle");
  const feedbackText = document.getElementById("clinicFeedbackText");
  const prescription = document.getElementById("clinicPrescription");
  const prescriptionList = document.getElementById("clinicPrescriptionList");
  const prevent = document.getElementById("clinicPrevent");
  const nextButton = document.getElementById("clinicNext");
  const complete = document.getElementById("clinicComplete");
  const restart = document.getElementById("clinicRestart");

  if (!caseList || !panel || !cloth || !options) return;

  const solved = new Set();
  const caseButtons = new Map();
  let activeIndex = 0;

  caseCount.textContent = String(cases.length).padStart(2, "0");

  cases.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "clinic-case";
    button.id = `clinic-case-${item.id}`;
    button.dataset.index = String(index);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "clinicPanel");
    button.setAttribute("aria-selected", "false");

    const swatch = document.createElement("span");
    swatch.className = `clinic-case-swatch swatch-${item.id}`;
    swatch.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "clinic-case-copy";
    const small = document.createElement("small");
    small.textContent = `症状 ${String(index + 1).padStart(2, "0")} · ${item.label}`;
    const strong = document.createElement("strong");
    strong.textContent = item.short;
    copy.append(small, strong);

    const state = document.createElement("span");
    state.className = "clinic-case-state";
    state.setAttribute("aria-label", "尚未诊明");
    state.textContent = "✓";

    button.append(swatch, copy, state);
    button.addEventListener("click", () => openCase(index));
    caseList.append(button);
    caseButtons.set(index, { button, state });
  });

  function updateProgress() {
    progressText.textContent = String(solved.size);
    progressBar.style.width = `${(solved.size / cases.length) * 100}%`;
    complete.hidden = solved.size !== cases.length;
  }

  function markSolved(index) {
    const item = cases[index];
    solved.add(item.id);
    const entry = caseButtons.get(index);
    if (entry) {
      entry.button.classList.add("is-solved");
      entry.state.setAttribute("aria-label", "已诊明");
    }
    updateProgress();
  }

  function resetFeedback() {
    feedback.hidden = true;
    feedback.classList.remove("is-correct");
    prescription.hidden = true;
    prescriptionList.replaceChildren();
    prevent.textContent = "";
    nextButton.hidden = true;
  }

  function showSolved(item) {
    feedback.hidden = false;
    feedback.classList.add("is-correct");
    feedbackTitle.textContent = `已诊明 · ${item.diagnosis}`;
    feedbackText.textContent = "这类翻车通常不是某一个参数的问题，按下面的顺序排查，比整块重做更有效。";
    prescription.hidden = false;
    item.prescription.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      prescriptionList.append(li);
    });
    prevent.textContent = `预防记录：${item.prevent}`;
    nextButton.hidden = false;
    nextButton.textContent = solved.size === cases.length ? "查看问诊结果" : "诊断下一种症状";
  }

  function showWrong(hint) {
    feedback.hidden = false;
    feedback.classList.remove("is-correct");
    feedbackTitle.textContent = "这个方向还不是最关键的";
    feedbackText.textContent = hint;
    prescription.hidden = true;
    nextButton.hidden = true;
  }

  function renderOptions(item, index) {
    options.replaceChildren();
    const isSolved = solved.has(item.id);

    item.options.forEach((text, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "clinic-option";
      button.dataset.option = String(optionIndex);

      const key = document.createElement("span");
      key.className = "clinic-option-key";
      key.textContent = String.fromCharCode(65 + optionIndex);
      const copy = document.createElement("span");
      copy.textContent = text;
      button.append(key, copy);

      if (isSolved) {
        button.disabled = true;
        if (optionIndex === item.correct) button.classList.add("is-correct");
      } else {
        button.addEventListener("click", () => chooseOption(index, optionIndex, button));
      }

      options.append(button);
    });
  }

  function chooseOption(caseIndex, optionIndex, button) {
    const item = cases[caseIndex];
    if (optionIndex !== item.correct) {
      button.classList.remove("is-correct");
      button.classList.add("is-wrong");
      button.setAttribute("aria-pressed", "true");
      showWrong(item.hint);
      return;
    }

    options.querySelectorAll(".clinic-option").forEach((option) => {
      option.disabled = true;
      option.classList.remove("is-wrong");
    });
    button.classList.add("is-correct");
    button.setAttribute("aria-pressed", "true");
    markSolved(caseIndex);
    showSolved(item);
  }

  function openCase(index) {
    activeIndex = Math.max(0, Math.min(cases.length - 1, index));
    const item = cases[activeIndex];

    caseButtons.forEach((entry, buttonIndex) => {
      const active = buttonIndex === activeIndex;
      entry.button.classList.toggle("is-active", active);
      entry.button.setAttribute("aria-selected", String(active));
      entry.button.tabIndex = active ? 0 : -1;
    });

    panel.setAttribute("aria-labelledby", `clinic-case-${item.id}`);
    symptomTag.textContent = `症状 ${String(activeIndex + 1).padStart(2, "0")}`;
    cloth.className = `clinic-cloth ${item.clothClass}`;
    symptom.textContent = item.symptom;
    questionNo.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(cases.length).padStart(2, "0")}`;
    question.textContent = item.question;
    renderOptions(item, activeIndex);
    resetFeedback();
    if (solved.has(item.id)) showSolved(item);
  }

  caseList.addEventListener("keydown", (event) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    if (event.key === "Home") {
      openCase(0);
    } else if (event.key === "End") {
      openCase(cases.length - 1);
    } else {
      const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      openCase((activeIndex + direction + cases.length) % cases.length);
    }
    caseButtons.get(activeIndex)?.button.focus();
  });

  nextButton.addEventListener("click", () => {
    if (solved.size === cases.length) {
      complete.scrollIntoView({ behavior: "smooth", block: "center" });
      complete.focus?.({ preventScroll: true });
      return;
    }

    for (let offset = 1; offset <= cases.length; offset += 1) {
      const candidate = (activeIndex + offset) % cases.length;
      if (!solved.has(cases[candidate].id)) {
        openCase(candidate);
        return;
      }
    }
  });

  restart?.addEventListener("click", () => {
    solved.clear();
    caseButtons.forEach((entry) => {
      entry.button.classList.remove("is-solved");
      entry.state.setAttribute("aria-label", "尚未诊明");
    });
    updateProgress();
    openCase(0);
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  updateProgress();
  openCase(0);
})();
