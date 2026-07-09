// PARTNERS PROGRAM PAGE
// function initPartnerTabs() {
//   const container = document.querySelector("[data-tab-container]");
//   if (!container) return;

//   const tabs = container.querySelectorAll("[data-tab-pill]");
//   const panels = container.querySelectorAll("[data-tab-panel]");
//   const bgs = container.querySelectorAll("[data-tab-bg]");
//   const mm = gsap.matchMedia();

//   let activeId = tabs[0].getAttribute("data-tab-pill");
//   let isAnimating = false;

//   tabs[0].setAttribute("data-is-active", "");
//   container
//     .querySelector(`[data-tab-panel="${activeId}"]`)
//     .setAttribute("data-is-active", "");
//   container
//     .querySelector(`[data-tab-bg="${activeId}"]`)
//     .setAttribute("data-is-active", "");

//   gsap.set(panels, { autoAlpha: 0, y: 12 });
//   gsap.set(bgs, { autoAlpha: 0, scale: 1.03 });
//   gsap.set(container.querySelector(`[data-tab-panel="${activeId}"]`), {
//     autoAlpha: 1,
//     y: 0,
//   });
//   gsap.set(container.querySelector(`[data-tab-bg="${activeId}"]`), {
//     autoAlpha: 1,
//     scale: 1,
//   });

//   function switchTab(targetId, targetTab) {
//     if (isAnimating || targetId === activeId) return;
//     isAnimating = true;

//     const currentTab = container.querySelector(`[data-tab-pill="${activeId}"]`);
//     const currentPanel = container.querySelector(
//       `[data-tab-panel="${activeId}"]`,
//     );
//     const currentBg = container.querySelector(`[data-tab-bg="${activeId}"]`);

//     const nextPanel = container.querySelector(`[data-tab-panel="${targetId}"]`);
//     const nextBg = container.querySelector(`[data-tab-bg="${targetId}"]`);

//     currentTab.removeAttribute("data-is-active");
//     currentTab.setAttribute("aria-selected", "false");
//     currentTab.setAttribute("tabindex", "-1");
//     currentPanel.removeAttribute("data-is-active");
//     currentBg.removeAttribute("data-is-active");

//     targetTab.setAttribute("data-is-active", "");
//     targetTab.setAttribute("aria-selected", "true");
//     targetTab.setAttribute("tabindex", "0");
//     nextPanel.setAttribute("data-is-active", "");
//     nextBg.setAttribute("data-is-active", "");

//     mm.add("(prefers-reduced-motion: no-preference)", () => {
//       const tl = gsap.timeline({
//         onComplete: () => {
//           activeId = targetId;
//           isAnimating = false;
//         },
//       });

//       tl.to(
//         [currentPanel, currentBg],
//         {
//           autoAlpha: 0,
//           y: (i, target) => (target.hasAttribute("data-tab-panel") ? -8 : 0),
//           duration: 0.35,
//           ease: "power2.inOut",
//         },
//         0,
//       )
//         .fromTo(
//           nextBg,
//           { autoAlpha: 0, scale: 1.03 },
//           { autoAlpha: 1, scale: 1, duration: 0.8, ease: "expo.out" },
//           0.15,
//         )
//         .fromTo(
//           nextPanel,
//           { autoAlpha: 0, y: 12 },
//           { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
//           0.2,
//         );
//     });

//     mm.add("(prefers-reduced-motion: reduce)", () => {
//       gsap.set([currentPanel, currentBg], { autoAlpha: 0, y: 0, scale: 1 });
//       gsap.set([nextPanel, nextBg], { autoAlpha: 1, y: 0, scale: 1 });
//       activeId = targetId;
//       isAnimating = false;
//     });
//   }

//   function handleKeyboardNav(e, index) {
//     let newIndex;
//     if (e.key === "ArrowRight") {
//       newIndex = index === tabs.length - 1 ? 0 : index + 1;
//     } else if (e.key === "ArrowLeft") {
//       newIndex = index === 0 ? tabs.length - 1 : index - 1;
//     }

