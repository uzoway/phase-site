function initNumenosMedia() {
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const useHoverInteractions = hoverQuery.matches && !mobileQuery.matches;

  if (mobileQuery.matches) {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  const userAgent = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|FxiOS/i.test(userAgent);
  const isWebKit = isSafari || isIOS;

  // WebKit only paints a paused, never-played video once it has seeked
  // somewhere other than exactly 0.
  const FIRST_FRAME_TIME = isWebKit ? 0.001 : 0;

  const CONFIG = {
    revealDuration: 0.6,
    loopFadeOut: 0.22,
    loopFadeIn: 0.38,
    bufferMaxWaitMs: 12000,

    // The hero owns the network until it can play smoothly; after that each
    // section starts loading when it is about one screen away.
    heroStartBufferSeconds: 1.5,
    heroStartMaxWaitMs: 2000,
    heroGateBufferSeconds: 4,
    heroGateMaxWaitMs: 3500,
    heroGateScrollRatio: 0.35,
    // Loader ([data-loader], home page only): covers the page until the logo
    // has played once and the hero video is fully downloaded. It stops
    // waiting for the hero this long after the page started loading.
    loaderMaxWaitMs: 10000,
    loaderFadeDuration: 0.8,
    loaderLottieUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js",
    heroWholeFileMaxBytes: 24 * 1024 * 1024,
    heroWholeFileTimeoutMs: 45000,
    prepareStart: "top 200%",
    // Background downloads run a couple at a time, in the order they were
    // asked for, so the clip needed next never shares the connection with
    // three others. Each holds its slot until buffered (or the timeout).
    prefetchConcurrency: 2,
    prefetchBufferSeconds: 5,
    prefetchMaxWaitMs: 8000,

    playbackBandStart: "top 85%",
    playbackBandEnd: "bottom 15%",
    playbackStartBufferSeconds: 1.5,
    playbackStartMaxWaitMs: 1500,

    mediaRevealStart: "top 50%",
    mediaRevealEnd: "top 5%",
    mediaRevealScrub: 0.55,

    // Hero → About, About → Story and Story → Insights: the wipe starts once
    // the outgoing copy has fully left the top of the screen, and runs over
    // this much scroll.
    contentWipeVh: 35,

    cLayersRevealDistanceVh: 45,
    cLayersRevealScrub: 0.8,
    cLayersPrepareStart: "top 300%",
    // Relative to the Insights section: the rocks video is the heaviest file
    // on the page and must be buffered before its intro copy scrolls away.
    cLayersPreloadStart: "top 100%",
    cLayersIntroOpacity: 0.4,
    cLayersBackground: "#F4F3F2",
    cLayersIntroTrackVh: 180,
    cLayersIntroLeadVh: 125,
    cLayersInteractionTrackVh: 320,
    // Rocks video timeline (Val's "Part 5", 24fps). Shut until frame 11,
    // apart by frame 28, settled from frame 52; every highlight holds that
    // exact pose. The close runs from frame 360 (mobile: 358) until shut at
    // frame 378 (mobile: 376). Times sit mid-frame so every browser lands on
    // the intended frame.
    cLayersOpenMotionStart: 0.48,
    cLayersOpenMotionEnd: 1.17,
    cLayersOpenTime: 2.19,
    cLayersCloseStartTime: 15.02,
    cLayersCloseMotionEnd: 15.75,
    cLayersOpenFadeDuration: 0.45,
    cLayersMapFadeDuration: 0.45,
    cLayersStateFade: 0.32,
    cLayersCloseViewportRatio: 1.7,
    cLayersToTeamRevealStart: "bottom bottom",
    cLayersToTeamRevealEnd: "bottom 65%",
    // Seconds; the frames Val's data/memory/application stills match.
    cLayersTargets: {
      infrastructure: 4.52,
      memory: 8.81,
      application: 13.94,
    },
    cLayersTargetTolerance: 0.015,
    cLayersPanelInDuration: 0.42,
    cLayersPanelOutDuration: 0.22,
    cLayersBuffer: {
      bufferFraction: 0,
      bufferSeconds: 2.5,
      maxWaitMs: 5000,
    },
    // Hovers and scroll reversals jump all over the rocks video, so a file
    // this size or smaller is downloaded whole and every seek stays local.
    // Anything larger (or slower than the timeout) streams as usual.
    cLayersWholeFileMaxBytes: 8 * 1024 * 1024,
    cLayersWholeFileTimeoutMs: 15000,
    freezeFrameMaxSide: 1280,

    staticRevealStart: "top 75%",
    staticRevealEnd: "top 25%",
    staticRevealDistanceVh: 18,
    staticRevealScrub: 0.55,
    // How far into the background wipe the next section's content appears.
    sectionGapLeadRatio: 0.35,

    storyStepStart: "top 60%",
    // Step 2 starts a quarter screen earlier, while Step 1's copy is leaving.
    storyStep2Start: "top 85%",
    storyCrossfade: 0.3,
    storySwapFade: 0.12,
    storyCatchUpRate: 2.5,
    storyReverseFps: 30,
    // A transition waits (holding the current loop) until its clip is fully
    // buffered, so it never freezes mid-animation.
    storyStartBufferMs: 3000,
    storyStallTimeoutMs: 3000,
    storyFirstFrameMaxWaitMs: 350,
    storyIntroGapVh: 40,

    viewportFadeScrub: 0.28,
    viewportFadeBlur: 4,
    viewportFadeInEnd: 0.2,
    viewportFadeOutStart: 0.8,
    storyFadeBlur: 5,
    storyRowRevealDuration: 0.18,
    storyRowRevealStagger: 0.045,
    storyRowFadeOutStart: 0.82,
    heroFadeBlur: 4,
    heroFadeHold: 0.22,

    mobile: {
      playbackBandStart: "top 110%",
      staticRevealStart: "top 60%",
      staticRevealEnd: "top 15%",
      mediaRevealScrub: 0.18,
      viewportFadeScrub: 0.08,
      storyStepStart: "top 68%",
      storyStep2Start: "top 93%",
      cLayersRevealDistanceVh: 12,
      cLayersPreloadStart: "top 150%",
      cLayersInteractionTrackVh: 260,
      cLayersCloseViewportRatio: 1.6,
      cLayersCloseStartTime: 14.94,
      cLayersCloseMotionEnd: 15.67,
      newsRevealDistanceVh: 10,
      footerRevealDistanceVh: 10,
    },
  };

  const STORY_STEPS = {
    1: { transition: "step-1-transition", rest: "step-1-loop" },
    2: { transition: "step-2-transition", rest: null },
    3: { transition: "step-3-transition", rest: "step-3-loop" },
  };

  const mediaMap = new Map();
  const activeMedia = new Set();
  let layoutObserver = null;

  let resolveHeroGate = null;
  const heroGate = new Promise(function (resolve) {
    resolveHeroGate = resolve;
  });

  function reportError(scope, error) {
    if (window.console && console.warn)
      console.warn(`[numenos] ${scope}`, error);
  }

  function responsiveValue(desktopValue, mobileValue) {
    return mobileQuery.matches ? mobileValue : desktopValue;
  }

  function getViewportHeight() {
    if (mobileQuery.matches && window.visualViewport) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  }

  function getSectionByRole(role) {
    return document.querySelector(`[data-media-role="${role}"]`);
  }

  function getSectionMedia(section) {
    if (!section) return null;
    return mediaMap.get(section.getAttribute("data-section")) || null;
  }

  // Webflow's Background Video element hands out direct S3 links. The same
  // files are on Webflow's Cloudflare CDN, which is many times faster (S3 has
  // measured as low as 2 Mbps); loadVideo falls back to S3 if the CDN fails.
  const S3_ASSETS = "https://s3.amazonaws.com/webflow-prod-assets/";
  const CDN_ASSETS = "https://cdn.prod.website-files.com/";

  function viaCdn(url) {
    return url && url.indexOf(S3_ASSETS) === 0
      ? CDN_ASSETS + url.slice(S3_ASSETS.length)
      : url || "";
  }

  // `variant` reads an alternate URL (e.g. "reverse" -> data-video-desktop-reverse)
  // for the same platform as the main source, so orientations never mix.
  function getVideoSource(el, variant) {
    const desktop = el.getAttribute("data-video-desktop");
    const mobile = el.getAttribute("data-video-mobile");
    const useMobile = !!(mobileQuery.matches && mobile) || !desktop;
    if (!variant) return viaCdn(useMobile ? mobile : desktop);
    return viaCdn(
      el.getAttribute(
        `data-video-${useMobile ? "mobile" : "desktop"}-${variant}`,
      ),
    );
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
    if ("disablePictureInPicture" in video)
      video.disablePictureInPicture = true;
  }

  // iOS Low Power Mode refuses every play() the visitor didn't start, in any
  // browser on the phone. Starting a video inside a tap unlocks it for good,
  // so the first tap anywhere starts and stops every video once, then
  // whatever should be moving resumes.
  const unlockCallbacks = [];
  let unlockArmed = false;

  function onPlaybackUnlocked(callback) {
    unlockCallbacks.push(callback);
  }

  function armPlaybackUnlock() {
    if (unlockArmed) return;
    unlockArmed = true;
    const events = ["touchend", "click", "keydown"];
    function unlock() {
      events.forEach(function (type) {
        document.removeEventListener(type, unlock, true);
      });
      unlockArmed = false;
      document.querySelectorAll("video").forEach(function (video) {
        // play() on an ended video would rewind it.
        if (!video.paused || video.ended) return;
        try {
          const promise = video.play();
          video.pause();
          if (promise && typeof promise.catch === "function")
            promise.catch(function () {});
        } catch (error) {}
      });
      activeMedia.forEach(function (media) {
        safePlay(media.video);
      });
      unlockCallbacks.forEach(function (callback) {
        callback();
      });
    }
    events.forEach(function (type) {
      document.addEventListener(type, unlock, true);
    });
  }

  function notePlaybackRefused(error) {
    if (error && error.name === "NotAllowedError" && !document.hidden)
      armPlaybackUnlock();
  }

  // Resolves true when playback started, false when it was refused (e.g. iOS
  // Low Power Mode) so callers can fall back to still frames.
  function safePlay(video) {
    if (!video || reducedMotion.matches || document.hidden)
      return Promise.resolve(false);
    let promise;
    try {
      promise = video.play();
    } catch (error) {
      notePlaybackRefused(error);
      return Promise.resolve(false);
    }
    if (!promise || typeof promise.then !== "function")
      return Promise.resolve(true);
    return promise.then(
      function () {
        return true;
      },
      function (error) {
        notePlaybackRefused(error);
        return false;
      },
    );
  }

  function seekTo(video, time) {
    return new Promise(function (resolve) {
      if (!video) {
        resolve(false);
        return;
      }
      if (
        !video.seeking &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        Math.abs(video.currentTime - time) <= 0.02
      ) {
        resolve(true);
        return;
      }
      let settled = false;
      const timeoutId = setTimeout(finish, isWebKit ? 900 : 600);
      function finish() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        video.removeEventListener("seeked", finish);
        resolve(true);
      }
      video.addEventListener("seeked", finish);
      try {
        video.currentTime = time;
      } catch (error) {
        finish();
      }
    });
  }

  // Seeks and resolves once the new frame has actually been handed to the
  // compositor. The frame callback is registered before seeking so a fast
  // seek can't slip past it.
  function presentFrame(video, time) {
    return new Promise(function (resolve) {
      if (!video) {
        resolve(false);
        return;
      }
      if (
        !video.seeking &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        Math.abs(video.currentTime - time) <= 0.02
      ) {
        resolve(true);
        return;
      }
      const hasFrameCallback =
        typeof video.requestVideoFrameCallback === "function";
      let settled = false;
      let callbackId = null;
      const timeoutId = setTimeout(finish, isWebKit ? 900 : 600);

      function finish() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        video.removeEventListener("seeked", onSeeked);
        if (callbackId !== null) {
          try {
            video.cancelVideoFrameCallback(callbackId);
          } catch (error) {}
        }
        resolve(true);
      }

      function onSeeked() {
        if (hasFrameCallback) return;
        requestAnimationFrame(function () {
          requestAnimationFrame(finish);
        });
      }

      if (hasFrameCallback) {
        callbackId = video.requestVideoFrameCallback(function () {
          callbackId = null;
          finish();
        });
      }
      video.addEventListener("seeked", onSeeked);
      try {
        video.currentTime = time;
      } catch (error) {
        finish();
      }
    });
  }

  // Resolves once the playing video has handed a new frame to the compositor
  // (or after `maxWaitMs`). Revealing a clip only then avoids showing a stale
  // frame, or a frozen one while a phone's decoder spins back up.
  function nextPresentedFrame(video, maxWaitMs) {
    return new Promise(function (resolve) {
      let settled = false;
      let callbackId = null;
      const timeoutId = setTimeout(finish, maxWaitMs);
      function finish() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (callbackId !== null) {
          try {
            video.cancelVideoFrameCallback(callbackId);
          } catch (error) {}
        }
        resolve();
      }
      if (typeof video.requestVideoFrameCallback === "function") {
        callbackId = video.requestVideoFrameCallback(function () {
          callbackId = null;
          finish();
        });
      } else {
        requestAnimationFrame(function () {
          requestAnimationFrame(finish);
        });
      }
    });
  }

  function buildMediaMap() {
    document
      .querySelectorAll("[data-bg-media]")
      .forEach(function (item, index) {
        const key = item.getAttribute("data-bg-media");
        if (!key) return;
        mediaMap.set(key, {
          item,
          video: item.querySelector("[data-bg-video]"),
          loaded: false,
          loadingPromise: null,
          loadVersion: 0,
          revealed: false,
          active: false,
          loopBound: false,
          nativeLoop: false,
        });
        gsap.set(item, { opacity: 0, scale: 1, zIndex: index + 1 });
        const video = item.querySelector("[data-bg-video]");
        if (video) gsap.set(video, { opacity: 0 });
      });
  }

  function openHeroGate() {
    if (!resolveHeroGate) return;
    resolveHeroGate();
    resolveHeroGate = null;
  }

  // Webflow's own copy of lottie-web (for the nav icon) arrives too late for
  // the loader, so the player comes from the CDN, preloaded by the page <head>.
  function loadLottie() {
    function existing() {
      return window.lottie && window.lottie.loadAnimation
        ? window.lottie
        : null;
    }
    if (existing()) return Promise.resolve(existing());
    return new Promise(function (resolve) {
      const script = document.createElement("script");
      script.src = CONFIG.loaderLottieUrl;
      script.async = true;
      script.onload = function () {
        resolve(existing());
      };
      script.onerror = function () {
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  // [data-loader] is styled in the page <head> so it covers the first paint,
  // with a CSS failsafe that hides it if this script never arrives. Here it
  // locks scrolling and plays the logo once, then fades out when the hero is
  // ready or the wait limit (counted from navigation start) has passed. The
  // logo always finishes once it has started.
  function initLoader() {
    const loader = document.querySelector("[data-loader]");
    if (!loader) return null;
    const remainingAtStart = CONFIG.loaderMaxWaitMs - performance.now();
    if (remainingAtStart <= 0) {
      gsap.to(loader, {
        autoAlpha: 0,
        duration: CONFIG.loaderFadeDuration,
        onComplete: function () {
          loader.remove();
        },
      });
      return null;
    }
    loader.style.animation = "none";

    const html = document.documentElement;
    const scrollKeys = [
      " ",
      "Spacebar",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      "ArrowUp",
      "ArrowDown",
    ];
    const blockOptions = { capture: true, passive: false };
    // Capture phase on window runs before Lenis's own wheel listener.
    function blockScroll(event) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    }
    function blockScrollKeys(event) {
      if (scrollKeys.indexOf(event.key) !== -1) blockScroll(event);
    }
    // The stable gutter stops the page reflowing when the scrollbar returns.
    html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    window.addEventListener("wheel", blockScroll, blockOptions);
    window.addEventListener("touchmove", blockScroll, blockOptions);
    window.addEventListener("keydown", blockScrollKeys, true);
    // ScrollTrigger rewrites history.scrollRestoration on every refresh; this
    // makes "manual" the value it keeps, so a reload opens at the top.
    ScrollTrigger.clearScrollMemory("manual");
    if (!location.hash) window.scrollTo(0, 0);

    let open = true;
    let logoDone = false;
    let heroDone = false;
    let waitOver = false;
    let animation = null;
    let resolveExit = null;
    const exited = new Promise(function (resolve) {
      resolveExit = resolve;
    });
    const capId = setTimeout(function () {
      waitOver = true;
      maybeExit();
    }, remainingAtStart);

    function exit() {
      if (!open) return;
      open = false;
      clearTimeout(capId);
      window.removeEventListener("wheel", blockScroll, blockOptions);
      window.removeEventListener("touchmove", blockScroll, blockOptions);
      window.removeEventListener("keydown", blockScrollKeys, true);
      html.style.overflow = "";
      html.style.scrollbarGutter = "";
      loader.style.pointerEvents = "none";
      resolveExit();
      gsap.to(loader, {
        autoAlpha: 0,
        duration: CONFIG.loaderFadeDuration,
        ease: "power2.inOut",
        onComplete: function () {
          if (animation) animation.destroy();
          loader.remove();
        },
      });
    }

    function maybeExit() {
      if (logoDone && (heroDone || waitOver)) exit();
    }

    function finishLogo() {
      logoDone = true;
      maybeExit();
    }

    const logo = loader.querySelector("[data-loader-logo]");
    if (!logo) {
      finishLogo();
    } else {
      loadLottie().then(function (lottie) {
        if (!open) return;
        if (!lottie) {
          finishLogo();
          return;
        }
        try {
          animation = lottie.loadAnimation({
            container: logo,
            renderer: "svg",
            loop: false,
            autoplay: false,
            animationData: NUMENOS_LOADER_ANIMATION,
            rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
          });
        } catch (error) {
          finishLogo();
          return;
        }
        function start() {
          if (reducedMotion.matches) {
            animation.goToAndStop(animation.totalFrames - 1, true);
            setTimeout(finishLogo, 600);
            return;
          }
          animation.addEventListener("complete", finishLogo);
          animation.play();
        }
        if (animation.isLoaded) start();
        else animation.addEventListener("DOMLoaded", start);
      });
    }

    return {
      exited,
      isOpen: function () {
        return open;
      },
      remainingMs: function () {
        return Math.max(0, CONFIG.loaderMaxWaitMs - performance.now());
      },
      heroReady: function () {
        heroDone = true;
        maybeExit();
      },
    };
  }

  function watchHeroGate() {
    if (reducedMotion.matches) {
      openHeroGate();
      return;
    }
    // With the loader the hero keeps the network to itself until its file is
    // complete (or the visitor scrolls), even after the loader has gone.
    if (!loader) setTimeout(openHeroGate, CONFIG.heroGateMaxWaitMs * 2);
    function onScroll() {
      if (window.scrollY > getViewportHeight() * CONFIG.heroGateScrollRatio) {
        openHeroGate();
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Runs `callback` once, when the section comes within `start` of the
  // viewport (from either direction) and the hero has finished claiming the
  // network. Sections already scrolled past don't download until the visitor
  // heads back to them.
  function whenNear(trigger, start, callback) {
    if (!trigger) return;
    let fired = false;
    const nearTrigger = ScrollTrigger.create({
      trigger,
      start,
      end: "bottom top",
      onToggle: function (self) {
        if (!self.isActive || fired) return;
        heroGate.then(function () {
          // The visitor may have scrolled past while the hero was loading.
          if (fired || !nearTrigger.isActive) return;
          fired = true;
          nearTrigger.kill();
          callback();
        });
      },
    });
  }

  const prefetchQueue = [];
  let prefetchRunning = 0;

  // Queues a background download. `task` starts it and returns a promise
  // that settles once the file is buffered enough to free its slot.
  function prefetch(task) {
    return new Promise(function (resolve) {
      prefetchQueue.push({ task, resolve });
      pumpPrefetch();
    });
  }

  function pumpPrefetch() {
    while (
      prefetchRunning < CONFIG.prefetchConcurrency &&
      prefetchQueue.length
    ) {
      const job = prefetchQueue.shift();
      prefetchRunning += 1;
      Promise.resolve()
        .then(job.task)
        .catch(function () {
          return false;
        })
        .then(function (result) {
          prefetchRunning -= 1;
          job.resolve(result);
          pumpPrefetch();
        });
    }
  }

  function prefetchMedia(media, onReady) {
    return prefetch(function () {
      return prepareMedia(media).then(function (ready) {
        if (!ready) return false;
        if (onReady) onReady();
        return waitForVideoBuffer(media.video, {
          bufferSeconds: CONFIG.prefetchBufferSeconds,
          maxWaitMs: CONFIG.prefetchMaxWaitMs,
        });
      });
    });
  }

  function waitForVideoReady(video) {
    if (video.error) return Promise.resolve(false);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
      return Promise.resolve(true);
    return new Promise(function (resolve) {
      function cleanup(result) {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("error", onError);
        resolve(result);
      }
      function onReady() {
        cleanup(true);
      }
      function onError() {
        cleanup(false);
      }
      video.addEventListener("loadeddata", onReady);
      video.addEventListener("error", onError);
    });
  }

  function getBufferedEndFromStart(video) {
    let end = 0;
    for (let i = 0; i < video.buffered.length; i += 1) {
      if (video.buffered.start(i) <= 0.1)
        end = Math.max(end, video.buffered.end(i));
    }
    return end;
  }

  // `strict` ignores the browser's own "can play through" estimate, which is
  // optimistic on a connection shared with other downloads.
  function waitForVideoBuffer(video, options) {
    options = options || {};
    const bufferSeconds = options.bufferSeconds || 0;
    const bufferFraction = options.bufferFraction || 0;
    const maxWaitMs = options.maxWaitMs || CONFIG.bufferMaxWaitMs;
    const strict = options.strict === true;
    if (!bufferSeconds && !bufferFraction) return Promise.resolve(true);
    return new Promise(function (resolve) {
      const startedAt = performance.now();
      let resolved = false;
      function cleanup(result) {
        if (resolved) return;
        resolved = true;
        video.removeEventListener("progress", check);
        video.removeEventListener("canplaythrough", check);
        video.removeEventListener("error", onError);
        resolve(result);
      }
      function onError() {
        cleanup(false);
      }
      function check() {
        if (resolved) return;
        if (video.error) return cleanup(false);
        if (video.duration && Number.isFinite(video.duration)) {
          const target = Math.min(
            video.duration,
            Math.max(bufferSeconds, video.duration * bufferFraction),
          );
          if (getBufferedEndFromStart(video) >= target - 0.05)
            return cleanup(true);
          if (!strict && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA)
            return cleanup(true);
        }
        if (performance.now() - startedAt >= maxWaitMs) return cleanup(false);
        setTimeout(check, 150);
      }
      video.addEventListener("progress", check);
      video.addEventListener("canplaythrough", check);
      video.addEventListener("error", onError);
      check();
    });
  }

  function loadVideo(video, url) {
    if (!video || !url) return Promise.resolve(false);
    const requestedUrl = url;
    if (video.dataset.src !== url) {
      configureVideo(video);
      video.preload = "auto";
      video.setAttribute("preload", "auto");
      video.src = url;
      video.dataset.src = url;
      video.load();
    }
    return waitForVideoReady(video).then(function (ready) {
      if (
        !ready &&
        video.error &&
        video.dataset.src === requestedUrl &&
        url.indexOf(CDN_ASSETS) === 0
      ) {
        return loadVideo(video, S3_ASSETS + url.slice(CDN_ASSETS.length));
      }
      return ready && video.dataset.src === requestedUrl;
    });
  }

  // Resolves a blob URL for the whole file, or the original URL to stream
  // when the file is too large, the request fails or it runs past the timeout.
  function fetchWholeVideo(url, maxBytes, timeoutMs) {
    if (
      typeof fetch !== "function" ||
      typeof AbortController !== "function" ||
      typeof URL.createObjectURL !== "function"
    )
      return Promise.resolve(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, timeoutMs);
    return fetch(url, { signal: controller.signal, credentials: "omit" })
      .then(function (response) {
        const size = parseInt(response.headers.get("content-length"), 10);
        if (!response.ok || !(size > 0) || size > maxBytes)
          throw new Error("stream");
        return response.blob();
      })
      .then(function (blob) {
        clearTimeout(timeoutId);
        return URL.createObjectURL(
          blob.type === "video/mp4"
            ? blob
            : new Blob([blob], { type: "video/mp4" }),
        );
      })
      .catch(function () {
        clearTimeout(timeoutId);
        controller.abort();
        return url;
      });
  }

  function unloadVideo(video) {
    video.pause();
    video.removeAttribute("src");
    delete video.dataset.src;
    video.preload = "none";
    try {
      video.load();
    } catch (error) {}
  }

  function prepareMedia(media) {
    if (!media || !media.video || reducedMotion.matches)
      return Promise.resolve(false);
    if (media.loaded) return Promise.resolve(true);
    if (media.loadingPromise) return media.loadingPromise;

    const url = getVideoSource(media.item);
    if (!url) return Promise.resolve(false);

    const loadVersion = media.loadVersion;
    const source = media.resolveSource
      ? media.resolveSource(url)
      : Promise.resolve(url);

    media.loadingPromise = source
      .then(function (resolvedUrl) {
        if (loadVersion !== media.loadVersion) return false;
        return loadVideo(media.video, resolvedUrl);
      })
      .then(function (ready) {
        if (loadVersion !== media.loadVersion) return false;
        media.loaded = ready;
        return ready;
      })
      .catch(function () {
        if (loadVersion === media.loadVersion) media.loaded = false;
        return false;
      })
      .finally(function () {
        if (loadVersion === media.loadVersion) media.loadingPromise = null;
      });

    return media.loadingPromise;
  }

  function releaseMedia(media) {
    if (
      !isWebKit ||
      !media ||
      !media.video ||
      (!media.loaded && !media.loadingPromise)
    )
      return;
    const video = media.video;
    media.loadVersion += 1;
    media.loadingPromise = null;
    disableSmoothLoop(media);
    gsap.killTweensOf(video);
    gsap.set(video, { opacity: 0 });
    unloadVideo(video);
    media.loaded = false;
    media.revealed = false;
  }

  function revealVideo(media, duration) {
    if (!media || !media.video) return;
    media.revealed = true;
    gsap.to(media.video, {
      opacity: 1,
      duration: duration,
      ease: "power2.out",
      overwrite: true,
    });
  }

  function revealAndPlay(media, duration) {
    const video = media.video;
    gsap.killTweensOf(video);
    if (!media.revealed) {
      media.revealed = true;
      gsap.set(video, { opacity: 0 });
    }
    gsap.to(video, { opacity: 1, duration: duration, ease: "power2.out" });
    return safePlay(video);
  }

  function restartWithFade(media) {
    const video = media.video;
    gsap.killTweensOf(video);
    gsap.to(video, {
      opacity: 0,
      duration: CONFIG.loopFadeOut,
      ease: "power1.out",
      onComplete: function () {
        if (!media.active) return;
        try {
          video.currentTime = 0;
        } catch (error) {}
        safePlay(video);
        gsap.to(video, {
          opacity: 1,
          duration: CONFIG.loopFadeIn,
          ease: "power1.out",
          overwrite: true,
        });
      },
    });
  }

  function enableSmoothLoop(media) {
    if (media.loopBound || media.nativeLoop) return;

    if (mobileQuery.matches) {
      media.nativeLoop = true;
      media.video.loop = true;
      return;
    }

    media.loopBound = true;
    media.onEnded = function () {
      if (media.active) restartWithFade(media);
    };
    media.video.loop = false;
    media.video.addEventListener("ended", media.onEnded);
  }

  function disableSmoothLoop(media) {
    if (media.nativeLoop) {
      media.nativeLoop = false;
      media.video.loop = false;
    }

    if (!media.loopBound) return;
    media.loopBound = false;
    media.video.removeEventListener("ended", media.onEnded);
    media.onEnded = null;
  }

  function activateFadeLoop(media) {
    if (!media || !media.video || reducedMotion.matches) return;
    media.active = true;
    activeMedia.add(media);
    enableSmoothLoop(media);
    if (media.video.ended) {
      if (media.nativeLoop) {
        try {
          media.video.currentTime = 0;
        } catch (error) {}
        revealAndPlay(
          media,
          media.revealed ? CONFIG.loopFadeIn : CONFIG.revealDuration,
        );
        return;
      }
      restartWithFade(media);
      return;
    }
    revealAndPlay(
      media,
      media.revealed ? CONFIG.loopFadeIn : CONFIG.revealDuration,
    );
  }

  function deactivateMedia(media) {
    if (!media) return;
    media.active = false;
    activeMedia.delete(media);
    if (media.video) {
      gsap.killTweensOf(media.video);
      media.video.pause();
    }
  }

  function createStackedReveal(trigger, incoming, outgoing, options) {
    if (!trigger || !incoming || !outgoing) return;
    options = options || {};
    incoming.item.classList.add("is-media-reveal");
    // A fully masked layer still costs a full-screen composite every frame,
    // so layers stay out of the render tree until their wipe begins and
    // leave it again once they have faded out underneath the next one.
    gsap.set(incoming.item, {
      opacity: 1,
      scale: 1.018,
      "--media-reveal": "-16%",
      visibility: "hidden",
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: options.start || CONFIG.mediaRevealStart,
        end: options.end || CONFIG.mediaRevealEnd,
        scrub:
          options.scrub != null
            ? options.scrub
            : responsiveValue(
                CONFIG.mediaRevealScrub,
                CONFIG.mobile.mediaRevealScrub,
              ),
        fastScrollEnd: 1800,
        preventOverlaps: "numenos-media-reveal",
        invalidateOnRefresh: true,
      },
    });
    timeline.set(incoming.item, { visibility: "inherit" }, 0.001);
    timeline.to(
      incoming.item,
      { "--media-reveal": "114%", scale: 1, duration: 1, ease: "none" },
      0,
    );
    timeline.to(
      outgoing.item,
      { scale: 0.992, opacity: 0.72, duration: 0.55, ease: "none" },
      0.28,
    );
    timeline.to(
      outgoing.item,
      { opacity: 0, duration: 0.25, ease: "none" },
      0.75,
    );
    timeline.set(outgoing.item, { visibility: "hidden" }, 1);
  }

  function createReducedMotionSwap(section, incoming, outgoing, options) {
    if (!section || !incoming || !outgoing) return;
    options = options || {};
    ScrollTrigger.create({
      trigger: section,
      start: options.start || "top 50%",
      onEnter: function () {
        gsap.set(outgoing.item, { opacity: 0 });
        gsap.set(incoming.item, { opacity: 1 });
      },
      onLeaveBack: function () {
        gsap.set(outgoing.item, { opacity: 1 });
        gsap.set(incoming.item, { opacity: 0 });
      },
    });
  }

  function initReveals() {
    const hero = getSectionByRole("hero");
    const about = getSectionByRole("about");
    const story = getSectionByRole("story");
    const insights = getSectionByRole("insights");
    const cLayers = getSectionByRole("c-layers");

    const heroMedia = getSectionMedia(hero);
    const aboutMedia = getSectionMedia(about);
    const storyMedia = getSectionMedia(story);
    const insightsMedia = getSectionMedia(insights);
    const cLayersMedia = getSectionMedia(cLayers);

    if (story) {
      story.style.setProperty(
        "--story-intro-gap",
        `${CONFIG.storyIntroGapVh}svh`,
      );
    }

    if (reducedMotion.matches) {
      createReducedMotionSwap(about, aboutMedia, heroMedia);
      createReducedMotionSwap(story, storyMedia, aboutMedia);
      createReducedMotionSwap(insights, insightsMedia, storyMedia);
      createReducedMotionSwap(cLayers, cLayersMedia, insightsMedia);
      initStaticReveals(cLayersMedia);
      return;
    }

    function revealAfterCopy(copy, section, incoming, outgoing) {
      createStackedReveal(copy || section, incoming, outgoing, {
        start: copy ? "bottom top" : CONFIG.mediaRevealStart,
        end: copy
          ? function () {
              return `+=${getContentWipeDistance()}`;
            }
          : CONFIG.mediaRevealEnd,
      });
    }

    if (about && aboutMedia && heroMedia) {
      revealAfterCopy(getHeroCopy(), about, aboutMedia, heroMedia);
    }

    if (story && storyMedia && aboutMedia) {
      revealAfterCopy(getAboutCopy(), story, storyMedia, aboutMedia);
    }

    if (insights && insightsMedia && storyMedia) {
      revealAfterCopy(getStoryFinalCopy(), insights, insightsMedia, storyMedia);
    }

    if (cLayers && cLayersMedia && insightsMedia) {
      const insightsContent = insights
        ? insights.querySelector("[data-insights-content]")
        : null;
      createStackedReveal(
        insightsContent || cLayers,
        cLayersMedia,
        insightsMedia,
        {
          start: insightsContent ? "bottom top" : CONFIG.mediaRevealStart,
          end: insightsContent
            ? function () {
                const distance = responsiveValue(
                  CONFIG.cLayersRevealDistanceVh,
                  CONFIG.mobile.cLayersRevealDistanceVh,
                );
                return `+=${Math.round((getViewportHeight() * distance) / 100)}`;
              }
            : CONFIG.mediaRevealEnd,
          scrub: responsiveValue(
            CONFIG.cLayersRevealScrub,
            CONFIG.mobile.mediaRevealScrub,
          ),
        },
      );
    }

    initStaticReveals(cLayersMedia);
  }

  function getNewsContent() {
    return (
      document.querySelector(".section_news .padding-global") ||
      document.querySelector(".section_news")
    );
  }

  function getLastTeamCard() {
    const teamCards = Array.from(
      document.querySelectorAll(".section_team .team_card"),
    );
    return teamCards[teamCards.length - 1] || null;
  }

  function getLowestElement(elements) {
    let lowest = null;
    let lowestBottom = -Infinity;
    elements.forEach(function (el) {
      if (!el || !el.getClientRects().length) return;
      const bottom = el.getBoundingClientRect().bottom;
      if (bottom > lowestBottom) {
        lowest = el;
        lowestBottom = bottom;
      }
    });
    return lowest;
  }

  function getHeroCopy() {
    const hero = getSectionByRole("hero");
    if (!hero) return null;
    return getLowestElement([
      hero.querySelector(".hero_heading"),
      hero.querySelector(".hero_subtext"),
    ]);
  }

  function getAboutCopy() {
    const about = getSectionByRole("about");
    return about ? about.querySelector("[data-about-title]") : null;
  }

  function getStoryFinalCopy() {
    const story = getSectionByRole("story");
    if (!story) return null;
    const rows = story.querySelectorAll("[data-story-row]");
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return null;
    return getLowestElement(
      Array.from(
        lastRow.querySelectorAll(
          "[data-story-eyebrow], [data-story-title], [data-story-subtext]",
        ),
      ),
    );
  }

  function getInsightsCopy() {
    const insights = getSectionByRole("insights");
    return insights
      ? insights.querySelector("[data-insights-content]") || insights
      : null;
  }

  function getContentWipeDistance() {
    return Math.round((getViewportHeight() * CONFIG.contentWipeVh) / 100);
  }

  function initStaticReveals(cLayersMedia) {
    const cLayers = getSectionByRole("c-layers");
    if (!cLayers || !cLayersMedia) return;
    const sections = Array.from(document.querySelectorAll("[data-section]"));
    const startIndex = sections.indexOf(cLayers);
    if (startIndex === -1) return;

    let outgoing = cLayersMedia;
    sections.slice(startIndex + 1).forEach(function (section) {
      const incoming = getSectionMedia(section);
      if (!incoming || getVideoSource(incoming.item)) return;

      let revealTrigger = section;
      let revealStart = responsiveValue(
        CONFIG.staticRevealStart,
        CONFIG.mobile.staticRevealStart,
      );
      let revealEnd = responsiveValue(
        CONFIG.staticRevealEnd,
        CONFIG.mobile.staticRevealEnd,
      );

      if (section.matches(".section_team")) {
        revealTrigger = cLayers;
        revealStart = CONFIG.cLayersToTeamRevealStart;
        revealEnd = CONFIG.cLayersToTeamRevealEnd;
      } else if (section.matches(".section_news")) {
        const lastTeamCard = getLastTeamCard();

        if (lastTeamCard) {
          revealTrigger = lastTeamCard;
          revealStart = "bottom top";
          revealEnd = function () {
            const distance = responsiveValue(
              CONFIG.staticRevealDistanceVh,
              CONFIG.mobile.newsRevealDistanceVh,
            );
            return `+=${Math.round((getViewportHeight() * distance) / 100)}`;
          };
        }
      } else if (section.matches(".c-footer")) {
        // The whole news block (cards + "show more") rather than the button,
        // which disappears once every item has loaded.
        const newsContent = getNewsContent();

        if (newsContent) {
          revealTrigger = newsContent;
          revealStart = "bottom top";
          revealEnd = function () {
            const distance = responsiveValue(
              CONFIG.staticRevealDistanceVh,
              CONFIG.mobile.footerRevealDistanceVh,
            );
            return `+=${Math.round((getViewportHeight() * distance) / 100)}`;
          };
        }
      }

      if (reducedMotion.matches) {
        createReducedMotionSwap(revealTrigger, incoming, outgoing, {
          start: revealStart,
        });
      } else {
        createStackedReveal(revealTrigger, incoming, outgoing, {
          start: revealStart,
          end: revealEnd,
          scrub: responsiveValue(
            CONFIG.staticRevealScrub,
            CONFIG.mobile.mediaRevealScrub,
          ),
        });
      }
      outgoing = incoming;
    });
  }

  // Holds each section's content back until the previous section's content
  // has left the screen and the background wipe is underway.
  function initSectionGaps() {
    if (reducedMotion.matches) return;
    const about = getSectionByRole("about");
    const story = getSectionByRole("story");
    const news = document.querySelector(".section_news");
    const footer = document.querySelector(".c-footer");
    const gaps = [];

    if (about) {
      gaps.push({
        section: about,
        anchor: getHeroCopy,
        content: getAboutCopy,
        revealVh: CONFIG.contentWipeVh,
        size: 0,
      });
    }

    // Here the space is the story's own tail, so the step 3 loop keeps
    // playing underneath until the Insights wipe covers it.
    if (story && getSectionByRole("insights")) {
      story.style.setProperty("--story-final-tail", "0px");
      gaps.push({
        anchor: getStoryFinalCopy,
        content: getInsightsCopy,
        revealVh: CONFIG.contentWipeVh,
        size: 0,
        apply: function (size) {
          story.style.setProperty("--story-final-tail", `${size}px`);
        },
      });
    }

    if (news) {
      gaps.push({
        section: news,
        anchor: function () {
          return getLastTeamCard() || document.querySelector(".section_team");
        },
        content: getNewsContent,
        revealVh: responsiveValue(
          CONFIG.staticRevealDistanceVh,
          CONFIG.mobile.newsRevealDistanceVh,
        ),
        size: 0,
      });
    }

    if (footer) {
      gaps.push({
        section: footer,
        anchor: getNewsContent,
        content: function () {
          return footer.querySelector(".padding-global") || footer;
        },
        revealVh: responsiveValue(
          CONFIG.staticRevealDistanceVh,
          CONFIG.mobile.footerRevealDistanceVh,
        ),
        size: 0,
      });
    }

    if (!gaps.length) return;

    // Sized against the largest mobile viewport so the gap still covers the
    // screen after the browser's address bar collapses.
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);

    function applyGaps() {
      const viewport = Math.max(probe.offsetHeight || 0, window.innerHeight);
      gaps.forEach(function (gap) {
        const anchor = gap.anchor();
        const content = gap.content();
        if (!anchor || !content) return;
        const naturalDistance =
          content.getBoundingClientRect().top -
          anchor.getBoundingClientRect().bottom -
          gap.size;
        const lead =
          ((getViewportHeight() * gap.revealVh) / 100) *
          CONFIG.sectionGapLeadRatio;
        const size = Math.max(0, Math.round(viewport + lead - naturalDistance));
        if (size === gap.size) return;
        gap.size = size;
        if (gap.apply) gap.apply(size);
        else gap.section.style.marginTop = `${size}px`;
      });
    }

    ScrollTrigger.addEventListener("refreshInit", applyGaps);
    applyGaps();
  }

  function heroUnavailable() {
    openHeroGate();
    if (loader) loader.heroReady();
  }

  // Behind the loader the whole file downloads before anything plays. Its
  // first frame waits under the loader and starts moving as the loader fades.
  function loadHeroBehindLoader(media) {
    const video = media.video;
    let wholeFile = null;
    media.resolveSource = function (url) {
      if (!wholeFile) {
        wholeFile = fetchWholeVideo(
          url,
          CONFIG.heroWholeFileMaxBytes,
          CONFIG.heroWholeFileTimeoutMs,
        );
      }
      return wholeFile;
    };

    function start(fadeIn) {
      if (!media.active) return;
      activeMedia.add(media);
      if (fadeIn) revealAndPlay(media, CONFIG.revealDuration);
      else safePlay(video);
    }

    prepareMedia(media)
      .then(function (ready) {
        if (!ready) return false;
        if (video.src.indexOf("blob:") === 0) return true;
        // The download fell back to streaming: wait until it's all buffered.
        return waitForVideoBuffer(video, {
          bufferFraction: 1,
          strict: true,
          maxWaitMs: Math.max(1, loader.remainingMs()),
        });
      })
      .then(function () {
        if (!media.loaded) {
          heroUnavailable();
          return;
        }
        openHeroGate();
        if (!loader.isOpen()) {
          start(true);
          return;
        }
        seekTo(video, FIRST_FRAME_TIME).then(function () {
          media.revealed = true;
          gsap.set(video, { opacity: 1 });
          loader.heroReady();
          loader.exited.then(function () {
            start(false);
          });
        });
      });
  }

  function initHero() {
    const section = getSectionByRole("hero");
    const media = getSectionMedia(section);
    if (!section || !media) {
      heroUnavailable();
      return;
    }

    gsap.set(media.item, { opacity: 1, scale: 1 });

    const video = media.video;
    if (!video || reducedMotion.matches) {
      heroUnavailable();
      return;
    }

    configureVideo(video);
    video.loop = true;
    media.active = true;

    if (loader) {
      loadHeroBehindLoader(media);
    } else {
      activeMedia.add(media);
      loadHeroStreaming(media);
    }

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onLeave: function () {
        deactivateMedia(media);
      },
      onEnterBack: function () {
        media.active = true;
        activeMedia.add(media);
        if (media.loaded && !media.revealed) {
          revealAndPlay(media, CONFIG.revealDuration);
        } else {
          safePlay(video);
        }
      },
    });
  }

  // Without a loader: a short head start in the buffer before the first frame
  // moves, so the opening seconds don't stutter while the rest streams in.
  function loadHeroStreaming(media) {
    const video = media.video;
    prepareMedia(media).then(function (ready) {
      if (!ready) {
        openHeroGate();
        return;
      }
      waitForVideoBuffer(video, {
        bufferSeconds: CONFIG.heroStartBufferSeconds,
        maxWaitMs: CONFIG.heroStartMaxWaitMs,
        strict: true,
      })
        .then(function () {
          if (media.active) revealAndPlay(media, CONFIG.revealDuration);
          return waitForVideoBuffer(video, {
            bufferSeconds: CONFIG.heroGateBufferSeconds,
            maxWaitMs: CONFIG.heroGateMaxWaitMs,
          });
        })
        .then(openHeroGate);
    });
  }

  function createLoopingPlayback(role, activate, options) {
    const section = getSectionByRole(role);
    const media = getSectionMedia(section);
    if (!section || !media || !media.video || reducedMotion.matches)
      return null;
    options = options || {};

    let activationId = 0;
    let shouldBeActive = false;
    // `playOnce`: the animation runs a single time per visit and then holds
    // its last frame. Once the layer has been wiped away (above or below) it
    // rewinds, so the next visit draws in again.
    let finished = false;

    if (options.playOnce) {
      media.video.addEventListener("ended", function () {
        finished = true;
        deactivateMedia(media);
      });
      let layerVisible = false;
      new MutationObserver(function () {
        const visible = media.item.style.visibility !== "hidden";
        if (visible === layerVisible) return;
        layerVisible = visible;
        if (!visible) rewindForNextVisit();
        else if (shouldBeActive && !media.active) activatePlayback();
      }).observe(media.item, { attributes: true, attributeFilter: ["style"] });
    }

    function rewindForNextVisit() {
      finished = false;
      activationId += 1;
      deactivateMedia(media);
      if (!media.loaded) return;
      try {
        media.video.currentTime = FIRST_FRAME_TIME;
      } catch (error) {}
    }

    function showLastFrame() {
      activationId += 1;
      const requestId = activationId;
      const video = media.video;
      deactivateMedia(media);
      disableSmoothLoop(media);
      video.loop = false;
      if (!media.loaded) return;
      const end = Math.max(0, video.duration - 0.02);
      const atEnd = video.ended || Math.abs(video.currentTime - end) < 0.1;
      (atEnd ? Promise.resolve() : seekTo(video, end)).then(function () {
        if (requestId !== activationId) return;
        media.revealed = true;
        gsap.to(video, {
          opacity: 1,
          duration: 0.25,
          ease: "power1.out",
          overwrite: true,
        });
      });
    }

    function playOnce() {
      if (finished) {
        showLastFrame();
        return;
      }
      media.active = true;
      activeMedia.add(media);
      disableSmoothLoop(media);
      media.video.loop = false;
      const requestId = activationId;
      revealAndPlay(
        media,
        media.revealed ? CONFIG.loopFadeIn : CONFIG.revealDuration,
      ).then(function (played) {
        // Playback refused: rest on the connected network rather than the
        // empty first frame.
        if (played || document.hidden || requestId !== activationId) return;
        finished = true;
        showLastFrame();
      });
    }

    // Parks the video on its first frame. With `holdVisible` that frame stays
    // on screen, so a wipe reveals the start of the animation, not the poster.
    function holdAtStart() {
      if (finished) {
        showLastFrame();
        return;
      }
      activationId += 1;
      const requestId = activationId;
      deactivateMedia(media);
      disableSmoothLoop(media);
      media.video.loop = false;
      if (options.holdVisible) {
        if (!media.loaded) return;
        seekTo(media.video, FIRST_FRAME_TIME).then(function () {
          if (requestId !== activationId) return;
          media.revealed = true;
          gsap.to(media.video, {
            opacity: 1,
            duration: 0.25,
            ease: "power1.out",
            overwrite: true,
          });
        });
        return;
      }
      try {
        media.video.currentTime = 0;
      } catch (error) {}
      media.revealed = false;
      gsap.set(media.video, { opacity: 0 });
    }

    function activatePlayback() {
      shouldBeActive = true;
      const requestId = ++activationId;
      // On phones About's band is already active at load; it still waits for
      // the hero so the two don't split the connection.
      heroGate
        .then(function () {
          if (requestId !== activationId) return false;
          return prepareMedia(media);
        })
        .then(function (ready) {
          if (!ready || requestId !== activationId) return false;
          return waitForVideoBuffer(media.video, {
            bufferSeconds: CONFIG.playbackStartBufferSeconds,
            maxWaitMs: CONFIG.playbackStartMaxWaitMs,
            strict: true,
          }).then(function () {
            return true;
          });
        })
        .then(function (ready) {
          if (!ready || requestId !== activationId) return;
          if (options.playOnce) {
            playOnce();
            return;
          }
          activate(media);
        });
    }

    function holdIfIdle() {
      if (options.holdAtStart && !shouldBeActive) holdAtStart();
    }

    whenNear(section, CONFIG.prepareStart, function () {
      prefetchMedia(media, holdIfIdle);
    });

    // A held first frame must be ready before the wipe uncovers it, even if
    // the download queue is still busy with something else.
    if (options.holdVisible) {
      ScrollTrigger.create({
        trigger: section,
        start: "top 150%",
        end: "bottom top",
        onEnter: function () {
          heroGate.then(function () {
            prepareMedia(media).then(function (ready) {
              if (ready) holdIfIdle();
            });
          });
        },
      });
    }

    ScrollTrigger.create({
      trigger: options.trigger || section,
      endTrigger: section,
      start:
        options.start ||
        responsiveValue(
          CONFIG.playbackBandStart,
          CONFIG.mobile.playbackBandStart,
        ),
      end: CONFIG.playbackBandEnd,
      onEnter: activatePlayback,
      onEnterBack: activatePlayback,
      onLeave: function () {
        shouldBeActive = false;
        activationId += 1;
        deactivateMedia(media);
      },
      onLeaveBack: function () {
        shouldBeActive = false;
        activationId += 1;
        deactivateMedia(media);
      },
    });

    return {
      activate: activatePlayback,
      release: function () {
        shouldBeActive = false;
        activationId += 1;
        deactivateMedia(media);
        releaseMedia(media);
      },
    };
  }

  // Story: three steps, each entered through a transition clip and (for steps
  // 1 and 3) held on a seamless loop. The engine always converges on the step
  // that matches the scroll position:
  //   - forward uses the transition clip, backward its reversed copy
  //     (data-video-*-reverse) or, without one, frame-by-frame seeking;
  //   - changing direction mid-clip continues from the mirrored frame;
  //   - when the visitor is more than one step ahead, in-between clips play
  //     at catch-up speed;
  //   - leaving the section parks it at the edge it left through, so coming
  //     back in always starts from a known state.
  function initStory() {
    const section = getSectionByRole("story");
    const media = getSectionMedia(section);
    if (!section || !media || reducedMotion.matches) return null;

    const manifestRoot = media.item.querySelector(
      "[data-story-media-manifest]",
    );
    const playerA = media.item.querySelector('[data-story-player="a"]');
    const playerB = media.item.querySelector('[data-story-player="b"]');
    const fallbackImages = Array.from(media.item.children).filter(
      function (child) {
        return child.classList.contains("bg-images_img");
      },
    );
    const rows = Array.from(section.querySelectorAll("[data-story-step]"));
    if (!manifestRoot || !playerA || !playerB || rows.length !== 3) return null;

    const stage = playerA.parentElement;
    const about = getSectionByRole("about");
    const aboutTitle = about ? about.querySelector("[data-about-title]") : null;

    const sources = {};
    manifestRoot
      .querySelectorAll("[data-story-source]")
      .forEach(function (source) {
        sources[source.getAttribute("data-story-source")] = source;
      });

    const clips = {};
    function defineClip(key, url, loop) {
      if (url) clips[key] = { key, url, loop, video: null, ready: null };
    }
    [1, 2, 3].forEach(function (stepNumber) {
      const transition = sources[STORY_STEPS[stepNumber].transition];
      const rest = STORY_STEPS[stepNumber].rest
        ? sources[STORY_STEPS[stepNumber].rest]
        : null;
      if (transition) {
        defineClip(`${stepNumber}:forward`, getVideoSource(transition), false);
        defineClip(
          `${stepNumber}:reverse`,
          getVideoSource(transition, "reverse"),
          false,
        );
      }
      if (rest) defineClip(`${stepNumber}:rest`, getVideoSource(rest), true);
    });
    if (!clips["1:forward"] || !clips["2:forward"] || !clips["3:forward"])
      return null;

    const clipList = Object.values(clips);

    // One <video> per clip: switching clips never swaps a src, so nothing is
    // re-downloaded and no element flashes empty mid-transition.
    const sparePlayers = [playerA, playerB];
    [playerA, playerB].forEach(function (player) {
      configureVideo(player);
      player.autoplay = false;
      player.removeAttribute("autoplay");
      player.loop = false;
      player.pause();
    });
    gsap.set([playerA, playerB], {
      opacity: 0,
      zIndex: 1,
      visibility: "hidden",
    });

    function createPlayer() {
      if (sparePlayers.length) return sparePlayers.shift();
      const player = playerA.cloneNode(false);
      player.removeAttribute("data-bg-video");
      player.removeAttribute("data-story-player");
      player.removeAttribute("data-src");
      player.removeAttribute("src");
      configureVideo(player);
      stage.appendChild(player);
      gsap.set(player, { opacity: 0, zIndex: 1, visibility: "hidden" });
      return player;
    }

    function clipVideo(clip) {
      if (!clip.video) {
        clip.video = createPlayer();
        clip.video.setAttribute("data-story-clip", clip.key);
      }
      return clip.video;
    }
    // Every player exists from the start so a Low Power Mode unlock reaches
    // them all; each still only downloads when its clip is needed.
    clipList.forEach(clipVideo);

    function loadClip(clip) {
      if (!clip) return Promise.resolve(false);
      if (!clip.ready) {
        const video = clipVideo(clip);
        video.loop = clip.loop;
        clip.ready = loadVideo(video, clip.url).then(function (ok) {
          if (!ok) clip.ready = null;
          return ok;
        });
      }
      return clip.ready;
    }

    function prefetchClip(clip) {
      if (!clip || clip.ready || clip.queued) return;
      clip.queued = true;
      prefetch(function () {
        clip.queued = false;
        return loadClip(clip).then(function (ok) {
          if (!ok) return false;
          return waitForVideoBuffer(clip.video, {
            bufferFraction: 1,
            strict: true,
            maxWaitMs: CONFIG.prefetchMaxWaitMs,
          });
        });
      });
    }

    // Queued in the order they'll be needed: the next step's clips first,
    // then the current step's, then the way back.
    function preloadAround(stepNumber) {
      [stepNumber + 1, stepNumber].forEach(function (n) {
        if (n < 1 || n > 3) return;
        prefetchClip(clips[`${n}:forward`]);
        prefetchClip(clips[`${n}:rest`]);
      });
      if (stepNumber >= 2) prefetchClip(clips[`${stepNumber}:reverse`]);
    }

    let active = false;
    let target = 0;
    let step = 0;
    let motion = null;
    let opId = 0;
    let shown = null;
    let restReady = false;
    let autoplayBlocked = false;

    onPlaybackUnlocked(function () {
      if (!autoplayBlocked) return;
      autoplayBlocked = false;
      if (active && !motion) reconcile();
    });

    function setFallbacksVisible(visible) {
      if (fallbackImages.length)
        gsap.set(fallbackImages, { autoAlpha: visible ? 1 : 0 });
    }

    function retireClip(clip) {
      if (!clip || !clip.video || clip === shown) return;
      clip.video.pause();
      gsap.killTweensOf(clip.video);
      gsap.set(clip.video, { opacity: 0, visibility: "hidden", zIndex: 1 });
    }

    // Puts a clip on top at opacity 0 so it can seek/start behind the
    // current frame before fading in.
    function stageClip(clip) {
      if (clip === shown) return;
      gsap.killTweensOf(clip.video);
      gsap.set(clip.video, { visibility: "inherit", opacity: 0, zIndex: 3 });
    }

    function fadeFor(clip) {
      if (!shown || shown === clip) return 0;
      const shownIsLooping = shown.loop && shown.video && !shown.video.paused;
      return shownIsLooping ? CONFIG.storyCrossfade : CONFIG.storySwapFade;
    }

    // Fades the new clip in over the old one (both opaque), then hides the
    // old one, so there is never a dip to the layer underneath.
    function showClip(clip, fade) {
      const video = clip.video;
      const previous = shown;
      shown = clip;
      setFallbacksVisible(false);
      clipList.forEach(function (other) {
        if (other !== clip && other !== previous) retireClip(other);
      });
      gsap.killTweensOf(video);
      gsap.set(video, { visibility: "inherit", zIndex: 3 });
      if (!previous || previous === clip || !fade) {
        gsap.set(video, { opacity: 1 });
        if (previous && previous !== clip) retireClip(previous);
        return;
      }
      gsap.set(previous.video, { zIndex: 2 });
      gsap.to(video, {
        opacity: 1,
        duration: fade,
        ease: "power1.inOut",
        onComplete: function () {
          retireClip(previous);
        },
      });
    }

    // Shows a still frame of a clip, used when parking the story at an edge
    // and when playback isn't allowed.
    function presentStill(clip, time, fade, onShown) {
      const id = ++opId;
      loadClip(clip).then(function (ok) {
        if (id !== opId || !ok) return;
        const video = clip.video;
        video.pause();
        stageClip(clip);
        const resolvedTime = typeof time === "function" ? time(video) : time;
        presentFrame(video, resolvedTime).then(function () {
          if (id !== opId) return;
          showClip(clip, fade);
          restReady = true;
          if (onShown) onShown(id);
        });
      });
    }

    function stepEndTime(video) {
      return Math.max(0, (video.duration || 0) - 0.04);
    }

    function presentStepFrame(stepNumber, fade) {
      if (stepNumber <= 0) {
        presentStill(clips["1:forward"], FIRST_FRAME_TIME, fade);
        return;
      }
      const restClip = clips[`${stepNumber}:rest`];
      if (restClip) {
        presentStill(restClip, FIRST_FRAME_TIME, fade);
        return;
      }
      presentStill(clips[`${stepNumber}:forward`], stepEndTime, fade);
    }

    function ensureRest() {
      if (step <= 0) {
        if (!restReady) presentStepFrame(0, 0);
        return;
      }
      const restClip = clips[`${step}:rest`];
      if (!restClip) {
        if (!restReady)
          presentStepFrame(step, fadeFor(clips[`${step}:forward`]));
        return;
      }
      if (shown === restClip && restReady) {
        if (restClip.video.paused && !autoplayBlocked) {
          restClip.video.loop = true;
          safePlay(restClip.video);
        }
        return;
      }
      const id = ++opId;
      loadClip(restClip).then(function (ok) {
        if (id !== opId) return;
        if (!ok) {
          if (!restReady) presentStepFrame(step, 0);
          return;
        }
        const video = restClip.video;
        video.loop = true;
        video.playbackRate = 1;
        stageClip(restClip);
        presentFrame(video, FIRST_FRAME_TIME)
          .then(function () {
            if (id !== opId) return false;
            return autoplayBlocked ? false : safePlay(video);
          })
          .then(function (played) {
            if (id !== opId) return;
            return played
              ? nextPresentedFrame(video, CONFIG.storyFirstFrameMaxWaitMs)
              : null;
          })
          .then(function () {
            if (id !== opId) return;
            showClip(restClip, fadeFor(restClip));
            restReady = true;
          });
      });
    }

    function currentFraction(m) {
      const video = m.clip.video;
      if (!m.started || !video || !video.duration) return 0;
      if (m.seekReverse) return m.fraction;
      return gsap.utils.clamp(0, 1, video.currentTime / video.duration);
    }

    function updateMotionRate() {
      if (!motion) return;
      const beyond = motion.dir > 0 ? target > motion.to : target < motion.to;
      motion.rate = beyond ? CONFIG.storyCatchUpRate : 1;
      if (motion.started && !motion.seekReverse && motion.clip.video) {
        try {
          motion.clip.video.playbackRate = motion.rate;
        } catch (error) {}
      }
    }

    function cancelMotion() {
      if (!motion) return;
      const m = motion;
      motion = null;
      if (m.stop) m.stop();
      if (m.clip.video) m.clip.video.pause();
    }

    function finishMotion(id, landedOnFrame) {
      if (!motion || motion.id !== id) return;
      step = motion.to;
      restReady = !!landedOnFrame;
      motion = null;
      reconcile();
    }

    // Autoplay refused: land on the transition's final frame instead.
    function jumpToMotionEnd(m) {
      const video = m.clip.video;
      const endTime = m.seekReverse ? FIRST_FRAME_TIME : stepEndTime(video);
      seekTo(video, endTime).then(function () {
        if (!motion || motion.id !== m.id) return;
        showClip(m.clip, 0);
        finishMotion(m.id, true);
      });
    }

    function watchPlayback(m) {
      const video = m.clip.video;
      let lastTime = video.currentTime;
      let lastProgressAt = performance.now();
      let rafId = null;

      function stop() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
        video.removeEventListener("ended", check);
      }

      function check() {
        if (!motion || motion.id !== m.id) {
          stop();
          return;
        }
        const duration = video.duration;
        if (video.ended || (duration && video.currentTime >= duration - 0.04)) {
          stop();
          video.pause();
          finishMotion(m.id, true);
          return;
        }
        const now = performance.now();
        if (video.currentTime !== lastTime || document.hidden) {
          lastTime = video.currentTime;
          lastProgressAt = now;
        } else if (now - lastProgressAt > CONFIG.storyStallTimeoutMs) {
          // Stuck on the network: land on the step rather than freeze.
          stop();
          video.pause();
          finishMotion(m.id, false);
          return;
        }
        rafId = requestAnimationFrame(check);
      }

      m.stop = stop;
      video.addEventListener("ended", check);
      rafId = requestAnimationFrame(check);
    }

    function runPlayback(m) {
      const video = m.clip.video;
      const duration = video.duration;
      if (!duration || !Number.isFinite(duration)) {
        finishMotion(m.id, false);
        return;
      }
      video.loop = false;
      video.pause();
      stageClip(m.clip);
      const startTime = gsap.utils.clamp(
        FIRST_FRAME_TIME,
        duration - 0.05,
        m.fraction * duration,
      );
      presentFrame(video, startTime)
        .then(function () {
          if (!motion || motion.id !== m.id) return null;
          video.playbackRate = m.rate;
          return autoplayBlocked ? false : safePlay(video);
        })
        .then(function (played) {
          if (played === null || !motion || motion.id !== m.id) return;
          if (!played) {
            if (!document.hidden) autoplayBlocked = true;
            jumpToMotionEnd(m);
            return;
          }
          m.started = true;
          watchPlayback(m);
          // The frame on screen matches the clip's start, so it stays up
          // until the clip is really moving.
          return nextPresentedFrame(
            video,
            CONFIG.storyFirstFrameMaxWaitMs,
          ).then(function () {
            if (!motion || motion.id !== m.id) return;
            showClip(m.clip, fadeFor(m.clip));
          });
        });
    }

    // Fallback reverse without a reversed file: steps backwards through the
    // forward clip in real time, only issuing a new seek once the previous
    // one has landed so slow decoders drop frames instead of lagging.
    function runSeekReverse(m) {
      const video = m.clip.video;
      const duration = video.duration;
      if (!duration || !Number.isFinite(duration)) {
        finishMotion(m.id, false);
        return;
      }
      video.loop = false;
      video.pause();
      stageClip(m.clip);
      let position = gsap.utils.clamp(
        0,
        duration - 0.04,
        (1 - m.fraction) * duration,
      );
      seekTo(video, position).then(function () {
        if (!motion || motion.id !== m.id) return;
        m.started = true;
        m.fraction = 1 - position / duration;
        showClip(m.clip, fadeFor(m.clip));

        const minStep = 1 / CONFIG.storyReverseFps;
        let lastTick = performance.now();
        let seeking = false;
        let seekStartedAt = 0;
        let rafId = null;

        function onSeeked() {
          seeking = false;
        }

        function stop() {
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = null;
          video.removeEventListener("seeked", onSeeked);
        }

        function tick(now) {
          if (!motion || motion.id !== m.id) {
            stop();
            return;
          }
          const elapsed = Math.min(0.1, (now - lastTick) / 1000);
          lastTick = now;
          if (!document.hidden) {
            position = Math.max(0, position - elapsed * m.rate);
          }
          m.fraction = 1 - position / duration;
          if (seeking && now - seekStartedAt > 500) seeking = false;
          if (
            !seeking &&
            (video.currentTime - position >= minStep ||
              (position === 0 && video.currentTime > 0.001))
          ) {
            seeking = true;
            seekStartedAt = now;
            try {
              video.currentTime = position;
            } catch (error) {
              seeking = false;
            }
          }
          if (position === 0 && !seeking) {
            stop();
            finishMotion(m.id, true);
            return;
          }
          rafId = requestAnimationFrame(tick);
        }

        m.stop = stop;
        video.addEventListener("seeked", onSeeked);
        rafId = requestAnimationFrame(tick);
      });
    }

    function startMotion(dir, startFraction) {
      const id = ++opId;
      const from = step;
      const to = step + dir;
      const clipStep = dir > 0 ? to : from;
      const reverseClip = dir < 0 ? clips[`${clipStep}:reverse`] : null;
      const clip = reverseClip || clips[`${clipStep}:forward`];
      const m = {
        id,
        dir,
        from,
        to,
        clip,
        seekReverse: dir < 0 && !reverseClip,
        rate: 1,
        started: false,
        stop: null,
        fraction: startFraction || 0,
      };
      motion = m;
      restReady = false;
      updateMotionRate();

      loadClip(clip).then(function (ok) {
        if (!motion || motion.id !== id) return;
        if (!ok) {
          finishMotion(id, false);
          return;
        }
        preloadAround(to);
        waitForVideoBuffer(clip.video, {
          bufferFraction: 1,
          strict: true,
          maxWaitMs: CONFIG.storyStartBufferMs,
        }).then(function () {
          if (!motion || motion.id !== id) return;
          if (m.seekReverse) runSeekReverse(m);
          else runPlayback(m);
        });
      });
    }

    // Reverses the clip in flight from the mirrored position.
    function flipMotion() {
      const m = motion;
      const fraction = currentFraction(m);
      const started = m.started;
      cancelMotion();
      if (!started) {
        opId += 1;
        reconcile();
        return;
      }
      step = m.to;
      startMotion(-m.dir, 1 - fraction);
    }

    function reconcile() {
      if (!active) return;
      target = computeTarget();
      if (motion) {
        const heading =
          motion.dir > 0 ? target >= motion.to : target <= motion.to;
        if (heading) updateMotionRate();
        else flipMotion();
        return;
      }
      if (target > step) {
        startMotion(1, 0);
        return;
      }
      if (target < step) {
        startMotion(-1, 0);
        return;
      }
      ensureRest();
    }

    const stepStart = responsiveValue(
      CONFIG.storyStepStart,
      CONFIG.mobile.storyStepStart,
    );
    const step2Start = responsiveValue(
      CONFIG.storyStep2Start,
      CONFIG.mobile.storyStep2Start,
    );

    // ScrollTrigger can fire callbacks while a trigger is being created, so
    // they're ignored until every trigger below exists.
    let initialized = false;

    // Active while the story layer can be on screen: from the start of its
    // wipe until the section has scrolled away.
    const activation = ScrollTrigger.create({
      trigger: aboutTitle || section,
      start: aboutTitle ? "bottom top" : "top bottom",
      endTrigger: section,
      end: "bottom top",
      onEnter: function () {
        if (initialized) activate();
      },
      onEnterBack: function () {
        if (initialized) activate();
      },
      onLeave: function () {
        if (initialized) deactivate(3);
      },
      onLeaveBack: function () {
        if (initialized) deactivate(0);
      },
      // Belt and braces for the row callbacks: a missed one (e.g. a throttled
      // fling) is corrected on the next scroll update.
      onUpdate: function () {
        if (initialized && active) updateTarget();
      },
    });

    const stepTriggers = rows
      .filter(function (row) {
        return parseInt(row.getAttribute("data-story-step"), 10) > 1;
      })
      .map(function (row) {
        const stepNumber = parseInt(row.getAttribute("data-story-step"), 10);
        return ScrollTrigger.create({
          trigger: row,
          start: stepNumber === 2 ? step2Start : stepStart,
          onEnter: updateTarget,
          onLeaveBack: updateTarget,
        });
      });

    function computeTarget() {
      const scroll = activation.scroll();
      if (scroll < activation.start) return 0;
      let value = 1;
      stepTriggers.forEach(function (trigger) {
        if (scroll >= trigger.start) value += 1;
      });
      return Math.min(3, value);
    }

    function updateTarget() {
      if (!initialized) return;
      const next = computeTarget();
      if (next === target) return;
      target = next;
      reconcile();
    }

    function prepare() {
      if (!active && !restReady) presentStepFrame(step, 0);
      preloadAround(step);
    }

    // Deferred a frame: a fast scroll that jumps straight through the section
    // fires enter and leave together, and shouldn't start any downloads.
    function activate() {
      if (active) return;
      active = true;
      const id = ++opId;
      requestAnimationFrame(function () {
        if (!active || id !== opId) return;
        target = computeTarget();
        prepare();
        reconcile();
      });
    }

    function deactivate(edgeStep) {
      active = false;
      opId += 1;
      cancelMotion();
      clipList.forEach(function (clip) {
        if (clip.video) clip.video.pause();
      });
      target = edgeStep;
      if (step !== edgeStep) {
        step = edgeStep;
        restReady = false;
        // Only swap frames for clips already in memory; anything else is
        // prepared when the visitor heads back this way.
        const edgeClip =
          edgeStep <= 0
            ? clips["1:forward"]
            : clips[`${edgeStep}:rest`] || clips[`${edgeStep}:forward`];
        if (edgeClip && edgeClip.ready) presentStepFrame(edgeStep, 0);
      }
    }

    initialized = true;
    if (activation.isActive) {
      activate();
    } else if (activation.scroll() > activation.end) {
      // Page loaded below the story: start parked at the last step.
      step = 3;
      target = 3;
    }

    ScrollTrigger.create({
      trigger: section,
      start: CONFIG.prepareStart,
      end: "bottom -100%",
      onEnter: function () {
        heroGate.then(prepare);
      },
      onEnterBack: function () {
        heroGate.then(prepare);
      },
    });

    return {
      // Queued behind the hero while the loader is up: the first clips a
      // visitor reaches, so Step 1 and Step 2 are ready before they get there.
      warm: function () {
        prefetchClip(clips["1:forward"]);
        prefetchClip(clips["1:rest"]);
        prefetchClip(clips["2:forward"]);
      },
      suspend: function () {
        if (!active) return;
        opId += 1;
        if (motion) {
          const m = motion;
          const fraction = currentFraction(m);
          cancelMotion();
          step = m.started && fraction >= 0.5 ? m.to : m.from;
        }
        restReady = false;
        clipList.forEach(function (clip) {
          if (clip.video) clip.video.pause();
        });
      },
      resume: function () {
        if (!active) return;
        target = computeTarget();
        reconcile();
      },
      // Frees the decoders on WebKit once the story is two sections away.
      release: function () {
        if (!isWebKit || active) return;
        opId += 1;
        cancelMotion();
        clipList.forEach(function (clip) {
          if (!clip.video || !clip.ready) return;
          unloadVideo(clip.video);
          clip.ready = null;
          gsap.set(clip.video, { opacity: 0, visibility: "hidden", zIndex: 1 });
        });
        shown = null;
        restReady = false;
        setFallbacksVisible(true);
      },
    };
  }

  function createViewportFade(trigger, targets, options) {
    if (reducedMotion.matches || !trigger || !targets) return;
    const elements = gsap.utils.toArray(targets).filter(Boolean);
    if (!elements.length) return;
    options = options || {};
    const blur = options.blur != null ? options.blur : CONFIG.viewportFadeBlur;

    gsap.set(elements, { opacity: 0, filter: `blur(${blur}px)` });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: options.start || "top 90%",
        end: options.end || "bottom 10%",
        scrub:
          options.scrub != null
            ? options.scrub
            : responsiveValue(
                CONFIG.viewportFadeScrub,
                CONFIG.mobile.viewportFadeScrub,
              ),
        fastScrollEnd: 1800,
        invalidateOnRefresh: true,
      },
    });
    timeline.to(
      elements,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: options.fadeInEnd || CONFIG.viewportFadeInEnd,
        ease: "none",
      },
      0,
    );
    timeline.to(
      elements,
      {
        opacity: 0,
        filter: `blur(${blur}px)`,
        duration: 1 - (options.fadeOutStart || CONFIG.viewportFadeOutStart),
        ease: "none",
      },
      options.fadeOutStart || CONFIG.viewportFadeOutStart,
    );
  }

  function createTitleReveal(el, options) {
    if (reducedMotion.matches || !el) return;

    options = options || {};

    gsap.set(el, {
      opacity: 0,
      filter: `blur(${CONFIG.viewportFadeBlur}px)`,
    });

    gsap.to(el, {
      opacity: 1,
      filter: "blur(0px)",
      ease: "none",
      scrollTrigger: {
        trigger: options.enterTrigger || el,
        start: options.enterStart || "top 90%",
        end: options.enterEnd || "top 62%",
        scrub: responsiveValue(
          CONFIG.viewportFadeScrub,
          CONFIG.mobile.viewportFadeScrub,
        ),
        fastScrollEnd: 1800,
        invalidateOnRefresh: true,
      },
    });

    gsap.fromTo(
      el,
      {
        opacity: 1,
        filter: "blur(0px)",
      },
      {
        opacity: 0,
        filter: `blur(${CONFIG.viewportFadeBlur}px)`,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: options.exitStart || "top top",
          end: options.exitEnd || "bottom top",
          scrub: responsiveValue(
            CONFIG.viewportFadeScrub,
            CONFIG.mobile.viewportFadeScrub,
          ),
          fastScrollEnd: 1800,
          invalidateOnRefresh: true,
        },
      },
    );
  }

  function createHeroExit(hero) {
    const targets = [
      hero.querySelector(".hero_heading"),
      hero.querySelector(".hero_subtext"),
    ].filter(Boolean);
    if (!targets.length) return;
    gsap.set(targets, { opacity: 1, filter: "blur(0px)" });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom 35%",
        scrub: responsiveValue(0.3, CONFIG.mobile.viewportFadeScrub),
        fastScrollEnd: 1800,
        invalidateOnRefresh: true,
      },
    });
    timeline.to(
      targets,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: CONFIG.heroFadeHold,
        ease: "none",
      },
      0,
    );
    timeline.to(
      targets,
      {
        opacity: 0,
        filter: `blur(${CONFIG.heroFadeBlur}px)`,
        duration: 1 - CONFIG.heroFadeHold,
        ease: "none",
      },
      CONFIG.heroFadeHold,
    );
  }

  // Safari clips anything that spills outside an element carrying a CSS
  // filter, which cut the eyebrows' blurred glow (their ::before) to a hard
  // box. Elements with their own glow ([data-blur-bg]) therefore only fade,
  // and the blur goes on a wrapper around their text.
  function getBlurTarget(element) {
    if (!element.hasAttribute("data-blur-bg")) return element;
    const wrapper = document.createElement("span");
    wrapper.setAttribute("data-blur-text", "");
    wrapper.style.display = "inline-block";
    while (element.firstChild) wrapper.appendChild(element.firstChild);
    element.appendChild(wrapper);
    return wrapper;
  }

  function createStoryRowFade(row) {
    const elements = [
      row.querySelector("[data-story-eyebrow]"),
      row.querySelector("[data-story-title]"),
      row.querySelector("[data-story-subtext]"),
    ].filter(Boolean);
    if (!elements.length) return;
    const blurTargets = elements.map(getBlurTarget);
    gsap.set(elements, { opacity: 0 });
    gsap.set(blurTargets, { filter: `blur(${CONFIG.storyFadeBlur}px)` });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: "top 50%",
        end: "bottom 50%",
        scrub: responsiveValue(0.3, CONFIG.mobile.viewportFadeScrub),
        fastScrollEnd: 1800,
        invalidateOnRefresh: true,
      },
    });
    elements.forEach(function (element, index) {
      const at = index * CONFIG.storyRowRevealStagger;
      timeline.to(
        element,
        { opacity: 1, duration: CONFIG.storyRowRevealDuration, ease: "none" },
        at,
      );
      timeline.to(
        blurTargets[index],
        {
          filter: "blur(0px)",
          duration: CONFIG.storyRowRevealDuration,
          ease: "none",
        },
        at,
      );
    });
    timeline.to(
      elements,
      { opacity: 0, duration: CONFIG.storyRowRevealDuration, ease: "none" },
      CONFIG.storyRowFadeOutStart,
    );
    timeline.to(
      blurTargets,
      {
        filter: `blur(${CONFIG.viewportFadeBlur}px)`,
        duration: CONFIG.storyRowRevealDuration,
        ease: "none",
      },
      CONFIG.storyRowFadeOutStart,
    );
  }

  function getContentTargets() {
    const targets = [];
    [
      ".about_title",
      ".pipeline_title",
      ".team_title",
      ".news_title",
      ".hero_heading",
      ".hero_subtext",
    ].forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        targets.push(el);
      });
    });
    const insights = getSectionByRole("insights");
    if (insights) {
      const cards = insights.querySelector(".insights_cards-container");
      insights
        .querySelectorAll(
          "[data-insights-content] h2, [data-insights-content] p",
        )
        .forEach(function (el) {
          if (!cards || !cards.contains(el)) targets.push(el);
        });
    }
    document
      .querySelectorAll(
        "[data-story-eyebrow], [data-story-title], [data-story-subtext], [data-blur-text]",
      )
      .forEach(function (el) {
        targets.push(el);
      });
    return targets;
  }

  function initContentFades() {
    if (reducedMotion.matches) {
      gsap.set(getContentTargets(), { clearProps: "opacity,filter" });
      return;
    }

    const hero = getSectionByRole("hero");
    if (hero) createHeroExit(hero);

    const about = getSectionByRole("about");
    const aboutTitle = about ? about.querySelector("[data-about-title]") : null;
    if (aboutTitle)
      createViewportFade(about, aboutTitle, {
        start: "top 50%",
        end: "bottom 50%",
        blur: 5,
      });

    const story = getSectionByRole("story");
    if (story)
      story.querySelectorAll("[data-story-row]").forEach(createStoryRowFade);

    const insights = getSectionByRole("insights");
    if (insights) {
      const cards = insights.querySelector(".insights_cards-container");
      insights
        .querySelectorAll(
          "[data-insights-content] h2, [data-insights-content] p",
        )
        .forEach(function (el) {
          if (cards && cards.contains(el)) return;
          createViewportFade(el, el, {
            start: "top 90%",
            end: "bottom 10%",
            fadeInEnd: 0.18,
            fadeOutStart: 0.82,
          });
        });
    }

    createTitleReveal(document.querySelector(".pipeline_title"));
    createTitleReveal(document.querySelector(".team_title"), {
      enterStart: "top 90%",
      enterEnd: "top 70%",
    });

    createTitleReveal(document.querySelector(".news_title"), {
      enterStart: responsiveValue("top 98%", "top 94%"),
      enterEnd: responsiveValue("top 78%", "top 74%"),
      exitStart: responsiveValue("center top", "bottom 5%"),
      exitEnd: responsiveValue("bottom -8%", "bottom -10%"),
    });
  }

  function preparePlaybackVideo(media, options) {
    if (!media || !media.video || reducedMotion.matches)
      return Promise.resolve(false);
    options = options || {};
    const video = media.video;
    configureVideo(video);
    video.loop = false;
    return prepareMedia(media).then(function (ready) {
      if (!ready) return false;
      return waitForVideoBuffer(video, options).then(function () {
        video.pause();
        if (options.hidePosters) {
          gsap.set(media.item.querySelectorAll(".bg-images_img"), {
            autoAlpha: 0,
          });
        }
        media.revealed = true;
        gsap.to(video, {
          opacity: options.revealOpacity != null ? options.revealOpacity : 1,
          duration: 0.35,
          ease: "power2.out",
          overwrite: true,
        });
        return true;
      });
    });
  }

  // A canvas laid over a video that can hold the current picture while the
  // video seeks underneath, then fade away: a smooth crossfade between any
  // two frames regardless of how long the seek takes.
  function createFreezeFrame(video, backgroundColor) {
    if (!video || !video.parentNode) return null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return null;
    const videoStyle = getComputedStyle(video);
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = [
      "position:absolute",
      "inset:0",
      "width:100%",
      "height:100%",
      `object-fit:${videoStyle.objectFit || "cover"}`,
      `object-position:${videoStyle.objectPosition || "50% 50%"}`,
      "pointer-events:none",
    ].join(";");
    video.parentNode.insertBefore(canvas, video.nextSibling);
    gsap.set(canvas, { opacity: 0, visibility: "hidden" });
    let visible = false;

    // Paints exactly what is on screen right now (background, video at its
    // current opacity, and any freeze-frame still fading out) into the
    // canvas, then shows the canvas fully opaque on top.
    function hold() {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (
        !width ||
        !height ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      )
        return false;
      const scale = Math.min(
        1,
        CONFIG.freezeFrameMaxSide / Math.max(width, height),
      );
      const canvasWidth = Math.round(width * scale);
      const canvasHeight = Math.round(height * scale);
      let canvasOpacity = visible ? +gsap.getProperty(canvas, "opacity") : 0;
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvasOpacity = 0;
      }
      const videoOpacity = +gsap.getProperty(video, "opacity");
      const videoAlpha = (1 - canvasOpacity) * videoOpacity;
      const backgroundAlpha =
        canvasOpacity > 0 ? 1 - canvasOpacity / (1 - videoAlpha) : 1;
      gsap.killTweensOf(canvas);
      try {
        context.globalAlpha = gsap.utils.clamp(0, 1, backgroundAlpha);
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        if (videoAlpha > 0) {
          context.globalAlpha = gsap.utils.clamp(0, 1, videoAlpha);
          context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        }
        context.globalAlpha = 1;
      } catch (error) {
        context.globalAlpha = 1;
        return false;
      }
      visible = true;
      gsap.set(canvas, { visibility: "inherit", opacity: 1 });
      return true;
    }

    function release(duration) {
      if (!visible) return;
      gsap.to(canvas, {
        opacity: 0,
        duration: duration || 0,
        ease: "power1.inOut",
        overwrite: true,
        onComplete: function () {
          visible = false;
          gsap.set(canvas, { visibility: "hidden" });
        },
      });
    }

    return { hold, release };
  }

  // C-layers (rocks). Phases follow the scroll position:
  //   intro       – intro copy on screen, video parked on frame 0 at 40%
  //   opening     – copy has gone, the video plays 0 → 2.2s (fully settled)
  //   interactive – map + dots live; hovering crossfades to each layer's frame
  //   closing     – past the close point, the video plays its final close
  //   closed      – parked on the last frame
  // Scrolling back up reverses this: the rocks reopen from closed, and close
  // again (dimmed) when the intro copy returns. Phones keep the rocks at the
  // intro's 40% throughout so the labels and cards stay readable.
  function initCLayers(handles) {
    const insights = getSectionByRole("insights");
    const cLayers = getSectionByRole("c-layers");
    const cLayersMedia = getSectionMedia(cLayers);
    if (!cLayers || !cLayersMedia) return;

    // Solid backdrop so the 40% intro video never shows Insights through it.
    cLayersMedia.item.style.backgroundColor = CONFIG.cLayersBackground;

    let wholeFile = null;
    cLayersMedia.resolveSource = function (url) {
      if (!wholeFile) {
        wholeFile = fetchWholeVideo(
          url,
          CONFIG.cLayersWholeFileMaxBytes,
          CONFIG.cLayersWholeFileTimeoutMs,
        );
      }
      return wholeFile;
    };

    const map = cLayers.querySelector("[data-layer-map]");
    const introTrack = cLayers.querySelector("[data-c-layers-intro]");
    const introCopy = cLayers.querySelector("[data-c-layers-intro-copy]");
    const interactionTrack = cLayers.querySelector(
      "[data-c-layers-interaction]",
    );
    const controls = map
      ? Array.from(map.querySelectorAll("[data-layer-control]"))
      : [];
    const rows = Array.from(cLayers.querySelectorAll("[data-layer-row]"));

    if (reducedMotion.matches) return;
    if (
      !map ||
      !introTrack ||
      !introCopy ||
      !interactionTrack ||
      controls.length !== 3 ||
      rows.length !== 3
    ) {
      console.warn(
        "C-layers requires intro/interaction hooks, [data-layer-map], three controls and three [data-layer-row] panels.",
      );
      return;
    }

    if (mobileQuery.matches) {
      interactionTrack.style.minHeight = `${CONFIG.mobile.cLayersInteractionTrackVh}svh`;
    } else {
      introTrack.style.boxSizing = "border-box";
      introTrack.style.alignItems = "flex-start";
      introTrack.style.minHeight = `${CONFIG.cLayersIntroTrackVh}svh`;
      introTrack.style.paddingTop = `${CONFIG.cLayersIntroLeadVh}svh`;
      interactionTrack.style.minHeight = `${CONFIG.cLayersInteractionTrackVh}svh`;
    }

    const closeRatio = responsiveValue(
      CONFIG.cLayersCloseViewportRatio,
      CONFIG.mobile.cLayersCloseViewportRatio,
    );

    const panelMap = {
      infrastructure: rows[0],
      memory: rows[1],
      application: rows[2],
    };

    Object.entries(panelMap).forEach(function (entry) {
      const key = entry[0];
      const row = entry[1];
      if (!row) return;
      row.setAttribute("data-layer-panel", key);
      if (!row.id) row.id = `layer-panel-${key}`;
      row.setAttribute("aria-hidden", "true");
      if ("inert" in row) row.inert = true;
      row.style.position = "fixed";
      row.style.inset = "0";
      gsap.set(row, { autoAlpha: 0 });
      row.querySelectorAll(".layers_close-button").forEach(function (button) {
        button.type = "button";
        if (!button.hasAttribute("aria-label"))
          button.setAttribute("aria-label", "Close");
        button.addEventListener("click", function () {
          resetLayers({ immediate: false, resetVideo: true });
        });
      });
    });

    controls.forEach(function (control) {
      const key = control.getAttribute("data-layer-control");
      const row = panelMap[key];
      if (row) control.setAttribute("aria-controls", row.id);
      control.setAttribute("aria-pressed", "false");
      control.disabled = true;
      control.setAttribute("aria-disabled", "true");
    });

    gsap.set(map, { autoAlpha: 0 });
    map.setAttribute("aria-hidden", "true");
    gsap.set(cLayersMedia.video, { opacity: CONFIG.cLayersIntroOpacity });
    // The poster stands in for the video until it has loaded, so it shows the
    // closed rocks at the intro's opacity too.
    gsap.set(cLayersMedia.item.querySelectorAll(".bg-images_img"), {
      opacity: CONFIG.cLayersIntroOpacity,
    });

    const freeze = createFreezeFrame(
      cLayersMedia.video,
      CONFIG.cLayersBackground,
    );

    let activeLayer = null;
    let videoActionId = 0;
    let cLayersReadyPromise = null;
    let cancelSegmentPlayback = null;
    let phase = "intro";
    let interactiveReady = false;
    let phaseId = 0;
    // Scroll callbacks are ignored until the initial state has been set.
    let layersInitialized = false;

    function setPanelAccessibility(row, active) {
      if (!row) return;
      row.setAttribute("aria-hidden", active ? "false" : "true");
      if ("inert" in row) row.inert = !active;
      row.style.pointerEvents = "none";
      const card = row.querySelector(".layers_card");
      if (card) card.style.pointerEvents = "none";
      // Taps on the card fall through and close it; only the X catches them.
      row.querySelectorAll(".layers_close-button").forEach(function (button) {
        button.style.pointerEvents = active ? "auto" : "none";
      });
    }

    function hidePanel(row, immediate) {
      if (!row) return;
      const card = row.querySelector(".layers_card");
      gsap.killTweensOf(row);
      if (card) gsap.killTweensOf(card);
      if (immediate) {
        gsap.set(row, { autoAlpha: 0 });
        if (card) gsap.set(card, { opacity: 1, y: 0, filter: "blur(0px)" });
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
          gsap.set(row, { autoAlpha: 0 });
          gsap.set(card, { opacity: 1, y: 0, filter: "blur(0px)" });
          setPanelAccessibility(row, false);
        },
      });
    }

    function showPanel(row) {
      if (!row) return;
      const card = row.querySelector(".layers_card");
      gsap.killTweensOf(row);
      if (card) gsap.killTweensOf(card);
      setPanelAccessibility(row, true);
      gsap.set(row, { autoAlpha: 1 });
      if (!card) return;
      gsap.fromTo(
        card,
        { opacity: 0, y: 18, filter: "blur(5px)" },
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
      if (key) map.setAttribute("data-active-layer", key);
      else map.removeAttribute("data-active-layer");
      controls.forEach(function (control) {
        control.setAttribute(
          "aria-pressed",
          control.getAttribute("data-layer-control") === key ? "true" : "false",
        );
      });
    }

    function setControlsEnabled(enabled) {
      interactiveReady = enabled;
      controls.forEach(function (control) {
        control.disabled = !enabled;
        control.setAttribute("aria-disabled", enabled ? "false" : "true");
      });
      // Disabled buttons swallow pointerenter, so a cursor already resting
      // on a dot when the map goes live wouldn't register without this.
      if (enabled && useHoverInteractions) {
        const hovered = controls.find(function (control) {
          return control.matches(":hover");
        });
        if (hovered) activateLayer(hovered.getAttribute("data-layer-control"));
      }
    }

    function getCLayersSafeDuration() {
      const video = cLayersMedia.video;
      if (!video || !video.duration || !Number.isFinite(video.duration))
        return 0;
      return Math.max(0, video.duration - 0.034);
    }

    function getCLayersTargetTime(seconds) {
      return Math.min(seconds, getCLayersSafeDuration());
    }

    function getRocksOpacity() {
      return mobileQuery.matches ? CONFIG.cLayersIntroOpacity : 1;
    }

    function getCLayersOpenTime() {
      return Math.min(CONFIG.cLayersOpenTime, getCLayersSafeDuration());
    }

    // The mobile encode closes two frames earlier than the desktop one.
    const closeStartTime = responsiveValue(
      CONFIG.cLayersCloseStartTime,
      CONFIG.mobile.cLayersCloseStartTime,
    );
    const closeMotionLength =
      responsiveValue(
        CONFIG.cLayersCloseMotionEnd,
        CONFIG.mobile.cLayersCloseMotionEnd,
      ) - closeStartTime;

    function getCLayersCloseStartTime() {
      return Math.min(closeStartTime, getCLayersSafeDuration());
    }

    function getCLayersCloseEndTime() {
      return getCLayersSafeDuration();
    }

    // How shut the rocks look at `time`: 0 apart, 1 closed.
    function getClosedness(time) {
      const closeStart = getCLayersCloseStartTime();
      if (time >= closeStart) {
        return gsap.utils.clamp(
          0,
          1,
          (time - closeStart) / closeMotionLength,
        );
      }
      if (time <= CONFIG.cLayersOpenMotionStart) return 1;
      if (time >= CONFIG.cLayersOpenMotionEnd) return 0;
      return (
        1 -
        (time - CONFIG.cLayersOpenMotionStart) /
          (CONFIG.cLayersOpenMotionEnd - CONFIG.cLayersOpenMotionStart)
      );
    }

    // A close or reopen that interrupts the other picks up from the frame
    // that looks the same, instead of restarting from its first frame.
    function getCloseFromTime() {
      const closedness = getClosedness(cLayersMedia.video.currentTime);
      return getCLayersCloseStartTime() + closedness * closeMotionLength;
    }

    function getOpenFromTime(fromIntro) {
      const closedness = getClosedness(cLayersMedia.video.currentTime);
      // From the intro, the still opening frames cover the fade to full
      // opacity; coming back up from below, the rocks start moving at once.
      if (closedness >= 1)
        return fromIntro ? 0 : CONFIG.cLayersOpenMotionStart;
      if (closedness <= 0) return getCLayersOpenTime();
      return (
        CONFIG.cLayersOpenMotionStart +
        (1 - closedness) *
          (CONFIG.cLayersOpenMotionEnd - CONFIG.cLayersOpenMotionStart)
      );
    }

    function stopSegmentPlayback() {
      if (cancelSegmentPlayback) cancelSegmentPlayback();
      cancelSegmentPlayback = null;
    }

    function beginVideoAction() {
      videoActionId += 1;
      stopSegmentPlayback();
      return videoActionId;
    }

    function seekCLayersFrame(video, targetTime, actionId) {
      if (!video || actionId !== videoActionId) return Promise.resolve(false);

      const target = gsap.utils.clamp(0, getCLayersSafeDuration(), targetTime);

      video.pause();
      video.loop = false;
      video.playbackRate = 1;

      if (
        !video.seeking &&
        Math.abs(video.currentTime - target) <= CONFIG.cLayersTargetTolerance
      ) {
        return Promise.resolve(true);
      }

      return presentFrame(video, target).then(function () {
        return actionId === videoActionId;
      });
    }

    function prepareCLayersVideo() {
      if (cLayersReadyPromise) return cLayersReadyPromise;
      cLayersReadyPromise = preparePlaybackVideo(
        cLayersMedia,
        Object.assign({}, CONFIG.cLayersBuffer, {
          hidePosters: true,
          revealOpacity:
            phase === "intro" ? CONFIG.cLayersIntroOpacity : getRocksOpacity(),
        }),
      ).then(function (ready) {
        if (!ready || !cLayersMedia.video) {
          cLayersReadyPromise = null;
          return false;
        }
        const video = cLayersMedia.video;
        video.pause();
        video.loop = false;
        video.playbackRate = 1;
        return true;
      });
      return cLayersReadyPromise;
    }

    // Crossfades from whatever is on screen to the frame at `time`.
    function transitionTo(time, options) {
      options = options || {};
      const actionId = beginVideoAction();
      return prepareCLayersVideo().then(function (ready) {
        if (!ready || actionId !== videoActionId) return false;
        const video = cLayersMedia.video;
        const resolvedTime = typeof time === "function" ? time() : time;
        const frozen = freeze ? freeze.hold() : false;
        return seekCLayersFrame(video, resolvedTime, actionId).then(
          function (ok) {
            if (actionId !== videoActionId) return false;
            gsap.killTweensOf(video);
            gsap.set(video, {
              opacity:
                options.opacity != null ? options.opacity : getRocksOpacity(),
            });
            if (freeze) {
              freeze.release(
                frozen
                  ? options.fade != null
                    ? options.fade
                    : CONFIG.cLayersStateFade
                  : 0,
              );
            }
            return ok;
          },
        );
      });
    }

    function playCLayersSegment(startTime, targetTime, options) {
      options = options || {};
      const actionId = beginVideoAction();

      return prepareCLayersVideo().then(async function (ready) {
        if (!ready || actionId !== videoActionId) return false;
        const video = cLayersMedia.video;
        if (!video) return false;

        const resolvedStart =
          typeof startTime === "function" ? startTime() : startTime;
        const resolvedTarget =
          typeof targetTime === "function" ? targetTime() : targetTime;
        const frozen = options.freeze && freeze ? freeze.hold() : false;
        const atStart = await seekCLayersFrame(video, resolvedStart, actionId);
        if (!atStart || actionId !== videoActionId) return false;

        if (freeze) freeze.release(frozen ? CONFIG.cLayersStateFade : 0.2);
        gsap.to(video, {
          opacity:
            options.opacity != null ? options.opacity : getRocksOpacity(),
          duration:
            options.fadeDuration != null
              ? options.fadeDuration
              : CONFIG.cLayersOpenFadeDuration,
          ease: "power2.out",
          overwrite: true,
        });

        return new Promise(function (resolve) {
          let settled = false;
          let frameCallbackId = null;
          let rafId = null;
          const watchdogId = setTimeout(
            finish,
            Math.max(4500, (resolvedTarget - resolvedStart + 2) * 1000),
          );

          function cleanup() {
            clearTimeout(watchdogId);
            video.removeEventListener("timeupdate", check);
            video.removeEventListener("ended", finish);
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (
              frameCallbackId !== null &&
              typeof video.cancelVideoFrameCallback === "function"
            ) {
              try {
                video.cancelVideoFrameCallback(frameCallbackId);
              } catch (error) {}
            }
            if (cancelSegmentPlayback === cancel) {
              cancelSegmentPlayback = null;
            }
          }

          function finish() {
            if (settled) return;
            settled = true;
            cleanup();
            video.pause();
            if (actionId !== videoActionId) {
              resolve(false);
              return;
            }
            seekCLayersFrame(video, resolvedTarget, actionId).then(resolve);
          }

          function cancel() {
            if (settled) return;
            settled = true;
            cleanup();
            video.pause();
            resolve(false);
          }

          function check() {
            if (actionId !== videoActionId) {
              cancel();
              return;
            }
            if (video.currentTime >= resolvedTarget - 0.025 || video.ended) {
              finish();
            }
          }

          function watchFrame() {
            check();
            if (settled) return;
            if (typeof video.requestVideoFrameCallback === "function") {
              frameCallbackId = video.requestVideoFrameCallback(watchFrame);
            } else {
              rafId = requestAnimationFrame(watchFrame);
            }
          }

          cancelSegmentPlayback = cancel;
          video.addEventListener("timeupdate", check);
          video.addEventListener("ended", finish);
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(function (error) {
              notePlaybackRefused(error);
              finish();
            });
          }
          watchFrame();
        });
      });
    }

    function activateLayer(key) {
      if (!interactiveReady || phase !== "interactive") return;
      if (!key || !panelMap[key] || CONFIG.cLayersTargets[key] === undefined)
        return;
      if (activeLayer === key) return;
      const previousLayer = activeLayer;
      activeLayer = key;
      if (previousLayer && panelMap[previousLayer])
        hidePanel(panelMap[previousLayer]);
      updateControls(key);
      hidePanel(panelMap[key], true);
      transitionTo(function () {
        return getCLayersTargetTime(CONFIG.cLayersTargets[key]);
      }).then(function () {
        if (!interactiveReady || activeLayer !== key) return;
        showPanel(panelMap[key]);
      });
    }

    function resetLayers(options) {
      options = options || {};
      const hadActiveLayer = activeLayer !== null;
      activeLayer = null;
      updateControls(null);
      Object.values(panelMap).forEach(function (row) {
        hidePanel(row, options.immediate === true);
      });
      if (options.resetVideo && hadActiveLayer && phase === "interactive") {
        transitionTo(getCLayersOpenTime);
      }
    }

    const introPass = ScrollTrigger.create({
      trigger: introCopy,
      start: "bottom 2px",
      onEnter: reconcileLayers,
      onLeaveBack: reconcileLayers,
      invalidateOnRefresh: true,
    });

    const closePoint = ScrollTrigger.create({
      trigger: cLayers,
      start: function () {
        return `bottom ${closeRatio * 100}%`;
      },
      onEnter: reconcileLayers,
      onLeaveBack: reconcileLayers,
      invalidateOnRefresh: true,
    });

    function getZone() {
      const scroll = introPass.scroll();
      if (scroll < introPass.start) return "intro";
      if (scroll < closePoint.start) return "interactive";
      return "closed";
    }

    function showLayerMap() {
      if (
        !interactiveReady ||
        phase !== "interactive" ||
        getZone() !== "interactive"
      ) {
        return;
      }
      map.setAttribute("aria-hidden", "false");
      gsap.to(map, {
        autoAlpha: 1,
        duration: CONFIG.cLayersMapFadeDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }

    function hideLayerMap(immediate) {
      map.setAttribute("aria-hidden", "true");
      if (immediate) {
        gsap.killTweensOf(map);
        gsap.set(map, { autoAlpha: 0 });
        return;
      }
      gsap.to(map, {
        autoAlpha: 0,
        duration: CONFIG.cLayersMapFadeDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }

    function enterIntroPhase(options) {
      options = options || {};
      const wasIntro = phase === "intro";
      phaseId += 1;
      phase = "intro";
      setControlsEnabled(false);
      hideLayerMap(options.immediate === true);
      resetLayers({ immediate: true });
      if (options.seek === false) return;
      if (wasIntro) {
        transitionTo(0, { opacity: CONFIG.cLayersIntroOpacity, fade: 0 });
        return;
      }
      playCLayersSegment(getCloseFromTime, getCLayersCloseEndTime, {
        opacity: CONFIG.cLayersIntroOpacity,
        fadeDuration: CONFIG.cLayersOpenFadeDuration,
        freeze: true,
      });
    }

    function startOpeningPhase() {
      const fromIntro = phase === "intro";
      const id = ++phaseId;
      phase = "opening";
      setControlsEnabled(false);
      hideLayerMap(false);
      resetLayers({ immediate: true });
      playCLayersSegment(
        function () {
          return getOpenFromTime(fromIntro);
        },
        getCLayersOpenTime,
        {
          opacity: getRocksOpacity(),
          fadeDuration: CONFIG.cLayersOpenFadeDuration,
          freeze: true,
        },
      ).then(function () {
        if (id !== phaseId) return;
        phase = "interactive";
        setControlsEnabled(true);
        reconcileLayers();
      });
    }

    function startClosingPhase() {
      const id = ++phaseId;
      phase = "closing";
      setControlsEnabled(false);
      hideLayerMap(false);
      resetLayers({ immediate: false });
      playCLayersSegment(getCloseFromTime, getCLayersCloseEndTime, {
        opacity: getRocksOpacity(),
        fadeDuration: 0,
        freeze: true,
      }).then(function () {
        if (id !== phaseId) return;
        phase = "closed";
        reconcileLayers();
      });
    }

    // Scrolled straight past the whole interaction: land on the last frame.
    function jumpToClosedPhase() {
      phaseId += 1;
      phase = "closed";
      setControlsEnabled(false);
      hideLayerMap(true);
      resetLayers({ immediate: true });
      transitionTo(getCLayersCloseEndTime, { opacity: getRocksOpacity() });
    }

    function reconcileLayers() {
      if (!layersInitialized) return;
      const zone = getZone();
      if (zone === "intro") {
        if (phase !== "intro") enterIntroPhase();
        return;
      }
      if (zone === "interactive") {
        if (phase === "interactive") showLayerMap();
        else if (phase !== "opening") startOpeningPhase();
        return;
      }
      if (phase === "intro") jumpToClosedPhase();
      else if (phase === "opening" || phase === "interactive")
        startClosingPhase();
    }

    function handleOutsidePointerDown(event) {
      if (!interactiveReady || useHoverInteractions || !activeLayer) return;
      if (event.target.closest("[data-layer-control]")) return;
      resetLayers({ immediate: false, resetVideo: true });
    }

    function handleFocusOut() {
      if (!useHoverInteractions) return;

      requestAnimationFrame(function () {
        if (!activeLayer) return;

        const activeControl = controls.find(function (control) {
          return control.getAttribute("data-layer-control") === activeLayer;
        });
        const activePanel = panelMap[activeLayer];
        const focused = document.activeElement;

        if (
          focused === activeControl ||
          (activePanel && activePanel.contains(focused))
        ) {
          return;
        }

        resetLayers({ immediate: false, resetVideo: true });
      });
    }

    controls.forEach(function (control) {
      const key = control.getAttribute("data-layer-control");
      if (!key) return;
      if (useHoverInteractions) {
        control.addEventListener("pointerenter", function () {
          activateLayer(key);
        });
        control.addEventListener("pointerleave", function () {
          if (activeLayer !== key || control.matches(":focus-visible")) return;
          resetLayers({ immediate: false, resetVideo: true });
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
    cLayers.addEventListener("focusout", handleFocusOut);

    map.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!interactiveReady) return;
      resetLayers({ immediate: false, resetVideo: true });
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      )
        document.activeElement.blur();
    });

    Object.values(panelMap).forEach(function (row) {
      hidePanel(row, true);
    });
    updateControls(null);
    setControlsEnabled(false);

    if (insights) {
      whenNear(
        insights,
        responsiveValue(
          CONFIG.cLayersPreloadStart,
          CONFIG.mobile.cLayersPreloadStart,
        ),
        function () {
          prefetch(prepareCLayersVideo);
        },
      );
    }

    whenNear(cLayers, CONFIG.cLayersPrepareStart, prepareCLayersVideo);

    ScrollTrigger.create({
      trigger: cLayers,
      start: "top top",
      end: "bottom top",
      onEnter: function () {
        prepareCLayersVideo();
        if (handles.insights) handles.insights.release();
        if (handles.story) handles.story.release();
      },
      onEnterBack: function () {
        prepareCLayersVideo();
      },
    });

    requestAnimationFrame(function () {
      layersInitialized = true;
      if (getZone() === "intro") {
        const sectionIsNear =
          cLayers.getBoundingClientRect().top < getViewportHeight();
        enterIntroPhase({ immediate: true, seek: sectionIsNear });
        return;
      }
      reconcileLayers();
    });
  }

  function initVisibilityHandling(handles) {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        activeMedia.forEach(function (media) {
          if (media.video) media.video.pause();
        });
        if (handles.story) handles.story.suspend();
        return;
      }
      activeMedia.forEach(function (media) {
        safePlay(media.video);
      });
      if (handles.story) handles.story.resume();
    });
  }

  function initLayoutStability() {
    document
      .querySelectorAll(".section_team .team_card-image-wrap")
      .forEach(function (wrapper) {
        if (getComputedStyle(wrapper).aspectRatio === "auto") {
          wrapper.style.aspectRatio = "3 / 4";
        }
      });

    const sections = [
      document.querySelector(".section_team"),
      document.querySelector(".section_news"),
    ].filter(Boolean);

    if (!sections.length) return;

    let refreshQueued = false;

    function scheduleLayoutRefresh() {
      if (refreshQueued) return;
      refreshQueued = true;

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          refreshQueued = false;
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });
      });
    }

    if (typeof ResizeObserver === "function") {
      const heights = new WeakMap();
      layoutObserver = new ResizeObserver(function (entries) {
        let layoutChanged = false;

        entries.forEach(function (entry) {
          const nextHeight = entry.contentRect.height;
          const previousHeight = heights.get(entry.target);
          heights.set(entry.target, nextHeight);

          if (
            previousHeight != null &&
            Math.abs(nextHeight - previousHeight) > 1
          ) {
            layoutChanged = true;
          }
        });

        if (layoutChanged) scheduleLayoutRefresh();
      });

      sections.forEach(function (section) {
        layoutObserver.observe(section);
      });
    }

    document
      .querySelectorAll(".section_team img, .section_news img")
      .forEach(function (image) {
        if (image.complete) return;
        image.addEventListener("load", scheduleLayoutRefresh, { once: true });
        image.addEventListener("error", scheduleLayoutRefresh, { once: true });
      });
  }

  function refresh() {
    requestAnimationFrame(function () {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  }

  let loader = null;
  try {
    loader = initLoader();
  } catch (error) {
    reportError("loader", error);
    const element = document.querySelector("[data-loader]");
    if (element) element.remove();
  }

  buildMediaMap();
  initLayoutStability();
  watchHeroGate();

  const handles = {};

  try {
    initSectionGaps();
  } catch (error) {
    reportError("section gaps", error);
  }
  try {
    initContentFades();
  } catch (error) {
    reportError("content fades", error);
    gsap.set(getContentTargets(), { clearProps: "opacity,filter" });
  }
  try {
    initReveals();
  } catch (error) {
    reportError("reveals", error);
  }
  try {
    initHero();
  } catch (error) {
    reportError("hero", error);
    openHeroGate();
  }
  try {
    handles.about = createLoopingPlayback("about", activateFadeLoop);
    const storyFinalCopy = getStoryFinalCopy();
    handles.insights = createLoopingPlayback("insights", activateFadeLoop, {
      // Draws in once the Insights background has fully wiped in (until then
      // the wipe shows the paused first frame), then holds on the connected
      // network instead of looping.
      trigger: storyFinalCopy,
      start: storyFinalCopy
        ? function () {
            return `bottom top-=${getContentWipeDistance()}`;
          }
        : CONFIG.mediaRevealEnd,
      holdAtStart: true,
      holdVisible: true,
      playOnce: true,
    });
  } catch (error) {
    reportError("looping playback", error);
  }
  try {
    handles.story = initStory();
    if (loader && handles.story) heroGate.then(handles.story.warm);
  } catch (error) {
    reportError("story", error);
  }
  try {
    initCLayers(handles);
  } catch (error) {
    reportError("c-layers", error);
  }

  initVisibilityHandling(handles);
  refresh();

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
    { once: true },
  );
}

