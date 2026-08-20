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

// /* -- Typewriter Effect -- */
// function initTypewriter() {
//   const config = {
//     typeSpeedPerChar: 0.05,
//     deleteSpeedPerChar: 0.03,
//     holdDuration: 3.5,
//   };

//   const wrapper = document.querySelector("[data-typewriter-wrapper]");
//   if (!wrapper) return;

//   const target = wrapper.querySelector("[data-typewriter-target]");

//   wrapper.setAttribute("aria-live", "polite");
//   wrapper.setAttribute("aria-atomic", "true");

//   const prefersReducedMotion = window.matchMedia(
//     "(prefers-reduced-motion: reduce)",
//   ).matches;

//   const phrases = [
//     wrapper.getAttribute("data-typewriter-one"),
//     wrapper.getAttribute("data-typewriter-two"),
//     wrapper.getAttribute("data-typewriter-three"),
//   ].filter(Boolean);

//   if (phrases.length === 0) return;

//   if (prefersReducedMotion) {
//     target.textContent = phrases[0];
//     return;
//   }

//   target.textContent = "\u00A0";

//   const masterTimeline = gsap.timeline({ repeat: -1 });

//   phrases.forEach((phrase) => {
//     const textProxy = { length: 0 };
//     const phraseTimeline = gsap.timeline();

//     phraseTimeline
//       .to(textProxy, {
//         length: phrase.length,
//         duration: phrase.length * config.typeSpeedPerChar,
//         ease: "none",
//         onUpdate: () => {
//           target.textContent =
//             phrase.substring(0, Math.round(textProxy.length)) || "\u00A0";
//         },
//       })
//       .to({}, { duration: config.holdDuration })
//       .to(textProxy, {
//         length: 0,
//         duration: phrase.length * config.deleteSpeedPerChar,
//         ease: "none",
//         onUpdate: () => {
//           target.textContent =
//             phrase.substring(0, Math.round(textProxy.length)) || "\u00A0";
//         },
//       });

//     masterTimeline.add(phraseTimeline);
//   });
// }

// /* -- FAQs Tab Interaction -- */
// function initFaqTabs() {
//   const config = {
//     baseOpacity: 0.5,
//     charStagger: 0.006,
//     charDuration: 0.05,
//     transitionDuration: 0.4,
//   };

//   const wrapper = document.querySelector("[data-faq-wrapper]");
//   if (!wrapper) return;

//   const buttons = wrapper.querySelectorAll("[data-faq-trigger]");
//   const targets = wrapper.querySelectorAll("[data-faq-target]");
//   const prefersReducedMotion = window.matchMedia(
//     "(prefers-reduced-motion: reduce)",
//   ).matches;

//   let activeIndex = "1";
//   let activeTimeline = null;
//   const splitInstances = new Map();

//   wrapper.setAttribute("aria-live", "polite");

//   if (!prefersReducedMotion) {
//     targets.forEach((target) => {
//       const index = target.getAttribute("data-faq-target");
//       const split = new SplitText(target, { type: "words, chars" });
//       splitInstances.set(index, split);

//       if (index !== activeIndex) {
//         gsap.set(split.chars, { opacity: config.baseOpacity });
//       }
//     });
//   }

//   function switchTab(newIndex) {
//     if (newIndex === activeIndex || !newIndex) return;

//     const oldTarget = wrapper.querySelector(
//       `[data-faq-target="${activeIndex}"]`,
//     );
//     const newTarget = wrapper.querySelector(`[data-faq-target="${newIndex}"]`);
//     const oldBtn = wrapper.querySelector(`[data-faq-trigger="${activeIndex}"]`);
//     const newBtn = wrapper.querySelector(`[data-faq-trigger="${newIndex}"]`);

//     if (activeTimeline) activeTimeline.kill();

//     oldBtn.removeAttribute("data-is-active");
//     newBtn.setAttribute("data-is-active", "");

//     gsap.to(oldTarget, {
//       autoAlpha: 0,
//       duration: config.transitionDuration,
//       pointerEvents: "none",
//       ease: "power2.inOut",
//     });

//     activeIndex = newIndex;

//     if (prefersReducedMotion) {
//       gsap.to(newTarget, {
//         autoAlpha: 1,
//         duration: config.transitionDuration,
//         pointerEvents: "auto",
//         ease: "power2.inOut",
//       });
//       return;
//     }

//     const currentSplit = splitInstances.get(newIndex);
//     if (!currentSplit) return;

//     newTarget.setAttribute("aria-hidden", "true");

//     activeTimeline = gsap.timeline();

//     activeTimeline
//       .to(newTarget, {
//         autoAlpha: 1,
//         duration: config.transitionDuration,
//         pointerEvents: "auto",
//         ease: "power2.inOut",
//       })
//       .fromTo(
//         currentSplit.chars,
//         { opacity: config.baseOpacity },
//         {
//           opacity: 1,
//           duration: config.charDuration,
//           ease: "power1.out",
//           stagger: {
//             each: config.charStagger,
//             ease: "power2.inOut",
//           },
//           onComplete: () => {
//             newTarget.removeAttribute("aria-hidden");
//           },
//         },
//       );
//   }

//   buttons.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const targetIndex = btn.getAttribute("data-faq-trigger");
//       switchTab(targetIndex);
//     });
//   });
// }

// document.addEventListener("DOMContentLoaded", () => {
//   initTypewriter();
//   initFaqTabs();
// });

// /* -- Spectral Readout Form Functionality -- */
// (function () {
//   const ENDPOINT = "https://formcarry.com/s/hVtd9IlWkwK";
//   const MAX_BYTES = 15 * 1024 * 1024;
//   const ALLOWED = ["csv", "txt", "tsv", "json", "jdx", "dx", "jcm", "spc"];
//   const prefersReducedMotion = window.matchMedia(
//     "(prefers-reduced-motion: reduce)",
//   ).matches;

//   const state = { file: null };
//   let root,
//     box,
//     dropzone,
//     fileInput,
//     icon,
//     texts,
//     statusEl,
//     bottom,
//     emailInput,
//     promptInput,
//     submit;
//   let progress, fill, message, resetBtn, honeypot;
//   let dragDepth = 0;

//   const D = (d) => (prefersReducedMotion ? 0 : d);
//   const getExt = (name) =>
//     name && name.includes(".") ? name.split(".").pop().toLowerCase() : "";
//   const locked = () =>
//     root.dataset.state === "sending" || root.dataset.state === "sent";

//   function cacheEls() {
//     root = document.querySelector('[data-form="root"]');
//     if (!root) return false;
//     box = root.parentElement;
//     dropzone = root.querySelector('[data-form="dropzone"]');
//     fileInput = root.querySelector('[data-form="file-input"]');
//     icon = root.querySelector('[data-form="upload-icon"]');
//     texts = root.querySelector('[data-form="upload-texts"]');
//     statusEl = root.querySelector('[data-form="status"]');
//     bottom = root.querySelector('[data-form="bottom"]');
//     emailInput = root.querySelector('[data-form="email"]');
//     promptInput = root.querySelector('[data-form="prompt"]');
//     submit = root.querySelector('[data-form="submit"]');

