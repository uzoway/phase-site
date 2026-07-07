function initPartnerTabs() {
  const container = document.querySelector("[data-tab-container]");
  if (!container) return;

  const tabs = container.querySelectorAll("[data-tab-pill]");
  const panels = container.querySelectorAll("[data-tab-panel]");
  const bgs = container.querySelectorAll("[data-tab-bg]");
  const mm = gsap.matchMedia();

  let activeId = tabs[0].getAttribute("data-tab-pill");
  let isAnimating = false;

  tabs[0].setAttribute("data-is-active", "");
  container
    .querySelector(`[data-tab-panel="${activeId}"]`)
    .setAttribute("data-is-active", "");
  container
    .querySelector(`[data-tab-bg="${activeId}"]`)
    .setAttribute("data-is-active", "");

  gsap.set(panels, { autoAlpha: 0, y: 12 });
  gsap.set(bgs, { autoAlpha: 0, scale: 1.03 });
  gsap.set(container.querySelector(`[data-tab-panel="${activeId}"]`), {
    autoAlpha: 1,
    y: 0,
  });
  gsap.set(container.querySelector(`[data-tab-bg="${activeId}"]`), {
    autoAlpha: 1,
    scale: 1,
  });

  function switchTab(targetId, targetTab) {
    if (isAnimating || targetId === activeId) return;
    isAnimating = true;

    const currentTab = container.querySelector(`[data-tab-pill="${activeId}"]`);
    const currentPanel = container.querySelector(
      `[data-tab-panel="${activeId}"]`,
    );
    const currentBg = container.querySelector(`[data-tab-bg="${activeId}"]`);

    const nextPanel = container.querySelector(`[data-tab-panel="${targetId}"]`);
    const nextBg = container.querySelector(`[data-tab-bg="${targetId}"]`);

    currentTab.removeAttribute("data-is-active");
    currentTab.setAttribute("aria-selected", "false");
    currentTab.setAttribute("tabindex", "-1");
    currentPanel.removeAttribute("data-is-active");
    currentBg.removeAttribute("data-is-active");

    targetTab.setAttribute("data-is-active", "");
    targetTab.setAttribute("aria-selected", "true");
    targetTab.setAttribute("tabindex", "0");
    nextPanel.setAttribute("data-is-active", "");
    nextBg.setAttribute("data-is-active", "");

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        onComplete: () => {
          activeId = targetId;
          isAnimating = false;
        },
      });

      tl.to(
        [currentPanel, currentBg],
        {
          autoAlpha: 0,
          y: (i, target) => (target.hasAttribute("data-tab-panel") ? -8 : 0),
          duration: 0.35,
          ease: "power2.inOut",
        },
        0,
      )
        .fromTo(
          nextBg,
          { autoAlpha: 0, scale: 1.03 },
          { autoAlpha: 1, scale: 1, duration: 0.8, ease: "expo.out" },
          0.15,
        )
        .fromTo(
          nextPanel,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
          0.2,
        );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([currentPanel, currentBg], { autoAlpha: 0, y: 0, scale: 1 });
      gsap.set([nextPanel, nextBg], { autoAlpha: 1, y: 0, scale: 1 });
      activeId = targetId;
      isAnimating = false;
    });
  }

  function handleKeyboardNav(e, index) {
    let newIndex;
    if (e.key === "ArrowRight") {
      newIndex = index === tabs.length - 1 ? 0 : index + 1;
    } else if (e.key === "ArrowLeft") {
      newIndex = index === 0 ? tabs.length - 1 : index - 1;
    }

    if (newIndex !== undefined) {
      tabs[newIndex].focus();
      switchTab(tabs[newIndex].getAttribute("data-tab-pill"), tabs[newIndex]);
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () =>
      switchTab(tab.getAttribute("data-tab-pill"), tab),
    );
    tab.addEventListener("keydown", (e) => handleKeyboardNav(e, index));
  });
}

document.addEventListener("DOMContentLoaded", initPartnerTabs);