// Val's "logo loading in" animation (the .lottie file's JSON), played by the
// loader. Inlined so the logo can start without another request.
const NUMENOS_LOADER_ANIMATION = {"nm":"logo loading in","ddd":0,"h":300,"w":1600,"meta":{"g":"@lottiefiles/toolkit-js 0.76.0","tc":"#ffffff"},"layers":[{"ty":4,"nm":"Numenos 2","sr":1,"st":72,"op":448,"ip":72,"ln":"6291","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[-90.68,0]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":72},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":85}]},"p":{"a":0,"k":[476.106,156.647]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 1","d":1,"ks":{"a":0,"k":{"c":true,"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-82.361,6.979],[-83.426,7.097],[-83.426,-13.8],[-78.418,-13.8],[-78.418,13.8],[-84.096,13.8],[-98.684,-10.409],[-97.896,-10.606],[-97.896,13.8],[-102.943,13.8],[-102.943,-13.8],[-94.86,-13.8]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":1},{"ty":4,"nm":"Numenos 3","sr":1,"st":69,"op":445,"ip":69,"ln":"6292","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[-61.098,0.276]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":69},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":82}]},"p":{"a":0,"k":[640.171,158.178]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 2","d":1,"ks":{"a":0,"k":{"c":true,"i":[[0.92,1.604],[0,2.261],[0,0],[0,0],[0,0],[-0.499,-0.972],[-0.946,-0.473],[-1.393,0],[-1.13,1.051],[0,2.156],[0,0],[0,0],[0,0],[0.946,-1.603],[1.787,-0.841],[2.445,0],[1.762,0.841]],"o":[[-0.92,-1.603],[0,0],[0,0],[0,0],[0,1.42],[0.5,0.947],[0.946,0.474],[2.103,0],[1.13,-1.078],[0,0],[0,0],[0,0],[0,2.261],[-0.92,1.604],[-1.761,0.841],[-2.445,0],[-1.734,-0.841]],"v":[[-71.448,9.423],[-72.828,3.627],[-72.828,-13.8],[-67.584,-13.8],[-67.584,3.154],[-66.835,6.742],[-64.666,8.871],[-61.157,9.581],[-56.307,8.004],[-54.612,3.154],[-54.612,-13.8],[-49.368,-13.8],[-49.368,3.627],[-50.787,9.423],[-54.848,13.09],[-61.157,14.352],[-67.466,13.09]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":2},{"ty":4,"nm":"Numenos 4","sr":1,"st":66,"op":442,"ip":66,"ln":"6293","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[-28.715,0]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":66},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":79}]},"p":{"a":0,"k":[819.764,156.647]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 3","d":1,"ks":{"a":0,"k":{"c":true,"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-27.335,9.502],[-29.898,9.187],[-22.446,-13.8],[-13.614,-13.8],[-13.614,13.8],[-18.819,13.8],[-18.819,-11.868],[-18.306,-11.829],[-26.705,13.8],[-31.002,13.8],[-39.361,-11.829],[-38.809,-11.907],[-38.809,13.8],[-43.817,13.8],[-43.817,-13.8],[-35.103,-13.8]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":3},{"ty":4,"nm":"Numenos 5","sr":1,"st":63,"op":439,"ip":63,"ln":"6294","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[3.393,0]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":63},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":76}]},"p":{"a":0,"k":[997.836,156.647]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 4","d":1,"ks":{"a":0,"k":{"c":true,"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[13.802,-9.266],[-2.521,-9.266],[-2.521,-3.075],[8.637,-3.075],[8.637,1.538],[-2.521,1.538],[-2.521,9.187],[14.551,9.187],[14.551,13.8],[-7.765,13.8],[-7.765,-13.8],[13.802,-13.8]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":4},{"ty":4,"nm":"Numenos 6","sr":1,"st":66,"op":442,"ip":66,"ln":"6295","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[30.729,0]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":66},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":79}]},"p":{"a":0,"k":[1149.444,156.647]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 5","d":1,"ks":{"a":0,"k":{"c":true,"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[39.049,6.979],[37.984,7.097],[37.984,-13.8],[42.992,-13.8],[42.992,13.8],[37.314,13.8],[22.725,-10.409],[23.514,-10.606],[23.514,13.8],[18.467,13.8],[18.467,-13.8],[26.55,-13.8]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":5},{"ty":4,"nm":"Numenos 7","sr":1,"st":69,"op":445,"ip":69,"ln":"6296","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[61.239,0]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":69},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":82}]},"p":{"a":0,"k":[1318.648,156.647]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 6","d":1,"ks":{"a":0,"k":{"c":true,"i":[[1.209,2.181],[0,2.76],[-1.183,2.182],[-2.103,1.209],[-2.681,0],[-2.13,-1.235],[-1.209,-2.181],[0,-2.76],[1.209,-2.182],[2.129,-1.235],[2.681,0],[2.129,1.209]],"o":[[-1.183,-2.182],[0,-2.76],[1.209,-2.181],[2.129,-1.235],[2.681,0],[2.129,1.209],[1.209,2.182],[0,2.76],[-1.209,2.181],[-2.13,1.209],[-2.681,0],[-2.103,-1.235]],"v":[[49.016,7.413],[47.241,0],[49.016,-7.413],[53.984,-12.499],[61.199,-14.352],[68.415,-12.499],[73.422,-7.413],[75.236,0],[73.422,7.413],[68.415,12.538],[61.199,14.352],[53.984,12.538]]}}},{"ty":"sh","nm":"Path 7","d":1,"ks":{"a":0,"k":{"c":true,"i":[[-0.71,1.446],[0,1.919],[0.736,1.446],[1.288,0.815],[1.682,0],[1.288,-0.815],[0.736,-1.472],[0,-1.919],[-0.71,-1.472],[-1.262,-0.815],[-1.682,0],[-1.288,0.815]],"o":[[0.736,-1.472],[0,-1.919],[-0.71,-1.472],[-1.288,-0.815],[-1.682,0],[-1.262,0.815],[-0.71,1.446],[0,1.919],[0.736,1.446],[1.288,0.815],[1.682,0],[1.288,-0.815]],"v":[[68.651,5.086],[69.755,0],[68.651,-5.047],[65.655,-8.477],[61.199,-9.699],[56.744,-8.477],[53.747,-5.047],[52.683,0],[53.747,5.086],[56.744,8.477],[61.199,9.699],[65.655,8.477]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":6},{"ty":4,"nm":"Numenos 1","sr":1,"st":72,"op":448,"ip":72,"ln":"6275","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[89.931,0]},"s":{"a":1,"k":[{"s":[0,554.6],"i":{"x":[0.24,0.24],"y":[1,1]},"o":{"x":[0,0],"y":[0,0]},"t":72},{"s":[554.6,554.6],"i":{"x":[1,1],"y":[1,1]},"o":{"x":[0.167,0.167],"y":[0,0]},"t":85}]},"p":{"a":0,"k":[1477.778,156.647]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Numenos","it":[{"ty":"sh","nm":"Path 8","d":1,"ks":{"a":0,"k":{"c":true,"i":[[1.341,0.841],[0.946,0.92],[0,0],[-1.919,-0.841],[-2.182,0],[-1.157,0.605],[0,1.288],[0.657,0.473],[1.446,0.262],[0,0],[1.55,1.236],[0,2.13],[-0.893,1.262],[-1.656,0.684],[-2.261,0],[-1.945,-0.657],[-2.103,-1.209],[0,0],[1.761,0.552],[1.866,0],[0.92,-0.578],[-0.026,-1.025],[-0.815,-0.5],[-1.682,-0.289],[0,0],[-1.446,-1.235],[0,-2.287],[0.972,-1.341],[1.814,-0.71],[2.392,0],[1.84,0.552]],"o":[[-1.34,-0.841],[0,0],[1.577,1.446],[1.919,0.841],[1.893,0],[1.156,-0.631],[0,-0.868],[-0.631,-0.499],[0,0],[-3.023,-0.552],[-1.525,-1.235],[0,-1.656],[0.894,-1.262],[1.656,-0.683],[2.365,0],[1.945,0.631],[0,0],[-1.787,-1.051],[-1.735,-0.578],[-1.814,0],[-0.92,0.552],[0,0.841],[0.841,0.499],[0,0],[2.865,0.499],[1.446,1.209],[0,1.84],[-0.973,1.314],[-1.787,0.683],[-2.129,0],[-1.814,-0.552]],"v":[[80.35,11.434],[76.92,8.793],[79.719,4.968],[84.963,8.398],[91.114,9.66],[95.688,8.753],[97.423,5.875],[96.437,3.864],[93.322,2.721],[87.802,1.695],[80.942,-0.986],[78.655,-6.033],[79.995,-10.409],[83.82,-13.327],[89.695,-14.352],[96.161,-13.366],[102.233,-10.606],[100.222,-6.427],[94.899,-8.832],[89.498,-9.699],[85.397,-8.832],[84.056,-6.466],[85.279,-4.455],[89.064,-3.273],[94.308,-2.326],[100.774,0.276],[102.943,5.52],[101.484,10.291],[97.304,13.327],[91.035,14.352],[85.082,13.524]]}}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.2157,0.1294,0.0863]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":7},{"ty":0,"nm":"icon","sr":1,"st":0,"op":376,"ip":0,"ln":"6249","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[150,150]},"s":{"a":0,"k":[100,100]},"p":{"a":1,"k":[{"o":{"x":0.958,"y":0},"i":{"x":0.67,"y":0.647},"s":[800,150],"t":56.999},{"o":{"x":0.169,"y":1.293},"i":{"x":0.458,"y":1},"s":[292.099,150],"t":71.999},{"s":[178.286,150],"t":95.999}]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"w":300,"h":300,"refId":"1","ind":8}],"v":"5.7.0","fr":24,"op":112,"ip":0,"assets":[{"nm":"icon","id":"1","fr":24,"layers":[{"ty":4,"nm":"Shape Layer 5","sr":1,"st":0,"op":376,"ip":40,"ln":"6223","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[1.967,-112.074]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[151.967,265.283]},"r":{"a":0,"k":180},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Shape 1","it":[{"ty":"sh","nm":"Path 1","d":1,"ks":{"a":1,"k":[{"o":{"x":0.167,"y":0},"i":{"x":0.24,"y":1},"s":[{"c":true,"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[14.346,-112.074],[-10.412,-108.387],[-10.427,-124.679],[14.198,-109.76]]}],"t":40},{"s":[{"c":true,"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[14.346,-112.074],[-10.412,-108.387],[-10.412,-48.337],[14.346,-3.564]]}],"t":55.999}]}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.4784,0.7216,0.5098]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":1},{"ty":4,"nm":"Shape Layer 4","sr":1,"st":-3,"op":373,"ip":37,"ln":"6221","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[1.967,-112.074]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[151.967,37.926]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Shape 1","it":[{"ty":"sh","nm":"Path 1","d":1,"ks":{"a":1,"k":[{"o":{"x":0.167,"y":0},"i":{"x":0.24,"y":1},"s":[{"c":true,"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[14.346,-112.074],[-10.412,-108.387],[-10.337,-113.164],[14.32,-109.333]]}],"t":37},{"s":[{"c":true,"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[14.346,-112.074],[-10.412,-108.387],[-10.412,-48.337],[14.346,-3.564]]}],"t":52.999}]}},{"ty":"fl","nm":"Fill 1","c":{"a":0,"k":[0.4784,0.7216,0.5098]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":2},{"ty":4,"nm":"Shape Layer 3","sr":1,"st":-3,"op":373,"ip":32,"ln":"6219","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[-54.132,2.055]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[206.081,152.055]},"r":{"a":0,"k":180},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Shape 1","it":[{"ty":"sh","nm":"Path 1","d":1,"ks":{"a":1,"k":[{"o":{"x":0.167,"y":0},"i":{"x":0.24,"y":1},"s":[{"c":false,"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[-54.132,-107.158],[-54.218,-105.815]]}],"t":32},{"s":[{"c":false,"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[-54.132,-107.158],[-54.132,111.267]]}],"t":49.999}]}},{"ty":"st","nm":"Stroke 1","lc":1,"lj":1,"ml":4,"o":{"a":0,"k":100},"w":{"a":0,"k":23.7},"c":{"a":0,"k":[0.4784,0.7216,0.5098]}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":3},{"ty":4,"nm":"Shape Layer 2","sr":1,"st":-6,"op":370,"ip":29,"ln":"6218","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[150,150]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Shape 1","it":[{"ty":"sh","nm":"Path 1","d":1,"ks":{"a":1,"k":[{"o":{"x":0.167,"y":0},"i":{"x":0.24,"y":1},"s":[{"c":false,"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[-54.132,-107.158],[-54.223,-107.095]]}],"t":29},{"s":[{"c":false,"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[-54.132,-107.158],[-54.132,111.267]]}],"t":46.999}]}},{"ty":"st","nm":"Stroke 1","lc":1,"lj":1,"ml":4,"o":{"a":0,"k":100},"w":{"a":0,"k":23.7},"c":{"a":0,"k":[0.4784,0.7216,0.5098]}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":4},{"ty":4,"nm":"Shape Layer 1","sr":1,"st":0,"op":376,"ip":0,"ln":"6217","hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[150.403,153.213]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","nm":"Ellipse 1","it":[{"ty":"el","nm":"Ellipse Path 1","d":1,"p":{"a":0,"k":[0,0]},"s":{"a":0,"k":[238.433,238.433]}},{"ty":"st","nm":"Stroke 1","lc":1,"lj":1,"ml":4,"o":{"a":0,"k":100},"w":{"a":0,"k":23.7},"c":{"a":0,"k":[0.4784,0.7216,0.5098]}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"p":{"a":0,"k":[-0.403,-3.213]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]},{"ty":"tm","nm":"Trim Paths 1","e":{"a":1,"k":[{"o":{"x":0.333,"y":0},"i":{"x":0.24,"y":1},"s":[0],"t":0},{"s":[100],"t":33}]},"o":{"a":0,"k":0},"s":{"a":0,"k":0},"m":1}],"ind":5}]}]};

document.addEventListener("DOMContentLoaded", initNumenosMedia);

// console.log("now working");
