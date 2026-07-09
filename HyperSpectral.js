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

function initTabTransitions() {
  const tabWrapper = document.querySelector("[data-tab-wrapper]");
  const buttons = document.querySelectorAll("[data-tab-btn]");
  const panels = document.querySelectorAll("[data-tab-panel]");
  const stages = document.querySelectorAll("[data-stage]");

  const TAB_GRADIENTS = {
    "clinical-diagnostics":
      "linear-gradient(97.85deg, #e33e5c -5.84%, #e33ec0 39.15%, #8164ec 100.08%)",
    biomanufacturing: "linear-gradient(270deg, #676CFB 39.15%, #BC41E7 100%)",
    "food-supply-chain":
      "linear-gradient(270deg, #FAFE80 39.15%, #23CC40 110.89%)",
    "defence-security": "linear-gradient(270deg, #6EFF9A 39.15%, #87C6FF 100%)",
    "quality-control": "linear-gradient(270deg, #B63600 39.15%, #DAC735 100%)",
    "your-domain": "linear-gradient(270deg, #020001 39.15%, #020001 100%)",
  };

  if (!tabWrapper || buttons.length === 0 || panels.length === 0) {
    console.warn("Tab Component: Missing required data attributes.");
    return;
  }

  let activeId = buttons[0].getAttribute("data-tab-btn");
  let isAnimating = false;
  let gradientEl = null;
  let gradientOverlay = null;

  function setupAccessibility() {
    buttons.forEach((btn) => {
      const id = btn.getAttribute("data-tab-btn");
      const panel = document.querySelector(`[data-tab-panel="${id}"]`);

      btn.setAttribute("id", `tab-btn-${id}`);
      btn.setAttribute("aria-controls", `tab-panel-${id}`);

      if (panel) {
        panel.setAttribute("id", `tab-panel-${id}`);
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", `tab-btn-${id}`);
      }
    });
  }

  function setup() {
    setupAccessibility();
    gsap.set(tabWrapper, { position: "relative" });

    buttons.forEach((btn, index) => {
      const id = btn.getAttribute("data-tab-btn");
      const panel = document.querySelector(`[data-tab-panel="${id}"]`);
      const isFirst = index === 0;

      btn.setAttribute("aria-selected", isFirst);
      btn.setAttribute("tabindex", isFirst ? "0" : "-1");
      if (isFirst) btn.setAttribute("data-is-active", "true");

      if (panel) {
        panel.setAttribute("aria-hidden", !isFirst);
        gsap.set(panel, {
          autoAlpha: isFirst ? 1 : 0,
          position: isFirst ? "relative" : "absolute",
          top: 0,
          left: 0,
          width: "100%",
          pointerEvents: isFirst ? "auto" : "none",
        });
      }
    });

    stages.forEach((stage, index) => {
      gsap.set(stage, { autoAlpha: index === 0 ? 1 : 0 });
    });

    gradientEl = document.querySelector('[data-tab="gradient-text"]');

    if (gradientEl) {
      const wrapper = document.createElement("span");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      gradientEl.parentNode.insertBefore(wrapper, gradientEl);
      wrapper.appendChild(gradientEl);

      gradientOverlay = gradientEl.cloneNode(true);
      gradientOverlay.removeAttribute("data-tab");
      gradientOverlay.setAttribute("aria-hidden", "true");
      Object.assign(gradientOverlay.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        opacity: "0",
        pointerEvents: "none",
      });
      wrapper.appendChild(gradientOverlay);
    }
  }

  function transitionTabs(newId) {
    if (isAnimating || newId === activeId) return;

    const oldBtn = document.querySelector(`[data-tab-btn="${activeId}"]`);
    const newBtn = document.querySelector(`[data-tab-btn="${newId}"]`);
    const oldPanel = document.querySelector(`[data-tab-panel="${activeId}"]`);
    const newPanel = document.querySelector(`[data-tab-panel="${newId}"]`);
    const oldStage = document.querySelector(`[data-stage="${activeId}"]`);
    const newStage = document.querySelector(`[data-stage="${newId}"]`);

    if (!newBtn || !newPanel) return;
    isAnimating = true;

    const staggerElements = newPanel.querySelectorAll("[data-tab-stagger]");

    if (oldBtn) {
      oldBtn.setAttribute("aria-selected", "false");
      oldBtn.setAttribute("tabindex", "-1");
      oldBtn.removeAttribute("data-is-active");
    }
    newBtn.setAttribute("aria-selected", "true");
    newBtn.setAttribute("tabindex", "0");
    newBtn.setAttribute("data-is-active", "true");
    if (oldPanel) oldPanel.setAttribute("aria-hidden", "true");
    newPanel.setAttribute("aria-hidden", "false");

    const startHeight = tabWrapper.offsetHeight;
    gsap.set(tabWrapper, { height: startHeight, overflow: "hidden" });

    if (oldPanel) {
      gsap.set(oldPanel, { position: "absolute" });
    }

    gsap.set(newPanel, {
      position: "relative",
      autoAlpha: 1,
      y: 0,
      width: "100%",
      top: 0,
      left: 0,
      pointerEvents: "auto",
    });
    gsap.set(staggerElements, { y: 0, autoAlpha: 1 });

    tabWrapper.style.height = "auto";
    const targetHeight = tabWrapper.offsetHeight;
    tabWrapper.style.height = startHeight + "px";

    gsap.set(newPanel, { autoAlpha: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        activeId = newId;
        isAnimating = false;
        newBtn.focus();
        gsap.set(tabWrapper, { clearProps: "height,overflow" });
      },
    });

    tl.to(
      tabWrapper,
      {
        height: targetHeight,
        duration: 0.4,
        ease: "power3.inOut",
      },
      0,
    );

    if (oldPanel) {
      tl.to(
        oldPanel,
        {
          autoAlpha: 0,
          y: -10,
          duration: 0.3,
          pointerEvents: "none",
          ease: "power2.in",
        },
        0,
      );
    }

    tl.fromTo(
      newPanel,
      { autoAlpha: 0, y: 15 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        pointerEvents: "auto",
        ease: "power2.out",
      },
      0.1,
    );

    if (staggerElements.length > 0) {
      tl.fromTo(
        staggerElements,
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
        },
        0.15,
      );
    }

    if (gradientEl && gradientOverlay) {
      gradientOverlay.style.background = TAB_GRADIENTS[newId];
      gradientOverlay.style.webkitBackgroundClip = "text";
      gradientOverlay.style.webkitTextFillColor = "transparent";

      tl.fromTo(
        gradientOverlay,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            gradientEl.style.background = TAB_GRADIENTS[newId];
            gradientEl.style.webkitBackgroundClip = "text";
            gradientEl.style.webkitTextFillColor = "transparent";
            gsap.set(gradientOverlay, { opacity: 0 });
          },
        },
        0,
      );
    }

    if (
      window.matchMedia("(min-width: 991px)").matches &&
      oldStage &&
      newStage
    ) {
      tl.to(oldStage, { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 0);
      tl.fromTo(
        newStage,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: "power1.inOut" },
        0,
      );
    }
  }

  buttons.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      transitionTabs(e.currentTarget.getAttribute("data-tab-btn"));
    });

    btn.addEventListener("keydown", (e) => {
      let nextIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIndex = index + 1 >= buttons.length ? 0 : index + 1;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        nextIndex = index - 1 < 0 ? buttons.length - 1 : index - 1;
      }
      if (nextIndex !== undefined) {
        e.preventDefault();
        buttons[nextIndex].click();
      }
    });
  });

  let resizeTimer;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isAnimating) {
        const activePanel = document.querySelector(
          `[data-tab-panel="${activeId}"]`,
        );
        if (activePanel) {
          gsap.set(tabWrapper, { height: activePanel.offsetHeight });
        }
      }
    }, 150);
  });

  resizeObserver.observe(tabWrapper);
  setup();
}

document.addEventListener("DOMContentLoaded", initTabTransitions);