//     const required = {
//       dropzone,
//       fileInput,
//       icon,
//       texts,
//       bottom,
//       emailInput,
//       promptInput,
//       submit,
//     };
//     const missing = Object.keys(required).filter((k) => !required[k]);
//     if (missing.length) {
//       console.warn("[sfm-form] missing data-form hooks:", missing.join(", "));
//       return false;
//     }
//     return true;
//   }

//   function buildProgress() {
//     progress = document.createElement("div");
//     progress.setAttribute("data-form", "progress");
//     progress.setAttribute("role", "progressbar");
//     progress.setAttribute("aria-label", "Upload progress");
//     progress.setAttribute("aria-valuemin", "0");
//     progress.setAttribute("aria-valuemax", "100");
//     progress.setAttribute("aria-valuenow", "0");
//     fill = document.createElement("div");
//     fill.setAttribute("data-form", "progress-fill");
//     progress.appendChild(fill);
//     root.appendChild(progress);
//   }

//   function buildMessage() {
//     message = document.createElement("p");
//     message.setAttribute("data-form", "message");
//     message.setAttribute("aria-live", "assertive");
//     bottom.insertBefore(message, bottom.firstChild);
//   }

//   function buildReset() {
//     resetBtn = document.createElement("button");
//     resetBtn.type = "button";
//     resetBtn.setAttribute("data-form", "reset");
//     resetBtn.textContent = "Send another";
//     resetBtn.addEventListener("click", resetForm);
//     dropzone.appendChild(resetBtn);
//   }

//   // Bots that autofill hidden fields get dropped before any network call.
//   function buildHoneypot() {
//     honeypot = document.createElement("input");
//     honeypot.type = "text";
//     honeypot.name = "_gotcha";
//     honeypot.tabIndex = -1;
//     honeypot.autocomplete = "off";
//     honeypot.setAttribute("aria-hidden", "true");
//     honeypot.style.cssText =
//       "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;";
//     root.appendChild(honeypot);
//   }

//   function ensureStatus() {
//     if (statusEl) return;
//     statusEl = document.createElement("p");
//     statusEl.setAttribute("data-form", "status");
//     statusEl.setAttribute("aria-live", "polite");
//     statusEl.className = "data-form_upload-title heading-h2";
//     dropzone.appendChild(statusEl);
//   }

//   function setStatusText(text) {
//     statusEl.textContent = text;
//   }

//   function showMessage(text, tone) {
//     message.textContent = text;
//     message.setAttribute("data-tone", tone || "hint");
//   }

//   function clearMessage() {
//     message.textContent = "";
//     message.removeAttribute("data-tone");
//   }

//   function isEmailValid() {
//     return emailInput.value.trim() !== "" && emailInput.checkValidity();
//   }

//   function isFormComplete() {
//     return !!state.file && isEmailValid() && promptInput.value.trim() !== "";
//   }

//   function updateSubmitState() {
//     submit.disabled = !isFormComplete();
//   }

//   function validateFile(file) {
//     if (!file || file.size === 0)
//       return {
//         ok: false,
//         reason: "That file looks empty. Pick another readout.",
//       };
//     if (file.size > MAX_BYTES)
//       return {
//         ok: false,
//         reason: "Over 15MB. Export a smaller readout and retry.",
//       };
//     if (!ALLOWED.includes(getExt(file.name))) {
//       return {
//         ok: false,
//         reason:
//           "Unsupported format. Use CSV, TXT, TSV, JSON, JDX, DX, JCM or SPC.",
//       };
//     }
//     return { ok: true };
//   }

//   function handleFiles(list) {
//     if (!list || !list.length || locked()) return;
//     const file = list[0];
//     const check = validateFile(file);
//     if (!check.ok) {
//       showMessage(check.reason, "error");
//       return;
//     }
//     list.length > 1
//       ? showMessage("One file at a time. Using the first.", "hint")
//       : clearMessage();
//     state.file = file;
//     setState("uploaded");
//     updateSubmitState();
//   }

//   function setState(next) {
//     root.dataset.state = next;

//     if (next === "idle") {
//       setStatusText("");
//       gsap.set(statusEl, { autoAlpha: 0, display: "none" });
//       gsap.set([icon, texts], { display: "" });
//       gsap.to([icon, texts], { autoAlpha: 1, duration: D(0.3) });
//       gsap.to(bottom, {
//         autoAlpha: 1,
//         duration: D(0.3),
//         onComplete: () => (bottom.style.pointerEvents = ""),
//       });
//       fill.style.width = "0%";
//       progress.setAttribute("aria-valuenow", "0");
//       root.removeAttribute("aria-busy");
//     }

//     if (next === "uploaded") {
//       gsap.to([icon, texts], {
//         autoAlpha: 0,
//         duration: D(0.25),
//         onComplete: () => gsap.set([icon, texts], { display: "none" }),
//       });
//       setStatusText("Uploaded");
//       gsap.set(statusEl, { display: "flex" });
//       gsap.fromTo(
//         statusEl,
//         { autoAlpha: 0 },
//         { autoAlpha: 1, duration: D(0.3), delay: D(0.08) },
//       );
//       gsap.to(bottom, {
//         autoAlpha: 1,
//         duration: D(0.3),
//         onComplete: () => (bottom.style.pointerEvents = ""),
//       });
//       root.removeAttribute("aria-busy");
//     }

//     if (next === "sending") {
//       root.setAttribute("aria-busy", "true");
//     }

//     if (next === "sent") {
//       setStatusText("Sent");
//       root.removeAttribute("aria-busy");
//       bottom.style.pointerEvents = "none";
//       gsap.to(bottom, { autoAlpha: 0.35, duration: D(0.4) });
//     }
//   }

//   function submitForm(payload, onProgress) {
//     return new Promise((resolve, reject) => {
//       const xhr = new XMLHttpRequest();
//       xhr.open("POST", ENDPOINT);
//       xhr.setRequestHeader("Accept", "application/json");
//       xhr.upload.addEventListener("progress", (e) => {
//         if (e.lengthComputable)
//           onProgress(Math.round((e.loaded / e.total) * 100));
//       });
//       xhr.addEventListener("load", () => {
//         xhr.status >= 200 && xhr.status < 300
//           ? resolve()
//           : reject(new Error("status " + xhr.status));
//       });
//       xhr.addEventListener("error", () => reject(new Error("network")));
//       xhr.addEventListener("abort", () => reject(new Error("aborted")));
//       xhr.send(payload);
//     });
//   }

