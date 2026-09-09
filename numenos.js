function initBackgroundMedia() {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

  const mediaItems = document.querySelectorAll("[data-bg-media]");
  const sections = document.querySelectorAll("[data-section]");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const mobileQuery = window.matchMedia("(max-width: 767px)");

  if (!mediaItems.length || !sections.length) return;

  const userAgent = navigator.userAgent;

  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|FxiOS/i.test(userAgent);

  const useWebKitMediaWorkarounds = isSafari || isIOS;

  const CONFIG = {
    heroBufferSeconds: 6,
    videoRevealDuration: 0.6,

    mediaRevealStart: "top 50%",
    mediaRevealEnd: "top 5%",
    mediaRevealScrub: 0.55,

    staticMediaRevealStart: "top 75%",
    staticMediaRevealEnd: "top 25%",
    staticMediaRevealScrub: 0.55,

    aboutFallbackScrollDistance: 1800,
    aboutPixelsPerSecond: 110,
    aboutMinScrollDistance: 1400,
    aboutMaxScrollDistance: 2400,
    aboutScrub: 0.45,

    aboutTextStart: 0.08,
    aboutLineDuration: 0.3,

    storyScrub: 0.45,
    storyDesktopMinScrollDistance: 2600,
    storyMobileMinScrollDistance: 2200,
    storyMaxScrollDistance: 4200,
    storyViewportMultiplier: 1.45,

    storyStep1MoveStart: 0.2,
    storyStep2Center: 0.46,
    storyStep2MoveStart: 0.62,
    storyStep3Center: 0.88,

    insightsScrub: 0.4,
    insightsPreloadStart: "top 200%",
    insightsContentRevealStart: "top 20%",
    insightsContentRevealEnd: "top 2%",

    cLayersFallbackScrollDistance: 1800,
    cLayersPixelsPerSecond: 110,
    cLayersMinScrollDistance: 1400,
    cLayersMaxScrollDistance: 2400,
    cLayersScrub: 0.45,
    cLayersPrepareStart: "top 300%",

    webKitSeekWatchdog: isIOS ? 320 : 220,
    webKitPrimeTimeout: isIOS ? 450 : 300,
  };

  CustomEase.create("softReveal", "M0,0 C0.16,1 0.3,1 1,1");

  const mediaMap = new Map();

  let heroPlaybackEnabled = true;

  mediaItems.forEach((item, index) => {
    const key = item.getAttribute("data-bg-media");
    const video = item.querySelector("[data-bg-video]");

    if (!key) return;

    mediaMap.set(key, {
      item,
      video,
      loaded: false,
      ready: false,
      primed: false,
      primePromise: null,
      scrubber: null,
      scrubProgress: 0,
    });

    gsap.set(item, {
      opacity: 0,
      scale: 1,
      zIndex: index + 1,
    });

    if (video) {
      gsap.set(video, {
        opacity: 0,
      });
    }
  });

  function getVideoSource(item) {
    const desktopSource = item.getAttribute("data-video-desktop");

    const mobileSource = item.getAttribute("data-video-mobile");

    if (mobileQuery.matches && mobileSource) {
      return mobileSource;
    }

    return desktopSource || mobileSource || "";
  }

  function hasVideoSource(media) {
    if (!media) return false;

    return Boolean(getVideoSource(media.item));
  }

  function getSectionMedia(section) {
    if (!section) return null;

    const key = section.getAttribute("data-section");

    return mediaMap.get(key) || null;
  }

  function getScrubPrepareOptions(role) {
    if (!useWebKitMediaWorkarounds) {
      return {};
    }

    if (role === "about") {
      return {
        bufferFraction: 0.9,
        maxWaitMs: 9000,
      };
    }

    if (role === "story") {
      return {
        bufferFraction: 0.75,
        maxWaitMs: 12000,
      };
    }

    if (role === "insights") {
      return {
        bufferFraction: 0.9,
        maxWaitMs: 9000,
      };
    }

    if (role === "c-layers") {
      return {
        bufferFraction: 0.9,
        bufferSeconds: 8,
        maxWaitMs: 12000,
      };
    }

    return {};
  }

  function configureVideo(video) {
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.controls = false;

    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    if ("disablePictureInPicture" in video) {
      video.disablePictureInPicture = true;
    }
  }

  function loadVideo(media) {
    if (!media || !media.video || media.loaded || reducedMotion.matches) {
      return;
    }

    const source = getVideoSource(media.item);

    if (!source) return;

    const video = media.video;

    configureVideo(video);

    media.loaded = true;

    video.preload = "auto";
    video.setAttribute("preload", "auto");
    video.src = source;

    video.load();
  }

  function waitForVideoReady(video) {
    if (video.error) {
      return Promise.resolve(false);
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      function cleanup(result) {
        video.removeEventListener("loadeddata", handleReady);

        video.removeEventListener("error", handleError);

        resolve(result);
      }

      function handleReady() {
        cleanup(true);
      }

      function handleError() {
        cleanup(false);
      }

      video.addEventListener("loadeddata", handleReady);

      video.addEventListener("error", handleError);
    });
  }

  function getBufferedEndFromStart(video) {
    if (!video.buffered.length) return 0;

    let bufferedEnd = 0;

    for (let index = 0; index < video.buffered.length; index += 1) {
      const start = video.buffered.start(index);
      const end = video.buffered.end(index);

      if (start <= 0.1) {
        bufferedEnd = Math.max(bufferedEnd, end);
      }
    }

    return bufferedEnd;
  }

  function isTimeBuffered(video, time) {
    if (!video.buffered.length) return false;

    for (let index = 0; index < video.buffered.length; index += 1) {
      const start = video.buffered.start(index);
      const end = video.buffered.end(index);

      if (time + 0.03 >= start && time <= end - 0.02) {
        return true;
      }
    }

    return false;
  }

  function waitForVideoBuffer(video, options = {}) {
    const bufferSeconds = options.bufferSeconds || 0;

    const bufferFraction = options.bufferFraction || 0;

    const maxWaitMs = options.maxWaitMs || 12000;

    const allowReadyState = options.allowReadyState || false;

    if (!bufferSeconds && !bufferFraction) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const startedAt = performance.now();

      let timerId = null;
      let resolved = false;

      function cleanup(result) {
        if (resolved) return;

        resolved = true;

        clearTimeout(timerId);

        video.removeEventListener("progress", checkBuffer);

        video.removeEventListener("canplaythrough", checkBuffer);

        video.removeEventListener("error", handleError);

        resolve(result);
      }

      function handleError() {
        cleanup(false);
      }

      function checkBuffer() {
        if (resolved) return;

        if (video.error) {
          cleanup(false);
          return;
        }

        if (video.duration && Number.isFinite(video.duration)) {
          const fractionTarget = video.duration * bufferFraction;

          const target = Math.min(
            video.duration,
            Math.max(bufferSeconds, fractionTarget),
          );

          const bufferedEnd = getBufferedEndFromStart(video);

          if (bufferedEnd >= target - 0.05) {
            cleanup(true);
            return;
          }

          if (
            allowReadyState &&
            video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
          ) {
            cleanup(true);
            return;
          }
        }

        if (performance.now() - startedAt >= maxWaitMs) {
          cleanup(false);
          return;
        }

        timerId = setTimeout(checkBuffer, 150);
      }

      video.addEventListener("progress", checkBuffer);

      video.addEventListener("canplaythrough", checkBuffer);

      video.addEventListener("error", handleError);

      checkBuffer();
    });
  }

  function waitForVideoSignal(video, timeoutMs) {
    return new Promise((resolve) => {
      let resolved = false;
      let timeoutId = null;
      let frameCallbackId = null;

      function cleanup() {
        if (resolved) return;

        resolved = true;

        clearTimeout(timeoutId);

        video.removeEventListener("seeked", handleSignal);

        if (
          frameCallbackId !== null &&
          typeof video.cancelVideoFrameCallback === "function"
        ) {
          try {
            video.cancelVideoFrameCallback(frameCallbackId);
          } catch (error) {
            // No-op.
          }
        }

        resolve();
      }

      function handleSignal() {
        cleanup();
      }

      video.addEventListener("seeked", handleSignal);

      if (typeof video.requestVideoFrameCallback === "function") {
        try {
          frameCallbackId = video.requestVideoFrameCallback(handleSignal);
        } catch (error) {
          frameCallbackId = null;
        }
      }

      timeoutId = setTimeout(cleanup, timeoutMs);
    });
  }

  function delay(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  function primeVideoDecoder(media) {
    if (!useWebKitMediaWorkarounds || !media || !media.video) {
      return Promise.resolve(true);
    }

    if (media.primed) {
      return Promise.resolve(true);
    }

    if (media.primePromise) {
      return media.primePromise;
    }

    media.primePromise = (async function () {
      const video = media.video;

      configureVideo(video);

      try {
        if (!document.hidden) {
          const playPromise = video.play();

          if (playPromise) {
            await Promise.race([
              playPromise.catch(function () {}),
              delay(CONFIG.webKitPrimeTimeout),
            ]);
          }

          await waitForVideoSignal(video, CONFIG.webKitPrimeTimeout);

          video.pause();
        }

        if (video.duration && Number.isFinite(video.duration)) {
          const safeDuration = Math.max(0, video.duration - 0.034);

          const nudgeTime = Math.min(0.08, safeDuration);

          if (nudgeTime > 0 && isTimeBuffered(video, nudgeTime)) {
            video.currentTime = nudgeTime;

            await waitForVideoSignal(video, CONFIG.webKitPrimeTimeout);
          }

          const desiredTime = safeDuration * media.scrubProgress;

          if (isTimeBuffered(video, desiredTime)) {
            video.currentTime = desiredTime;

            await waitForVideoSignal(video, CONFIG.webKitPrimeTimeout);
          } else if (isTimeBuffered(video, 0)) {
            video.currentTime = 0;
          }
        }
      } catch (error) {
        // Keep the static fallback visible.
      }

      video.pause();

      media.primed = true;

      return true;
    })();

    return media.primePromise;
  }

  function revealVideo(media, duration = CONFIG.videoRevealDuration) {
    if (!media || !media.video || media.ready) {
      return;
    }

    media.ready = true;

    gsap.to(media.video, {
      opacity: 1,
      duration,
      ease: "power2.out",
      overwrite: true,
    });
  }

  function safePlay(video) {
    if (!video || reducedMotion.matches || document.hidden) {
      return;
    }

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(function () {});
    }
  }

  function setHeroPlayback(enabled, media) {
    if (!media || !media.video) return;

    if (heroPlaybackEnabled === enabled) {
      return;
    }

    heroPlaybackEnabled = enabled;

    if (enabled) {
      safePlay(media.video);
      return;
    }

    media.video.pause();
  }

  function createVideoScrubber(video) {
    let targetTime = 0;
    let isSeeking = false;
    let rafId = null;
    let watchdogId = null;
    let frameCallbackId = null;
    let destroyed = false;

    const seekThreshold = useWebKitMediaWorkarounds ? 0.025 : 0.018;

    function getSafeDuration() {
      if (!video.duration || !Number.isFinite(video.duration)) {
        return 0;
      }

      return Math.max(0, video.duration - 0.034);
    }

    function getTimeFromProgress(progress) {
      const duration = getSafeDuration();

      if (!duration) return 0;

      return duration * gsap.utils.clamp(0, 1, progress);
    }

    function clearSeekGuards() {
      clearTimeout(watchdogId);

      watchdogId = null;

      if (
        frameCallbackId !== null &&
        typeof video.cancelVideoFrameCallback === "function"
      ) {
        try {
          video.cancelVideoFrameCallback(frameCallbackId);
        } catch (error) {
          // No-op.
        }
      }

      frameCallbackId = null;
    }

    function completeSeek() {
      if (destroyed) return;

      clearSeekGuards();

      isSeeking = false;

      if (Math.abs(targetTime - video.currentTime) > seekThreshold) {
        queueSeek();
      }
    }

    function armSeekGuards() {
      clearSeekGuards();

      watchdogId = setTimeout(completeSeek, CONFIG.webKitSeekWatchdog);

      if (typeof video.requestVideoFrameCallback === "function") {
        try {
          frameCallbackId = video.requestVideoFrameCallback(completeSeek);
        } catch (error) {
          frameCallbackId = null;
        }
      }
    }

    function canSeekToTarget() {
      if (!useWebKitMediaWorkarounds) {
        return true;
      }

      return isTimeBuffered(video, targetTime);
    }

    function queueSeek() {
      if (destroyed || isSeeking || rafId !== null) {
        return;
      }

      rafId = requestAnimationFrame(performSeek);
    }

    function performSeek() {
      rafId = null;

      if (destroyed || isSeeking) {
        return;
      }

      const duration = getSafeDuration();

      if (!duration) return;

      targetTime = gsap.utils.clamp(0, duration, targetTime);

      const difference = targetTime - video.currentTime;

      if (Math.abs(difference) < seekThreshold) {
        return;
      }

      if (!canSeekToTarget()) {
        return;
      }

      isSeeking = true;

      try {
        video.currentTime = targetTime;

        if (useWebKitMediaWorkarounds) {
          armSeekGuards();
        }
      } catch (error) {
        isSeeking = false;
      }
    }

    function handleSeeked() {
      completeSeek();
    }

    function handleProgress() {
      if (!isSeeking) {
        queueSeek();
      }
    }

    function handleLoadedData() {
      if (!isSeeking) {
        queueSeek();
      }
    }

    video.addEventListener("seeked", handleSeeked);

    video.addEventListener("progress", handleProgress);

    video.addEventListener("loadeddata", handleLoadedData);

    return {
      setProgress(progress) {
        const duration = getSafeDuration();

        if (!duration) return;

        targetTime = getTimeFromProgress(progress);

        queueSeek();
      },

      forceProgress(progress) {
        const duration = getSafeDuration();

        if (!duration) return;

        targetTime = getTimeFromProgress(progress);

        if (rafId !== null) {
          cancelAnimationFrame(rafId);

          rafId = null;
        }

        if (useWebKitMediaWorkarounds && !canSeekToTarget()) {
          return;
        }

        clearSeekGuards();

        isSeeking = false;

        performSeek();
      },

      reset() {
        targetTime = 0;

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          try {
            video.currentTime = 0;
          } catch (error) {
            // No-op.
          }
        }
      },

      destroy() {
        destroyed = true;

        clearSeekGuards();

        video.removeEventListener("seeked", handleSeeked);

        video.removeEventListener("progress", handleProgress);

        video.removeEventListener("loadeddata", handleLoadedData);

        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      },
    };
  }

  function setScrubProgress(media, progress) {
    if (!media) return;

    media.scrubProgress = gsap.utils.clamp(0, 1, progress);

    if (!media.scrubber) return;

    media.scrubber.setProgress(media.scrubProgress);
  }

  function forceScrubProgress(media, progress) {
    if (!media) return;

    media.scrubProgress = gsap.utils.clamp(0, 1, progress);

    if (!media.scrubber) return;

    media.scrubber.forceProgress(media.scrubProgress);
  }

  async function prepareScrubVideo(media, options = {}) {
    if (!media || !media.video || reducedMotion.matches) {
      return false;
    }

    loadVideo(media);

    const video = media.video;

    configureVideo(video);

    video.loop = false;
    video.pause();

    const ready = await waitForVideoReady(video);

    if (!ready) {
      return false;
    }

    if (options.bufferSeconds || options.bufferFraction) {
      await waitForVideoBuffer(video, {
        bufferSeconds: options.bufferSeconds,
        bufferFraction: options.bufferFraction,
        maxWaitMs: options.maxWaitMs,
      });
    }

    if (useWebKitMediaWorkarounds) {
      await primeVideoDecoder(media);
    }

    if (!media.scrubber) {
      media.scrubber = createVideoScrubber(video);
    }

    revealVideo(media, 0.35);

    media.scrubber.setProgress(media.scrubProgress);

    return true;
  }

  function releaseScrubVideo(media) {
    if (!useWebKitMediaWorkarounds || !media || !media.video || !media.loaded) {
      return;
    }

    const video = media.video;

    video.pause();

    if (media.scrubber) {
      media.scrubber.destroy();
      media.scrubber = null;
    }

    media.primePromise = null;
    media.primed = false;
    media.ready = false;
    media.loaded = false;

    gsap.killTweensOf(video);

    gsap.set(video, {
      opacity: 0,
    });

    video.removeAttribute("src");

    video.preload = "none";
    video.setAttribute("preload", "none");

    try {
      video.load();
    } catch (error) {
      // No-op.
    }
  }

  function getAboutScrollDistance(video) {
    if (!video || !video.duration || !Number.isFinite(video.duration)) {
      return CONFIG.aboutFallbackScrollDistance;
    }

    const calculatedDistance = video.duration * CONFIG.aboutPixelsPerSecond;

    return Math.round(
      gsap.utils.clamp(
        CONFIG.aboutMinScrollDistance,
        CONFIG.aboutMaxScrollDistance,
        calculatedDistance,
      ),
    );
  }

  function getStoryScrollDistance(rowCount) {
    const rowTransitions = Math.max(1, rowCount - 1);

    const viewportDistance =
      rowTransitions * window.innerHeight * CONFIG.storyViewportMultiplier;

    const minimumDistance = mobileQuery.matches
      ? CONFIG.storyMobileMinScrollDistance
      : CONFIG.storyDesktopMinScrollDistance;

    return Math.round(
      gsap.utils.clamp(
        minimumDistance,
        CONFIG.storyMaxScrollDistance,
        viewportDistance,
      ),
    );
  }

  function getNaturalSectionScrollDistance(section) {
    return Math.max(1, section.offsetHeight - window.innerHeight);
  }

  function getCLayersScrollDistance(video) {
    if (!video || !video.duration || !Number.isFinite(video.duration)) {
      return CONFIG.cLayersFallbackScrollDistance;
    }

    const calculatedDistance = video.duration * CONFIG.cLayersPixelsPerSecond;

    return Math.round(
      gsap.utils.clamp(
        CONFIG.cLayersMinScrollDistance,
        CONFIG.cLayersMaxScrollDistance,
        calculatedDistance,
      ),
    );
  }

  function createStackedMediaReveal(
    trigger,
    incomingMedia,
    outgoingMedia,
    options = {},
  ) {
    if (!trigger || !incomingMedia || !outgoingMedia) {
      return null;
    }

    const start = options.start || CONFIG.mediaRevealStart;

    const end = options.end || CONFIG.mediaRevealEnd;

    const scrub = options.scrub ?? CONFIG.mediaRevealScrub;

    incomingMedia.item.classList.add("is-media-reveal");

    gsap.set(incomingMedia.item, {
      opacity: 1,
      scale: 1.018,
      "--media-reveal": "-16%",
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
      },
    });

    timeline.to(
      incomingMedia.item,
      {
        "--media-reveal": "114%",
        scale: 1,
        duration: 1,
        ease: "none",
      },
      0,
    );

    timeline.to(
      outgoingMedia.item,
      {
        scale: 0.992,
        opacity: 0.72,
        duration: 0.55,
        ease: "none",
      },
      0.28,
    );

    timeline.to(
      outgoingMedia.item,
      {
        opacity: 0,
        duration: 0.25,
        ease: "none",
      },
      0.75,
    );

    return timeline;
  }

  function createReducedMotionMediaSwap(section, incomingMedia, outgoingMedia) {
    if (!section || !incomingMedia || !outgoingMedia) {
      return;
    }

    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",

      onEnter: function () {
        gsap.set(outgoingMedia.item, {
          opacity: 0,
        });

        gsap.set(incomingMedia.item, {
          opacity: 1,
        });
      },

      onLeaveBack: function () {
        gsap.set(outgoingMedia.item, {
          opacity: 1,
        });

        gsap.set(incomingMedia.item, {
          opacity: 0,
        });
      },
    });
  }

  function createStoryTextTimeline(rows) {
    const timeline = gsap.timeline({
      paused: true,
    });

    const timelineClock = {
      progress: 0,
    };

    timeline.to(
      timelineClock,
      {
        progress: 1,
        duration: 1,
        ease: "none",
      },
      0,
    );

    rows.forEach((row) => {
      const eyebrow = row.querySelector("[data-story-eyebrow]");

      const title = row.querySelector("[data-story-title]");

      const subtext = row.querySelector("[data-story-subtext]");

      if (eyebrow) {
        gsap.set(eyebrow, {
          opacity: 0,
          y: 14,
          filter: "blur(5px)",
        });
      }

      if (title) {
        gsap.set(title, {
          opacity: 0,
          y: 30,
          filter: "blur(10px)",
        });
      }

      if (subtext) {
        gsap.set(subtext, {
          opacity: 0,
          y: 20,
          filter: "blur(7px)",
        });
      }
    });

    const revealStarts = [0, 0.42, 0.82];

    const exitStarts = [0.22, 0.64];

    rows.forEach((row, index) => {
      const eyebrow = row.querySelector("[data-story-eyebrow]");

      const title = row.querySelector("[data-story-title]");

      const subtext = row.querySelector("[data-story-subtext]");

      const revealStart = revealStarts[index] ?? index / rows.length;

      if (eyebrow) {
        timeline.to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.08,
            ease: "softReveal",
          },
          revealStart,
        );
      }

      if (title) {
        timeline.to(
          title,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.12,
            ease: "softReveal",
          },
          revealStart + 0.025,
        );
      }

      if (subtext) {
        timeline.to(
          subtext,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.11,
            ease: "softReveal",
          },
          revealStart + 0.065,
        );
      }

      if (index >= rows.length - 1) {
        return;
      }

      const exitStart = exitStarts[index];

      const elements = [eyebrow, title, subtext].filter(Boolean);

      timeline.to(
        elements,
        {
          opacity: 0,
          y: -18,
          filter: "blur(7px)",
          duration: 0.15,
          ease: "power1.in",
          stagger: 0.012,
        },
        exitStart,
      );
    });

    return timeline;
  }

  async function initHero() {
    const hero = document.querySelector('[data-media-role="hero"]');

    if (!hero) return null;

    const heroMedia = getSectionMedia(hero);

    if (!heroMedia) return null;

    gsap.set(heroMedia.item, {
      opacity: 1,
      scale: 1,
    });

    if (!heroMedia.video || reducedMotion.matches) {
      return heroMedia;
    }

    const video = heroMedia.video;

    video.loop = true;

    loadVideo(heroMedia);

    await waitForVideoBuffer(video, {
      bufferSeconds: CONFIG.heroBufferSeconds,
      maxWaitMs: 12000,
      allowReadyState: true,
    });

    if (!heroPlaybackEnabled) {
      return heroMedia;
    }

    try {
      await video.play();

      if (!video.paused) {
        revealVideo(heroMedia);
      }
    } catch (error) {
      return heroMedia;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        video.pause();
        return;
      }

      if (heroPlaybackEnabled) {
        safePlay(video);
      }
    });

    return heroMedia;
  }

  async function initAbout(heroReadyPromise) {
    const hero = document.querySelector('[data-media-role="hero"]');

    const about = document.querySelector('[data-media-role="about"]');

    if (!hero || !about) {
      return null;
    }

    const heroMedia = getSectionMedia(hero);

    const aboutMedia = getSectionMedia(about);

    const aboutTitle = about.querySelector("[data-about-title]");

    if (!heroMedia || !aboutMedia) {
      return null;
    }

    if (reducedMotion.matches) {
      if (aboutTitle) {
        gsap.set(aboutTitle, {
          opacity: 1,
          clearProps: "filter,transform",
        });
      }

      createReducedMotionMediaSwap(about, aboutMedia, heroMedia);

      return aboutMedia;
    }

    let textTimeline = null;
    let currentProgress = 0;

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    function createAboutTextAnimation(self) {
      const lines = self.lines;

      if (!lines.length) {
        return null;
      }

      gsap.set(lines, {
        opacity: 0,
        yPercent: 28,
        filter: "blur(10px)",
        "--line-reveal": "0%",
      });

      const timeline = gsap.timeline({
        paused: true,
      });

      const availableStagger =
        1 - CONFIG.aboutTextStart - CONFIG.aboutLineDuration;

      const lineStagger =
        lines.length > 1 ? availableStagger / (lines.length - 1) : 0;

      lines.forEach(function (line, index) {
        const position = CONFIG.aboutTextStart + index * lineStagger;

        timeline.to(
          line,
          {
            opacity: 1,
            yPercent: 0,
            filter: "blur(0px)",
            "--line-reveal": "100%",
            duration: CONFIG.aboutLineDuration,
            ease: "softReveal",
          },
          position,
        );
      });

      timeline.progress(currentProgress);

      textTimeline = timeline;

      return timeline;
    }

    if (aboutTitle) {
      SplitText.create(aboutTitle, {
        type: "lines",
        linesClass: "about-line",
        autoSplit: true,

        onSplit: function (self) {
          return createAboutTextAnimation(self);
        },
      });
    }

    heroReadyPromise.then(function () {
      prepareScrubVideo(aboutMedia, getScrubPrepareOptions("about")).then(
        function (ready) {
          if (!ready) return;

          ScrollTrigger.refresh();
        },
      );
    });

    createStackedMediaReveal(about, aboutMedia, heroMedia);

    const progressState = {
      value: 0,
    };

    const aboutTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: about,
        start: "top top",

        end: function () {
          return `+=${getAboutScrollDistance(aboutMedia.video)}`;
        },

        pin: true,
        scrub: CONFIG.aboutScrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,

        onEnter: function () {
          setHeroPlayback(false, heroMedia);

          prepareScrubVideo(aboutMedia, getScrubPrepareOptions("about"));
        },

        onEnterBack: function () {
          setHeroPlayback(false, heroMedia);

          prepareScrubVideo(aboutMedia, getScrubPrepareOptions("about"));
        },

        onLeaveBack: function () {
          setHeroPlayback(true, heroMedia);
        },
      },
    });

    aboutTimeline.to(
      progressState,
      {
        value: 1,
        duration: 1,
        ease: "none",

        onUpdate: function () {
          currentProgress = progressState.value;

          if (textTimeline) {
            textTimeline.progress(currentProgress);
          }

          setScrubProgress(aboutMedia, currentProgress);
        },
      },
      0,
    );

    return aboutMedia;
  }

  async function initStory(aboutReadyPromise) {
    await aboutReadyPromise;

    const about = document.querySelector('[data-media-role="about"]');

    const story = document.querySelector('[data-media-role="story"]');

    if (!about || !story) {
      return null;
    }

    const aboutMedia = getSectionMedia(about);

    const storyMedia = getSectionMedia(story);

    const rows = gsap.utils.toArray(story.querySelectorAll("[data-story-row]"));

    if (!aboutMedia || !storyMedia || !rows.length) {
      return null;
    }

    if (reducedMotion.matches) {
      createReducedMotionMediaSwap(story, storyMedia, aboutMedia);

      return storyMedia;
    }

    ScrollTrigger.create({
      trigger: about,
      start: "top top",

      onEnter: function () {
        prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
      },

      onEnterBack: function () {
        prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
      },
    });

    createStackedMediaReveal(story, storyMedia, aboutMedia);

    const storyTextTimeline = createStoryTextTimeline(rows);

    const progressState = {
      value: 0,
    };

    gsap.set(rows, {
      yPercent: 0,
    });

    const storyTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: story,
        start: "top top",

        end: function () {
          return `+=${getStoryScrollDistance(rows.length)}`;
        },

        pin: true,
        scrub: CONFIG.storyScrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,

        onEnter: function () {
          prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));

          releaseScrubVideo(aboutMedia);
        },

        onEnterBack: function () {
          prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
        },

        onLeaveBack: function () {
          prepareScrubVideo(aboutMedia, getScrubPrepareOptions("about"));
        },
      },
    });

    storyTimeline.to(
      rows,
      {
        yPercent: -100,
        duration: CONFIG.storyStep2Center - CONFIG.storyStep1MoveStart,
        ease: "none",
      },
      CONFIG.storyStep1MoveStart,
    );

    storyTimeline.to(
      rows,
      {
        yPercent: -200,
        duration: CONFIG.storyStep3Center - CONFIG.storyStep2MoveStart,
        ease: "none",
      },
      CONFIG.storyStep2MoveStart,
    );

    storyTimeline.to(
      progressState,
      {
        value: 1,
        duration: 1,
        ease: "none",

        onUpdate: function () {
          const progress = progressState.value;

          storyTextTimeline.progress(progress);

          setScrubProgress(storyMedia, progress);
        },
      },
      0,
    );

    return storyMedia;
  }

  async function initInsights(storyReadyPromise) {
    await storyReadyPromise;

    const story = document.querySelector('[data-media-role="story"]');

    const insights = document.querySelector('[data-media-role="insights"]');

    if (!story || !insights) {
      return null;
    }

    const storyMedia = getSectionMedia(story);

    const insightsMedia = getSectionMedia(insights);

    const insightsContent = insights.querySelector("[data-insights-content]");

    if (!storyMedia || !insightsMedia) {
      return null;
    }

    if (reducedMotion.matches) {
      if (insightsContent) {
        gsap.set(insightsContent, {
          opacity: 1,
          clearProps: "filter,transform",
        });
      }

      createReducedMotionMediaSwap(insights, insightsMedia, storyMedia);

      return insightsMedia;
    }

    if (insightsContent) {
      gsap.set(insightsContent, {
        opacity: 0,
        y: 24,
        filter: "blur(8px)",
      });

      gsap.to(insightsContent, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        ease: "softReveal",

        scrollTrigger: {
          trigger: insights,
          start: CONFIG.insightsContentRevealStart,
          end: CONFIG.insightsContentRevealEnd,
          scrub: 0.45,
        },
      });
    }

    ScrollTrigger.create({
      trigger: insights,
      start: CONFIG.insightsPreloadStart,
      once: true,

      onEnter: function () {
        prepareScrubVideo(insightsMedia, getScrubPrepareOptions("insights"));
      },
    });

    createStackedMediaReveal(insights, insightsMedia, storyMedia);

    const progressState = {
      value: 0,
    };

    const insightsTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: insights,
        start: "top top",

        end: function () {
          return `+=${getNaturalSectionScrollDistance(insights)}`;
        },

        scrub: CONFIG.insightsScrub,
        invalidateOnRefresh: true,

        onEnter: function () {
          prepareScrubVideo(insightsMedia, getScrubPrepareOptions("insights"));

          releaseScrubVideo(storyMedia);
        },

        onEnterBack: function () {
          prepareScrubVideo(insightsMedia, getScrubPrepareOptions("insights"));
        },

        onLeave: function () {
          forceScrubProgress(insightsMedia, 1);
        },

        onLeaveBack: function () {
          forceScrubProgress(insightsMedia, 0);

          prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
        },
      },
    });

    insightsTimeline.to(
      progressState,
      {
        value: 1,
        duration: 1,
        ease: "none",

        onUpdate: function () {
          setScrubProgress(insightsMedia, progressState.value);
        },
      },
      0,
    );

    return insightsMedia;
  }

  async function initCLayers(insightsReadyPromise) {
    await insightsReadyPromise;

    const insights = document.querySelector('[data-media-role="insights"]');

    const cLayers = document.querySelector('[data-media-role="c-layers"]');

    if (!insights || !cLayers) {
      return null;
    }

    const insightsMedia = getSectionMedia(insights);

    const cLayersMedia = getSectionMedia(cLayers);

    if (!insightsMedia || !cLayersMedia) {
      return null;
    }

    if (reducedMotion.matches) {
      createReducedMotionMediaSwap(cLayers, cLayersMedia, insightsMedia);

      return cLayersMedia;
    }

    ScrollTrigger.create({
      trigger: insights,
      start: CONFIG.mediaRevealStart,
      once: true,

      onEnter: function () {
        loadVideo(cLayersMedia);
      },
    });

    ScrollTrigger.create({
      trigger: cLayers,
      start: CONFIG.cLayersPrepareStart,
      once: true,

      onEnter: function () {
        prepareScrubVideo(
          cLayersMedia,
          getScrubPrepareOptions("c-layers"),
        ).then(function (ready) {
          if (!ready) return;

          ScrollTrigger.refresh();
        });
      },
    });

    createStackedMediaReveal(cLayers, cLayersMedia, insightsMedia);

    const progressState = {
      value: 0,
    };

    const cLayersTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: cLayers,
        start: "top top",

        end: function () {
          return `+=${getCLayersScrollDistance(cLayersMedia.video)}`;
        },

        pin: true,
        scrub: CONFIG.cLayersScrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,

        onEnter: function () {
          prepareScrubVideo(cLayersMedia, getScrubPrepareOptions("c-layers"));

          releaseScrubVideo(insightsMedia);
        },

        onEnterBack: function () {
          prepareScrubVideo(cLayersMedia, getScrubPrepareOptions("c-layers"));
        },

        onLeave: function () {
          forceScrubProgress(cLayersMedia, 1);
        },

        onLeaveBack: function () {
          forceScrubProgress(cLayersMedia, 0);

          prepareScrubVideo(insightsMedia, getScrubPrepareOptions("insights"));
        },
      },
    });

    cLayersTimeline.to(
      progressState,
      {
        value: 1,
        duration: 1,
        ease: "none",

        onUpdate: function () {
          setScrubProgress(cLayersMedia, progressState.value);
        },
      },
      0,
    );

    return cLayersMedia;
  }

  async function initStaticMediaSections(cLayersReadyPromise) {
    const cLayersMedia = await cLayersReadyPromise;

    if (!cLayersMedia) return;

    const cLayers = document.querySelector('[data-media-role="c-layers"]');

    if (!cLayers) return;

    const allSections = Array.from(sections);

    const cLayersIndex = allSections.indexOf(cLayers);

    if (cLayersIndex === -1) {
      return;
    }

    const lowerSections = allSections.slice(cLayersIndex + 1);

    const staticSections = lowerSections.filter(function (section) {
      const media = getSectionMedia(section);

      if (!media) {
        return false;
      }

      return !hasVideoSource(media);
    });

    if (!staticSections.length) {
      return;
    }

    let outgoingMedia = cLayersMedia;

    staticSections.forEach(function (section) {
      const incomingMedia = getSectionMedia(section);

      if (!incomingMedia) {
        return;
      }

      if (reducedMotion.matches) {
        createReducedMotionMediaSwap(section, incomingMedia, outgoingMedia);
      } else {
        createStackedMediaReveal(section, incomingMedia, outgoingMedia, {
          start: CONFIG.staticMediaRevealStart,
          end: CONFIG.staticMediaRevealEnd,
          scrub: CONFIG.staticMediaRevealScrub,
        });
      }

      outgoingMedia = incomingMedia;
    });
  }

  const heroReadyPromise = initHero();

  const aboutReadyPromise = initAbout(heroReadyPromise);

  const storyReadyPromise = initStory(aboutReadyPromise);

  const insightsReadyPromise = initInsights(storyReadyPromise);

  const cLayersReadyPromise = initCLayers(insightsReadyPromise);

  initStaticMediaSections(cLayersReadyPromise);
}

document.addEventListener("DOMContentLoaded", function () {
  initBackgroundMedia();
});