//     if (newIndex !== undefined) {
//       tabs[newIndex].focus();
//       switchTab(tabs[newIndex].getAttribute("data-tab-pill"), tabs[newIndex]);
//     }
//   }

//   tabs.forEach((tab, index) => {
//     tab.addEventListener("click", () =>
//       switchTab(tab.getAttribute("data-tab-pill"), tab),
//     );
//     tab.addEventListener("keydown", (e) => handleKeyboardNav(e, index));
//   });
// }

// document.addEventListener("DOMContentLoaded", initPartnerTabs);

// function initTabTransitions() {
//   const tabWrapper = document.querySelector("[data-tab-wrapper]");
//   const buttons = document.querySelectorAll("[data-tab-btn]");
//   const panels = document.querySelectorAll("[data-tab-panel]");
//   const stages = document.querySelectorAll("[data-stage]");

//   const TAB_GRADIENTS = {
//     "clinical-diagnostics":
//       "linear-gradient(97.85deg, #e33e5c -5.84%, #e33ec0 39.15%, #8164ec 100.08%)",
//     biomanufacturing: "linear-gradient(270deg, #676CFB 39.15%, #BC41E7 100%)",
//     "food-supply-chain":
//       "linear-gradient(270deg, #FAFE80 39.15%, #23CC40 110.89%)",
//     "defence-security": "linear-gradient(270deg, #6EFF9A 39.15%, #87C6FF 100%)",
//     "quality-control": "linear-gradient(270deg, #B63600 39.15%, #DAC735 100%)",
//     "your-domain": "linear-gradient(270deg, #020001 39.15%, #020001 100%)",
//   };

//   if (!tabWrapper || buttons.length === 0 || panels.length === 0) {
//     console.warn("Tab Component: Missing required data attributes.");
//     return;
//   }

//   let activeId = buttons[0].getAttribute("data-tab-btn");
//   let isAnimating = false;
//   let gradientEl = null;
//   let gradientOverlay = null;

//   function setupAccessibility() {
//     buttons.forEach((btn) => {
//       const id = btn.getAttribute("data-tab-btn");
//       const panel = document.querySelector(`[data-tab-panel="${id}"]`);

//       btn.setAttribute("id", `tab-btn-${id}`);
//       btn.setAttribute("aria-controls", `tab-panel-${id}`);

//       if (panel) {
//         panel.setAttribute("id", `tab-panel-${id}`);
//         panel.setAttribute("role", "tabpanel");
//         panel.setAttribute("aria-labelledby", `tab-btn-${id}`);
//       }
//     });
//   }

//   function setup() {
//     setupAccessibility();
//     gsap.set(tabWrapper, { position: "relative" });

//     buttons.forEach((btn, index) => {
//       const id = btn.getAttribute("data-tab-btn");
//       const panel = document.querySelector(`[data-tab-panel="${id}"]`);
//       const isFirst = index === 0;

//       btn.setAttribute("aria-selected", isFirst);
//       btn.setAttribute("tabindex", isFirst ? "0" : "-1");
//       if (isFirst) btn.setAttribute("data-is-active", "true");

//       if (panel) {
//         panel.setAttribute("aria-hidden", !isFirst);
//         gsap.set(panel, {
//           autoAlpha: isFirst ? 1 : 0,
//           position: isFirst ? "relative" : "absolute",
//           top: 0,
//           left: 0,
//           width: "100%",
//           pointerEvents: isFirst ? "auto" : "none",
//         });
//       }
//     });

//     stages.forEach((stage, index) => {
//       gsap.set(stage, { autoAlpha: index === 0 ? 1 : 0 });
//     });

//     gradientEl = document.querySelector('[data-tab="gradient-text"]');

//     if (gradientEl) {
//       const wrapper = document.createElement("span");
//       wrapper.style.position = "relative";
//       wrapper.style.display = "inline-block";
//       gradientEl.parentNode.insertBefore(wrapper, gradientEl);
//       wrapper.appendChild(gradientEl);