//   function handleSubmit(e) {
//     e.preventDefault();
//     if (!isFormComplete() || root.dataset.state === "sending") return;
//     if (honeypot && honeypot.value) return;

//     clearMessage();
//     setState("sending");
//     submit.disabled = true;

//     const payload = new FormData();
//     payload.append("email", emailInput.value.trim());
//     payload.append("prompt", promptInput.value.trim());
//     payload.append("spectral_readout", state.file, state.file.name);
//     payload.append("_gotcha", honeypot ? honeypot.value : "");

//     submitForm(payload, (pct) => {
//       fill.style.width = pct + "%";
//       progress.setAttribute("aria-valuenow", String(pct));
//     })
//       .then(() => {
//         fill.style.width = "100%";
//         progress.setAttribute("aria-valuenow", "100");
//         emailInput.disabled = true;
//         promptInput.disabled = true;
//         setState("sent");
//       })
//       .catch(() => {
//         showMessage(
//           "Send failed. Check your connection and try again.",
//           "error",
//         );
//         setState("uploaded");
//         updateSubmitState();
//       });
//   }

//   function resetForm() {
//     state.file = null;
//     fileInput.value = "";
//     promptInput.value = "";
//     emailInput.disabled = false;
//     promptInput.disabled = false;
//     clearMessage();
//     setState("idle");
//     updateSubmitState();
//   }

//   function onDragEnter(e) {
//     e.preventDefault();
//     if (locked()) return;
//     dragDepth++;
//     box.dataset.drag = "active";
//   }

//   function onDragOver(e) {
//     e.preventDefault();
//   }

//   function onDragLeave(e) {
//     e.preventDefault();
//     dragDepth--;
//     if (dragDepth <= 0) {
//       dragDepth = 0;
//       delete box.dataset.drag;
//     }
//   }

//   function onDrop(e) {
//     e.preventDefault();
//     dragDepth = 0;
//     delete box.dataset.drag;
//     if (locked()) return;
//     handleFiles(e.dataTransfer.files);
//   }

//   function preventWindowDrop(e) {
//     e.preventDefault();
//   }

//   function initBaseline() {
//     root.dataset.state = "idle";
//     box.setAttribute("data-form", "box");
//     gsap.set(statusEl, { autoAlpha: 0, display: "none" });
//     gsap.set([icon, texts], { autoAlpha: 1 });
//     fill.style.width = "0%";
//     submit.disabled = true;
//   }

//   function bindEvents() {
//     fileInput.addEventListener("change", () => handleFiles(fileInput.files));
//     emailInput.addEventListener("input", updateSubmitState);
//     promptInput.addEventListener("input", updateSubmitState);
//     root.addEventListener("submit", handleSubmit);

//     root.addEventListener("dragenter", onDragEnter);
//     root.addEventListener("dragover", onDragOver);
//     root.addEventListener("dragleave", onDragLeave);
//     root.addEventListener("drop", onDrop);
//     window.addEventListener("dragover", preventWindowDrop);
//     window.addEventListener("drop", preventWindowDrop);
//   }

//   function initDataForm() {
//     if (!cacheEls()) return;
//     if (root.dataset.sfmReady) return;
//     root.dataset.sfmReady = "true";
//     ensureStatus();
//     buildProgress();
//     buildMessage();
//     buildReset();
//     buildHoneypot();
//     initBaseline();
//     bindEvents();
//   }

//   document.addEventListener("DOMContentLoaded", initDataForm);
// })();

// function initPlatformScroll() {
//   const track = document.querySelector('[data-platform="track"]');
//   const colsWrapper = document.querySelector('[data-platform="text-wrapper"]');
//   const cols = gsap.utils.toArray('[data-platform="text-col"]');
//   const bgImages = gsap.utils.toArray('[data-platform="bg-image"]');

//   if (!track || !colsWrapper || cols.length === 0) return;

//   const prefersReducedMotion = window.matchMedia(
//     "(prefers-reduced-motion: reduce)",
//   ).matches;
//   if (prefersReducedMotion) return;

//   const tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: track,
//       start: "top top",
//       end: "bottom bottom",
//       scrub: 1,
//       invalidateOnRefresh: true,
//     },
//   });

//   tl.to(
//     colsWrapper,
//     {
//       y: () => -(colsWrapper.scrollHeight - window.innerHeight),
//       ease: "none",
//     },
//     0,
//   );

//   const fadeDuration = 1 / (cols.length - 1);

//   bgImages.forEach((img, index) => {
//     if (index === 0) return;

//     tl.to(
//       img,
//       {
//         opacity: 1,
//         ease: "none",
//         duration: fadeDuration,
//       },
//       (index - 1) * fadeDuration,
//     );
//   });
// }

// function initMagneticCorpus() {
//   const section = document.querySelector('[data-about="section"]');
//   const wrapper = document.querySelector('[data-about="floats-wrapper"]');
//   const items = gsap.utils.toArray('[data-about="float-item"]');

//   if (!section || !wrapper || items.length === 0) return;

//   const prefersReducedMotion = window.matchMedia(
//     "(prefers-reduced-motion: reduce)",
//   ).matches;
//   const isMobile = window.matchMedia("(max-width: 767px)").matches;

//   if (prefersReducedMotion || isMobile) return;

//   gsap.set(items, {
//     xPercent: -50,
//     yPercent: -50,
//     x: 0,
//     y: 0,
//   });

//   let maxTravelX = window.innerWidth * 0.08;
//   let maxTravelY = window.innerHeight * 0.08;

//   const itemSetters = items.map((item) => {
//     const depth = parseFloat(item.getAttribute("data-depth")) || 0.1;
//     return {
//       xTo: gsap.quickTo(item, "x", { duration: 0.8, ease: "power3.out" }),
//       yTo: gsap.quickTo(item, "y", { duration: 0.8, ease: "power3.out" }),
//       depth: depth,
//     };
//   });

//   const handleResize = () => {
//     maxTravelX = window.innerWidth * 0.08;
//     maxTravelY = window.innerHeight * 0.08;
//   };

//   const handleMouseMove = (e) => {
//     const rect = section.getBoundingClientRect();

//     // Normalize coordinates relative to the section's width/height, not the window
//     const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
//     const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

//     itemSetters.forEach((setter) => {
//       const moveX = normX * maxTravelX * setter.depth;
//       const moveY = normY * maxTravelY * setter.depth;

//       setter.xTo(moveX);
//       setter.yTo(moveY);
//     });
//   };

//   const handleMouseLeave = () => {
//     itemSetters.forEach((setter) => {
//       setter.xTo(0);
//       setter.yTo(0);
//     });
//   };

//   window.addEventListener("resize", handleResize);
//   section.addEventListener("mousemove", handleMouseMove);
//   section.addEventListener("mouseleave", handleMouseLeave);
// }

// function initProcessTabs() {
//   const contentWrap = document.querySelector(".process_tab-content-wrap");
//   const btns = gsap.utils.toArray('[data-process="tab-btn"]');
//   const panels = gsap.utils.toArray('[data-process^="step-"]');

