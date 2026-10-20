const DOTLOTTIE_SRC =
  "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.81.0/+esm";

let dotLottiePromise;
function loadDotLottie() {
  dotLottiePromise ??= import(DOTLOTTIE_SRC).then((mod) => mod.DotLottie);
  return dotLottiePromise;
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* -- Contact email copy interaction -- */
function initClipboardInteraction() {
  const button = document.querySelector('[data-contact="email-text"]');
  const modal = document.querySelector('[data-contact="mobile-modal"]');
  if (!button || !modal) return;

  const emailString = "info@adiabatic.co";
  const textContact = "contact";
  const textCopied = "COPIED!";

  let resetDelay;
  let isCopied = false;
  let isAnimating = false;

  const updateTextSmoothly = (newText) => {
    if (button.textContent === newText || isAnimating) return;

    isAnimating = true;
    gsap
      .timeline({ onComplete: () => (isAnimating = false) })
      .to(button, {
        autoAlpha: 0,
        duration: 0.12,
        ease: "power1.inOut",
        onComplete: () => (button.textContent = newText),
      })
      .to(button, { autoAlpha: 1, duration: 0.15, ease: "power1.inOut" });
  };

  const mm = gsap.matchMedia();

  mm.add("(min-width: 767px)", () => {
    gsap.set(modal, {
      x: 0,
      xPercent: 0,
      left: "auto",
      y: -15,
      autoAlpha: 0,
      display: "none",
    });

    const handleClick = () => {
      if (isCopied) return;

      navigator.clipboard.writeText(emailString).then(() => {
        isCopied = true;

        gsap.killTweensOf(modal);
        gsap.to(modal, {
          autoAlpha: 1,
          display: "flex",
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        });

        resetDelay?.kill();
        resetDelay = gsap.delayedCall(2, () => {
          isCopied = false;
          gsap.to(modal, {
            autoAlpha: 0,
            display: "none",
            y: -10,
            duration: 0.3,
            ease: "power2.in",
          });
        });
      });
    };

    button.addEventListener("click", handleClick);
    return () => button.removeEventListener("click", handleClick);
  });

  mm.add("(max-width: 766px)", () => {
    gsap.set(modal, {
      x: "-50%",
      xPercent: 0,
      left: "50%",
      right: "auto",
      y: 15,
      autoAlpha: 0,
      display: "none",
    });

    const handleClick = () => {
      if (isCopied) return;

      navigator.clipboard.writeText(emailString).then(() => {
        isCopied = true;
        updateTextSmoothly(textCopied);

        gsap.killTweensOf(modal);
        gsap.to(modal, {
          autoAlpha: 1,
          display: "flex",
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        });

        resetDelay?.kill();
        resetDelay = gsap.delayedCall(2, () => {
          isCopied = false;
          updateTextSmoothly(textContact);
          gsap.to(modal, {
            autoAlpha: 0,
            display: "none",
            y: 10,
            duration: 0.3,
            ease: "power2.in",
          });
        });
      });
    };

    button.addEventListener("click", handleClick);
    return () => button.removeEventListener("click", handleClick);
  });
}

/* -- Preloader -- */
function initPreloader() {
  const MAX_DURATION = 6000;
  const wrap = document.querySelector("[data-preloader-wrap]");
  const host = document.querySelector("[data-preloader-lottie]");

  if (!wrap || !host) {
    finishPreloader();
    return;
  }

  let animationComplete = false;
  let windowLoaded = document.readyState === "complete";

  const tryExit = () => {
    if (!animationComplete || !windowLoaded || wrap.dataset.exited) return;
    wrap.dataset.exited = "true";

    gsap.to(wrap, {
      autoAlpha: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        wrap.style.display = "none";
        finishPreloader();
      },
    });
  };

  const skipAnimation = () => {
    animationComplete = true;
    tryExit();
  };

  const canvas = document.createElement("canvas");
  host.appendChild(canvas);

  loadDotLottie()
    .then((DotLottie) => {
      const isMobile = window.matchMedia("(max-width: 990px)").matches;
      const player = new DotLottie({
        canvas,
        src: "https://cdn.prod.website-files.com/699d71efcffad5812bae11d5/6a3b99ed7c28d351bc014ecf_Loading%20Screen.json",
        autoplay: true,
        loop: false,
        renderConfig: { autoResize: true },
        layout: { fit: isMobile ? "cover" : "fit-height", align: [0.5, 0.5] },
      });

      player.addEventListener("complete", skipAnimation);
      player.addEventListener("loadError", skipAnimation);
    })
    .catch((err) => {
      console.error("[preloader] DotLottie failed to load:", err);
      skipAnimation();
    });

  if (!windowLoaded) {
    window.addEventListener("load", () => {
      windowLoaded = true;
      tryExit();
    });
  }

  setTimeout(() => {
    animationComplete = true;
    windowLoaded = true;
    tryExit();
  }, MAX_DURATION);
}