//       gradientOverlay = gradientEl.cloneNode(true);
//       gradientOverlay.removeAttribute("data-tab");
//       gradientOverlay.setAttribute("aria-hidden", "true");
//       Object.assign(gradientOverlay.style, {
//         position: "absolute",
//         top: "0",
//         left: "0",
//         width: "100%",
//         height: "100%",
//         opacity: "0",
//         pointerEvents: "none",
//       });
//       wrapper.appendChild(gradientOverlay);
//     }
//   }

//   function transitionTabs(newId) {
//     if (isAnimating || newId === activeId) return;

//     const oldBtn = document.querySelector(`[data-tab-btn="${activeId}"]`);
//     const newBtn = document.querySelector(`[data-tab-btn="${newId}"]`);
//     const oldPanel = document.querySelector(`[data-tab-panel="${activeId}"]`);
//     const newPanel = document.querySelector(`[data-tab-panel="${newId}"]`);
//     const oldStage = document.querySelector(`[data-stage="${activeId}"]`);
//     const newStage = document.querySelector(`[data-stage="${newId}"]`);

//     if (!newBtn || !newPanel) return;
//     isAnimating = true;

//     const staggerElements = newPanel.querySelectorAll("[data-tab-stagger]");

//     if (oldBtn) {
//       oldBtn.setAttribute("aria-selected", "false");
//       oldBtn.setAttribute("tabindex", "-1");
//       oldBtn.removeAttribute("data-is-active");
//     }
//     newBtn.setAttribute("aria-selected", "true");
//     newBtn.setAttribute("tabindex", "0");
//     newBtn.setAttribute("data-is-active", "true");
//     if (oldPanel) oldPanel.setAttribute("aria-hidden", "true");
//     newPanel.setAttribute("aria-hidden", "false");

//     const startHeight = tabWrapper.offsetHeight;
//     gsap.set(tabWrapper, { height: startHeight, overflow: "hidden" });

//     if (oldPanel) {
//       gsap.set(oldPanel, { position: "absolute" });
//     }

//     gsap.set(newPanel, {
//       position: "relative",
//       autoAlpha: 1,
//       y: 0,
//       width: "100%",
//       top: 0,
//       left: 0,
//       pointerEvents: "auto",
//     });
//     gsap.set(staggerElements, { y: 0, autoAlpha: 1 });

//     tabWrapper.style.height = "auto";
//     const targetHeight = tabWrapper.offsetHeight;
//     tabWrapper.style.height = startHeight + "px";

//     gsap.set(newPanel, { autoAlpha: 0 });

//     const tl = gsap.timeline({
//       onComplete: () => {
//         activeId = newId;
//         isAnimating = false;
//         newBtn.focus();
//         gsap.set(tabWrapper, { clearProps: "height,overflow" });
//       },
//     });

//     tl.to(
//       tabWrapper,
//       {
//         height: targetHeight,
//         duration: 0.4,
//         ease: "power3.inOut",
//       },
//       0,
//     );

//     if (oldPanel) {
//       tl.to(
//         oldPanel,
//         {
//           autoAlpha: 0,
//           y: -10,
//           duration: 0.3,
//           pointerEvents: "none",
//           ease: "power2.in",
//         },
//         0,
//       );
//     }

//     tl.fromTo(
//       newPanel,
//       { autoAlpha: 0, y: 15 },
//       {
//         autoAlpha: 1,
//         y: 0,
//         duration: 0.4,
//         pointerEvents: "auto",
//         ease: "power2.out",
//       },
//       0.1,
//     );

//     if (staggerElements.length > 0) {
//       tl.fromTo(
//         staggerElements,
//         { autoAlpha: 0, y: 10 },
//         {
//           autoAlpha: 1,
//           y: 0,
//           duration: 0.4,
//           stagger: 0.05,
//           ease: "power2.out",
//         },
//         0.15,
//       );
//     }

//     if (gradientEl && gradientOverlay) {
//       gradientOverlay.style.background = TAB_GRADIENTS[newId];
//       gradientOverlay.style.webkitBackgroundClip = "text";
//       gradientOverlay.style.webkitTextFillColor = "transparent";