//   if (!contentWrap || btns.length === 0 || panels.length === 0) return;

//   let currentIndex = 0;
//   let isAnimating = false;

//   btns.forEach((btn, idx) => {
//     btn.setAttribute("data-is-active", idx === 0 ? "true" : "false");
//   });

//   gsap.set(panels, {
//     position: (i) => (i === 0 ? "relative" : "absolute"),
//     top: 0,
//     left: 0,
//     width: "100%",
//   });

//   function switchTab(nextIndex) {
//     if (nextIndex === currentIndex || isAnimating) return;
//     isAnimating = true;

//     const currentPanel = panels[currentIndex];
//     const nextPanel = panels[nextIndex];

//     btns[currentIndex].setAttribute("data-is-active", "false");
//     btns[nextIndex].setAttribute("data-is-active", "true");

//     const startHeight = contentWrap.offsetHeight;
//     gsap.set(contentWrap, { height: startHeight, overflow: "hidden" });

//     gsap.set(currentPanel, { position: "absolute", pointerEvents: "none" });
//     gsap.set(nextPanel, {
//       position: "relative",
//       visibility: "visible",
//       opacity: 1,
//       y: 0,
//       pointerEvents: "auto",
//     });

//     contentWrap.style.height = "auto";
//     const targetHeight = contentWrap.offsetHeight;
//     contentWrap.style.height = startHeight + "px";

//     gsap.set(nextPanel, { opacity: 0 });

//     const tl = gsap.timeline({
//       onComplete: () => {
//         currentIndex = nextIndex;
//         isAnimating = false;
//         gsap.set(contentWrap, { clearProps: "height,overflow" });
//       },
//     });

//     tl.to(
//       contentWrap,
//       { height: targetHeight, duration: 0.4, ease: "power3.inOut" },
//       0,
//     );

//     tl.to(
//       currentPanel,
//       {
//         opacity: 0,
//         y: -10,
//         duration: 0.3,
//         ease: "power2.in",
//         onComplete: () => gsap.set(currentPanel, { visibility: "hidden" }),
//       },
//       0,
//     );

//     tl.fromTo(
//       nextPanel,
//       { opacity: 0, y: 15 },
//       { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
//       0.1,
//     );
//   }

//   btns.forEach((btn, idx) => {
//     btn.addEventListener("click", () => switchTab(idx));
//   });
// }

// document.addEventListener("DOMContentLoaded", () => {
//   initPlatformScroll();
//   initMagneticCorpus();
//   initProcessTabs();
// });

// function initPhaseSection() {
//   const section = document.querySelector('[data-phase="section"]');
//   if (!section) return;

//   const contentWrap = section.querySelector('[data-phase="content"]');
//   const cols = section.querySelectorAll('[data-phase="col"]');
//   const images = section.querySelectorAll('[data-phase="image"]');

//   if (!contentWrap || cols.length < 2 || images.length !== cols.length) return;

//   gsap.registerPlugin(ScrollTrigger);

//   const mm = gsap.matchMedia();

//   mm.add(
//     {
//       isDesktop: "(min-width: 767px)",
//       reduceMotion: "(prefers-reduced-motion: reduce)",
//     },
//     (context) => {
//       const { isDesktop, reduceMotion } = context.conditions;
//       if (!isDesktop || reduceMotion) return;

//       gsap.set(contentWrap, { position: "relative", overflow: "hidden" });
//       gsap.set(cols, {
//         position: "absolute",
//         top: 0,
//         left: 0,
//         width: "100%",
//         height: "100%",
//         yPercent: (i) => (i === 0 ? 0 : 100),
//       });
//       gsap.set(images, { autoAlpha: (i) => (i === 0 ? 1 : 0) });

//       cols.forEach((col, i) => {
//         if (i === 0) col.removeAttribute("inert");
//         else col.setAttribute("inert", "");
//       });

//       const steps = cols.length - 1;
//       let lastActive = 0;

//       const tl = gsap.timeline({
//         defaults: { ease: "power2.inOut", duration: 1 },
//         scrollTrigger: {
//           trigger: section,
//           start: "top top",
//           end: () => `+=${window.innerHeight * steps}`,
//           pin: true,
//           pinType: "transform",
//           scrub: 1,
//           invalidateOnRefresh: true,
//           anticipatePin: 1,
//           onUpdate: (self) => {
//             const active = Math.round(self.progress * steps);
//             if (active === lastActive) return;
//             cols.forEach((col, i) => {
//               if (i === active) col.removeAttribute("inert");
//               else col.setAttribute("inert", "");
//             });
//             lastActive = active;
//           },
//         },
//       });

//       for (let i = 0; i < steps; i++) {
//         const label = `step-${i}`;
//         tl.addLabel(label)
//           .to(cols[i], { yPercent: -100 }, label)
//           .to(cols[i + 1], { yPercent: 0 }, label)
//           .to(images[i], { autoAlpha: 0 }, label)
//           .to(images[i + 1], { autoAlpha: 1 }, label);
//       }

//       return () => {
//         cols.forEach((col) => col.removeAttribute("inert"));
//         lastActive = 0;
//       };
//     },
//   );
// }

// function initHeroRotation() {
//   const container = document.querySelector('[data-hero="container"]');
//   if (!container || container.dataset.heroInit === "true") return;
//   container.dataset.heroInit = "true";

//   const stages = Array.from(document.querySelectorAll("[data-hero-stage]"));
//   const cards = Array.from(document.querySelectorAll("[data-hero-card]"));
//   const gradientSource = document.querySelector(".text-hero-gradient");

//   if (stages.length !== 3 || cards.length !== 4) return;

//   const REM = parseFloat(getComputedStyle(document.documentElement).fontSize);
//   const STAGE_DURATION = 4000;
//   const TRANSITION = 0.9;
//   const PAD_FEATURED = "0.63rem";
//   const PAD_TILE = "0.25rem";

//   const layouts = {
//     1: {
//       featured: 1,
//       tiles: { 2: [0.35, 0.3], 3: [0.08, 0.08], 4: [0.5, 0.08] },
//     },
//     2: {
//       featured: 2,
//       tiles: { 1: [0.45, 0.55], 3: [0.25, 0.08], 4: [0.55, 0.08] },
//     },
//     3: {
//       featured: 3,
//       tiles: { 1: [0.05, 0.55], 2: [0.15, 0.08], 4: [0.4, 0.15] },
//     },
//   };

//   const gradients = setupGradients(gradientSource);
//   const state = { current: 1, timer: null, tl: null, paused: false };
//   const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
//   const mobileQuery = window.matchMedia("(max-width: 766px)");

