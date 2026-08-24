/* Mobile Navigation Toggle */
function initMobileNavigation() {
  const nav = document.querySelector('[data-nav="root"]');
  const toggle = document.querySelector('[data-nav="toggle"]');
  const menu = document.querySelector('[data-nav="menu"]');

  if (!nav || !toggle || !menu) return;

  const links = menu.querySelectorAll('[data-nav="link"]');
  const topLine = toggle.querySelector('[data-nav-line="top"]');
  const middleLine = toggle.querySelector('[data-nav-line="middle"]');
  const bottomLine = toggle.querySelector('[data-nav-line="bottom"]');

  if (!topLine || !middleLine || !bottomLine) return;

  const mediaQuery = window.matchMedia("(max-width: 767px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  CustomEase.create("ease-out-quint", "0.23,1,0.32,1");

  let isOpen = false;
  let timeline = null;

  function setAccessibilityState(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );

    if (open) {
      menu.removeAttribute("inert");
      menu.removeAttribute("aria-hidden");
    } else {
      menu.setAttribute("inert", "");
      menu.setAttribute("aria-hidden", "true");
    }
  }

  function setClosedState() {
    gsap.set(menu, {
      autoAlpha: 0,
      y: reducedMotion.matches ? 0 : -12,
    });

    gsap.set(links, {
      opacity: reducedMotion.matches ? 1 : 0,
      y: reducedMotion.matches ? 0 : -8,
    });

    gsap.set(topLine, {
      y: 0,
      rotation: 0,
    });

    gsap.set(middleLine, {
      scaleX: 1,
      opacity: 1,
    });

    gsap.set(bottomLine, {
      y: 0,
      rotation: 0,
    });
  }

  function buildTimeline() {
    timeline?.kill();

    timeline = gsap.timeline({
      paused: true,
      defaults: {
        overwrite: "auto",
      },
    });

    if (reducedMotion.matches) {
      timeline
        .set(menu, {
          autoAlpha: 1,
          y: 0,
        })
        .set(links, {
          opacity: 1,
          y: 0,
        })
        .set(
          topLine,
          {
            y: 3.2,
            rotation: 45,
          },
          0,
        )
        .set(
          middleLine,
          {
            scaleX: 0,
            opacity: 0,
          },
          0,
        )
        .set(
          bottomLine,
          {
            y: -3.2,
            rotation: -45,
          },
          0,
        );

      return;
    }

    timeline
      .to(
        menu,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          ease: "ease-out-quint",
        },
        0,
      )
      .to(
        topLine,
        {
          y: 3.2,
          rotation: 45,
          duration: 0.4,
          ease: "ease-out-quint",
        },
        0,
      )
      .to(
        middleLine,
        {
          scaleX: 0,
          opacity: 0,
          duration: 0.22,
          ease: "ease-out-quart",
        },
        0,
      )
      .to(
        bottomLine,
        {
          y: -5.3,
          rotation: -45,
          duration: 0.4,
          ease: "ease-out-quint",
        },
        0,
      )
      .to(
        links,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.045,
          ease: "ease-out-quint",
        },
        0.08,
      );
  }

  function openNavigation() {
    if (isOpen || !mediaQuery.matches) return;

    isOpen = true;
    setAccessibilityState(true);

    timeline?.play();
  }

  function closeNavigation({ restoreFocus = false } = {}) {
    if (!isOpen) return;

    isOpen = false;
    setAccessibilityState(false);

    if (reducedMotion.matches) {
      timeline?.reverse(0);
    } else {
      timeline?.reverse();
    }

    if (restoreFocus) {
      toggle.focus();
    }
  }

  function toggleNavigation() {
    if (isOpen) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Escape" || !isOpen) return;

    event.preventDefault();
    closeNavigation({ restoreFocus: true });
  }

  function handleLinkClick() {
    if (!mediaQuery.matches) return;

    closeNavigation();
  }

  function handleViewportChange() {
    timeline?.kill();
    timeline = null;

    isOpen = false;

    if (mediaQuery.matches) {
      setAccessibilityState(false);
      setClosedState();
      buildTimeline();
      return;
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");

    menu.removeAttribute("inert");
    menu.removeAttribute("aria-hidden");

    gsap.set([menu, links, topLine, middleLine, bottomLine], {
      clearProps: "all",
    });
  }

  function handleMotionPreferenceChange() {
    if (!mediaQuery.matches) return;

    const wasOpen = isOpen;

    timeline?.kill();
    timeline = null;

    setClosedState();
    buildTimeline();

    if (wasOpen) {
      timeline.progress(1);
    }
  }

  toggle.addEventListener("click", toggleNavigation);
  document.addEventListener("keydown", handleKeydown);

  links.forEach(function (link) {
    link.addEventListener("click", handleLinkClick);
  });

  mediaQuery.addEventListener("change", handleViewportChange);
  reducedMotion.addEventListener("change", handleMotionPreferenceChange);

  handleViewportChange();
}

/* Logo subtle scroll interaction */
function initNavbarScrollState() {
  const nav = document.querySelector('[data-nav="root"]');

  if (!nav) return;

  const enterThreshold = 120;
  const exitThreshold = 80;

  let isScrolled = false;
  let ticking = false;

  function updateNavState() {
    const scrollY = window.scrollY;

    ticking = false;

    if (!isScrolled && scrollY >= enterThreshold) {
      isScrolled = true;
      nav.setAttribute("data-nav-scrolled", "");
      return;
    }

    if (isScrolled && scrollY <= exitThreshold) {
      isScrolled = false;
      nav.removeAttribute("data-nav-scrolled");
    }
  }

  function handleScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateNavState);
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  updateNavState();
}