//       tl.fromTo(
//         gradientOverlay,
//         { opacity: 0 },
//         {
//           opacity: 1,
//           duration: 0.5,
//           ease: "power2.inOut",
//           onComplete: () => {
//             gradientEl.style.background = TAB_GRADIENTS[newId];
//             gradientEl.style.webkitBackgroundClip = "text";
//             gradientEl.style.webkitTextFillColor = "transparent";
//             gsap.set(gradientOverlay, { opacity: 0 });
//           },
//         },
//         0,
//       );
//     }

//     if (
//       window.matchMedia("(min-width: 991px)").matches &&
//       oldStage &&
//       newStage
//     ) {
//       tl.to(oldStage, { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 0);
//       tl.fromTo(
//         newStage,
//         { autoAlpha: 0 },
//         { autoAlpha: 1, duration: 0.6, ease: "power1.inOut" },
//         0,
//       );
//     }
//   }

//   buttons.forEach((btn, index) => {
//     btn.addEventListener("click", (e) => {
//       transitionTabs(e.currentTarget.getAttribute("data-tab-btn"));
//     });

//     btn.addEventListener("keydown", (e) => {
//       let nextIndex;
//       if (e.key === "ArrowRight" || e.key === "ArrowDown") {
//         nextIndex = index + 1 >= buttons.length ? 0 : index + 1;
//       } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
//         nextIndex = index - 1 < 0 ? buttons.length - 1 : index - 1;
//       }
//       if (nextIndex !== undefined) {
//         e.preventDefault();
//         buttons[nextIndex].click();
//       }
//     });
//   });

//   let resizeTimer;
//   const resizeObserver = new ResizeObserver(() => {
//     clearTimeout(resizeTimer);
//     resizeTimer = setTimeout(() => {
//       if (!isAnimating) {
//         const activePanel = document.querySelector(
//           `[data-tab-panel="${activeId}"]`,
//         );
//         if (activePanel) {
//           gsap.set(tabWrapper, { height: activePanel.offsetHeight });
//         }
//       }
//     }, 150);
//   });

//   resizeObserver.observe(tabWrapper);
//   setup();
// }

// document.addEventListener("DOMContentLoaded", initTabTransitions);

function initTypewriter() {
  const config = {
    typeSpeedPerChar: 0.05,
    deleteSpeedPerChar: 0.03,
    holdDuration: 3.5,
  };

  const wrapper = document.querySelector("[data-typewriter-wrapper]");
  if (!wrapper) return;

  const target = wrapper.querySelector("[data-typewriter-target]");

  wrapper.setAttribute("aria-live", "polite");
  wrapper.setAttribute("aria-atomic", "true");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const phrases = [
    wrapper.getAttribute("data-typewriter-one"),
    wrapper.getAttribute("data-typewriter-two"),
    wrapper.getAttribute("data-typewriter-three"),
  ].filter(Boolean);

  if (phrases.length === 0) return;

  if (prefersReducedMotion) {
    target.textContent = phrases[0];
    return;
  }

  target.textContent = "\u00A0";

  const masterTimeline = gsap.timeline({ repeat: -1 });

  phrases.forEach((phrase) => {
    const textProxy = { length: 0 };
    const phraseTimeline = gsap.timeline();

    phraseTimeline
      .to(textProxy, {
        length: phrase.length,
        duration: phrase.length * config.typeSpeedPerChar,
        ease: "none",
        onUpdate: () => {
          target.textContent =
            phrase.substring(0, Math.round(textProxy.length)) || "\u00A0";
        },
      })
      .to({}, { duration: config.holdDuration })
      .to(textProxy, {
        length: 0,
        duration: phrase.length * config.deleteSpeedPerChar,
        ease: "none",
        onUpdate: () => {
          target.textContent =
            phrase.substring(0, Math.round(textProxy.length)) || "\u00A0";
        },
      });

    masterTimeline.add(phraseTimeline);
  });
}