//   function setupGradients(source) {
//     if (!source) return null;
//     const text = source.textContent.trim();
//     source.setAttribute("data-hero-gradient", "wrap");
//     source.textContent = "";
//     const spans = [1, 2, 3].map((n) => {
//       const s = document.createElement("span");
//       s.setAttribute("data-hero-gradient", String(n));
//       s.textContent = text;
//       if (n > 1) s.setAttribute("aria-hidden", "true");
//       source.appendChild(s);
//       return s;
//     });
//     return spans;
//   }

//   function tileSize() {
//     return mobileQuery.matches ? { w: 59, h: 67 } : { w: 80, h: 91 };
//   }

//   function featuredSize() {
//     return mobileQuery.matches
//       ? { w: 127, h: 114 }
//       : { w: 15.44 * REM, h: 13.19 * REM };
//   }

//   function tilePos(topPct, rightPct) {
//     const r = container.getBoundingClientRect();
//     const s = tileSize();
//     return {
//       top: r.height * topPct,
//       left: r.width - s.w - r.width * rightPct,
//       width: s.w,
//       height: s.h,
//     };
//   }

//   function featuredPos() {
//     const r = container.getBoundingClientRect();
//     const f = featuredSize();
//     const offset = mobileQuery.matches ? 12 : 0.81 * REM;
//     const inset = mobileQuery.matches ? 12 : 1.06 * REM;
//     return {
//       top: r.height - f.h - offset,
//       left: inset,
//       width: f.w,
//       height: f.h,
//     };
//   }

//   function positionFor(cardNum, stageNum) {
//     const layout = layouts[stageNum];
//     return cardNum === layout.featured
//       ? featuredPos()
//       : tilePos(...layout.tiles[cardNum]);
//   }

//   function applyInitialState() {
//     stages.forEach((s, i) => {
//       if (i === 0) {
//         s.setAttribute("data-hero-stage-state", "active");
//         s.removeAttribute("aria-hidden");
//       } else {
//         s.removeAttribute("data-hero-stage-state");
//         s.setAttribute("aria-hidden", "true");
//       }
//     });
//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       if (num === layouts[1].featured)
//         card.setAttribute("data-hero-card-state", "featured");
//       else card.removeAttribute("data-hero-card-state");
//     });
//   }

//   function normalize() {
//     const featuredNum = layouts[state.current].featured;
//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       const pos = positionFor(num, state.current);
//       gsap.set(card, {
//         top: pos.top,
//         left: pos.left,
//         right: "auto",
//         bottom: "auto",
//         width: pos.width,
//         height: pos.height,
//         paddingBottom: num === featuredNum ? PAD_FEATURED : PAD_TILE,
//       });
//     });
//   }

//   function rotate(nextNum) {
//     if (state.current === nextNum || state.tl) return;

//     const layout = layouts[nextNum];
//     const currentStageEl = stages.find(
//       (s) => +s.dataset.heroStage === state.current,
//     );
//     const nextStageEl = stages.find((s) => +s.dataset.heroStage === nextNum);

//     nextStageEl.setAttribute("data-hero-stage-state", "active");
//     nextStageEl.removeAttribute("aria-hidden");

//     const tl = gsap.timeline({
//       onComplete: () => {
//         currentStageEl.removeAttribute("data-hero-stage-state");
//         currentStageEl.setAttribute("aria-hidden", "true");
//         cards.forEach((card) => {
//           const num = +card.dataset.heroCard;
//           if (num === layout.featured)
//             card.setAttribute("data-hero-card-state", "featured");
//           else card.removeAttribute("data-hero-card-state");
//         });
//         state.current = nextNum;
//         state.tl = null;
//         schedule();
//       },
//     });

//     tl.to(
//       currentStageEl,
//       { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" },
//       0,
//     ).to(nextStageEl, { autoAlpha: 1, duration: 0.6, ease: "power2.inOut" }, 0);

//     if (gradients) {
//       gradients.forEach((span, i) => {
//         const isNext = i + 1 === nextNum;
//         tl.to(
//           span,
//           { autoAlpha: isNext ? 1 : 0, duration: 0.6, ease: "power2.inOut" },
//           0,
//         );
//       });
//     }

//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       const inner = card.querySelector("[data-hero-card-inner]");
//       const tag = card.querySelector("[data-hero-card-tag]");
//       const willFeature = num === layout.featured;
//       const wasFeatured = num === layouts[state.current].featured;
//       const pos = positionFor(num, nextNum);

//       tl.to(
//         card,
//         {
//           top: pos.top,
//           left: pos.left,
//           width: pos.width,
//           height: pos.height,
//           paddingBottom: willFeature ? PAD_FEATURED : PAD_TILE,
//           duration: TRANSITION,
//           ease: "power3.inOut",
//         },
//         0,
//       );

//       if (willFeature && !wasFeatured) {
//         tl.to(tag, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, 0).to(
//           inner,
//           { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
//           TRANSITION * 0.5,
//         );
//       } else if (!willFeature && wasFeatured) {
//         tl.to(inner, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, 0).to(
//           tag,
//           { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
//           TRANSITION * 0.4,
//         );
//       }
//     });

//     state.tl = tl;
//   }

//   function nextNum() {
//     return state.current === 3 ? 1 : state.current + 1;
//   }

//   function schedule() {
//     clearTimeout(state.timer);
//     if (state.paused || reduceQuery.matches) return;
//     state.timer = setTimeout(() => rotate(nextNum()), STAGE_DURATION);
//   }

//   function pause() {
//     if (state.paused) return;
//     state.paused = true;
//     clearTimeout(state.timer);
//     if (state.tl) state.tl.pause();
//   }

//   function resume() {
//     if (!state.paused) return;
//     state.paused = false;
//     if (state.tl) state.tl.play();
//     else schedule();
//   }

//   function handleResize() {
//     if (state.tl) state.tl.progress(1);
//     normalize();
//   }

//   reduceQuery.addEventListener("change", (e) => {
//     if (e.matches) pause();
//     else resume();
//   });

//   mobileQuery.addEventListener("change", handleResize);

//   container.addEventListener("mouseenter", pause);
//   container.addEventListener("mouseleave", resume);
//   document.addEventListener("visibilitychange", () => {
//     if (document.hidden) pause();
//     else resume();
//   });

//   let resizeTimer;
//   window.addEventListener("resize", () => {
//     clearTimeout(resizeTimer);
//     resizeTimer = setTimeout(handleResize, 150);
//   });

//   applyInitialState();
//   normalize();
//   if (!reduceQuery.matches) schedule();
// }

// function initVideoPlayer() {
//   const btn = document.querySelector("[data-video-btn]");
//   const thumb = document.querySelector("[data-video-thumb]");
//   const video = document.querySelector("[data-video-element]");

//   if (!btn || !thumb || !video) return;

//   function handlePlay() {
//     btn.setAttribute("aria-disabled", "true");

//     const playPromise = video.play();