function finishPreloader() {
  document.documentElement.classList.remove("is-loading");
  document.dispatchEvent(new CustomEvent("preloader:done"));
}

/* -- Video modal -- */
function initVideoModal() {
  const trigger = document.querySelector('[data-video-modal="trigger"]');
  const modal = document.querySelector('[data-video-modal="modal"]');
  const videoWrap = document.querySelector('[data-video-modal="video-wrap"]');
  const video = document.querySelector('[data-video-modal="video"]');
  const controlBtn = document.querySelector('[data-video-modal="control"]');
  const playIcon = document.querySelector('[data-video-modal="icon-play"]');
  const pauseIcon = document.querySelector('[data-video-modal="icon-pause"]');
  const closeBtn = document.querySelector('[data-video-modal="close"]');

  if (!trigger || !modal || !video || !videoWrap) return;

  const isTouch = () =>
    window.matchMedia("(hover: none), (pointer: coarse)").matches;

  let isPlaying = false;

  video.loop = true;
  video.muted = false;

  gsap.set(modal, { autoAlpha: 0, display: "none", scale: 0.96, y: 10 });

  const showPlayIcon = (show) => {
    gsap.set(playIcon, { autoAlpha: show ? 1 : 0, display: show ? "block" : "none" });
    gsap.set(pauseIcon, { autoAlpha: show ? 0 : 1, display: show ? "none" : "block" });
  };

  showPlayIcon(true);

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey && document.activeElement === firstFocusable) {
      lastFocusable.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      firstFocusable.focus();
      e.preventDefault();
    }
  };

  const lockScroll = () => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
  };

  const unlockScroll = () => {
    document.body.style.paddingRight = "";
    document.body.style.overflow = "";
  };

  const showControls = () => {
    gsap.to(controlBtn, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
  };

  const hideControls = () => {
    if (!isPlaying) return;
    gsap.to(controlBtn, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
  };

  const toggleVideoPlayback = () => {
    if (isPlaying) {
      isPlaying = false;
      video.pause();
      controlBtn.setAttribute("aria-label", "Play video");
      showPlayIcon(true);
      showControls();
      return;
    }

    isPlaying = true;
    video.muted = false;
    video.play();
    controlBtn.setAttribute("aria-label", "Pause video");
    showPlayIcon(false);
    if (isTouch()) hideControls();
  };

  const announce = (isOpen) => {
    document.dispatchEvent(
      new CustomEvent("videoModalState", { detail: { isOpen } }),
    );
  };

  videoWrap.addEventListener("mouseenter", () => {
    if (!isTouch()) showControls();
  });

  videoWrap.addEventListener("mouseleave", () => {
    if (!isTouch()) hideControls();
  });

  controlBtn.addEventListener("focus", showControls);
  videoWrap.addEventListener("click", toggleVideoPlayback);
  controlBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleVideoPlayback();
  });

  const openModal = () => {
    lockScroll();
    trigger.setAttribute("aria-expanded", "true");
    announce(true);

    gsap.to(modal, {
      autoAlpha: 1,
      display: "flex",
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      onComplete: () => {
        controlBtn.focus();
        document.addEventListener("keydown", handleTabKey);
      },
    });
  };

  const closeModal = () => {
    video.pause();
    video.currentTime = 0;
    isPlaying = false;

    controlBtn.setAttribute("aria-label", "Play video");
    showPlayIcon(true);
    gsap.set(controlBtn, { autoAlpha: 1 });
    trigger.setAttribute("aria-expanded", "false");

    gsap.to(modal, {
      autoAlpha: 0,
      display: "none",
      scale: 0.96,
      y: 10,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        announce(false);
        unlockScroll();
        document.removeEventListener("keydown", handleTabKey);
        trigger.focus();
      },
    });
  };

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") closeModal();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