function initFaqTabs() {
  const config = {
    baseOpacity: 0.5,
    charStagger: 0.006,
    charDuration: 0.05,
    transitionDuration: 0.4,
  };

  const wrapper = document.querySelector("[data-faq-wrapper]");
  if (!wrapper) return;

  const buttons = wrapper.querySelectorAll("[data-faq-trigger]");
  const targets = wrapper.querySelectorAll("[data-faq-target]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let activeIndex = "1";
  let activeTimeline = null;
  const splitInstances = new Map();

  wrapper.setAttribute("aria-live", "polite");

  if (!prefersReducedMotion) {
    targets.forEach((target) => {
      const index = target.getAttribute("data-faq-target");
      const split = new SplitText(target, { type: "words, chars" });
      splitInstances.set(index, split);

      if (index !== activeIndex) {
        gsap.set(split.chars, { opacity: config.baseOpacity });
      }
    });
  }

  function switchTab(newIndex) {
    if (newIndex === activeIndex || !newIndex) return;

    const oldTarget = wrapper.querySelector(
      `[data-faq-target="${activeIndex}"]`,
    );
    const newTarget = wrapper.querySelector(`[data-faq-target="${newIndex}"]`);
    const oldBtn = wrapper.querySelector(`[data-faq-trigger="${activeIndex}"]`);
    const newBtn = wrapper.querySelector(`[data-faq-trigger="${newIndex}"]`);

    if (activeTimeline) activeTimeline.kill();

    oldBtn.removeAttribute("data-is-active");
    newBtn.setAttribute("data-is-active", "");

    gsap.to(oldTarget, {
      autoAlpha: 0,
      duration: config.transitionDuration,
      pointerEvents: "none",
      ease: "power2.inOut",
    });

    activeIndex = newIndex;

    if (prefersReducedMotion) {
      gsap.to(newTarget, {
        autoAlpha: 1,
        duration: config.transitionDuration,
        pointerEvents: "auto",
        ease: "power2.inOut",
      });
      return;
    }

    const currentSplit = splitInstances.get(newIndex);
    if (!currentSplit) return;

    newTarget.setAttribute("aria-hidden", "true");

    activeTimeline = gsap.timeline();

    activeTimeline
      .to(newTarget, {
        autoAlpha: 1,
        duration: config.transitionDuration,
        pointerEvents: "auto",
        ease: "power2.inOut",
      })
      .fromTo(
        currentSplit.chars,
        { opacity: config.baseOpacity },
        {
          opacity: 1,
          duration: config.charDuration,
          ease: "power1.out",
          stagger: {
            each: config.charStagger,
            ease: "power2.inOut",
          },
          onComplete: () => {
            newTarget.removeAttribute("aria-hidden");
          },
        },
      );
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetIndex = btn.getAttribute("data-faq-trigger");
      switchTab(targetIndex);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTypewriter();
  initFaqTabs();
});

(function () {
  const ENDPOINT = "https://formcarry.com/s/hVtd9IlWkwK";
  const MAX_BYTES = 15 * 1024 * 1024;
  const ALLOWED = ["csv", "txt", "tsv", "json", "jdx", "dx", "jcm", "spc"];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const state = { file: null };
  let root,
    box,
    dropzone,
    fileInput,
    icon,
    texts,
    statusEl,
    bottom,
    emailInput,
    promptInput,
    submit;
  let progress, fill, message, resetBtn, honeypot;
  let dragDepth = 0;

  const D = (d) => (prefersReducedMotion ? 0 : d);
  const getExt = (name) =>
    name && name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const locked = () =>
    root.dataset.state === "sending" || root.dataset.state === "sent";

  function cacheEls() {
    root = document.querySelector('[data-form="root"]');
    if (!root) return false;
    box = root.parentElement;
    dropzone = root.querySelector('[data-form="dropzone"]');
    fileInput = root.querySelector('[data-form="file-input"]');
    icon = root.querySelector('[data-form="upload-icon"]');
    texts = root.querySelector('[data-form="upload-texts"]');
    statusEl = root.querySelector('[data-form="status"]');
    bottom = root.querySelector('[data-form="bottom"]');
    emailInput = root.querySelector('[data-form="email"]');
    promptInput = root.querySelector('[data-form="prompt"]');
    submit = root.querySelector('[data-form="submit"]');

    const required = {
      dropzone,
      fileInput,
      icon,
      texts,
      bottom,
      emailInput,
      promptInput,
      submit,
    };
    const missing = Object.keys(required).filter((k) => !required[k]);
    if (missing.length) {
      console.warn("[sfm-form] missing data-form hooks:", missing.join(", "));
      return false;
    }
    return true;
  }

  function buildProgress() {
    progress = document.createElement("div");
    progress.setAttribute("data-form", "progress");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Upload progress");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", "0");
    fill = document.createElement("div");
    fill.setAttribute("data-form", "progress-fill");
    progress.appendChild(fill);
    root.appendChild(progress);
  }

  function buildMessage() {
    message = document.createElement("p");
    message.setAttribute("data-form", "message");
    message.setAttribute("aria-live", "assertive");
    bottom.insertBefore(message, bottom.firstChild);
  }

  function buildReset() {
    resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.setAttribute("data-form", "reset");
    resetBtn.textContent = "Send another";
    resetBtn.addEventListener("click", resetForm);
    dropzone.appendChild(resetBtn);
  }

  // Bots that autofill hidden fields get dropped before any network call.
  function buildHoneypot() {
    honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.name = "_gotcha";
    honeypot.tabIndex = -1;
    honeypot.autocomplete = "off";
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.style.cssText =
      "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;";
    root.appendChild(honeypot);
  }

  function ensureStatus() {
    if (statusEl) return;
    statusEl = document.createElement("p");
    statusEl.setAttribute("data-form", "status");
    statusEl.setAttribute("aria-live", "polite");
    statusEl.className = "data-form_upload-title heading-h2";
    dropzone.appendChild(statusEl);
  }

  function setStatusText(text) {
    statusEl.textContent = text;
  }

  function showMessage(text, tone) {
    message.textContent = text;
    message.setAttribute("data-tone", tone || "hint");
  }

  function clearMessage() {
    message.textContent = "";
    message.removeAttribute("data-tone");
  }

  function isEmailValid() {
    return emailInput.value.trim() !== "" && emailInput.checkValidity();
  }

  function isFormComplete() {
    return !!state.file && isEmailValid() && promptInput.value.trim() !== "";
  }

  function updateSubmitState() {
    submit.disabled = !isFormComplete();
  }

  function validateFile(file) {
    if (!file || file.size === 0)
      return {
        ok: false,
        reason: "That file looks empty. Pick another readout.",
      };
    if (file.size > MAX_BYTES)
      return {
        ok: false,
        reason: "Over 15MB. Export a smaller readout and retry.",
      };
    if (!ALLOWED.includes(getExt(file.name))) {
      return {
        ok: false,
        reason:
          "Unsupported format. Use CSV, TXT, TSV, JSON, JDX, DX, JCM or SPC.",
      };
    }
    return { ok: true };
  }

  function handleFiles(list) {
    if (!list || !list.length || locked()) return;
    const file = list[0];
    const check = validateFile(file);
    if (!check.ok) {
      showMessage(check.reason, "error");
      return;
    }
    list.length > 1
      ? showMessage("One file at a time. Using the first.", "hint")
      : clearMessage();
    state.file = file;
    setState("uploaded");
    updateSubmitState();
  }

  function setState(next) {
    root.dataset.state = next;

    if (next === "idle") {
      setStatusText("");
      gsap.set(statusEl, { autoAlpha: 0, display: "none" });
      gsap.set([icon, texts], { display: "" });
      gsap.to([icon, texts], { autoAlpha: 1, duration: D(0.3) });
      gsap.to(bottom, {
        autoAlpha: 1,
        duration: D(0.3),
        onComplete: () => (bottom.style.pointerEvents = ""),
      });
      fill.style.width = "0%";
      progress.setAttribute("aria-valuenow", "0");
      root.removeAttribute("aria-busy");
    }

    if (next === "uploaded") {
      gsap.to([icon, texts], {
        autoAlpha: 0,
        duration: D(0.25),
        onComplete: () => gsap.set([icon, texts], { display: "none" }),
      });
      setStatusText("Uploaded");
      gsap.set(statusEl, { display: "flex" });
      gsap.fromTo(
        statusEl,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: D(0.3), delay: D(0.08) },
      );
      gsap.to(bottom, {
        autoAlpha: 1,
        duration: D(0.3),
        onComplete: () => (bottom.style.pointerEvents = ""),
      });
      root.removeAttribute("aria-busy");
    }

    if (next === "sending") {
      root.setAttribute("aria-busy", "true");
    }

    if (next === "sent") {
      setStatusText("Sent");
      root.removeAttribute("aria-busy");
      bottom.style.pointerEvents = "none";
      gsap.to(bottom, { autoAlpha: 0.35, duration: D(0.4) });
    }
  }

  function submitForm(payload, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", ENDPOINT);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error("status " + xhr.status));
      });
      xhr.addEventListener("error", () => reject(new Error("network")));
      xhr.addEventListener("abort", () => reject(new Error("aborted")));
      xhr.send(payload);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isFormComplete() || root.dataset.state === "sending") return;
    if (honeypot && honeypot.value) return;

    clearMessage();
    setState("sending");
    submit.disabled = true;

    const payload = new FormData();
    payload.append("email", emailInput.value.trim());
    payload.append("prompt", promptInput.value.trim());
    payload.append("spectral_readout", state.file, state.file.name);
    payload.append("_gotcha", honeypot ? honeypot.value : "");

    submitForm(payload, (pct) => {
      fill.style.width = pct + "%";
      progress.setAttribute("aria-valuenow", String(pct));
    })
      .then(() => {
        fill.style.width = "100%";
        progress.setAttribute("aria-valuenow", "100");
        emailInput.disabled = true;
        promptInput.disabled = true;
        setState("sent");
      })
      .catch(() => {
        showMessage(
          "Send failed. Check your connection and try again.",
          "error",
        );
        setState("uploaded");
        updateSubmitState();
      });
  }

  function resetForm() {
    state.file = null;
    fileInput.value = "";
    promptInput.value = "";
    emailInput.disabled = false;
    promptInput.disabled = false;
    clearMessage();
    setState("idle");
    updateSubmitState();
  }

  function onDragEnter(e) {
    e.preventDefault();
    if (locked()) return;
    dragDepth++;
    box.dataset.drag = "active";
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  function onDragLeave(e) {
    e.preventDefault();
    dragDepth--;
    if (dragDepth <= 0) {
      dragDepth = 0;
      delete box.dataset.drag;
    }
  }

  function onDrop(e) {
    e.preventDefault();
    dragDepth = 0;
    delete box.dataset.drag;
    if (locked()) return;
    handleFiles(e.dataTransfer.files);
  }

  function preventWindowDrop(e) {
    e.preventDefault();
  }

  function initBaseline() {
    root.dataset.state = "idle";
    box.setAttribute("data-form", "box");
    gsap.set(statusEl, { autoAlpha: 0, display: "none" });
    gsap.set([icon, texts], { autoAlpha: 1 });
    fill.style.width = "0%";
    submit.disabled = true;
  }

  function bindEvents() {
    fileInput.addEventListener("change", () => handleFiles(fileInput.files));
    emailInput.addEventListener("input", updateSubmitState);
    promptInput.addEventListener("input", updateSubmitState);
    root.addEventListener("submit", handleSubmit);

    root.addEventListener("dragenter", onDragEnter);
    root.addEventListener("dragover", onDragOver);
    root.addEventListener("dragleave", onDragLeave);
    root.addEventListener("drop", onDrop);
    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);
  }

  function initDataForm() {
    if (!cacheEls()) return;
    if (root.dataset.sfmReady) return;
    root.dataset.sfmReady = "true";
    ensureStatus();
    buildProgress();
    buildMessage();
    buildReset();
    buildHoneypot();
    initBaseline();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", initDataForm);
})();