//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           const prefersReducedMotion = window.matchMedia(
//             "(prefers-reduced-motion: reduce)",
//           ).matches;
//           const animDuration = prefersReducedMotion ? 0 : 0.4;

//           gsap.to([btn, thumb], {
//             opacity: 0,
//             pointerEvents: "none",
//             visibility: "hidden",
//             duration: animDuration,
//             ease: "power2.inOut",
//           });

//           gsap.to(video, {
//             opacity: 1,
//             pointerEvents: "auto",
//             visibility: "visible",
//             duration: animDuration,
//             ease: "power2.inOut",
//             onComplete: () => video.focus(),
//           });
//         })
//         .catch((error) => {
//           btn.removeAttribute("aria-disabled");
//         });
//     }
//   }

//   btn.addEventListener("click", handlePlay);
// }

// window.addEventListener("DOMContentLoaded", () => {
//   initHeroRotation();
//   initVideoPlayer();
//   initPhaseSection();
// });

// function initHeroRotation() {
//   const container = document.querySelector('[data-hero="container"]');
//   if (!container || container.dataset.heroInit === "true") return;
//   container.dataset.heroInit = "true";

//   const stages = Array.from(document.querySelectorAll("[data-hero-stage]"));
//   const cards = Array.from(document.querySelectorAll("[data-hero-card]"));
//   const gradientSource = document.querySelector(".text-hero-gradient");

//   if (stages.length !== 3 || cards.length !== 4) return;

//   const REM = parseFloat(getComputedStyle(document.documentElement).fontSize);
//   const STAGE_DURATION = 4000;
//   const MACRO = 1.0;
//   const EASE = "power2.inOut";
//   const PAD_FEATURED = "0.2rem";
//   const PAD_TILE = "0.25rem";

//   const layouts = {
//     1: {
//       featured: 1,
//       tiles: { 2: [0.35, 0.3], 3: [0.08, 0.08], 4: [0.5, 0.58] },
//     },
//     2: {
//       featured: 2,
//       tiles: { 1: [0.45, 0.55], 3: [0.25, 0.08], 4: [0.25, 0.58] },
//     },
//     3: {
//       featured: 3,
//       tiles: { 1: [0.05, 0.55], 2: [0.15, 0.08], 4: [0.4, 0.15] },
//     },
//   };

//   const gradients = setupGradients(gradientSource);
//   const state = { current: 1, timer: null, tl: null, paused: false };
//   const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
//   const mobileQuery = window.matchMedia("(max-width: 766px)");

//   function setupGradients(source) {
//     if (!source) return null;
//     const text = source.textContent.trim();
//     source.setAttribute("data-hero-gradient", "wrap");
//     source.textContent = "";
//     return [1, 2, 3].map((n) => {
//       const s = document.createElement("span");
//       s.setAttribute("data-hero-gradient", String(n));
//       s.textContent = text;
//       if (n > 1) s.setAttribute("aria-hidden", "true");
//       source.appendChild(s);
//       return s;
//     });
//   }

//   function tileSize() {
//     return mobileQuery.matches ? { w: 59, h: 67 } : { w: 80, h: 91 };
//   }

//   function featuredSize() {
//     return mobileQuery.matches
//       ? { w: 127, h: 120 }
//       : { w: 15.44 * REM, h: 13.19 * REM };
//   }

//   function tilePos(topPct, rightPct) {
//     const r = container.getBoundingClientRect();
//     const s = tileSize();
//     return {
//       top: r.height * topPct,
//       left: r.width - s.w - r.width * rightPct,
//       width: s.w,
//       height: s.h,
//     };
//   }

//   function featuredPos() {
//     const r = container.getBoundingClientRect();
//     const f = featuredSize();
//     const offset = mobileQuery.matches ? 12 : 0.81 * REM;
//     const inset = mobileQuery.matches ? 12 : 1.06 * REM;
//     return {
//       top: r.height - f.h - offset,
//       left: inset,
//       width: f.w,
//       height: f.h,
//     };
//   }

//   function positionFor(cardNum, stageNum) {
//     const layout = layouts[stageNum];
//     return cardNum === layout.featured
//       ? featuredPos()
//       : tilePos(...layout.tiles[cardNum]);
//   }

//   function applyInitialState() {
//     stages.forEach((s, i) => {
//       if (i === 0) {
//         s.setAttribute("data-hero-stage-state", "active");
//         s.removeAttribute("aria-hidden");
//       } else {
//         s.removeAttribute("data-hero-stage-state");
//         s.setAttribute("aria-hidden", "true");
//       }
//     });
//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       if (num === layouts[1].featured)
//         card.setAttribute("data-hero-card-state", "featured");
//       else card.removeAttribute("data-hero-card-state");
//     });

//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       const bg = card.querySelector("[data-hero-card-bg]");
//       const featured = num === layouts[1].featured;
//       if (bg)
//         gsap.set(bg, {
//           clipPath: featured
//             ? "inset(50% round 0.5rem)"
//             : "inset(0% round 0.5rem)",
//         });
//     });
//   }

//   function normalize() {
//     const featuredNum = layouts[state.current].featured;
//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       const pos = positionFor(num, state.current);
//       gsap.set(card, {
//         top: pos.top,
//         left: pos.left,
//         right: "auto",
//         bottom: "auto",
//         width: pos.width,
//         height: pos.height,
//         paddingBottom: num === featuredNum ? PAD_FEATURED : PAD_TILE,
//       });
//     });
//   }

//   function decodeImages() {
//     const imgs = stages.flatMap((s) => Array.from(s.querySelectorAll("img")));
//     const jobs = imgs.map((img) =>
//       img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
//     );
//     const safety = new Promise((res) => setTimeout(res, 1500));
//     return Promise.race([Promise.all(jobs), safety]);
//   }

//   function crossfadeStages(tl, fromEl, toEl) {
//     gsap.set(toEl, { autoAlpha: 0 });
//     tl.to(toEl, { autoAlpha: 1, duration: MACRO, ease: EASE }, 0).to(
//       fromEl,
//       { autoAlpha: 0, duration: MACRO, ease: EASE },
//       0,
//     );
//   }

//   function rotate(nextNum) {
//     if (state.current === nextNum || state.tl) return;

//     const layout = layouts[nextNum];
//     const fromStage = stages.find(
//       (s) => +s.dataset.heroStage === state.current,
//     );
//     const toStage = stages.find((s) => +s.dataset.heroStage === nextNum);
//     const OUT = 0.4;
//     const IN = 0.45;
//     const CLOSED = "inset(50% round 0.5rem)";
//     const OPEN = "inset(0% round 0.5rem)";
//     const curFeatured = layouts[state.current].featured;

//     toStage.setAttribute("data-hero-stage-state", "active");
//     toStage.removeAttribute("aria-hidden");
//     gsap.set(toStage, { autoAlpha: 0 });