/* -- Hero before/after -- */
function initHeroAnimation() {
  const lottieWrap = document.querySelector('[data-hero-lottie="lottie"]');
  const beforeText = document.querySelector('[data-hero-lottie="before-text"]');
  const afterText = document.querySelector('[data-hero-lottie="after-text"]');
  const textWrap = beforeText?.parentElement;

  const makeState = (name) => {
    const host = document.querySelector(`[data-hero-lottie="${name}"]`);
    return {
      host,
      src: host?.getAttribute(`data-lottie-${name}-src`),
      text: name === "before" ? beforeText : afterText,
      buttons: [
        ...document.querySelectorAll(`[data-hero-lottie="${name}-button"]`),
      ],
      words: [],
      player: null,
    };
  };

  const before = makeState("before");
  const after = makeState("after");
  const other = (state) => (state === before ? after : before);

  if (
    !lottieWrap ||
    !textWrap ||
    !before.host ||
    !after.host ||
    !before.text ||
    !after.text ||
    !before.buttons.length ||
    !after.buttons.length
  ) {
    return;
  }

  if (!before.src || !after.src) {
    console.error("[hero] Missing lottie src attributes");
    return;
  }

  const CROSSFADE_DURATION = 0.4;

  const TEXT = {
    outDuration: 0.25,
    wordDuration: 0.45,
    wordStagger: 0.045,
  };

  let current = before;
  let textTimeline = null;
  let crossfade = null;
  let preloaderDone = !document.documentElement.classList.contains("is-loading");

  const navs = [
    ...new Set(
      [...before.buttons, ...after.buttons].map((button) => button.parentElement),
    ),
  ];

  setupText();
  setupAccessibility();
  setActive(before, true);

  gsap.set(before.host, { opacity: 1 });
  gsap.set(after.host, { opacity: 0 });

  loadPlayers();
  observeSizes();

  if (preloaderDone) {
    revealText(before);
  } else {
    document.addEventListener(
      "preloader:done",
      () => {
        preloaderDone = true;
        revealText(current);
        startActivePlayer();
      },
      { once: true },
    );
  }

  for (const state of [before, after]) {
    state.buttons.forEach((button) => {
      button.addEventListener("click", () => goTo(state));
    });
  }

  document.addEventListener("videoModalState", (e) => {
    const active = current.player;
    if (!active) return;

    if (e.detail.isOpen) active.pause();
    else if (!prefersReducedMotion) active.play();
  });

  function setupText() {
    textWrap.style.display = "grid";

    for (const state of [before, after]) {
      state.text.style.gridArea = "1 / 1";
      state.text.style.position = "static";

      if (typeof SplitText !== "undefined") {
        state.words = new SplitText(state.text, {
          type: "words",
          tag: "span",
          aria: "none",
        }).words;
      } else {
        state.words = [state.text];
      }

      gsap.set(state.words, { opacity: 0 });
    }
  }

  function setupAccessibility() {
    lottieWrap.setAttribute("aria-hidden", "true");
    textWrap.setAttribute("aria-live", "polite");
    textWrap.setAttribute("aria-atomic", "true");
  }

  function setActive(state, instant = false) {
    for (const s of [before, after]) {
      const isActive = s === state;
      s.buttons.forEach((button) => {
        button.toggleAttribute("data-button-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      s.text.setAttribute("aria-hidden", String(!isActive));
    }

    navs.forEach((nav) => placeHighlight(nav, instant));
  }

  function goTo(state) {
    if (state === current) return;
    current = state;

    setActive(state);
    revealText(state);
    crossfadeLottie(state);
  }

  function isShowing(state) {
    if (gsap.getProperty(state.text, "opacity") === 0) return false;
    return state.words.some((word) => gsap.getProperty(word, "opacity") > 0);
  }

  function revealText(state) {
    textTimeline?.kill();

    const outgoing = other(state);
    const tl = gsap.timeline();
    textTimeline = tl;

    const showing = [outgoing, state].filter(isShowing).map((s) => s.text);
    if (showing.length) {
      tl.to(showing, {
        opacity: 0,
        duration: TEXT.outDuration,
        ease: "power2.out",
      });
    }

    tl.set([outgoing.text, state.text], { opacity: 1 })
      .set([...outgoing.words, ...state.words], { opacity: 0 })
      .to(state.words, {
        opacity: 1,
        duration: TEXT.wordDuration,
        ease: "power2.out",
        stagger: TEXT.wordStagger,
      });
  }

  function placeHighlight(nav, instant = false) {
    const highlight = nav.querySelector(':scope > [data-hero-lottie="highlight"]');
    const active = nav.querySelector(":scope > [data-button-active]");
    if (!highlight || !active || !nav.offsetWidth) return;

    const navBox = nav.getBoundingClientRect();
    const buttonBox = active.getBoundingClientRect();
    const borderRight = nav.offsetWidth - nav.clientWidth - nav.clientLeft;
    const left = buttonBox.left - navBox.left - nav.clientLeft;
    const right = navBox.right - borderRight - buttonBox.right;

    if (instant) highlight.style.transition = "none";
    highlight.style.clipPath = `inset(0px ${right}px 0px ${left}px)`;
    if (instant) {
      void highlight.offsetWidth;
      highlight.style.transition = "";
    }
  }

  function crossfadeLottie(state) {
    crossfade?.kill();

    const outgoing = other(state);

    if (state.player) {
      syncPlayerLayout(state);
      state.player.setFrame(0);
      if (!prefersReducedMotion) state.player.play();
    }

    if (prefersReducedMotion) {
      gsap.set(state.host, { opacity: 1 });
      gsap.set(outgoing.host, { opacity: 0 });
      outgoing.player?.pause();
      crossfade = null;
      return;
    }

    crossfade = gsap
      .timeline({
        onComplete: () => {
          outgoing.player?.pause();
          crossfade = null;
        },
      })
      .to(
        outgoing.host,
        { opacity: 0, duration: CROSSFADE_DURATION, ease: "power2.in" },
        0,
      )
      .to(
        state.host,
        { opacity: 1, duration: CROSSFADE_DURATION, ease: "power2.out" },
        0,
      );
  }

  function getPlayerLayout(state) {
    return {
      fit: state === before ? "fit-height" : "cover",
      align: [0.5, 0.5],
    };
  }

  function syncPlayerLayout(state) {
    if (!state.player) return;
    state.player.resize();
    state.player.setLayout(getPlayerLayout(state));
  }

  function observeSizes() {
    const syncPlayers = debounce(() => {
      syncPlayerLayout(before);
      syncPlayerLayout(after);
    }, 100);

    if (!("ResizeObserver" in window)) {
      window.addEventListener("resize", () => {
        syncPlayers();
        navs.forEach((nav) => placeHighlight(nav, true));
      });
      return;
    }

    new ResizeObserver(syncPlayers).observe(lottieWrap);

    const navObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => placeHighlight(entry.target, true));
    });
    navs.forEach((nav) => navObserver.observe(nav));
  }

  function loadPlayers() {
    loadDotLottie()
      .then((DotLottie) => {
        before.player = createPlayer(DotLottie, before);
        after.player = createPlayer(DotLottie, after);
      })
      .catch((err) => {
        console.error("[hero] DotLottie failed to load:", err);
      });
  }

  function createPlayer(DotLottie, state) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    state.host.appendChild(canvas);

    const player = new DotLottie({
      canvas,
      src: state.src,
      autoplay: false,
      loop: false,
      renderConfig: { autoResize: true },
      layout: getPlayerLayout(state),
    });

    player.addEventListener("load", () => {
      requestAnimationFrame(() => {
        syncPlayerLayout(state);
        if (state === current) startActivePlayer();
      });
    });

    player.addEventListener("complete", () => {
      if (state === current) goTo(other(state));
    });

    player.addEventListener("loadError", () => {
      console.error("[hero] Lottie failed to load:", state.src);
    });

    return player;
  }

  function startActivePlayer() {
    if (!preloaderDone || prefersReducedMotion) return;
    current.player?.play();
  }
}

/* -- Legal table of contents scroll offset -- */
function initLegalTocOffset() {
  const OFFSET_REM = 5.88;
  const tocLinks = document.querySelectorAll(
    '[data-legal="toc-wrap"] a[href^="#"]',
  );
  if (!tocLinks.length) return;

  const desktop = window.matchMedia("(min-width: 767px)");

  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!desktop.matches) return;

      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const rootPx = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const targetY =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        OFFSET_REM * rootPx;

      gsap.to(window, {
        scrollTo: { y: targetY, autoKill: false },
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "power2.inOut",
      });

      history.pushState(null, "", `#${id}`);
    });
  });
}

function debounce(fn, delay) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  initClipboardInteraction();
  initPreloader();
  initVideoModal();
  initHeroAnimation();
  initLegalTocOffset();
});
