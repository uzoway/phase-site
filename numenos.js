function initBackgroundMedia() {
  gsap.registerPlugin(ScrollTrigger);

  const mediaItems = document.querySelectorAll("[data-bg-media]");
  const sections = document.querySelectorAll("[data-section]");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

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

    aboutMediaRevealStart: "top 98%",
    aboutMediaRevealEnd: "top 55%",
    aboutMediaRevealScrub: 0.55,

    storyMediaRevealStart: "top 90%",
    storyMediaRevealEnd: "top 60%",
    storyMediaRevealScrub: 0.55,
    storyMediaRevealDistanceVh: 35,

    insightsMediaRevealStart: "top 100%",
    insightsMediaRevealEnd: "top 55%",
    insightsMediaRevealScrub: 0.6,

    cLayersMediaRevealStart: "top 45%",
    cLayersMediaRevealEnd: "top top",
    cLayersMediaRevealScrub: 0.8,
    cLayersPrepareStart: "top 300%",
    cLayersMapFadeDuration: 0.45,
    cLayersMapFadeOutStart: "bottom 75%",

    cLayersVideoTargets: {
      infrastructure: 0.403,
      memory: 0.581,
      application: 0.767,
    },

    cLayersTargetTolerance: 0.015,
    cLayersPanelInDuration: 0.42,
    cLayersPanelOutDuration: 0.22,

    staticMediaRevealStart: "top 75%",
    staticMediaRevealEnd: "top 25%",
    staticMediaRevealScrub: 0.55,

    storyScrubStart: "top 50%",
    storyScrubEnd: "bottom 100%",
    storyScrub: 0.7,
    storyPreloadStart: "top 80%",
    storyFinalTailVh: 180,
    storyIntroGapVh: 40,

    insightsScrubViewport: 0.55,
    insightsScrubStart: "top 55%",
    insightsScrubEnd: "bottom 55%",
    insightsScrub: 0.65,
    insightsPreloadStart: "top 200%",
    insightsContentStartSeconds: 4,
    insightsContentEntryViewport: 0.92,
    insightsFinalVisualHoldVh: 60,

    viewportFadeScrub: 0.28,
    viewportFadeBlur: 4,
    viewportFadeInEnd: 0.2,
    viewportFadeOutStart: 0.8,

    storyFadeBlur: 5,
    storyRevealDuration: 0.18,
    storyRevealStagger: 0.045,
    storyFadeOutStart: 0.82,
    storyFadeOutDuration: 0.18,

    heroFadeBlur: 4,
    heroFadeHold: 0.22,

    aboutReplayFadeOut: 0.18,
    aboutReplayFadeIn: 0.35,
    aboutReplaySeekTimeout: 400,

    webKitSeekWatchdog: isIOS ? 320 : 220,
    webKitPrimeTimeout: isIOS ? 450 : 300,
  };

  const mediaMap = new Map();

  let heroPlaybackEnabled = true;

  mediaItems.forEach(function (item, index) {
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

    return new Promise(function (resolve) {
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

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        cleanup(true);
      }
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

    return new Promise(function (resolve) {
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
    return new Promise(function (resolve) {
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
          } catch (error) {}
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
    return new Promise(function (resolve) {
      setTimeout(resolve, milliseconds);
    });
  }

  function tweenVideoOpacity(video, opacity, duration) {
    return new Promise(function (resolve) {
      gsap.to(video, {
        opacity,
        duration,
        ease: "power1.out",
        overwrite: true,
        onComplete: resolve,
      });
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
      } catch (error) {}

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

  async function preparePlaybackVideo(media, options = {}) {
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

    revealVideo(media, 0.35);

    return true;
  }

  async function restartPlaybackVideo(media, options = {}) {
    if (!media || !media.video) {
      return false;
    }

    const video = media.video;

    const smooth = options.smooth === true;

    const shouldContinue =
      typeof options.shouldContinue === "function"
        ? options.shouldContinue
        : function () {
            return true;
          };

    configureVideo(video);

    video.loop = false;

    if (smooth) {
      await tweenVideoOpacity(video, 0, CONFIG.aboutReplayFadeOut);

      if (!shouldContinue()) {
        return false;
      }
    }

    video.pause();

    try {
      video.currentTime = 0;
    } catch (error) {}

    if (smooth) {
      await waitForVideoSignal(video, CONFIG.aboutReplaySeekTimeout);

      if (!shouldContinue()) {
        return false;
      }
    }

    safePlay(video);

    if (smooth) {
      gsap.to(video, {
        opacity: 1,
        duration: CONFIG.aboutReplayFadeIn,
        ease: "power1.out",
        overwrite: true,
      });
    } else {
      gsap.set(video, {
        opacity: 1,
      });
    }

    return true;
  }

  function pausePlaybackVideo(media) {
    if (!media || !media.video) return;

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
        } catch (error) {}
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
      setProgress: function (progress) {
        const duration = getSafeDuration();

        if (!duration) return;

        targetTime = getTimeFromProgress(progress);

        queueSeek();
      },

      forceProgress: function (progress) {
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

      reset: function () {
        targetTime = 0;

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          try {
            video.currentTime = 0;
          } catch (error) {}
        }
      },

      destroy: function () {
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
    } catch (error) {}
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
        invalidateOnRefresh: true,
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

  function createViewportFade(trigger, targets, options = {}) {
    if (reducedMotion.matches || !trigger || !targets) {
      return null;
    }

    const elements = gsap.utils.toArray(targets).filter(Boolean);

    if (!elements.length) {
      return null;
    }

    const start = options.start || "top 90%";

    const end = options.end || "bottom 10%";

    const scrub = options.scrub ?? CONFIG.viewportFadeScrub;

    const fadeInEnd = options.fadeInEnd ?? CONFIG.viewportFadeInEnd;

    const fadeOutStart = options.fadeOutStart ?? CONFIG.viewportFadeOutStart;

    const blur = options.blur ?? CONFIG.viewportFadeBlur;

    const edgeOpacity = options.edgeOpacity ?? 0;

    gsap.set(elements, {
      opacity: edgeOpacity,
      filter: `blur(${blur}px)`,
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        invalidateOnRefresh: true,
      },
    });

    timeline.to(
      elements,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: fadeInEnd,
        ease: "none",
      },
      0,
    );

    timeline.to(
      elements,
      {
        opacity: edgeOpacity,
        filter: `blur(${blur}px)`,
        duration: 1 - fadeOutStart,
        ease: "none",
      },
      fadeOutStart,
    );

    return timeline;
  }

  function createViewportEntrance(trigger, targets, options = {}) {
    if (reducedMotion.matches || !trigger || !targets) {
      return null;
    }

    const elements = gsap.utils.toArray(targets).filter(Boolean);

    if (!elements.length) {
      return null;
    }

    const start = options.start || "top 92%";

    const end = options.end || "top 60%";

    const scrub = options.scrub ?? CONFIG.viewportFadeScrub;

    const blur = options.blur ?? CONFIG.viewportFadeBlur;

    gsap.set(elements, {
      opacity: 0,
      filter: `blur(${blur}px)`,
    });

    return gsap.to(elements, {
      opacity: 1,
      filter: "blur(0px)",
      ease: "none",

      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        invalidateOnRefresh: true,
      },
    });
  }

  function createViewportExit(trigger, targets, options = {}) {
    if (reducedMotion.matches || !trigger || !targets) {
      return null;
    }

    const elements = gsap.utils.toArray(targets).filter(Boolean);

    if (!elements.length) {
      return null;
    }

    const start = options.start || "top top";

    const end = options.end || "bottom 35%";

    const scrub = options.scrub ?? CONFIG.viewportFadeScrub;

    const blur = options.blur ?? CONFIG.heroFadeBlur;

    const holdUntil = options.holdUntil ?? CONFIG.heroFadeHold;

    gsap.set(elements, {
      opacity: 1,
      filter: "blur(0px)",
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        invalidateOnRefresh: true,
      },
    });

    timeline.to(
      elements,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: holdUntil,
        ease: "none",
      },
      0,
    );

    timeline.to(
      elements,
      {
        opacity: 0,
        filter: `blur(${blur}px)`,
        duration: 1 - holdUntil,
        ease: "none",
      },
      holdUntil,
    );

    return timeline;
  }

  function createStoryRowFade(row) {
    if (reducedMotion.matches || !row) {
      return null;
    }

    const eyebrow = row.querySelector("[data-story-eyebrow]");

    const title = row.querySelector("[data-story-title]");

    const subtext = row.querySelector("[data-story-subtext]");

    const elements = [eyebrow, title, subtext].filter(Boolean);

    if (!elements.length) {
      return null;
    }

    gsap.set(elements, {
      opacity: 0,
      filter: `blur(${CONFIG.storyFadeBlur}px)`,
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: "top 50%",
        end: "bottom 50%",
        scrub: 0.3,
        invalidateOnRefresh: true,
      },
    });

    elements.forEach(function (element, elementIndex) {
      timeline.to(
        element,
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: CONFIG.storyRevealDuration,
          ease: "none",
        },
        elementIndex * CONFIG.storyRevealStagger,
      );
    });

    timeline.to(
      elements,
      {
        opacity: 0,
        filter: `blur(${CONFIG.viewportFadeBlur}px)`,
        duration: CONFIG.storyFadeOutDuration,
        ease: "none",
      },
      CONFIG.storyFadeOutStart,
    );

    return timeline;
  }

  function getInsightsTextTargets(insights) {
    if (!insights) return [];

    const contentRoot =
      insights.querySelector("[data-insights-content]") || insights;

    const cardsContainer = insights.querySelector(".insights_cards-container");

    const candidates = Array.from(
      contentRoot.querySelectorAll("h1, h2, h3, h4, h5, h6, p"),
    );

    if (!cardsContainer) {
      return candidates.slice(0, 3);
    }

    return candidates.filter(function (element) {
      return !cardsContainer.contains(element);
    });
  }

  function createInsightsSpacingController(insights, contentRoot, media) {
    if (!insights || !contentRoot || !media || !media.video) {
      return function () {
        return false;
      };
    }

    const computedStyle = window.getComputedStyle(contentRoot);

    const basePaddingTop = parseFloat(computedStyle.paddingTop) || 0;

    const basePaddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

    function updateInsightsSpacing() {
      const video = media.video;

      if (!video.duration || !Number.isFinite(video.duration)) {
        return false;
      }

      const contentStartProgress = gsap.utils.clamp(
        0,
        0.9,
        CONFIG.insightsContentStartSeconds / video.duration,
      );

      const viewportHeight = window.innerHeight;

      contentRoot.style.paddingTop = `${basePaddingTop}px`;

      contentRoot.style.paddingBottom = `${
        basePaddingBottom +
        (viewportHeight * CONFIG.insightsFinalVisualHoldVh) / 100
      }px`;

      const firstTarget =
        getInsightsTextTargets(insights)[0] || contentRoot.firstElementChild;

      if (!firstTarget) {
        return false;
      }

      const sectionRect = insights.getBoundingClientRect();

      const firstTargetRect = firstTarget.getBoundingClientRect();

      const firstTargetOffset = firstTargetRect.top - sectionRect.top;

      const baseScrollDistance = insights.offsetHeight;

      const desiredViewportOffset =
        (CONFIG.insightsContentEntryViewport - CONFIG.insightsScrubViewport) *
        viewportHeight;

      const extraPaddingTop =
        (contentStartProgress * baseScrollDistance +
          desiredViewportOffset -
          firstTargetOffset) /
        (1 - contentStartProgress);

      contentRoot.style.paddingTop = `${
        basePaddingTop + Math.max(0, extraPaddingTop)
      }px`;

      return true;
    }

    return updateInsightsSpacing;
  }

  function initContentFades() {
    if (reducedMotion.matches) {
      return;
    }

    const hero = document.querySelector('[data-media-role="hero"]');

    if (hero) {
      const heroHeading = hero.querySelector(".hero_heading");

      const heroSubtext = hero.querySelector(".hero_subtext");

      createViewportExit(hero, [heroHeading, heroSubtext], {
        start: "top top",
        end: "bottom 35%",
        scrub: 0.3,
        holdUntil: 0.2,
        blur: 4,
      });
    }

    const about = document.querySelector('[data-media-role="about"]');

    const aboutTitle = about ? about.querySelector("[data-about-title]") : null;

    if (about && aboutTitle) {
      createViewportFade(about, aboutTitle, {
        start: "top 50%",
        end: "bottom 50%",
        scrub: 0.28,
        fadeInEnd: 0.2,
        fadeOutStart: 0.8,
        blur: 5,
      });
    }

    const story = document.querySelector('[data-media-role="story"]');

    if (story) {
      const rows = story.querySelectorAll("[data-story-row]");

      rows.forEach(function (row) {
        createStoryRowFade(row);
      });
    }

    const insights = document.querySelector('[data-media-role="insights"]');

    if (insights) {
      const insightsTextTargets = getInsightsTextTargets(insights);

      insightsTextTargets.forEach(function (element) {
        createViewportFade(element, element, {
          start: "top 90%",
          end: "bottom 10%",
          scrub: 0.28,
          fadeInEnd: 0.18,
          fadeOutStart: 0.82,
          blur: 4,
        });
      });
    }

    const pipelineTitle = document.querySelector(".pipeline_title");

    if (pipelineTitle) {
      createViewportFade(pipelineTitle, pipelineTitle, {
        start: "top 90%",
        end: "bottom 10%",
        scrub: 0.28,
        fadeInEnd: 0.18,
        fadeOutStart: 0.82,
        blur: 4,
      });
    }

    const teamTitle = document.querySelector(".team_title");

    if (teamTitle) {
      createViewportFade(teamTitle, teamTitle, {
        start: "top 90%",
        end: "bottom 10%",
        scrub: 0.28,
        fadeInEnd: 0.18,
        fadeOutStart: 0.82,
        blur: 4,
      });
    }

    const newsTitle = document.querySelector(".news_title");

    if (newsTitle) {
      createViewportFade(newsTitle, newsTitle, {
        start: "top 90%",
        end: "bottom 10%",
        scrub: 0.28,
        fadeInEnd: 0.18,
        fadeOutStart: 0.82,
        blur: 4,
      });
    }

    const footerTitle = document.querySelector(".footer_title");

    if (footerTitle) {
      createViewportEntrance(footerTitle, footerTitle, {
        start: "top 92%",
        end: "top 60%",
        scrub: 0.28,
        blur: 4,
      });
    }
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

    if (!heroMedia || !aboutMedia) {
      return null;
    }

    if (reducedMotion.matches) {
      createReducedMotionMediaSwap(about, aboutMedia, heroMedia);

      return aboutMedia;
    }

    heroReadyPromise.then(function () {
      preparePlaybackVideo(aboutMedia, getScrubPrepareOptions("about"));
    });

    createStackedMediaReveal(about, aboutMedia, heroMedia, {
      start: CONFIG.aboutMediaRevealStart,
      end: CONFIG.aboutMediaRevealEnd,
      scrub: CONFIG.aboutMediaRevealScrub,
    });

    let aboutPlaybackActive = false;
    let aboutPlaybackRunId = 0;

    async function startAboutPlayback(options = {}) {
      aboutPlaybackRunId += 1;

      const runId = aboutPlaybackRunId;

      aboutPlaybackActive = true;

      setHeroPlayback(false, heroMedia);

      const ready = await preparePlaybackVideo(
        aboutMedia,
        getScrubPrepareOptions("about"),
      );

      if (!ready || !aboutPlaybackActive || runId !== aboutPlaybackRunId) {
        return;
      }

      await restartPlaybackVideo(aboutMedia, {
        smooth: options.smooth === true,

        shouldContinue: function () {
          return aboutPlaybackActive && runId === aboutPlaybackRunId;
        },
      });
    }

    function stopAboutPlayback() {
      aboutPlaybackActive = false;
      aboutPlaybackRunId += 1;

      pausePlaybackVideo(aboutMedia);
    }

    ScrollTrigger.create({
      trigger: about,
      start: CONFIG.aboutMediaRevealEnd,
      end: "bottom 90%",

      onEnter: function () {
        startAboutPlayback({
          smooth: false,
        });
      },

      onEnterBack: function () {
        startAboutPlayback({
          smooth: true,
        });
      },

      onLeave: function () {
        stopAboutPlayback();
      },

      onLeaveBack: function () {
        stopAboutPlayback();

        setHeroPlayback(true, heroMedia);
      },
    });

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

    if (!aboutMedia || !storyMedia) {
      return null;
    }

    const aboutTitle = about.querySelector("[data-about-title]");

    story.style.setProperty(
      "--story-final-tail",
      `${CONFIG.storyFinalTailVh}svh`,
    );

    story.style.setProperty(
      "--story-intro-gap",
      `${CONFIG.storyIntroGapVh}svh`,
    );

    if (reducedMotion.matches) {
      createReducedMotionMediaSwap(story, storyMedia, aboutMedia);

      return storyMedia;
    }

    ScrollTrigger.create({
      trigger: about,
      start: CONFIG.storyPreloadStart,
      once: true,

      onEnter: function () {
        prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
      },
    });

    const storyRevealTrigger = aboutTitle || story;

    const storyRevealStart = aboutTitle
      ? "bottom top"
      : CONFIG.storyMediaRevealStart;

    const storyRevealEnd = aboutTitle
      ? function () {
          return `+=${Math.round(
            (window.innerHeight * CONFIG.storyMediaRevealDistanceVh) / 100,
          )}`;
        }
      : CONFIG.storyMediaRevealEnd;

    createStackedMediaReveal(storyRevealTrigger, storyMedia, aboutMedia, {
      start: storyRevealStart,
      end: storyRevealEnd,
      scrub: CONFIG.storyMediaRevealScrub,
    });

    const progressState = {
      value: 0,
    };

    const storyTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: story,
        start: CONFIG.storyScrubStart,
        end: CONFIG.storyScrubEnd,
        scrub: CONFIG.storyScrub,
        invalidateOnRefresh: true,

        onEnter: function () {
          prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
        },

        onEnterBack: function () {
          prepareScrubVideo(storyMedia, getScrubPrepareOptions("story"));
        },

        onLeave: function () {
          forceScrubProgress(storyMedia, 1);
        },

        onLeaveBack: function () {
          forceScrubProgress(storyMedia, 0);

          preparePlaybackVideo(aboutMedia, getScrubPrepareOptions("about"));
        },
      },
    });

    storyTimeline.to(
      progressState,
      {
        value: 1,
        duration: 1,
        ease: "none",

        onUpdate: function () {
          setScrubProgress(storyMedia, progressState.value);
        },
      },
      0,
    );

    ScrollTrigger.create({
      trigger: story,
      start: "top top",

      onEnter: function () {
        releaseScrubVideo(aboutMedia);
      },

      onLeaveBack: function () {
        preparePlaybackVideo(aboutMedia, getScrubPrepareOptions("about"));
      },
    });

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

    if (!storyMedia || !insightsMedia) {
      return null;
    }

    const contentRoot = insights.querySelector("[data-insights-content]");

    if (!contentRoot) {
      console.warn(
        "Missing [data-insights-content] on the Insights foreground wrapper.",
      );
    }

    if (reducedMotion.matches) {
      createReducedMotionMediaSwap(insights, insightsMedia, storyMedia);

      return insightsMedia;
    }

    const updateInsightsSpacing = createInsightsSpacingController(
      insights,
      contentRoot,
      insightsMedia,
    );

    ScrollTrigger.addEventListener("refreshInit", updateInsightsSpacing);

    ScrollTrigger.create({
      trigger: insights,
      start: CONFIG.insightsPreloadStart,
      once: true,

      onEnter: function () {
        prepareScrubVideo(
          insightsMedia,
          getScrubPrepareOptions("insights"),
        ).then(function (ready) {
          if (!ready) return;

          updateInsightsSpacing();
          ScrollTrigger.refresh();
        });
      },
    });

    createStackedMediaReveal(insights, insightsMedia, storyMedia, {
      start: CONFIG.insightsMediaRevealStart,
      end: CONFIG.insightsMediaRevealEnd,
      scrub: CONFIG.insightsMediaRevealScrub,
    });

    const progressState = {
      value: 0,
    };

    const insightsTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: insights,
        start: CONFIG.insightsScrubStart,
        end: CONFIG.insightsScrubEnd,
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

    const map = cLayers.querySelector("[data-layer-map]");

    const controls = map
      ? Array.from(map.querySelectorAll("[data-layer-control]"))
      : [];

    const rows = Array.from(cLayers.querySelectorAll("[data-layer-row]"));

    if (reducedMotion.matches) {
      createReducedMotionMediaSwap(cLayers, cLayersMedia, insightsMedia);

      return cLayersMedia;
    }

    if (!map || controls.length !== 3 || rows.length !== 3) {
      console.warn(
        "C-layers requires [data-layer-map], three [data-layer-control] buttons, and three [data-layer-row] panels.",
      );
    }

    const panelMap = {
      infrastructure: rows[0] || null,

      memory: rows[1] || null,

      application: rows[2] || null,
    };

    Object.entries(panelMap).forEach(function ([key, row]) {
      if (!row) return;

      row.setAttribute("data-layer-panel", key);

      if (!row.id) {
        row.id = `layer-panel-${key}`;
      }

      row.setAttribute("aria-hidden", "true");

      if ("inert" in row) {
        row.inert = true;
      }

      gsap.set(row, {
        autoAlpha: 0,
      });
    });

    controls.forEach(function (control) {
      const key = control.getAttribute("data-layer-control");

      const row = panelMap[key];

      if (row) {
        control.setAttribute("aria-controls", row.id);
      }

      control.setAttribute("aria-pressed", "false");
    });

    if (map) {
      gsap.set(map, {
        autoAlpha: 0,
      });
    }

    let activeLayer = null;
    let videoActionId = 0;
    let cLayersReadyPromise = null;

    function setPanelAccessibility(row, active) {
      if (!row) return;

      row.setAttribute("aria-hidden", active ? "false" : "true");

      if ("inert" in row) {
        row.inert = !active;
      }

      row.style.pointerEvents = "none";

      const card = row.querySelector(".layers_card");

      if (card) {
        card.style.pointerEvents = active ? "auto" : "none";
      }
    }

    function hidePanel(row, immediate = false) {
      if (!row) return;

      const card = row.querySelector(".layers_card");

      gsap.killTweensOf(row);

      if (card) {
        gsap.killTweensOf(card);
      }

      if (immediate) {
        gsap.set(row, {
          autoAlpha: 0,
        });

        if (card) {
          gsap.set(card, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          });
        }

        setPanelAccessibility(row, false);

        return;
      }

      if (!card) {
        gsap.to(row, {
          autoAlpha: 0,
          duration: CONFIG.cLayersPanelOutDuration,
          ease: "power1.out",

          onComplete: function () {
            setPanelAccessibility(row, false);
          },
        });

        return;
      }

      gsap.to(card, {
        opacity: 0,
        y: -12,
        filter: "blur(4px)",
        duration: CONFIG.cLayersPanelOutDuration,
        ease: "power1.out",

        onComplete: function () {
          gsap.set(row, {
            autoAlpha: 0,
          });

          gsap.set(card, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          });

          setPanelAccessibility(row, false);
        },
      });
    }

    function showPanel(row) {
      if (!row) return;

      const card = row.querySelector(".layers_card");

      gsap.killTweensOf(row);

      if (card) {
        gsap.killTweensOf(card);
      }

      setPanelAccessibility(row, true);

      gsap.set(row, {
        autoAlpha: 1,
      });

      if (!card) return;

      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 18,
          filter: "blur(5px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: CONFIG.cLayersPanelInDuration,
          ease: "power2.out",
          overwrite: true,
        },
      );
    }

    function updateControls(key) {
      if (!map) return;

      if (key) {
        map.setAttribute("data-active-layer", key);
      } else {
        map.removeAttribute("data-active-layer");
      }

      controls.forEach(function (control) {
        const controlKey = control.getAttribute("data-layer-control");

        control.setAttribute(
          "aria-pressed",
          controlKey === key ? "true" : "false",
        );
      });
    }

    function getCLayersSafeDuration() {
      const video = cLayersMedia.video;

      if (!video || !video.duration || !Number.isFinite(video.duration)) {
        return 0;
      }

      return Math.max(0, video.duration - 0.034);
    }

    function getCLayersTargetTime(progress) {
      const duration = getCLayersSafeDuration();

      if (!duration) {
        return 0;
      }

      return duration * gsap.utils.clamp(0, 1, progress);
    }

    async function prepareCLayersVideo() {
      if (cLayersReadyPromise) {
        return cLayersReadyPromise;
      }

      cLayersReadyPromise = (async function () {
        const ready = await preparePlaybackVideo(
          cLayersMedia,
          getScrubPrepareOptions("c-layers"),
        );

        if (!ready || !cLayersMedia.video) {
          return false;
        }

        const video = cLayersMedia.video;

        video.pause();
        video.loop = false;
        video.playbackRate = 1;

        return true;
      })();

      return cLayersReadyPromise;
    }

    async function snapCLayersVideo(progress) {
      const actionId = ++videoActionId;

      const ready = await prepareCLayersVideo();

      if (!ready || actionId !== videoActionId) {
        return;
      }

      const video = cLayersMedia.video;

      if (!video) return;

      const targetTime = getCLayersTargetTime(progress);

      video.pause();
      video.loop = false;
      video.playbackRate = 1;

      gsap.killTweensOf(video);

      gsap.set(video, {
        opacity: 1,
      });

      if (
        Math.abs(video.currentTime - targetTime) <=
        CONFIG.cLayersTargetTolerance
      ) {
        return;
      }

      try {
        video.currentTime = targetTime;
      } catch (error) {}
    }

    function activateLayer(key) {
      if (
        !key ||
        !panelMap[key] ||
        CONFIG.cLayersVideoTargets[key] === undefined
      ) {
        return;
      }

      if (activeLayer === key) {
        return;
      }

      const previousLayer = activeLayer;

      activeLayer = key;

      if (previousLayer && panelMap[previousLayer]) {
        hidePanel(panelMap[previousLayer]);
      }

      updateControls(key);

      showPanel(panelMap[key]);

      snapCLayersVideo(CONFIG.cLayersVideoTargets[key]);
    }

    function resetLayers(options = {}) {
      const immediate = options.immediate === true;

      const resetVideo = options.resetVideo !== false;

      if (!activeLayer) {
        return;
      }

      activeLayer = null;

      updateControls(null);

      Object.values(panelMap).forEach(function (row) {
        hidePanel(row, immediate);
      });

      if (resetVideo) {
        snapCLayersVideo(0);
      }
    }

    function showLayerMap() {
      if (!map) return;

      gsap.to(map, {
        autoAlpha: 1,
        duration: CONFIG.cLayersMapFadeDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }

    function hideLayerMap() {
      if (!map) return;

      gsap.to(map, {
        autoAlpha: 0,
        duration: CONFIG.cLayersMapFadeDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }

    function handleOutsidePointerDown(event) {
      if (hoverQuery.matches || !activeLayer) {
        return;
      }

      const control = event.target.closest("[data-layer-control]");

      if (control) {
        return;
      }

      resetLayers({
        immediate: false,
        resetVideo: true,
      });
    }

    controls.forEach(function (control) {
      const key = control.getAttribute("data-layer-control");

      if (!key) return;

      if (hoverQuery.matches) {
        control.addEventListener("pointerenter", function () {
          activateLayer(key);
        });
      }

      control.addEventListener("click", function () {
        activateLayer(key);
      });

      control.addEventListener("focus", function () {
        activateLayer(key);
      });
    });

    document.addEventListener("pointerdown", handleOutsidePointerDown, {
      passive: true,
    });

    if (map) {
      map.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
          return;
        }

        resetLayers({
          immediate: false,
          resetVideo: true,
        });

        const activeElement = document.activeElement;

        if (activeElement && typeof activeElement.blur === "function") {
          activeElement.blur();
        }
      });
    }

    Object.values(panelMap).forEach(function (row) {
      hidePanel(row, true);
    });

    updateControls(null);

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
        prepareCLayersVideo();
      },
    });

    createStackedMediaReveal(cLayers, cLayersMedia, insightsMedia, {
      start: CONFIG.cLayersMediaRevealStart,
      end: CONFIG.cLayersMediaRevealEnd,
      scrub: CONFIG.cLayersMediaRevealScrub,
    });

    ScrollTrigger.create({
      trigger: cLayers,
      start: CONFIG.cLayersMediaRevealEnd,
      end: CONFIG.cLayersMapFadeOutStart,

      onEnter: function () {
        showLayerMap();
      },

      onEnterBack: function () {
        showLayerMap();
      },

      onLeave: function () {
        hideLayerMap();
      },

      onLeaveBack: function () {
        hideLayerMap();
      },
    });

    ScrollTrigger.create({
      trigger: cLayers,
      start: "top top",
      end: "bottom top",

      onEnter: function () {
        prepareCLayersVideo();

        releaseScrubVideo(insightsMedia);
      },

      onEnterBack: function () {
        prepareCLayersVideo();
      },

      onLeaveBack: function () {
        hideLayerMap();

        if (activeLayer) {
          resetLayers({
            immediate: true,
            resetVideo: true,
          });
        }

        prepareScrubVideo(insightsMedia, getScrubPrepareOptions("insights"));
      },
    });

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

  const staticMediaReadyPromise = initStaticMediaSections(cLayersReadyPromise);

  Promise.all([cLayersReadyPromise, staticMediaReadyPromise]).then(function () {
    initContentFades();

    requestAnimationFrame(function () {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }

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

document.addEventListener("DOMContentLoaded", function () {
  initBackgroundMedia();
});

console.log("is working locally");