//     const tl = gsap.timeline({
//       onComplete: () => {
//         fromStage.removeAttribute("data-hero-stage-state");
//         fromStage.setAttribute("aria-hidden", "true");
//         state.current = nextNum;
//         state.tl = null;
//         schedule();
//       },
//     });

//     tl.to(toStage, { autoAlpha: 1, duration: OUT + IN, ease: EASE }, 0).to(
//       fromStage,
//       { autoAlpha: 0, duration: OUT + IN, ease: EASE },
//       0,
//     );

//     if (gradients) {
//       gradients.forEach((span, i) => {
//         tl.to(
//           span,
//           {
//             autoAlpha: i + 1 === nextNum ? 1 : 0,
//             duration: OUT + IN,
//             ease: EASE,
//           },
//           0,
//         );
//       });
//     }

//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       const bg = card.querySelector("[data-hero-card-bg]");
//       const tag = card.querySelector("[data-hero-card-tag]");
//       if (num === curFeatured) {
//         tl.to(card, { autoAlpha: 0, duration: OUT, ease: "power2.inOut" }, 0);
//       } else {
//         tl.to(
//           bg,
//           { clipPath: CLOSED, duration: OUT, ease: "power2.inOut" },
//           0,
//         ).to(tag, { autoAlpha: 0, duration: OUT, ease: "power2.inOut" }, 0);
//       }
//     });

//     tl.add(() => {
//       cards.forEach((card) => {
//         const num = +card.dataset.heroCard;
//         const inner = card.querySelector("[data-hero-card-inner]");
//         const tag = card.querySelector("[data-hero-card-tag]");
//         const bg = card.querySelector("[data-hero-card-bg]");
//         const willFeature = num === layout.featured;
//         const pos = positionFor(num, nextNum);

//         if (willFeature) card.setAttribute("data-hero-card-state", "featured");
//         else card.removeAttribute("data-hero-card-state");

//         gsap.set(card, {
//           top: pos.top,
//           left: pos.left,
//           right: "auto",
//           bottom: "auto",
//           width: pos.width,
//           height: pos.height,
//           paddingBottom: willFeature ? PAD_FEATURED : PAD_TILE,
//           autoAlpha: willFeature ? 0 : 1,
//         });
//         gsap.set(inner, { autoAlpha: willFeature ? 1 : 0 });
//         gsap.set(tag, { autoAlpha: 0 });
//         gsap.set(bg, { clipPath: CLOSED });
//       });
//     }, OUT);

//     cards.forEach((card) => {
//       const num = +card.dataset.heroCard;
//       const tag = card.querySelector("[data-hero-card-tag]");
//       const bg = card.querySelector("[data-hero-card-bg]");
//       const willFeature = num === layout.featured;
//       if (willFeature) {
//         tl.to(card, { autoAlpha: 1, duration: IN, ease: "power2.out" }, OUT);
//       } else {
//         tl.to(
//           bg,
//           { clipPath: OPEN, duration: IN, ease: "power2.inOut" },
//           OUT,
//         ).to(tag, { autoAlpha: 1, duration: IN, ease: "power2.out" }, OUT);
//       }
//     });

//     state.tl = tl;
//   }

//   function nextNum() {
//     return state.current === 3 ? 1 : state.current + 1;
//   }

//   function schedule() {
//     clearTimeout(state.timer);
//     if (state.paused || reduceQuery.matches) return;
//     state.timer = setTimeout(() => rotate(nextNum()), STAGE_DURATION);
//   }

//   function pause() {
//     if (state.paused) return;
//     state.paused = true;
//     clearTimeout(state.timer);
//     if (state.tl) state.tl.pause();
//   }

//   function resume() {
//     if (!state.paused) return;
//     state.paused = false;
//     if (state.tl) state.tl.play();
//     else schedule();
//   }

//   function handleResize() {
//     if (state.tl) state.tl.progress(1);
//     normalize();
//   }

//   reduceQuery.addEventListener("change", (e) => {
//     if (e.matches) pause();
//     else resume();
//   });

//   mobileQuery.addEventListener("change", handleResize);

//   container.addEventListener("mouseenter", pause);
//   container.addEventListener("mouseleave", resume);
//   document.addEventListener("visibilitychange", () => {
//     if (document.hidden) pause();
//     else resume();
//   });

//   let resizeTimer;
//   window.addEventListener("resize", () => {
//     clearTimeout(resizeTimer);
//     resizeTimer = setTimeout(handleResize, 150);
//   });

//   applyInitialState();
//   normalize();
//   decodeImages().then(() => {
//     if (!reduceQuery.matches) schedule();
//   });
// }

// window.addEventListener("DOMContentLoaded", () => {
//   initHeroRotation();
// });

