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

  const CONFIG = {
    revealDuration: 0.6,
    loopFadeOut: 0.22,
    loopFadeIn: 0.38,
    bufferMaxWaitMs: 12000,

    playbackBandStart: "top 85%",
    playbackBandEnd: "bottom 15%",
    playbackPrepareStart: "top 250%",

    mediaRevealStart: "top 50%",
    mediaRevealEnd: "top 5%",
    mediaRevealScrub: 0.55,

    aboutRevealStart: "top 98%",
    aboutRevealEnd: "top 55%",

    storyRevealDistanceVh: 35,
    storyRevealScrub: 0.55,

    insightsRevealStart: "top 100%",
    insightsRevealEnd: "top 55%",
    insightsRevealScrub: 0.6,

    cLayersRevealStart: "top 45%",
    cLayersRevealEnd: "top top",
    cLayersRevealScrub: 0.8,
    cLayersPrepareStart: "top 300%",
    cLayersMapFadeDuration: 0.45,
    cLayersMapFadeOutStart: "bottom 75%",
    cLayersTargets: {
      infrastructure: 0.3125,
      memory: 0.581,
      application: 0.875,
    },
    cLayersTargetTolerance: 0.015,
    cLayersPanelInDuration: 0.42,
    cLayersPanelOutDuration: 0.22,
    cLayersBuffer: { bufferFraction: 0.9, bufferSeconds: 8, maxWaitMs: 12000 },

    staticRevealStart: "top 75%",
    staticRevealEnd: "top 25%",
    staticRevealScrub: 0.55,

    storyStepStart: "top 60%",
    storyCrossfade: 0.35,
    storyIntroGapVh: 40,
    storyFinalTailVh: 117,

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
      aboutRevealStart: "top 78%",
      aboutRevealEnd: "top 38%",
      insightsRevealStart: "top 78%",
      insightsRevealEnd: "top 38%",
      staticRevealStart: "top 60%",
      staticRevealEnd: "top 15%",
      mediaRevealScrub: 0.18,
      viewportFadeScrub: 0.08,
      storyStepStart: "top 68%",
      newsRevealDistanceVh: 20,
    },
  };

  const STORY_STEPS = {
    1: {
      transition: "step-1-transition",
      rest: { id: "step-1-loop", loop: true },
    },
    2: { transition: "step-2-transition", rest: { id: null, loop: false } },
    3: {
      transition: "step-3-transition",
      rest: { id: "step-3-loop", loop: true },
    },
  };

  const mediaMap = new Map();
  const activeMedia = new Set();
  let mobileLayoutObserver = null;

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

  function getVideoSource(el) {
    const desktop = el.getAttribute("data-video-desktop");
    const mobile = el.getAttribute("data-video-mobile");
    if (mobileQuery.matches && mobile) return mobile;
    return desktop || mobile || "";
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

  function safePlay(video) {
    if (!video || reducedMotion.matches || document.hidden) return;
    const promise = video.play();
    if (promise !== undefined) promise.catch(function () {});
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

  function waitForVideoBuffer(video, options) {
    options = options || {};
    const bufferSeconds = options.bufferSeconds || 0;
    const bufferFraction = options.bufferFraction || 0;
    const maxWaitMs = options.maxWaitMs || CONFIG.bufferMaxWaitMs;
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
          if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA)
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
      return ready && video.dataset.src === requestedUrl;
    });
  }

  function prepareMedia(media) {
    if (!media || !media.video || reducedMotion.matches)
      return Promise.resolve(false);
    if (media.loaded) return Promise.resolve(true);
    if (media.loadingPromise) return media.loadingPromise;

    const url = getVideoSource(media.item);
    if (!url) return Promise.resolve(false);

    const loadVersion = media.loadVersion;

    media.loadingPromise = loadVideo(media.video, url)
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
    video.pause();
    gsap.killTweensOf(video);
    gsap.set(video, { opacity: 0 });
    video.removeAttribute("src");
    delete video.dataset.src;
    video.preload = "none";
    media.loaded = false;
    media.revealed = false;
    try {
      video.load();
    } catch (error) {}
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
    safePlay(video);
    gsap.to(video, { opacity: 1, duration: duration, ease: "power2.out" });
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
    gsap.set(incoming.item, {
      opacity: 1,
      scale: 1.018,
      "--media-reveal": "-16%",
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
        invalidateOnRefresh: true,
      },
    });
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
        "--story-final-tail",
        `${CONFIG.storyFinalTailVh}svh`,
      );
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

    if (about && aboutMedia && heroMedia) {
      createStackedReveal(about, aboutMedia, heroMedia, {
        start: responsiveValue(
          CONFIG.aboutRevealStart,
          CONFIG.mobile.aboutRevealStart,
        ),
        end: responsiveValue(
          CONFIG.aboutRevealEnd,
          CONFIG.mobile.aboutRevealEnd,
        ),
      });
    }

    if (story && storyMedia && aboutMedia) {
      const aboutTitle = about
        ? about.querySelector("[data-about-title]")
        : null;
      createStackedReveal(aboutTitle || story, storyMedia, aboutMedia, {
        start: aboutTitle ? "bottom top" : CONFIG.mediaRevealStart,
        end: aboutTitle
          ? function () {
              return `+=${Math.round((getViewportHeight() * CONFIG.storyRevealDistanceVh) / 100)}`;
            }
          : CONFIG.mediaRevealEnd,
        scrub: responsiveValue(
          CONFIG.storyRevealScrub,
          CONFIG.mobile.mediaRevealScrub,
        ),
      });
    }

    if (insights && insightsMedia && storyMedia) {
      createStackedReveal(insights, insightsMedia, storyMedia, {
        start: responsiveValue(
          CONFIG.insightsRevealStart,
          CONFIG.mobile.insightsRevealStart,
        ),
        end: responsiveValue(
          CONFIG.insightsRevealEnd,
          CONFIG.mobile.insightsRevealEnd,
        ),
        scrub: responsiveValue(
          CONFIG.insightsRevealScrub,
          CONFIG.mobile.mediaRevealScrub,
        ),
      });
    }

    if (cLayers && cLayersMedia && insightsMedia) {
      createStackedReveal(cLayers, cLayersMedia, insightsMedia, {
        start: CONFIG.cLayersRevealStart,
        end: CONFIG.cLayersRevealEnd,
        scrub: responsiveValue(
          CONFIG.cLayersRevealScrub,
          CONFIG.mobile.mediaRevealScrub,
        ),
      });
    }

    initStaticReveals(cLayersMedia);
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

      if (mobileQuery.matches && section.matches(".section_news")) {
        const teamCards = Array.from(
          document.querySelectorAll(".section_team .team_card"),
        );
        const lastTeamCard = teamCards[teamCards.length - 1];

        if (lastTeamCard) {
          revealTrigger = lastTeamCard;
          revealStart = "bottom top";
          revealEnd = function () {
            return `+=${Math.round((getViewportHeight() * CONFIG.mobile.newsRevealDistanceVh) / 100)}`;
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

  function initHero() {
    const section = getSectionByRole("hero");
    const media = getSectionMedia(section);
    if (!section || !media) return;

    gsap.set(media.item, { opacity: 1, scale: 1 });

    const video = media.video;
    if (!video || reducedMotion.matches) return;

    configureVideo(video);
    video.loop = true;
    media.active = true;
    activeMedia.add(media);

    prepareMedia(media).then(function (ready) {
      if (ready) revealAndPlay(media, CONFIG.revealDuration);
    });

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
        safePlay(video);
      },
    });
  }

  function createLoopingPlayback(role, activate) {
    const section = getSectionByRole(role);
    const media = getSectionMedia(section);
    if (!section || !media || !media.video || reducedMotion.matches)
      return null;

    ScrollTrigger.create({
      trigger: section,
      start: CONFIG.playbackPrepareStart,
      once: true,
      onEnter: function () {
        prepareMedia(media);
      },
    });

    ScrollTrigger.create({
      trigger: section,
      start: responsiveValue(
        CONFIG.playbackBandStart,
        CONFIG.mobile.playbackBandStart,
      ),
      end: CONFIG.playbackBandEnd,
      onEnter: function () {
        prepareMedia(media).then(function () {
          activate(media);
        });
      },
      onEnterBack: function () {
        activate(media);
      },
      onLeave: function () {
        deactivateMedia(media);
      },
      onLeaveBack: function () {
        deactivateMedia(media);
      },
    });

    return {
      activate: function () {
        prepareMedia(media).then(function () {
          activate(media);
        });
      },
      release: function () {
        deactivateMedia(media);
        releaseMedia(media);
      },
    };
  }

  function initStory(handles) {
    const section = getSectionByRole("story");
    const media = getSectionMedia(section);
    if (!section || !media || reducedMotion.matches) return null;

    const manifestRoot = media.item.querySelector(
      "[data-story-media-manifest]",
    );
    const playerA = media.item.querySelector('[data-story-player="a"]');
    const playerB = media.item.querySelector('[data-story-player="b"]');
    const fallbackImages = Array.from(media.item.children).filter(function (
      child,
    ) {
      return child.classList.contains("bg-images_img");
    });
    const rows = Array.from(section.querySelectorAll("[data-story-step]"));
    if (!manifestRoot || !playerA || !playerB || rows.length !== 3) return null;

    const SEG_ORDER = [
      "step-1-transition",
      "step-1-loop",
      "step-2-transition",
      "step-3-transition",
      "step-3-loop",
    ];

    const PREVIEW_SEGMENTS = {
      "step-1-transition": [0, 0.16],
      "step-1-loop": [0.22, 0.36],
      "step-2-transition": [0.42, 0.56],
      "step-3-transition": [0.62, 0.76],
      "step-3-loop": [0.82, 0.96],
    };

    const manifest = {};
    manifestRoot
      .querySelectorAll("[data-story-source]")
      .forEach(function (source) {
        manifest[source.getAttribute("data-story-source")] =
          getVideoSource(source);
      });

    const manifestUrls = SEG_ORDER.map(function (id) {
      return manifest[id];
    }).filter(Boolean);

    const previewMode =
      manifestUrls.length === SEG_ORDER.length &&
      manifestUrls.every(function (url) {
        return url === manifestUrls[0];
      });

    [playerA, playerB].forEach(function (player) {
      configureVideo(player);
      player.autoplay = false;
      player.loop = false;
      player.removeAttribute("autoplay");
      player.pause();
    });
    gsap.set(fallbackImages, { autoAlpha: 0 });
    gsap.set([playerA, playerB], { opacity: 0, zIndex: 1 });

    let visible = playerA;
    let idle = playerB;
    let current = 0;
    let desired = 0;
    let processing = false;
    let sectionActive = false;
    let lifecycleId = 0;
    let loopVideo = null;
    let loopStop = null;
    let loopRunId = 0;
    let transitionStop = null;

    function segmentFor(id, duration) {
      if (!duration || !Number.isFinite(duration)) {
        return { in: 0, out: 0 };
      }

      if (!previewMode) {
        return { in: 0, out: duration };
      }

      const range = PREVIEW_SEGMENTS[id] || [0, 1];

      return {
        in: duration * range[0],
        out: duration * range[1],
      };
    }

    function seekVideo(video, time) {
      try {
        video.currentTime = time;
      } catch (error) {}
    }

    function seekStoryFrame(video, time) {
      if (!video || !Number.isFinite(time)) return Promise.resolve();

      if (Math.abs(video.currentTime - time) <= 0.03) {
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        let resolved = false;
        let timeoutId = null;

        function cleanup() {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutId);
          video.removeEventListener("seeked", finish);
          resolve();
        }

        function finish() {
          cleanup();
        }

        video.addEventListener("seeked", finish, { once: true });
        timeoutId = setTimeout(finish, isWebKit ? 450 : 250);
        seekVideo(video, time);
      });
    }

    function waitForPresentedVideoFrame(video) {
      if (!video) return Promise.resolve();

      return new Promise(function (resolve) {
        let resolved = false;
        let frameCallbackId = null;
        const timeoutId = setTimeout(finish, isWebKit ? 600 : 350);

        function finish() {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutId);

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

        if (typeof video.requestVideoFrameCallback === "function") {
          frameCallbackId = video.requestVideoFrameCallback(finish);
          return;
        }

        requestAnimationFrame(function () {
          requestAnimationFrame(finish);
        });
      });
    }

    function watchClipEnd(video, id, onReach) {
      let stopped = false;
      let frameCallbackId = null;

      function reached() {
        const seg = segmentFor(id, video.duration);
        return (
          seg.out > 0 && (video.currentTime >= seg.out - 0.05 || video.ended)
        );
      }

      function frame() {
        if (stopped) return;

        if (reached()) {
          onReach();
        }

        if (!stopped && typeof video.requestVideoFrameCallback === "function") {
          frameCallbackId = video.requestVideoFrameCallback(frame);
        }
      }

      function onTime() {
        if (!stopped && reached()) onReach();
      }

      video.addEventListener("timeupdate", onTime);
      video.addEventListener("ended", onReach);

      if (typeof video.requestVideoFrameCallback === "function") {
        frameCallbackId = video.requestVideoFrameCallback(frame);
      }

      return function () {
        stopped = true;
        video.removeEventListener("timeupdate", onTime);
        video.removeEventListener("ended", onReach);

        if (
          frameCallbackId !== null &&
          typeof video.cancelVideoFrameCallback === "function"
        ) {
          try {
            video.cancelVideoFrameCallback(frameCallbackId);
          } catch (error) {}
        }
      };
    }

    function swap() {
      const previous = visible;
      visible = idle;
      idle = previous;
    }

    function crossfade(showVideo, hideVideo) {
      gsap.killTweensOf([showVideo, hideVideo]);

      gsap.set(showVideo, { zIndex: 2 });

      if (hideVideo && hideVideo !== showVideo) {
        gsap.set(hideVideo, { zIndex: 1 });
      }

      gsap.to(showVideo, {
        opacity: 1,
        duration: CONFIG.storyCrossfade,
        ease: "power1.inOut",
        overwrite: true,
      });

      if (hideVideo && hideVideo !== showVideo) {
        gsap.to(hideVideo, {
          opacity: 0,
          duration: CONFIG.storyCrossfade,
          ease: "power1.inOut",
          overwrite: true,
          onComplete: function () {
            hideVideo.pause();
          },
        });
      }
    }

    function stopLoop() {
      loopRunId += 1;
      if (loopStop) loopStop();
      loopStop = null;
      loopVideo = null;
    }

    function startSegmentLoop(video, id) {
      stopLoop();

      const sourceUrl = video.dataset.src;
      const runId = loopRunId;
      loopVideo = video;

      if (mobileQuery.matches && !previewMode) {
        video.loop = true;
        safePlay(video);
        loopStop = function () {
          if (video.dataset.src === sourceUrl) video.loop = false;
        };
        return;
      }

      video.loop = false;
      safePlay(video);

      let restarting = false;

      loopStop = watchClipEnd(video, id, function () {
        if (
          !sectionActive ||
          restarting ||
          loopVideo !== video ||
          visible !== video
        ) {
          return;
        }

        restarting = true;
        video.pause();
        gsap.killTweensOf(video);
        gsap.set(video, { opacity: 1 });

        seekStoryFrame(video, segmentFor(id, video.duration).in).then(
          function () {
            if (
              !sectionActive ||
              runId !== loopRunId ||
              loopVideo !== video ||
              visible !== video ||
              video.dataset.src !== sourceUrl
            ) {
              return;
            }

            safePlay(video);
            restarting = false;
          },
        );
      });
    }

    function preloadStoryPlayer(video, assetId) {
      const url = manifest[assetId];

      return loadVideo(video, url).then(function (ready) {
        if (!ready || video.dataset.src !== url) return false;

        video.pause();
        video.loop = false;

        const segment = segmentFor(assetId, video.duration);

        return seekStoryFrame(video, segment.in).then(function () {
          return video.dataset.src === url;
        });
      });
    }

    function watchToEnd(video, id) {
      return new Promise(function (resolve) {
        let done = false;
        let stop = null;
        const seg = segmentFor(id, video.duration);
        const span = seg.out > 0 ? seg.out - seg.in : 8;
        const watchdog = setTimeout(
          function () {
            finish(true);
          },
          Math.max(600, span * 1000 + 900),
        );

        function finish(completed) {
          if (done) return;

          done = true;
          clearTimeout(watchdog);

          if (stop) stop();
          if (transitionStop === cancel) transitionStop = null;

          if (completed) {
            video.pause();

            const settled = segmentFor(id, video.duration);

            if (settled.out > 0) {
              seekVideo(video, Math.max(0, settled.out - 0.03));
            }
          }

          resolve(completed);
        }

        function cancel() {
          finish(false);
        }

        transitionStop = cancel;
        stop = watchClipEnd(video, id, function () {
          finish(true);
        });
      });
    }

    function cancelTransition() {
      if (transitionStop) transitionStop();
      transitionStop = null;
    }

    function isLifecycleValid(id) {
      return sectionActive && id === lifecycleId;
    }

    async function playTransition(step, id) {
      stopLoop();

      const assetId = STORY_STEPS[step].transition;
      const assetUrl = manifest[assetId];
      const ready = await loadVideo(idle, assetUrl);

      if (
        !ready ||
        idle.dataset.src !== assetUrl ||
        !isLifecycleValid(id)
      )
        return false;

      idle.loop = false;

      const segment = segmentFor(assetId, idle.duration);
      await seekStoryFrame(idle, segment.in);

      if (idle.dataset.src !== assetUrl || !isLifecycleValid(id)) return false;

      safePlay(idle);
      await waitForPresentedVideoFrame(idle);

      if (idle.dataset.src !== assetUrl || !isLifecycleValid(id)) return false;

      crossfade(idle, visible);
      swap();

      const completed = await watchToEnd(visible, assetId);

      return completed && isLifecycleValid(id);
    }

    async function showRest(step, id) {
      const rest = STORY_STEPS[step].rest;

      if (!rest.id) {
        stopLoop();
        visible.pause();
        return isLifecycleValid(id);
      }

      const restUrl = manifest[rest.id];
      const ready = await loadVideo(idle, restUrl);

      if (!ready || idle.dataset.src !== restUrl || !isLifecycleValid(id))
        return false;

      idle.loop = false;

      const segment = segmentFor(rest.id, idle.duration);
      await seekStoryFrame(idle, segment.in);

      if (idle.dataset.src !== restUrl || !isLifecycleValid(id)) return false;

      safePlay(idle);
      await waitForPresentedVideoFrame(idle);

      if (idle.dataset.src !== restUrl || !isLifecycleValid(id)) return false;

      crossfade(idle, visible);
      swap();
      startSegmentLoop(visible, rest.id);

      return true;
    }

    async function restoreStableStep(step, id) {
      const rest = STORY_STEPS[step].rest;

      if (rest.id) {
        return showRest(step, id);
      }

      const assetId = STORY_STEPS[step].transition;
      const assetUrl = manifest[assetId];
      const ready = await loadVideo(idle, assetUrl);

      if (
        !ready ||
        idle.dataset.src !== assetUrl ||
        !isLifecycleValid(id)
      )
        return false;

      const segment = segmentFor(assetId, idle.duration);
      await seekStoryFrame(idle, Math.max(0, segment.out - 0.03));

      if (idle.dataset.src !== assetUrl || !isLifecycleValid(id)) return false;

      stopLoop();
      idle.pause();
      crossfade(idle, visible);
      swap();

      return true;
    }

    async function processStory() {
      if (processing || !sectionActive || desired < 1) return;

      processing = true;

      const id = lifecycleId;

      try {
        while (isLifecycleValid(id) && current !== desired) {
          if (desired > current) {
            const nextStep = mobileQuery.matches ? desired : current + 1;
            const played = await playTransition(nextStep, id);

            if (!played || !isLifecycleValid(id)) return;

            current = nextStep;

            if (current === desired) {
              const rested = await showRest(current, id);

              if (!rested || !isLifecycleValid(id)) return;
            }

            continue;
          }

          const targetStep = desired;
          const restored = await restoreStableStep(targetStep, id);

          if (!restored || !isLifecycleValid(id)) return;

          current = targetStep;
        }
      } finally {
        if (id === lifecycleId) {
          processing = false;

          if (sectionActive && desired > 0 && current !== desired) {
            processStory();
          }
        }
      }
    }

    function requestStep(stepNumber) {
      if (!sectionActive) return;

      const nextDesired = gsap.utils.clamp(1, 3, stepNumber);
      if (nextDesired === desired) return;

      desired = nextDesired;

      if (mobileQuery.matches && processing) {
        lifecycleId += 1;
        processing = false;
        cancelTransition();
        stopLoop();
        gsap.killTweensOf([playerA, playerB]);
        playerA.pause();
        playerB.pause();
      }

      processStory();
    }

    function preloadStory() {
      const transitionPlayer = idle;
      const restPlayer = visible;
      const transitionId = STORY_STEPS[1].transition;
      const transitionUrl = manifest[transitionId];

      preloadStoryPlayer(
        transitionPlayer,
        transitionId,
      )
        .then(function (ready) {
          if (
            !ready ||
            current !== 0 ||
            transitionPlayer.dataset.src !== transitionUrl
          ) {
            return;
          }

          gsap.set(transitionPlayer, { opacity: 1, zIndex: 2 });
          gsap.set(restPlayer, { opacity: 0, zIndex: 1 });
        })
        .catch(function () {});
      preloadStoryPlayer(restPlayer, STORY_STEPS[1].rest.id).catch(
        function () {},
      );
    }

    function deactivateStory() {
      if (!sectionActive && !processing) return;

      sectionActive = false;
      lifecycleId += 1;
      processing = false;

      cancelTransition();
      stopLoop();

      gsap.killTweensOf([playerA, playerB]);
      playerA.pause();
      playerB.pause();
    }

    function storyIsInViewport() {
      const rect = section.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < getViewportHeight();
    }

    function resumeStory() {
      if (!storyIsInViewport()) return;

      sectionActive = true;
      lifecycleId += 1;
      processing = false;

      const id = lifecycleId;

      if (current < 1) {
        processStory();
        return;
      }

      restoreStableStep(current, id).then(function (restored) {
        if (!restored || !isLifecycleValid(id)) return;
        processStory();
      });
    }

    rows.forEach(function (row) {
      const stepNumber = parseInt(row.getAttribute("data-story-step"), 10);

      ScrollTrigger.create({
        trigger: row,
        start: responsiveValue(
          CONFIG.storyStepStart,
          CONFIG.mobile.storyStepStart,
        ),
        end: "bottom top",

        onEnter: function () {
          requestStep(stepNumber);
        },

        onLeaveBack: function () {
          if (stepNumber > 1) {
            requestStep(stepNumber - 1);
          }
        },
      });
    });

    ScrollTrigger.create({
      trigger: section,
      start: CONFIG.playbackPrepareStart,
      once: true,
      onEnter: preloadStory,
    });

    ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",

      onEnter: function () {
        sectionActive = true;
        lifecycleId += 1;
        processStory();
      },

      onEnterBack: function () {
        resumeStory();
      },

      onLeave: function () {
        deactivateStory();
      },

      onLeaveBack: function () {
        deactivateStory();
      },
    });

    return {
      release: deactivateStory,
      resume: resumeStory,
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
        trigger: el,
        start: options.enterStart || "top 90%",
        end: options.enterEnd || "top 62%",
        scrub: responsiveValue(
          CONFIG.viewportFadeScrub,
          CONFIG.mobile.viewportFadeScrub,
        ),
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

  function createStoryRowFade(row) {
    const elements = [
      row.querySelector("[data-story-eyebrow]"),
      row.querySelector("[data-story-title]"),
      row.querySelector("[data-story-subtext]"),
    ].filter(Boolean);
    if (!elements.length) return;
    gsap.set(elements, {
      opacity: 0,
      filter: `blur(${CONFIG.storyFadeBlur}px)`,
    });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: "top 50%",
        end: "bottom 50%",
        scrub: responsiveValue(0.3, CONFIG.mobile.viewportFadeScrub),
        invalidateOnRefresh: true,
      },
    });
    elements.forEach(function (element, index) {
      timeline.to(
        element,
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: CONFIG.storyRowRevealDuration,
          ease: "none",
        },
        index * CONFIG.storyRowRevealStagger,
      );
    });
    timeline.to(
      elements,
      {
        opacity: 0,
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
        "[data-story-eyebrow], [data-story-title], [data-story-subtext]",
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
    createTitleReveal(document.querySelector(".team_title"));
    createTitleReveal(document.querySelector(".news_title"), {
      exitStart: responsiveValue("center top", "bottom 5%"),
      exitEnd: responsiveValue("bottom -8%", "bottom -10%"),
    });
  }

  function preparePlaybackVideo(media, options) {
    if (!media || !media.video || reducedMotion.matches)
      return Promise.resolve(false);
    const video = media.video;
    configureVideo(video);
    video.loop = false;
    return prepareMedia(media).then(function (ready) {
      if (!ready) return false;
      return waitForVideoBuffer(video, options || {}).then(function () {
        video.pause();
        revealVideo(media, 0.35);
        return true;
      });
    });
  }

  function initCLayers(handles) {
    const insights = getSectionByRole("insights");
    const cLayers = getSectionByRole("c-layers");
    const insightsMedia = getSectionMedia(insights);
    const cLayersMedia = getSectionMedia(cLayers);
    if (!cLayers || !cLayersMedia) return;

    const map = cLayers.querySelector("[data-layer-map]");
    const controls = map
      ? Array.from(map.querySelectorAll("[data-layer-control]"))
      : [];
    const rows = Array.from(cLayers.querySelectorAll("[data-layer-row]"));

    if (reducedMotion.matches) return;
    if (!map || controls.length !== 3 || rows.length !== 3) {
      console.warn(
        "C-layers requires [data-layer-map], three controls and three [data-layer-row] panels.",
      );
      return;
    }

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
      gsap.set(row, { autoAlpha: 0 });
    });

    controls.forEach(function (control) {
      const key = control.getAttribute("data-layer-control");
      const row = panelMap[key];
      if (row) control.setAttribute("aria-controls", row.id);
      control.setAttribute("aria-pressed", "false");
    });

    gsap.set(map, { autoAlpha: 0 });

    let activeLayer = null;
    let videoActionId = 0;
    let cLayersReadyPromise = null;

    function setPanelAccessibility(row, active) {
      if (!row) return;
      row.setAttribute("aria-hidden", active ? "false" : "true");
      if ("inert" in row) row.inert = !active;
      row.style.pointerEvents = "none";
      const card = row.querySelector(".layers_card");
      if (card) card.style.pointerEvents = "none";
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

    function getCLayersSafeDuration() {
      const video = cLayersMedia.video;
      if (!video || !video.duration || !Number.isFinite(video.duration))
        return 0;
      return Math.max(0, video.duration - 0.034);
    }

    function getCLayersTargetTime(progress) {
      const duration = getCLayersSafeDuration();
      if (!duration) return 0;
      return duration * gsap.utils.clamp(0, 1, progress);
    }

    function prepareCLayersVideo() {
      if (cLayersReadyPromise) return cLayersReadyPromise;
      cLayersReadyPromise = preparePlaybackVideo(
        cLayersMedia,
        CONFIG.cLayersBuffer,
      ).then(function (ready) {
        if (!ready || !cLayersMedia.video) return false;
        const video = cLayersMedia.video;
        video.pause();
        video.loop = false;
        video.playbackRate = 1;
        return true;
      });
      return cLayersReadyPromise;
    }

    function snapCLayersVideo(progress) {
      const actionId = ++videoActionId;
      prepareCLayersVideo().then(function (ready) {
        if (!ready || actionId !== videoActionId) return;
        const video = cLayersMedia.video;
        if (!video) return;
        const targetTime = getCLayersTargetTime(progress);
        video.pause();
        video.loop = false;
        video.playbackRate = 1;
        gsap.killTweensOf(video);
        gsap.set(video, { opacity: 1 });
        if (
          Math.abs(video.currentTime - targetTime) <=
          CONFIG.cLayersTargetTolerance
        )
          return;
        try {
          video.currentTime = targetTime;
        } catch (error) {}
      });
    }

    function activateLayer(key) {
      if (!key || !panelMap[key] || CONFIG.cLayersTargets[key] === undefined)
        return;
      if (activeLayer === key) return;
      const previousLayer = activeLayer;
      activeLayer = key;
      if (previousLayer && panelMap[previousLayer])
        hidePanel(panelMap[previousLayer]);
      updateControls(key);
      showPanel(panelMap[key]);
      snapCLayersVideo(CONFIG.cLayersTargets[key]);
    }

    function resetLayers(options) {
      options = options || {};
      if (!activeLayer) return;
      activeLayer = null;
      updateControls(null);
      Object.values(panelMap).forEach(function (row) {
        hidePanel(row, options.immediate === true);
      });
      if (options.resetVideo !== false) snapCLayersVideo(0);
    }

    function showLayerMap() {
      gsap.to(map, {
        autoAlpha: 1,
        duration: CONFIG.cLayersMapFadeDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }

    function hideLayerMap() {
      gsap.to(map, {
        autoAlpha: 0,
        duration: CONFIG.cLayersMapFadeDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }

    function handleOutsidePointerDown(event) {
      if (useHoverInteractions || !activeLayer) return;
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

    if (insights) {
      ScrollTrigger.create({
        trigger: insights,
        start: CONFIG.mediaRevealStart,
        once: true,
        onEnter: function () {
          prepareMedia(cLayersMedia);
        },
      });
    }

    ScrollTrigger.create({
      trigger: cLayers,
      start: CONFIG.cLayersPrepareStart,
      once: true,
      onEnter: prepareCLayersVideo,
    });

    ScrollTrigger.create({
      trigger: cLayers,
      start: CONFIG.cLayersRevealEnd,
      end: CONFIG.cLayersMapFadeOutStart,
      onEnter: showLayerMap,
      onEnterBack: showLayerMap,
      onLeave: hideLayerMap,
      onLeaveBack: hideLayerMap,
    });

    ScrollTrigger.create({
      trigger: cLayers,
      start: "top top",
      end: "bottom top",
      onEnter: function () {
        prepareCLayersVideo();
        if (handles.insights) handles.insights.release();
      },
      onEnterBack: function () {
        prepareCLayersVideo();
      },
      onLeaveBack: function () {
        hideLayerMap();
        if (activeLayer) resetLayers({ immediate: true, resetVideo: true });
        if (handles.insights) handles.insights.activate();
      },
    });
  }

  function initVisibilityHandling(handles) {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        activeMedia.forEach(function (media) {
          if (media.video) media.video.pause();
        });
        if (handles.story) handles.story.release();
        return;
      }
      activeMedia.forEach(function (media) {
        safePlay(media.video);
      });
      if (handles.story) handles.story.resume();
    });
  }

  function initMobileLayoutStability() {
    if (!mobileQuery.matches) return;

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
      mobileLayoutObserver = new ResizeObserver(function (entries) {
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
        mobileLayoutObserver.observe(section);
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

  buildMediaMap();

  const handles = {};

  try {
    initContentFades();
  } catch (error) {
    gsap.set(getContentTargets(), { clearProps: "opacity,filter" });
  }
  try {
    initReveals();
  } catch (error) {}
  try {
    initHero();
    handles.about = createLoopingPlayback("about", activateFadeLoop);
    handles.insights = createLoopingPlayback("insights", activateFadeLoop);
  } catch (error) {}
  try {
    handles.story = initStory(handles);
  } catch (error) {}
  try {
    initCLayers(handles);
  } catch (error) {}

  initVisibilityHandling(handles);
  initMobileLayoutStability();
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

document.addEventListener("DOMContentLoaded", initNumenosMedia);
