/* Hero Video Page Load Optimization */
function initHeroVideo() {
  const video = document.querySelector('[data-hero="video"]');
  const poster = document.querySelector('[data-hero="hero-poster"]');

  if (!video || !poster || typeof gsap === "undefined") return;

  gsap.set(video, { autoAlpha: 0 });

  const loadAndPlayVideo = () => {
    const source = video.querySelector("source");

    if (source && source.dataset.src) {
      source.src = source.dataset.src;
      video.load();
    }

    video.addEventListener(
      "playing",
      () => {
        gsap.to(poster, { autoAlpha: 0, duration: 1.2, ease: "power2.inOut" });
        gsap.to(video, { autoAlpha: 1, duration: 1.2, ease: "power2.inOut" });
      },
      { once: true },
    );

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(loadAndPlayVideo, { timeout: 2500 });
  } else {
    window.addEventListener("load", loadAndPlayVideo);
  }
}

/* Hero - Approach - Platform Scroll Interaction */
function initHeroApproachPlatformStory() {
  const story = document.querySelector('[data-story="wrap"]');

  if (
    !story ||
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    return;
  }

  const visualStage = story.querySelector('[data-story="visual-stage"]');

  const visualLayer = story.querySelector('[data-story="visual-layer"]');

  const fadeStage = story.querySelector('[data-story="fade-stage"]');

  const heroSection = story.querySelector('[data-story-section="hero"]');

  const approachSection = story.querySelector(
    '[data-story-section="approach"]',
  );

  const platformSection = story.querySelector(
    '[data-story-section="platform"]',
  );

  const platformContent = story.querySelector(
    '[data-story="platform-content"]',
  );

  const heroVisual = story.querySelector('[data-story-visual="hero"]');

  const approachVisual = story.querySelector('[data-story-visual="approach"]');

  const platformVisual = story.querySelector('[data-story-visual="platform"]');

  const bottomGradient = story.querySelector('[data-story-gradient="bottom"]');

  const approachVideo = approachVisual?.querySelector("video");

  if (
    !visualStage ||
    !visualLayer ||
    !fadeStage ||
    !heroSection ||
    !approachSection ||
    !platformSection ||
    !platformContent ||
    !heroVisual ||
    !approachVisual ||
    !platformVisual ||
    !bottomGradient
  ) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  function getDocumentTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function clamp(value) {
    return Math.min(1, Math.max(0, value));
  }

  function smoothstep(value) {
    const progress = clamp(value);

    return progress * progress * (3 - 2 * progress);
  }

  function moveVisualToStage(element) {
    const anchor = document.createComment("story-visual-anchor");

    element.parentNode.insertBefore(anchor, element);
    visualLayer.appendChild(element);

    return {
      element: element,
      anchor: anchor,
    };
  }

  function restoreVisual(item) {
    if (!item || !item.anchor.parentNode) return;

    item.anchor.parentNode.insertBefore(item.element, item.anchor);

    item.anchor.remove();
  }

  function setVideoPlayback(video, shouldPlay) {
    if (!video) return;

    if (shouldPlay) {
      if (video.paused) {
        const playPromise = video.play();

        if (playPromise) {
          playPromise.catch(function () {});
        }
      }

      return;
    }

    if (!video.paused) {
      video.pause();
    }
  }

  mm.add(
    "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    function () {
      const movedVisuals = [
        moveVisualToStage(heroVisual),
        moveVisualToStage(approachVisual),
        moveVisualToStage(platformVisual),
      ];

      const metrics = {
        heroTop: 0,
        heroGradientStart: 0,
        heroGradientEnd: 0,
        heroToApproachStart: 0,
        heroToApproachEnd: 0,
        approachToPlatformStart: 0,
        approachToPlatformEnd: 0,
        release: 0,
        releaseTop: 0,
      };

      let isReleased = false;
      let approachVideoActive = null;

      gsap.set([visualStage, fadeStage], {
        display: "block",
      });

      function setLayerState(element, opacity) {
        const value = clamp(opacity);

        element.style.opacity = value;

        if (value <= 0.001) {
          element.style.visibility = "hidden";
        } else {
          element.style.visibility = "visible";
        }
      }

      function measureStory() {
        const viewportHeight = window.innerHeight;

        const heroTop = getDocumentTop(heroSection);
        const approachTop = getDocumentTop(approachSection);
        const platformTop = getDocumentTop(platformSection);
        const storyTop = getDocumentTop(story);

        const platformContentRect = platformContent.getBoundingClientRect();

        const platformContentCenter =
          platformContentRect.top +
          window.scrollY +
          platformContentRect.height / 2;

        metrics.heroTop = heroTop;

        metrics.heroGradientStart = heroTop + 96;
        metrics.heroGradientEnd = heroTop + 216;

        metrics.heroToApproachStart = approachTop - viewportHeight * 0.85;

        metrics.heroToApproachEnd = approachTop - viewportHeight * 0.05;

        metrics.approachToPlatformStart = platformTop - viewportHeight * 0.85;

        metrics.approachToPlatformEnd = platformTop - viewportHeight * 0.15;

        metrics.release = platformContentCenter - viewportHeight * 0.5;

        metrics.releaseTop = Math.max(0, metrics.release - storyTop);
      }

      function getCrossfadeState(scrollPosition, start, end) {
        const range = Math.max(1, end - start);

        const progress = clamp((scrollPosition - start) / range);

        const fadeOutEnd = 0.46;
        const fadeInStart = 0.54;

        let outgoing = 0;
        let incoming = 0;

        if (progress <= fadeOutEnd) {
          outgoing = 1 - smoothstep(progress / fadeOutEnd);
        } else if (progress >= fadeInStart) {
          incoming = smoothstep((progress - fadeInStart) / (1 - fadeInStart));
        }

        return {
          outgoing: outgoing,
          incoming: incoming,
        };
      }

      function updateBottomGradient(scrollPosition) {
        const range = metrics.heroGradientEnd - metrics.heroGradientStart;

        const progress =
          range > 0 ? (scrollPosition - metrics.heroGradientStart) / range : 1;

        bottomGradient.style.opacity = smoothstep(progress);
      }

      function updateVisuals(scrollPosition) {
        let heroOpacity = 0;
        let approachOpacity = 0;
        let platformOpacity = 0;

        if (scrollPosition < metrics.heroToApproachStart) {
          heroOpacity = 1;
        } else if (scrollPosition <= metrics.heroToApproachEnd) {
          const state = getCrossfadeState(
            scrollPosition,
            metrics.heroToApproachStart,
            metrics.heroToApproachEnd,
          );

          heroOpacity = state.outgoing;
          approachOpacity = state.incoming;
        } else if (scrollPosition < metrics.approachToPlatformStart) {
          approachOpacity = 1;
        } else if (scrollPosition <= metrics.approachToPlatformEnd) {
          const state = getCrossfadeState(
            scrollPosition,
            metrics.approachToPlatformStart,
            metrics.approachToPlatformEnd,
          );

          approachOpacity = state.outgoing;
          platformOpacity = state.incoming;
        } else {
          platformOpacity = 1;
        }

        setLayerState(heroVisual, heroOpacity);

        setLayerState(approachVisual, approachOpacity);

        setLayerState(platformVisual, platformOpacity);

        const shouldPlayApproach = approachOpacity > 0.001;

        if (shouldPlayApproach !== approachVideoActive) {
          approachVideoActive = shouldPlayApproach;

          setVideoPlayback(approachVideo, shouldPlayApproach);
        }
      }

      function fixStoryStage() {
        if (!isReleased) return;

        isReleased = false;

        gsap.set([visualStage, fadeStage], {
          position: "fixed",
          top: 0,
          left: 0,
        });
      }

      function releaseStoryStage() {
        if (isReleased) return;

        isReleased = true;

        gsap.set([visualStage, fadeStage], {
          position: "absolute",
          top: metrics.releaseTop,
          left: 0,
        });
      }

      function updateStagePosition(scrollPosition) {
        if (scrollPosition >= metrics.release) {
          releaseStoryStage();
        } else {
          fixStoryStage();
        }
      }

      function updateStory() {
        const scrollPosition = window.scrollY;

        updateBottomGradient(scrollPosition);
        updateVisuals(scrollPosition);
        updateStagePosition(scrollPosition);
      }

      measureStory();
      updateStory();

      const storyTrigger = ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom top",
        invalidateOnRefresh: true,

        onUpdate: function () {
          updateStory();
        },

        onRefreshInit: function () {
          if (isReleased) {
            isReleased = false;

            gsap.set([visualStage, fadeStage], {
              position: "fixed",
              top: 0,
              left: 0,
            });
          }
        },

        onRefresh: function () {
          measureStory();
          updateStory();
        },
      });

      if (document.fonts?.ready) {
        document.fonts.ready.then(function () {
          ScrollTrigger.refresh();
        });
      }

      return function () {
        storyTrigger.kill();

        setVideoPlayback(approachVideo, true);

        movedVisuals.forEach(function (item) {
          restoreVisual(item);
        });

        [heroVisual, approachVisual, platformVisual, bottomGradient].forEach(
          function (element) {
            element.style.removeProperty("opacity");
            element.style.removeProperty("visibility");
          },
        );

        gsap.set([visualStage, fadeStage], {
          clearProps: "display,position,top,left",
        });
      };
    },
  );

  window.addEventListener(
    "load",
    function () {
      ScrollTrigger.refresh();
    },
    {
      once: true,
    },
  );
}

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

    graphs.forEach((_, index) => {
      const timeline = getTimeline(index);

      if (timeline) {
        timeline.pause(0);
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

      if (resetGraphs() || attempts > 20) {
        clearInterval(interval);
      }
    }, 20);
  }

  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    if (reducedMotion) {
      gsap.set(rows, {
        autoAlpha: 1,
      });

      return;
    }

    const triggerStart = "top 75%";
    const finalDwellVH = 50;

    gsap.set(rows, {
      autoAlpha: 1,
      minHeight: "100vh",
    });

    gsap.set(stage, {
      position: "relative",
    });

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

    rows.forEach((row, index) => {
      const visualWrap = row.querySelector("[data-process-visual-wrap]");

      visuals.push(visualWrap);
      stickyFrame.appendChild(visualWrap);

      gsap.set(visualWrap, {
        position: "absolute",
        autoAlpha: index === 0 ? 1 : 0,
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

      if (oldVisual) {
        gsap.to(oldVisual, {
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }

      if (newVisual) {
        gsap.to(newVisual, {
          autoAlpha: 1,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }

      lastActive = index;
    }

    rows.forEach((row, index) => {
      const leftWrap = row.querySelector("[data-process-left]");

      if (!leftWrap) return;

      const trigger = ScrollTrigger.create({
        trigger: leftWrap,
        start: triggerStart,
        onEnter: () => transitionTo(index, 1),
        onEnterBack: () => transitionTo(index, -1),
      });

      triggers.push(trigger);
    });

    return () => {
      pinTrigger.kill();

      triggers.forEach((trigger) => {
        trigger.kill();
      });

      rows.forEach((row, index) => {
        row.appendChild(visuals[index]);

        gsap.set(visuals[index], {
          clearProps: "all",
        });
      });

      gsap.set(rows, {
        clearProps: "all",
      });

      gsap.set(stage, {
        clearProps: "all",
      });

      rightTrack.remove();
    };
  });

  mm.add("(max-width: 767px)", () => {
    gsap.set(rows, {
      autoAlpha: 1,
      pointerEvents: "auto",
    });

    if (reducedMotion) return;

    const triggers = [];

    rows.forEach((row, index) => {
      const visualWrap = row.querySelector("[data-process-visual-wrap]");

      if (!visualWrap) return;

      const trigger = ScrollTrigger.create({
        trigger: visualWrap,
        start: "top 60%",
        onEnter: () => getTimeline(index)?.restart(),
        onEnterBack: () => getTimeline(index)?.restart(),
      });

      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((trigger) => {
        trigger.kill();
      });

      gsap.set(rows, {
        clearProps: "all",
      });
    };
  });
}

/* Sort Advisors list, Surname L - R */
function initAdvisorSorting() {
  const list = document.querySelector("[data-advisors-list]");

  if (!list) return;

  const items = Array.from(list.querySelectorAll("[data-advisor-item]"));

  function getSurname(item) {
    const name = item.querySelector("[data-advisor-name]");

    if (!name) return "";

    const parts = name.textContent
      .trim()
      .replace(/^(Prof\.|Dr\.)\s+/i, "")
      .split(/\s+/);

    return parts.at(-1) || "";
  }

  items
    .sort((a, b) =>
      getSurname(a).localeCompare(getSurname(b), undefined, {
        sensitivity: "base",
      }),
    )
    .forEach((item) => {
      list.appendChild(item);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  initHeroVideo();
  initHeroApproachPlatformStory();
  initMobileNavigation();
  initProcessSection();
  initAdvisorSorting();
});