/*
  function initNav() {
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (window.lenis) window.lenis.on('scroll', ScrollTrigger.update);

    const mm = gsap.matchMedia();
    const dropdownWrappers = document.querySelectorAll('[data-nav="dropdown-wrapper"]');
    const dropdownContents = document.querySelectorAll('[data-nav="dropdown-content"]');
    const dropdownIcons = document.querySelectorAll('[data-nav="dropdown-icon"]');
    const dropdownBtns = document.querySelectorAll('[data-nav="dropdown-btn"]');
    const logo = document.querySelector('[data-nav="logo"]');
    const darkSections = [...document.querySelectorAll('[data-theme="dark"]')];
    const mobileDarkSections = [...document.querySelectorAll('[data-theme-mobile="dark"]')];

    const LIGHT = '#E2DBD8';
    const DARK = '#231F20';
    let menuOpen = false;
    let currentColor = null;

    function isOnDark() {
      const rect = logo.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const sections = window.innerWidth <= 990 ? [...darkSections, ...mobileDarkSections] : darkSections;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (mid >= r.top && mid <= r.bottom) return true;
      }
      return false;
    }

    function updateLogo(immediate) {
      const target = menuOpen ? LIGHT : isOnDark() ? LIGHT : DARK;
      if (target === currentColor) return;
      currentColor = target;
      gsap.to(logo, {
        color: target,
        duration: immediate ? 0 : 0.3,
        ease: 'power2.out',
        overwrite: true,
      });
    }

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: () => updateLogo(false),
      onRefresh: () => updateLogo(true),
    });

    updateLogo(true);

    mm.add('(min-width: 991px)', () => {
      let activeDropdown = null;

      gsap.set([dropdownContents, dropdownIcons], { clearProps: 'all' });
      dropdownBtns.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));

      function closeDropdown(wrapper, immediate = false) {
        if (!wrapper) return;
        const btn = wrapper.querySelector('[data-nav="dropdown-btn"]');
        const content = wrapper.querySelector('[data-nav="dropdown-content"]');
        const icon = wrapper.querySelector('[data-nav="dropdown-icon"]');

        btn.setAttribute('aria-expanded', 'false');
        gsap.killTweensOf([content, icon]);

        const duration = immediate ? 0 : 0.2;

        gsap.to(content, {
          autoAlpha: 0,
          y: 10,
          pointerEvents: 'none',
          duration: duration,
          ease: 'power2.in',
        });

        if (icon) gsap.to(icon, { rotation: 0, duration: duration, ease: 'power2.inOut' });
        activeDropdown = null;
      }

      function openDropdown(wrapper) {
        if (activeDropdown && activeDropdown !== wrapper) {
          closeDropdown(activeDropdown, true);
        }

        const btn = wrapper.querySelector('[data-nav="dropdown-btn"]');
        const content = wrapper.querySelector('[data-nav="dropdown-content"]');
        const icon = wrapper.querySelector('[data-nav="dropdown-icon"]');

        btn.setAttribute('aria-expanded', 'true');
        gsap.killTweensOf([content, icon]);

        gsap.to(content, {
          autoAlpha: 1,
          y: 0,
          pointerEvents: 'auto',
          duration: 0.4,
          ease: 'power3.out',
        });

        if (icon) gsap.to(icon, { rotation: 180, duration: 0.4, ease: 'power3.out' });
        activeDropdown = wrapper;
      }

      function handleDropdownClick(e) {
        const btn = e.target.closest('[data-nav="dropdown-btn"]');
        if (!btn) return;
        const wrapper = btn.closest('[data-nav="dropdown-wrapper"]');
        btn.getAttribute('aria-expanded') === 'true' ? closeDropdown(wrapper) : openDropdown(wrapper);
      }

      function handleOutsideClick(e) {
        if (activeDropdown && !activeDropdown.contains(e.target)) closeDropdown(activeDropdown);
      }

      function handleEscapeKey(e) {
        if (e.key === 'Escape' && activeDropdown) {
          const btn = activeDropdown.querySelector('[data-nav="dropdown-btn"]');
          closeDropdown(activeDropdown);
          btn.focus();
        }
      }

      dropdownWrappers.forEach((wrapper) => wrapper.addEventListener('click', handleDropdownClick));
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);

      return () => {
        dropdownWrappers.forEach((wrapper) => wrapper.removeEventListener('click', handleDropdownClick));
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscapeKey);

        gsap.set([dropdownContents, dropdownIcons], { clearProps: 'all' });
        dropdownBtns.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
      };
    });

    mm.add('(max-width: 990px)', () => {
      const hamburger = document.querySelector('[data-nav="hamburger-btn"]');
      const menuWrap = document.querySelector('[data-nav="menu-wrap"]');
      const line1 = document.querySelector('[data-nav="line-1"]');
      const line2 = document.querySelector('[data-nav="line-2"]');
      const line3 = document.querySelector('[data-nav="line-3"]');
      const navItems = document.querySelectorAll('[data-nav-item]');

      gsap.set(dropdownContents, { clearProps: 'all', height: 0, paddingBlock: 0 });
      gsap.set(dropdownIcons, { clearProps: 'all' });
      dropdownBtns.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));

      const tl = gsap.timeline({ paused: true, reversed: true }).fromTo(menuWrap, { x: '-100%', autoAlpha: 0 }, { x: '0%', autoAlpha: 1, duration: 0.6, ease: 'expo.inOut' }).fromTo(navItems, { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, '-=0.4').to(line1, { y: 6, rotation: 45, duration: 0.3, transformOrigin: '50% 50%', ease: 'power2.inOut' }, 0).to(line2, { autoAlpha: 0, duration: 0.2 }, 0).to(line3, { y: -6, rotation: -45, duration: 0.3, transformOrigin: '50% 50%', ease: 'power2.inOut' }, 0);

      function toggleMenu() {
        menuOpen = !menuOpen;
        hamburger.setAttribute('aria-expanded', menuOpen);

        if (!menuOpen) {
          dropdownWrappers.forEach((wrapper) => {
            const btn = wrapper.querySelector('[data-nav="dropdown-btn"]');
            const content = wrapper.querySelector('[data-nav="dropdown-content"]');
            const icon = wrapper.querySelector('[data-nav="dropdown-icon"]');
            btn.setAttribute('aria-expanded', 'false');
            gsap.to(content, { height: 0, autoAlpha: 0, paddingBlock: 0, pointerEvents: 'none', duration: 0.3 });
            if (icon) gsap.to(icon, { rotation: 0, duration: 0.3 });
          });
        }

        updateLogo(false);
        menuOpen ? tl.play() : tl.reverse();
      }

      function handleMobileAccordion(e) {
        const btn = e.target.closest('[data-nav="dropdown-btn"]');
        if (!btn) return;

        const wrapper = btn.closest('[data-nav="dropdown-wrapper"]');
        const content = wrapper.querySelector('[data-nav="dropdown-content"]');
        const icon = wrapper.querySelector('[data-nav="dropdown-icon"]');
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        dropdownWrappers.forEach((otherWrapper) => {
          if (otherWrapper !== wrapper) {
            const otherBtn = otherWrapper.querySelector('[data-nav="dropdown-btn"]');
            const otherContent = otherWrapper.querySelector('[data-nav="dropdown-content"]');
            const otherIcon = otherWrapper.querySelector('[data-nav="dropdown-icon"]');

            if (otherBtn.getAttribute('aria-expanded') === 'true') {
              otherBtn.setAttribute('aria-expanded', 'false');
              gsap.to(otherContent, { height: 0, autoAlpha: 0, paddingBlock: 0, pointerEvents: 'none', duration: 0.3, ease: 'power2.inOut' });
              if (otherIcon) gsap.to(otherIcon, { rotation: 0, duration: 0.3 });
            }
          }
        });

        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          gsap.to(content, { height: 0, autoAlpha: 0, paddingBlock: 0, pointerEvents: 'none', duration: 0.3, ease: 'power2.inOut' });
          if (icon) gsap.to(icon, { rotation: 0, duration: 0.3 });
        } else {
          btn.setAttribute('aria-expanded', 'true');
          gsap.to(content, { height: 'auto', autoAlpha: 1, paddingBlock: '0.5rem', pointerEvents: 'auto', duration: 0.3, ease: 'power2.inOut' });
          if (icon) gsap.to(icon, { rotation: 180, duration: 0.3 });
        }
      }

      hamburger.addEventListener('click', toggleMenu);
      dropdownWrappers.forEach((wrapper) => wrapper.addEventListener('click', handleMobileAccordion));

      return () => {
        hamburger.removeEventListener('click', toggleMenu);
        dropdownWrappers.forEach((wrapper) => wrapper.removeEventListener('click', handleMobileAccordion));

        menuOpen = false;
        updateLogo(true);
        tl.kill();
        gsap.set([menuWrap, line1, line2, line3, navItems, dropdownContents, dropdownIcons], { clearProps: 'all' });
        dropdownBtns.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
      };
    });
  }

  document.addEventListener('DOMContentLoaded', initNav);
  */