/* Approach section scroll interaction */
function initApproachScroll() {
  const section = document.querySelector('[data-approach="section"]');
  const contentColumn = document.querySelector(
    '[data-approach="content-column"]',
  );

  if (!section || !contentColumn) return;

  const blocks = contentColumn.querySelectorAll('[data-approach="block"]');

  if (blocks.length < 2) return;

  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let tween = null;

  function getScrollDistance() {
    return Math.max(0, contentColumn.scrollHeight - contentColumn.clientHeight);
  }

  function createScrollAnimation() {
    if (reducedMotion.matches) return;

    const scrollDistance = getScrollDistance();

    if (scrollDistance <= 0) return;

    tween = gsap.to(blocks, {
      y: function () {
        return -getScrollDistance();
      },
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () {
          return "+=" + getScrollDistance();
        },
        pin: section,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  function destroyScrollAnimation() {
    tween?.scrollTrigger?.kill();
    tween?.kill();

    tween = null;

    gsap.set(blocks, {
      clearProps: "transform",
    });
  }

  function handleMotionPreferenceChange() {
    destroyScrollAnimation();

    if (!reducedMotion.matches) {
      createScrollAnimation();
      ScrollTrigger.refresh();
    }
  }

  reducedMotion.addEventListener("change", handleMotionPreferenceChange);

  createScrollAnimation();

  if (document.fonts?.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
}

/* Process scroll interaction */
function initProcessSection() {
  const section = document.querySelector("[data-process-section]");
  if (!section || typeof gsap === "undefined") return;

  const stage = section.querySelector("[data-process-stage]");
  const rows = section.querySelectorAll("[data-process-row]");

  if (!stage || !rows.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const graphs = Array.from(rows).map((row) => row.querySelector("[data-pv]"));

  function getTimeline(index) {
    const visual = graphs[index];
    return visual
      ? visual.__decodeTimeline ||
          visual.__scatterTimeline ||
          visual.__lineTimeline
      : null;
  }

  function resetGraphs() {
    let allFound = true;
    graphs.forEach((_, i) => {
      const tl = getTimeline(i);
      if (tl) {
        tl.pause(0);
      } else {
        allFound = false;
      }
    });
    return allFound;
  }

  if (!resetGraphs()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (resetGraphs() || attempts > 20) clearInterval(interval);
    }, 20);
  }

  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    if (reducedMotion) {
      gsap.set(rows, { autoAlpha: 1 });
      return;
    }

    const triggerStart = "top 75%";
    const finalDwellVH = 50;

    gsap.set(rows, { autoAlpha: 1, minHeight: "100vh" });
    gsap.set(stage, { position: "relative" });

    const rightTrack = document.createElement("div");
    gsap.set(rightTrack, {
      position: "absolute",
      top: 0,
      right: 0,
      width: "50%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 5,
    });
    stage.appendChild(rightTrack);

    const stickyFrame = document.createElement("div");
    gsap.set(stickyFrame, {
      height: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      pointerEvents: "auto",
    });
    rightTrack.appendChild(stickyFrame);

    const visuals = [];
    rows.forEach((row, i) => {
      const vWrap = row.querySelector("[data-process-visual-wrap]");
      visuals.push(vWrap);
      stickyFrame.appendChild(vWrap);

      gsap.set(vWrap, {
        position: "absolute",
        autoAlpha: i === 0 ? 1 : 0,
        width: "100%",
      });
    });

    const triggers = [];

    const lastRowPin = ScrollTrigger.create({
      trigger: rows[rows.length - 1],
      start: "center center",
      end: `+=${finalDwellVH}vh`,
      pin: true,
      pinSpacing: true,
    });
    triggers.push(lastRowPin);

    const pinTrigger = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      pin: stickyFrame,
      pinSpacing: false,
    });

    let lastActive = -1;

    function transitionTo(index, direction) {
      if (index === lastActive) return;

      const oldVisual = visuals[lastActive];
      const newVisual = visuals[index];

      if (direction === -1 && lastActive >= 0) {
        getTimeline(lastActive)?.reverse();
      }

      getTimeline(index)?.restart();

      if (oldVisual)
        gsap.to(oldVisual, {
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.inOut",
        });
      if (newVisual)
        gsap.to(newVisual, {
          autoAlpha: 1,
          duration: 0.6,
          ease: "power2.inOut",
        });

      lastActive = index;
    }

    rows.forEach((row, i) => {
      const leftWrap =
        row.querySelector("[data-process-left]") ||
        row.querySelector(".process_left-wrap");
      const trigger = ScrollTrigger.create({
        trigger: leftWrap,
        start: triggerStart,
        onEnter: () => transitionTo(i, 1),
        onEnterBack: () => transitionTo(i, -1),
      });
      triggers.push(trigger);
    });

    return () => {
      pinTrigger.kill();
      triggers.forEach((t) => t.kill());
      rows.forEach((row, i) => {
        row.appendChild(visuals[i]);
        gsap.set(visuals[i], { clearProps: "all" });
      });
      gsap.set(rows, { clearProps: "all" });
      gsap.set(stage, { clearProps: "all" });
      rightTrack.remove();
    };
  });

  mm.add("(max-width: 767px)", () => {
    gsap.set(rows, { autoAlpha: 1, pointerEvents: "auto" });

    if (reducedMotion) return;

    const triggers = [];

    rows.forEach((row, i) => {
      const visualWrap = row.querySelector("[data-process-visual-wrap]");
      const trigger = ScrollTrigger.create({
        trigger: visualWrap,
        start: "top 60%",
        onEnter: () => getTimeline(i)?.restart(),
        onEnterBack: () => getTimeline(i)?.restart(),
      });
      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
      gsap.set(rows, { clearProps: "all" });
    };
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initMobileNavigation();
  initNavbarScrollState();
  initApproachScroll();
  initProcessSection();
});
