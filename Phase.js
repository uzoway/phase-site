/* -- Hero Image Sequence -- */
function initHeroSequence() {
  const canvas = document.querySelector('[data-canvas-seq="hero"]');
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const poster = document.querySelector('[data-canvas-poster="hero"]');

  const config = {
    frames: 54,
    fps: 24,
    url: "https://cdn.jsdelivr.net/gh/uzoway/phase-site@afbfd318fb94c0640c36f3379a7ce2ca8ec8b644/Phase%20Header/phase-header",
    ext: ".webp",
  };

  const frames = new Array(config.frames).fill(null);
  const interval = 1000 / config.fps;

  let frame = 0;
  let lastTime = 0;
  let rafId = null;
  let ready = false;
  let visible = true;

  function resize() {
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    const source = frames[frame] || frames.find(Boolean);

    if (!width || !height) return;

    const coverScale = source
      ? Math.max(width / source.width, height / source.height)
      : 1;
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      Math.max(1, 1 / coverScale),
    );

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    draw(frames[frame]);
  }

  function draw(img) {
    if (!img) return;
    const scale = Math.max(
      canvas.width / img.width,
      canvas.height / img.height,
    );
    const x = canvas.width / 2 - (img.width / 2) * scale;
    const y = canvas.height / 2 - (img.height / 2) * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    if (poster) poster.style.visibility = "hidden";
  }

  function loop(time) {
    rafId = requestAnimationFrame(loop);
    const delta = time - lastTime;
    if (delta > interval) {
      frame = (frame + 1) % config.frames;
      draw(frames[frame]);
      lastTime = time - (delta % interval);
    }
  }

  function start() {
    if (rafId !== null || !ready || !visible) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      if (index > 0) img.fetchPriority = "low";
      img.onload = () => {
        if (typeof createImageBitmap !== "function") {
          resolve(img);
          return;
        }
        createImageBitmap(img).then(resolve, () => resolve(img));
      };
      img.onerror = () => resolve(null);
      img.src = `${config.url}${index.toString().padStart(2, "0")}${config.ext}`;
    });
  }

  const loads = frames.map((_, index) =>
    loadFrame(index).then((source) => {
      frames[index] = source;

      if (index === 0) {
        resize();
        window.addEventListener("resize", resize);
      }
    }),
  );

  Promise.all(loads).then(() => {
    ready = true;
    resize();
    start();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }).observe(canvas);
  }
}

/* -- PROCESS VIDEO STEP ANIMATION -- */
const SHOW_STEP_INDICATORS = true;
const PROCESS_SECTION_SCROLL = 100;
const PROCESS_VIDEO_FIT = 0.9;
const PROCESS_VIDEO_MAX_WIDTH = 1.15;
const PROCESS_INTRO_FADE = 0.4;
const PROCESS_FALLBACK_FPS = 24;
const PROCESS_MOBILE_SOURCES_QUERY = "(max-width: 767px)";

const PROCESS_OUT_DURATION = 0.55;
const PROCESS_OUT_SCALE = 0.75;
const PROCESS_IN_DURATION = 0.9;
const PROCESS_IN_DELAY = 0.15;
const PROCESS_TEXT_OUT_DURATION = 0.3;
const PROCESS_IN_SCALE = 1.5;
const PROCESS_IN_BLUR_RATIO = 0.03;

function initProcessAnimation() {
  const section = document.querySelector('[data-process="section"]');
  if (!section) return;

  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined" ||
    typeof THREE === "undefined"
  ) {
    return;
  }

  if (section.dataset.processInitialized === "true") return;

  gsap.registerPlugin(ScrollTrigger);

  const texts = gsap.utils.toArray('[data-process$="-text"]');
  const videoMounts = gsap.utils.toArray('[data-process$="-video"]');
  const progressBar = document.querySelector('[data-process="progress-bar"]');
  const progressWrap = progressBar?.parentElement;

  if (
    !texts.length ||
    !videoMounts.length ||
    texts.length !== videoMounts.length ||
    !progressBar ||
    !progressWrap
  ) {
    return;
  }

  section.dataset.processInitialized = "true";

  const total = texts.length;

  const stepNodes = SHOW_STEP_INDICATORS
    ? buildStepNodes(progressWrap, total + 1)
    : [];

  const useMobileSources = window.matchMedia(
    PROCESS_MOBILE_SOURCES_QUERY,
  ).matches;

  const backgroundColor = getComputedStyle(section).backgroundColor;

  const scenes = videoMounts.map((mount) => {
    const getSource = (name) =>
      (useMobileSources && mount.getAttribute(`${name}-mobile`)) ||
      mount.getAttribute(name);

    return createDualScene(mount, {
      loopSrc: getSource("data-video-src"),
      introSrc: getSource("data-video-intro-src"),
      rotation: parseInt(mount.getAttribute("data-video-rotation") || "0", 10),
      backgroundColor,
    });
  });

  const loadScenes = () => scenes.forEach((scene) => scene.load());

  if ("IntersectionObserver" in window) {
    const loader = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        loader.disconnect();
        loadScenes();
      },
      { rootMargin: "150% 0px" },
    );

    loader.observe(section);
  } else {
    loadScenes();
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    const isMobile = window.matchMedia("(max-width: 990px)").matches;

    positionStepNodes(stepNodes, isMobile);

    gsap.set(texts, {
      autoAlpha: 0,
      y: 0,
    });

    gsap.set(texts[0], {
      autoAlpha: 1,
    });

    gsap.set(videoMounts, {
      autoAlpha: 0,
    });

    gsap.set(videoMounts[0], {
      autoAlpha: 1,
      zIndex: 1,
    });

    gsap.set(progressBar, {
      scaleX: isMobile ? 0 : 1,
      scaleY: isMobile ? 1 : 0,
      transformOrigin: isMobile ? "left center" : "top center",
    });

    gsap.set(stepNodes, {
      autoAlpha: 0.25,
      scale: 0.6,
    });

    if (stepNodes[0]) {
      gsap.set(stepNodes[0], {
        autoAlpha: 1,
        scale: 1,
      });
    }

    scenes[0].showStill();

    return;
  }

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 991px)",
      isMobile: "(max-width: 990px)",
    },
    (context) => {
      const { isMobile } = context.conditions;

      const barAxis = isMobile ? "scaleX" : "scaleY";
      const barOrigin = isMobile ? "left center" : "top center";

      const mountBlur = videoMounts.map(() => ({ value: 0 }));

      let activeScenes = new Set();
      let sectionVisible = false;
      let currentStep = -1;

      positionStepNodes(stepNodes, isMobile);

      gsap.set(texts, {
        autoAlpha: 0,
        y: 15,
        willChange: "transform, opacity",
      });

      gsap.set(videoMounts, {
        autoAlpha: 0,
        scale: 1,
        zIndex: 0,
        willChange: "transform, opacity",
      });

      gsap.set(progressBar, {
        scaleX: isMobile ? 0 : 1,
        scaleY: isMobile ? 1 : 0,
        transformOrigin: barOrigin,
      });

      gsap.set(stepNodes, {
        autoAlpha: 0.25,
        scale: 0.6,
      });

      function clamp(value, min = 0, max = 1) {
        return Math.min(Math.max(value, min), max);
      }

      function getStep(progress) {
        return Math.min(total - 1, Math.floor(clamp(progress) * total));
      }

      function isShown(element) {
        return gsap.getProperty(element, "opacity") > 0.001;
      }

      function applyBlur(index) {
        scenes[index].setBlur(mountBlur[index].value);
      }

      function resetElement(element, index, isMount) {
        gsap.killTweensOf(element);

        if (isMount) {
          gsap.killTweensOf(mountBlur[index]);
          mountBlur[index].value = 0;
          applyBlur(index);
        }

        gsap.set(element, isMount
          ? { autoAlpha: 0, scale: 1, zIndex: 0 }
          : { autoAlpha: 0, y: 15 });
      }

      function syncPlayback(direction = 1) {
        const next = new Set(
          sectionVisible
            ? videoMounts
                .map((mount, index) => index)
                .filter(
                  (index) =>
                    index === currentStep || isShown(videoMounts[index]),
                )
            : [],
        );

        activeScenes.forEach((index) => {
          if (!next.has(index)) scenes[index].deactivate();
        });

        next.forEach((index) => {
          if (!activeScenes.has(index)) scenes[index].activate(direction);
        });

        activeScenes = next;
      }

      function tickActiveScenes(time, deltaTime) {
        const delta = Math.min(deltaTime / 1000, 0.1);

        activeScenes.forEach((index) => scenes[index].tick(delta));
      }

      function showStepInstantly(step) {
        currentStep = step;

        videoMounts.forEach((mount, index) => resetElement(mount, index, true));
        texts.forEach((text, index) => resetElement(text, index, false));

        gsap.set(videoMounts[step], {
          autoAlpha: 1,
          zIndex: 1,
        });

        gsap.set(texts[step], {
          autoAlpha: 1,
          y: 0,
        });

        scenes[step].render();
      }

      function transitionTo(step, direction) {
        const incoming = videoMounts[step];
        const incomingShown = isShown(incoming);

        const outgoing = videoMounts.filter(
          (mount, index) => index !== step && isShown(mount),
        );

        const delay =
          outgoing.length && !incomingShown ? PROCESS_IN_DELAY : 0;

        currentStep = step;

        videoMounts.forEach((mount, index) => {
          if (index === step) return;

          if (!isShown(mount)) {
            resetElement(mount, index, true);
            return;
          }

          gsap.killTweensOf(mount);
          gsap.killTweensOf(mountBlur[index]);

          gsap.set(mount, { zIndex: 0 });

          gsap.to(mount, {
            scale: PROCESS_OUT_SCALE,
            autoAlpha: 0,
            duration: PROCESS_OUT_DURATION,
            ease: "power2.in",
            onComplete: () => {
              resetElement(mount, index, true);
              syncPlayback(direction);
            },
          });

          gsap.to(mountBlur[index], {
            value: 0,
            duration: PROCESS_OUT_DURATION,
            onUpdate: () => applyBlur(index),
          });
        });

        gsap.killTweensOf(incoming);
        gsap.killTweensOf(mountBlur[step]);

        gsap.set(incoming, { zIndex: 1 });

        if (!incomingShown) {
          gsap.set(incoming, {
            autoAlpha: 0,
            scale: PROCESS_IN_SCALE,
          });

          mountBlur[step].value = incoming.clientHeight * PROCESS_IN_BLUR_RATIO;
          applyBlur(step);
        }

        gsap.to(incoming, {
          scale: 1,
          duration: PROCESS_IN_DURATION,
          delay,
          ease: "power3.out",
        });

        gsap.to(incoming, {
          autoAlpha: 1,
          duration: PROCESS_IN_DURATION * 0.6,
          delay,
          ease: "power1.out",
        });

        gsap.to(mountBlur[step], {
          value: 0,
          duration: PROCESS_IN_DURATION,
          delay,
          ease: "power2.out",
          onUpdate: () => applyBlur(step),
        });

        const incomingText = texts[step];
        const incomingTextShown = isShown(incomingText);

        const outgoingTexts = texts.filter(
          (text, index) => index !== step && isShown(text),
        );

        const textDelay =
          outgoingTexts.length && !incomingTextShown
            ? PROCESS_TEXT_OUT_DURATION
            : 0;

        texts.forEach((text, index) => {
          if (index === step) return;

          if (!isShown(text)) {
            resetElement(text, index, false);
            return;
          }

          gsap.killTweensOf(text);

          gsap.to(text, {
            autoAlpha: 0,
            y: -12,
            duration: PROCESS_TEXT_OUT_DURATION,
            ease: "power2.in",
          });
        });

        gsap.killTweensOf(incomingText);

        if (!incomingTextShown) {
          gsap.set(incomingText, { autoAlpha: 0, y: 12 });
        }

        gsap.to(incomingText, {
          autoAlpha: 1,
          y: 0,
          duration: PROCESS_IN_DURATION * 0.8,
          delay: textDelay,
          ease: "power2.out",
        });

        syncPlayback(direction);
      }

      function updateProgress(progress) {
        gsap.set(progressBar, {
          [barAxis]: progress,
        });

        stepNodes.forEach((node, index) => {
          const completed = progress + 0.0001 >= index / total;

          gsap.set(node, {
            autoAlpha: completed ? 1 : 0.25,
            scale: completed ? 1 : 0.6,
          });
        });
      }

      function updateProcessState(rawProgress) {
        const progress = clamp(rawProgress);

        updateProgress(progress);

        const step = getStep(progress);

        if (step === currentStep) return;

        transitionTo(step, step > currentStep ? 1 : -1);
      }

      const processTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${total * PROCESS_SECTION_SCROLL}%`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,

        onUpdate: (self) => {
          updateProcessState(self.progress);
        },

        onRefresh: (self) => {
          scenes.forEach((scene) => scene.refresh());

          const progress = clamp(self.progress);

          updateProgress(progress);

          if (getStep(progress) !== currentStep) {
            showStepInstantly(getStep(progress));
            syncPlayback();
          }
        },
      });

      const visibilityTrigger = ScrollTrigger.create({
        start: () => processTrigger.start - window.innerHeight * 0.5,
        end: () => processTrigger.end + window.innerHeight,
        invalidateOnRefresh: true,

        onToggle: (self) => {
          sectionVisible = self.isActive;

          syncPlayback(self.direction);
        },
      });

      gsap.ticker.add(tickActiveScenes);

      scenes.forEach((scene) => scene.refresh());

      const initialProgress = clamp(processTrigger.progress);

      updateProgress(initialProgress);
      showStepInstantly(getStep(initialProgress));

      sectionVisible = visibilityTrigger.isActive;
      syncPlayback();

      return () => {
        gsap.ticker.remove(tickActiveScenes);

        sectionVisible = false;
        syncPlayback();

        gsap.killTweensOf([...videoMounts, ...texts, ...mountBlur]);

        processTrigger.kill();
        visibilityTrigger.kill();

        scenes.forEach((scene) => scene.setBlur(0));

        gsap.set(texts, {
          clearProps: "opacity,visibility,transform,willChange",
        });

        gsap.set(videoMounts, {
          clearProps: "opacity,visibility,transform,zIndex,willChange",
        });
      };
    },
  );
}

function createProcessClip(src, loop) {
  const video = document.createElement("video");

  video.crossOrigin = "anonymous";
  video.muted = true;
  video.loop = loop;
  video.playsInline = true;
  video.autoplay = false;
  video.preload = "auto";

  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  const frameDuration = 1 / PROCESS_FALLBACK_FPS;
  const supportsFrameCallback =
    "requestVideoFrameCallback" in HTMLVideoElement.prototype;

  const clip = {
    video,
    onEnded: null,
    load,
    play,
    pause,
    restart,
    tick,
    takeFrame,
    destroy,
  };

  let loaded = false;
  let manual = false;
  let playing = false;
  let manualTime = 0;
  let seekInFlight = false;
  let frameReady = false;
  let frameCallbackId = null;
  let lastCallbackAt = 0;
  let lastFrameTime = -1;

  function load() {
    if (loaded) return;
    loaded = true;
    video.src = src;
    video.load();
  }

  function watchFrames() {
    if (!supportsFrameCallback || frameCallbackId !== null) return;

    frameCallbackId = video.requestVideoFrameCallback(() => {
      frameCallbackId = null;
      frameReady = true;
      lastCallbackAt = performance.now();

      if (playing) watchFrames();
    });
  }

  function takeFrame() {
    if (frameReady) {
      frameReady = false;
      lastFrameTime = video.currentTime;
      return true;
    }

    if (
      supportsFrameCallback &&
      performance.now() - lastCallbackAt < 250
    ) {
      return false;
    }

    if (video.currentTime === lastFrameTime) return false;

    lastFrameTime = video.currentTime;
    return true;
  }

  function getDuration() {
    return Number.isFinite(video.duration) ? video.duration : 0;
  }

  function play() {
    playing = true;

    load();
    watchFrames();

    if (manual) return;

    const attempt = video.play();

    if (attempt && typeof attempt.catch === "function") {
      attempt.catch((error) => {
        if (!playing || error?.name !== "NotAllowedError") return;

        manual = true;
        manualTime = video.currentTime;
      });
    }
  }

  function pause() {
    playing = false;
    video.pause();
  }

  function restart() {
    manualTime = 0;

    if (video.currentTime !== 0 && video.readyState >= 1) {
      video.currentTime = 0;
    }
  }

  function tick(delta) {
    if (!manual || !playing) return;

    const duration = getDuration();

    if (!duration) return;

    const lastFrame = Math.max(0, duration - frameDuration);

    manualTime += delta;

    if (manualTime >= lastFrame) {
      if (loop) {
        manualTime %= lastFrame || 1;
      } else {
        manualTime = lastFrame;
        playing = false;
        clip.onEnded?.();
      }
    }

    if (seekInFlight || video.seeking) return;

    const targetTime =
      Math.round(manualTime / frameDuration) * frameDuration;

    if (Math.abs(targetTime - video.currentTime) < frameDuration * 0.5) {
      return;
    }

    seekInFlight = true;

    try {
      video.currentTime = Math.min(targetTime, lastFrame);
    } catch {
      seekInFlight = false;
    }
  }

  function handleSeeked() {
    seekInFlight = false;
    frameReady = true;
    watchFrames();
  }

  function handleEnded() {
    if (!manual) clip.onEnded?.();
  }

  video.addEventListener("seeked", handleSeeked);
  video.addEventListener("ended", handleEnded);

  function destroy() {
    playing = false;

    if (frameCallbackId !== null && "cancelVideoFrameCallback" in video) {
      video.cancelVideoFrameCallback(frameCallbackId);
    }

    video.removeEventListener("seeked", handleSeeked);
    video.removeEventListener("ended", handleEnded);

    video.pause();
  }

  return clip;
}

function createDualScene(mount, { loopSrc, introSrc, rotation, backgroundColor }) {
  const loopClip = createProcessClip(loopSrc, true);
  const introClip = introSrc ? createProcessClip(introSrc, false) : null;

  const clips = introClip ? [introClip, loopClip] : [loopClip];

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setClearColor(0x000000, 0);

  if (getComputedStyle(mount).position === "static") {
    mount.style.position = "relative";
  }

  mount.appendChild(renderer.domElement);

  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
  });

  function createTexture(video) {
    const texture = new THREE.Texture(video);

    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.generateMipmaps = false;
    texture.flipY = true;

    return texture;
  }

  const loopTexture = createTexture(loopClip.video);
  const introTexture = introClip ? createTexture(introClip.video) : loopTexture;

  const textures = introClip ? [introTexture, loopTexture] : [loopTexture];

  const background = new THREE.Color(backgroundColor || "#040610");

  const uniforms = {
    uTexture: {
      value: loopTexture,
    },

    uIntroTexture: {
      value: introTexture,
    },

    uIntroMix: {
      value: introClip ? 1 : 0,
    },

    uBackground: {
      value: new THREE.Vector3(background.r, background.g, background.b),
    },

    uVideoScale: {
      value: new THREE.Vector2(PROCESS_VIDEO_FIT, PROCESS_VIDEO_FIT),
    },

    uRotation: {
      value: (rotation * Math.PI) / 180,
    },

    uBlur: {
      value: new THREE.Vector2(0, 0),
    },

    uBlurLod: {
      value: 0,
    },
  };

  const videoGeometry = new THREE.PlaneGeometry(2, 2);

  const videoMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VIDEO_VERT,
    fragmentShader: VIDEO_FRAG,
    transparent: true,
    depthWrite: false,
  });

  const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);

  scene.add(videoMesh);

  let destroyed = false;
  let active = false;
  let phase = introClip ? "idle" : "loop";
  let introFade = null;
  let needsRender = true;
  let blurPixels = 0;
  let blurMips = false;

  const uploaded = clips.map(() => false);
  const pendingFrames = clips.map(() => false);
  const supportsBlurMips = renderer.capabilities.isWebGL2;

  function getVideoAspect() {
    const { videoWidth, videoHeight } = loopClip.video;

    if (!videoWidth || !videoHeight) return 1;

    const isRotated90 = rotation === 90 || rotation === 270;

    return isRotated90 ? videoHeight / videoWidth : videoWidth / videoHeight;
  }

  function updateLayout() {
    const width = mount.clientWidth;
    const height = mount.clientHeight || width;

    if (!width || !height) return;

    const videoAspect = getVideoAspect();

    const videoWidth = Math.min(
      width * PROCESS_VIDEO_MAX_WIDTH,
      height * PROCESS_VIDEO_FIT * videoAspect,
    );

    const videoHeight = videoWidth / videoAspect;

    uniforms.uVideoScale.value.set(videoWidth / width, videoHeight / height);

    updateBlur();
  }

  function getWeight(index) {
    if (!introClip) return 1;

    const mix = uniforms.uIntroMix.value;

    return index === 0 ? mix : 1 - mix;
  }

  function hasData(index) {
    return clips[index].video.readyState >= 2;
  }

  function render() {
    if (destroyed) return;

    const visibleReady = clips.every(
      (clip, index) => getWeight(index) <= 0 || hasData(index),
    );

    if (!visibleReady) return;

    textures.forEach((texture, index) => {
      if (!hasData(index)) return;

      if (uploaded[index] && !(pendingFrames[index] && getWeight(index) > 0)) {
        return;
      }

      texture.needsUpdate = true;
      uploaded[index] = true;
      pendingFrames[index] = false;
    });

    renderer.render(scene, camera);

    needsRender = false;
  }

  function collectFrames() {
    let visibleChange = false;

    clips.forEach((clip, index) => {
      if (!clip.takeFrame()) return;

      pendingFrames[index] = true;

      if (getWeight(index) > 0) visibleChange = true;
    });

    return visibleChange;
  }

  function tick(delta) {
    if (destroyed) return;

    clips.forEach((clip) => clip.tick(delta));

    if (collectFrames() || needsRender) render();
  }

  function updateBlur() {
    const width = mount.clientWidth;
    const height = mount.clientHeight || width;
    const scale = uniforms.uVideoScale.value;
    const active = blurPixels > 0.05 && width > 0 && height > 0;

    if (active) {
      const isRotated90 = rotation === 90 || rotation === 270;
      const blurX = blurPixels / (scale.x * width);
      const blurY = blurPixels / (scale.y * height);

      uniforms.uBlur.value.set(
        isRotated90 ? blurY : blurX,
        isRotated90 ? blurX : blurY,
      );
      uniforms.uBlurLod.value = Math.log2(
        Math.max(1, blurPixels * renderer.getPixelRatio() * 0.9),
      );
    } else {
      uniforms.uBlur.value.set(0, 0);
      uniforms.uBlurLod.value = 0;
    }

    const wantMips = active && supportsBlurMips;

    if (wantMips !== blurMips) {
      blurMips = wantMips;

      textures.forEach((texture, index) => {
        texture.generateMipmaps = wantMips;
        texture.minFilter = wantMips
          ? THREE.LinearMipmapLinearFilter
          : THREE.LinearFilter;
        uploaded[index] = false;
      });
    }

    needsRender = true;
  }

  function setBlur(pixels) {
    if (pixels === blurPixels) return;

    blurPixels = pixels;
    updateBlur();
  }

  function load() {
    clips.forEach((clip) => clip.load());
  }

  function setIntroMix(value) {
    uniforms.uIntroMix.value = value;
    needsRender = true;
  }

  function startIntro() {
    phase = "intro";

    introFade?.kill();
    setIntroMix(1);

    loopClip.pause();
    loopClip.restart();

    introClip.restart();
    introClip.play();
  }

  function showLoop() {
    phase = "loop";

    introFade?.kill();
    setIntroMix(0);

    introClip?.pause();

    loopClip.play();
  }

  if (introClip) {
    introClip.onEnded = () => {
      if (phase !== "intro") return;

      phase = "loop";

      loopClip.restart();

      if (active) loopClip.play();

      introFade = gsap.to(uniforms.uIntroMix, {
        value: 0,
        duration: PROCESS_INTRO_FADE,
        ease: "power1.inOut",
        onUpdate: () => {
          needsRender = true;
        },
      });
    };
  }

  function activate(direction) {
    active = true;

    if (!introClip) {
      loopClip.play();
      return;
    }

    if (direction < 0) {
      showLoop();
      return;
    }

    if (phase === "intro") {
      introClip.play();
      return;
    }

    startIntro();
  }

  function deactivate() {
    active = false;

    clips.forEach((clip) => clip.pause());
  }

  function showStill() {
    if (introClip) {
      phase = "loop";
      setIntroMix(0);
    }

    render();
  }

  function resize() {
    const width = mount.clientWidth;
    const height = mount.clientHeight || width;

    if (!width || !height) return;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    renderer.setPixelRatio(pixelRatio);

    renderer.setSize(width, height, false);

    updateLayout();
    render();
  }

  function handleLoadedData(event) {
    const index = clips.findIndex((clip) => clip.video === event?.target);

    if (index >= 0) pendingFrames[index] = true;

    updateLayout();
    render();
  }

  clips.forEach((clip) => {
    clip.video.addEventListener("loadedmetadata", handleLoadedData);
    clip.video.addEventListener("loadeddata", handleLoadedData);
    clip.video.addEventListener("seeked", handleLoadedData);
  });

  const resizeObserver = new ResizeObserver(resize);

  resizeObserver.observe(mount);

  resize();

  function destroy() {
    destroyed = true;

    introFade?.kill();

    resizeObserver.disconnect();

    clips.forEach((clip) => {
      clip.video.removeEventListener("loadedmetadata", handleLoadedData);
      clip.video.removeEventListener("loadeddata", handleLoadedData);
      clip.video.removeEventListener("seeked", handleLoadedData);

      clip.destroy();
    });

    videoMaterial.dispose();

    videoGeometry.dispose();

    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  }

  return {
    load,
    render,
    tick,
    activate,
    deactivate,
    showStill,
    setBlur,
    refresh: resize,
    destroy,
  };
}

const PROCESS_SAMPLE_CHUNK = `
  uniform sampler2D uTexture;
  uniform sampler2D uIntroTexture;
  uniform float uIntroMix;
  uniform vec3 uBackground;

  vec4 sampleProcessVideo(vec2 uv, float bias) {
    vec3 loopColor = texture2D(uTexture, uv, bias).rgb;
    vec3 introColor = texture2D(uIntroTexture, uv, bias).rgb;

    vec3 color = mix(loopColor, introColor, uIntroMix);

    vec3 difference = abs(color - uBackground);

    float keyAlpha = smoothstep(
      0.0,
      0.04,
      max(difference.r, max(difference.g, difference.b))
    );

    return vec4(color, keyAlpha);
  }
`;

const VIDEO_VERT = `
  varying vec2 vUv;

  uniform vec2 uVideoScale;
  uniform float uRotation;

  vec2 rotate2D(vec2 value, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * value;
  }

  void main() {
    vUv = rotate2D(uv - 0.5, uRotation) + 0.5;

    gl_Position = vec4(position.xy * uVideoScale, 0.0, 1.0);
  }
`;

const VIDEO_FRAG = `
  ${PROCESS_SAMPLE_CHUNK}

  uniform vec2 uBlur;
  uniform float uBlurLod;

  varying vec2 vUv;

  vec4 sampleBlurred(vec2 uv) {
    vec4 total = vec4(0.0);
    float weightSum = 0.0;

    for (int i = 0; i < 16; i++) {
      float index = float(i);
      float radius = sqrt((index + 0.5) / 16.0) * 2.0;
      float angle = index * 2.39996;
      vec2 offset = vec2(cos(angle), sin(angle)) * radius;
      vec2 tapUv = uv + offset * uBlur;

      float weight = exp(-0.5 * radius * radius);
      weightSum += weight;

      if (
        tapUv.x < 0.0 ||
        tapUv.x > 1.0 ||
        tapUv.y < 0.0 ||
        tapUv.y > 1.0
      ) {
        continue;
      }

      vec4 tap = sampleProcessVideo(tapUv, uBlurLod);
      total += vec4(tap.rgb * tap.a, tap.a) * weight;
    }

    if (total.a <= 0.0001) return vec4(0.0);

    return vec4(total.rgb / total.a, total.a / weightSum);
  }

  void main() {
    if (
      vUv.x < 0.0 ||
      vUv.x > 1.0 ||
      vUv.y < 0.0 ||
      vUv.y > 1.0
    ) {
      discard;
    }

    if (uBlur.x > 0.0) {
      gl_FragColor = sampleBlurred(vUv);
      return;
    }

    gl_FragColor = sampleProcessVideo(vUv, 0.0);
  }
`;

function buildStepNodes(wrap, count) {
  if (!wrap) return [];

  wrap
    .querySelectorAll('[data-process="progress-node"]')
    .forEach((node) => node.remove());

  if (getComputedStyle(wrap).position === "static") {
    wrap.style.position = "relative";
  }

  const nodes = [];

  for (let index = 0; index < count; index++) {
    const node = document.createElement("div");

    node.setAttribute("data-process", "progress-node");

    Object.assign(node.style, {
      position: "absolute",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "currentColor",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    });

    wrap.appendChild(node);

    nodes.push(node);
  }

  return nodes;
}

function positionStepNodes(nodes, isMobile) {
  const lastIndex = nodes.length - 1;

  nodes.forEach((node, index) => {
    const percentage = lastIndex <= 0 ? 0 : (index / lastIndex) * 100;

    node.style.top = isMobile ? "50%" : `${percentage}%`;

    node.style.left = isMobile ? `${percentage}%` : "50%";
  });
}

/* -- TECHNOLOGY STEP ANIMATION -- */
const SHOW_TECH_BG_CROSSFADE = true;

function initTechSection() {
  const section = document.querySelector('[data-tech="process"]');
  if (!section) return;

  const readDescription = section.querySelector(
    '[data-tech="read-description"]',
  );
  const writeDescription = section.querySelector(
    '[data-tech="write-description"]',
  );
  const progressBar = section.querySelector('[data-tech="progress-bar"]');
  const [readLabel, writeLabel] = section.querySelectorAll(
    '[data-tech="progress-text"]',
  );

  const visualContainer = section.querySelector('[data-tech="read-lottie"]');
  if (!readDescription || !writeDescription || !visualContainer) return;

  // Isolate the Read and Write elements inside the container
  const writeVisuals = visualContainer.querySelectorAll(".uc-write");
  const readVisuals = visualContainer.querySelectorAll(
    ".tech_vid-wrap:not(.uc-write) .tech_vid-embed, .tech_image:not(.uc-write), .tech_mid-line:not(.uc-write), .tech_top-row-line",
  );

  const READ_GRADIENT =
    "linear-gradient(180deg, #F0E7DD 77.68%, #FFF296 133.88%)";
  const WRITE_GRADIENT =
    "linear-gradient(180deg, #ECE5D2 79.3%, #9FC6B4 143.09%), linear-gradient(180deg, #F0E7DD 80.15%, #9FC6B4 105.21%)";

  section.style.background = READ_GRADIENT;
  const bgOverlay = SHOW_TECH_BG_CROSSFADE
    ? buildBackgroundOverlay(section, WRITE_GRADIENT)
    : null;

  gsap.set([readDescription, writeDescription, readVisuals, writeVisuals], {
    willChange: "transform, opacity",
  });

  function resetToReadState() {
    gsap.set(readDescription, { autoAlpha: 1, y: 0 });
    gsap.set(writeDescription, { autoAlpha: 0, y: 20 });

    gsap.set(visualContainer, { autoAlpha: 1 });
    gsap.set(readVisuals, { autoAlpha: 1 });
    gsap.set(writeVisuals, { autoAlpha: 0 });

    gsap.set(readLabel, { autoAlpha: 1 });
    gsap.set(writeLabel, { autoAlpha: 0 });
    gsap.set(progressBar, { scaleX: 0, transformOrigin: "left center" });
    if (bgOverlay) gsap.set(bgOverlay, { autoAlpha: 0 });
  }

  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    resetToReadState();

    const totalDuration = 5;
    const handoff = 2.25;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${(totalDuration / 2) * 100}%`,
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });

    tl.to(progressBar, { scaleX: 1, duration: handoff }, 0);
    tl.fromTo(
      progressBar,
      { scaleX: 0 },
      { scaleX: 1, duration: totalDuration - handoff, immediateRender: false },
      handoff,
    );

    tl.to(readDescription, { autoAlpha: 0, y: -12, duration: 0.4 }, handoff);

    // Fade out specific Read visuals
    tl.to(readVisuals, { autoAlpha: 0, duration: 0.6 }, handoff);
    tl.to(readLabel, { autoAlpha: 0, duration: 0.15 }, handoff - 0.15);

    if (bgOverlay) {
      tl.to(bgOverlay, { autoAlpha: 1, duration: 0.9 }, handoff - 0.1);
    }

    // Fade in specific Write visuals
    tl.to(writeVisuals, { autoAlpha: 1, duration: 0.65 }, handoff + 0.15);
    tl.to(
      writeDescription,
      { autoAlpha: 1, y: 0, duration: 0.5 },
      handoff + 0.2,
    );
    tl.to(writeLabel, { autoAlpha: 1, duration: 0.15 }, handoff);
  });

  mm.add("(max-width: 767px)", () => {
    resetToReadState();

    const mobileTrigger = section.querySelector('[data-tech="mobile-trigger"]');
    if (!mobileTrigger) return;

    const totalDuration = 5;
    const handoff = 2.25;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: mobileTrigger,
        start: () => {
          const rem = parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          );

          return `top ${rem * 2}px`;
        },
        end: () => `+=${(totalDuration / 2) * 100}%`,
        pin: section,
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });

    tl.to(progressBar, { scaleX: 1, duration: handoff }, 0);
    tl.fromTo(
      progressBar,
      { scaleX: 0 },
      { scaleX: 1, duration: totalDuration - handoff, immediateRender: false },
      handoff,
    );

    tl.to(readDescription, { autoAlpha: 0, y: -12, duration: 0.4 }, handoff);
    tl.to(readVisuals, { autoAlpha: 0, duration: 0.6 }, handoff);
    tl.to(readLabel, { autoAlpha: 0, duration: 0.15 }, handoff - 0.15);

    if (bgOverlay) {
      tl.to(bgOverlay, { autoAlpha: 1, duration: 0.9 }, handoff - 0.1);
    }

    tl.to(writeVisuals, { autoAlpha: 1, duration: 0.65 }, handoff + 0.15);
    tl.to(
      writeDescription,
      { autoAlpha: 1, y: 0, duration: 0.5 },
      handoff + 0.2,
    );
    tl.to(writeLabel, { autoAlpha: 1, duration: 0.15 }, handoff);
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    resetToReadState();
    gsap.set(progressBar, { scaleX: 1 });
  });

  refreshOnContentResize(section.querySelector(".tech_wrap"));
}

function refreshOnContentResize(content) {
  if (!content || !("ResizeObserver" in window)) return;

  const children = [...content.children];
  const measure = () =>
    children.reduce((total, child) => total + child.offsetHeight, 0);

  let lastHeight = measure();
  let refreshTimer;

  const observer = new ResizeObserver(() => {
    const height = measure();
    if (Math.abs(height - lastHeight) < 1) return;
    lastHeight = height;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });

  children.forEach((child) => observer.observe(child));
}

function buildBackgroundOverlay(section, gradient) {
  if (getComputedStyle(section).position === "static") {
    section.style.position = "relative";
  }
  const directChild = section.firstElementChild;
  if (directChild) {
    directChild.style.position = "relative";
    directChild.style.zIndex = "1";
  }
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    background: gradient,
    opacity: "0",
    pointerEvents: "none",
    zIndex: "0",
  });
  section.appendChild(overlay);
  return overlay;
}

/* -- TEAM MODAL ANIMATION -- */
function initTeamModals() {
  const teamBlocks = document.querySelectorAll(".team_block");
  if (!teamBlocks.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let activeModal = null;
  let activeInnerCard = null;
  let lastFocusedElement = null;
  let savedScrollY = 0;

  teamBlocks.forEach((block, index) => {
    const openBtn = block.querySelector('[data-team-modal="open-button"]');
    const modal = block.querySelector('[data-team-modal="container"]');
    const closeBtn = modal?.querySelector('[data-team-modal="close-button"]');
    const innerCard = modal?.querySelector(".modal-inner-wrap");
    const nameEl = modal?.querySelector(".modal-name");

    if (!openBtn || !modal || !closeBtn || !innerCard) return;

    const modalId = `team-modal-${index}`;
    const titleId = `team-modal-title-${index}`;
    modal.id = modalId;
    if (nameEl) nameEl.id = titleId;

    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    if (nameEl) modal.setAttribute("aria-labelledby", titleId);

    const scrollableTexts = modal.querySelector(".modal-texts-wrap");
    if (scrollableTexts) {
      setupScrollMask(scrollableTexts);
    }

    openBtn.setAttribute("type", "button");
    openBtn.setAttribute("aria-haspopup", "dialog");
    openBtn.setAttribute("aria-controls", modalId);
    const memberName = nameEl?.textContent?.trim();
    if (memberName)
      openBtn.setAttribute("aria-label", `View profile for ${memberName}`);

    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute(
      "aria-label",
      memberName ? `Close profile for ${memberName}` : "Close profile",
    );

    gsap.set(modal, { autoAlpha: 0 });
    gsap.set(innerCard, { scale: 0.96, y: 16 });
    modal.classList.remove("hide");
    modal.inert = true;

    openBtn.addEventListener("click", () =>
      openModal(modal, innerCard, openBtn),
    );
    closeBtn.addEventListener("click", () => closeModal());

    modal.addEventListener("click", (event) => {
      if (!innerCard.contains(event.target)) closeModal();
    });
  });

  document.addEventListener("keydown", handleKeydown);

  function openModal(modal, innerCard, opener) {
    if (activeModal) return;
    activeModal = modal;
    activeInnerCard = innerCard;
    lastFocusedElement = opener;

    lockScroll();
    modal.inert = false;

    if (prefersReducedMotion) {
      gsap.set(modal, { autoAlpha: 1 });
      gsap.set(innerCard, { scale: 1, y: 0 });
      focusCloseButton(modal);
      return;
    }

    gsap.to(modal, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(innerCard, {
      scale: 1,
      y: 0,
      duration: 0.45,
      ease: "expo.out",
    });

    requestAnimationFrame(() => focusCloseButton(modal));
  }

  function closeModal() {
    if (!activeModal) return;
    const modal = activeModal;
    const innerCard = activeInnerCard;
    const opener = lastFocusedElement;
    activeModal = null;
    activeInnerCard = null;

    if (prefersReducedMotion) {
      gsap.set(modal, { autoAlpha: 0 });
      gsap.set(innerCard, { scale: 0.96, y: 16 });
      finishClose(modal, opener);
      return;
    }

    gsap.to(innerCard, {
      scale: 0.97,
      duration: 0.28,
      ease: "power2.in",
    });
    gsap.to(modal, {
      autoAlpha: 0,
      duration: 0.32,
      ease: "power2.in",
      delay: 0.04,
      onComplete: () => {
        gsap.set(innerCard, { scale: 0.96, y: 16 });
        finishClose(modal, opener);
      },
    });
  }

  function finishClose(modal, opener) {
    modal.inert = true;
    unlockScroll();
    if (opener) opener.focus({ preventScroll: true });
  }

  function focusCloseButton(modal) {
    const closeBtn = modal.querySelector('[data-team-modal="close-button"]');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (!activeModal) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      trapFocus(event, activeModal);
    }
  }

  function trapFocus(event, modal) {
    const focusable = getFocusableElements(modal);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !modal.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getFocusableElements(container) {
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    return Array.from(container.querySelectorAll(selector)).filter((el) => {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function lockScroll() {
    savedScrollY = window.scrollY;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
  }

  function unlockScroll() {
    document.body.style.paddingRight = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.overflow = "";
    window.scrollTo(0, savedScrollY);
  }
}

function setupScrollMask(scrollEl) {
  const FADE_THRESHOLD = 4;
  const mobileQuery = window.matchMedia("(max-width: 767px)");

  const update = () => {
    if (!mobileQuery.matches) {
      scrollEl.style.removeProperty("--mask-top");
      scrollEl.style.removeProperty("--mask-bottom");
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const distanceFromTop = scrollTop;
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;

    const topMask = Math.min(1, distanceFromTop / FADE_THRESHOLD);
    const bottomMask = Math.min(1, distanceFromBottom / FADE_THRESHOLD);

    scrollEl.style.setProperty("--mask-top", topMask.toFixed(3));
    scrollEl.style.setProperty("--mask-bottom", bottomMask.toFixed(3));
  };

  scrollEl.addEventListener("scroll", update, { passive: true });

  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(scrollEl);

  mobileQuery.addEventListener("change", update);

  update();
}

/* -- BANDWIDTH ORGAN SCENE -- */
const BANDWIDTH_IMAGE_URL =
  "https://cdn.prod.website-files.com/6a38f19091ef930a42ce265b/6a3e5b4fe033bb1b927a2e3e_Organs%20in%20Ring.webp";
const BANDWIDTH_NARROW_BREAKPOINT = 768;

const BANDWIDTH_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BANDWIDTH_FRAG = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform vec2 uCursor;
  uniform float uHoverState;
  uniform float uTime;

  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec2 containUv(vec2 uv, vec2 containerRes, vec2 imageRes) {
    float containerAspect = containerRes.x / containerRes.y;
    float imageAspect = imageRes.x / imageRes.y;
    vec2 centered = uv - 0.5;
    if (containerAspect > imageAspect) {
      centered.x *= containerAspect / imageAspect;
    } else {
      centered.y *= imageAspect / containerAspect;
    }
    return centered + 0.5;
  }

  vec3 srgbToLinear(vec3 color) {
    return mix(
      color / 12.92,
      pow((color + 0.055) / 1.055, vec3(2.4)),
      step(0.04045, color)
    );
  }

  void main() {
    vec2 imageUv = containUv(vUv, uResolution, uImageResolution);

    if (imageUv.x < 0.0 || imageUv.x > 1.0 || imageUv.y < 0.0 || imageUv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 aspectDomUv = vUv;
    vec2 aspectCursor = uCursor;
    float aspect = uResolution.x / uResolution.y;
    aspectDomUv.x *= aspect;
    aspectCursor.x *= aspect;

    float dist = distance(aspectDomUv, aspectCursor);
    float radius = 0.18;
    float falloff = 1.0 - smoothstep(0.0, radius, dist);
    falloff *= uHoverState;

    vec2 finalUv = imageUv;

    if (falloff > 0.0) {
      float gridSize = 250.0;
      vec2 cellUv = floor(imageUv * gridSize) / gridSize;

      float noiseScale = 25.0;
      float speed = 0.8;
      float n1 = snoise(cellUv * noiseScale + uTime * speed);
      float n2 = snoise(cellUv * noiseScale - uTime * speed + 100.0);
      vec2 displacement = vec2(n1, n2);

      float scatterStrength = 0.07;
      finalUv += displacement * falloff * scatterStrength;
    }

    vec4 color = texture2D(uTexture, finalUv);
    color.rgb = srgbToLinear(color.rgb);
    color.a *= 1.0 - (falloff * 0.3);

    gl_FragColor = color;
  }
`;

function initBandwidth() {
  const section = document.querySelector('[data-bandwidth="section"]');
  if (!section || typeof THREE === "undefined" || typeof gsap === "undefined") {
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const narrowMql = window.matchMedia(
    `(max-width: ${BANDWIDTH_NARROW_BREAKPOINT - 1}px)`,
  );
  const hasFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  let cachedImage = null;

  function teardown() {
    if (section._bandwidthDispose) {
      section._bandwidthDispose();
      section._bandwidthDispose = null;
    }
    section.querySelector('[data-bandwidth="static"]')?.remove();
    section.querySelector('[data-bandwidth="canvas"]')?.remove();
  }

  function render() {
    teardown();

    if (narrowMql.matches || prefersReducedMotion) {
      mountBandwidthStatic(section);
      return;
    }

    const proceed = (img) =>
      mountBandwidthScene(section, img, { interactive: hasFinePointer });

    if (cachedImage) {
      proceed(cachedImage);
      return;
    }

    loadBandwidthImage(BANDWIDTH_IMAGE_URL)
      .then((img) => {
        cachedImage = img;
        if (narrowMql.matches || prefersReducedMotion) {
          mountBandwidthStatic(section);
        } else {
          proceed(img);
        }
      })
      .catch(() => mountBandwidthStatic(section));
  }

  narrowMql.addEventListener("change", render);
  render();
}

function mountBandwidthStatic(section) {
  const img = document.createElement("img");
  img.src = BANDWIDTH_IMAGE_URL;
  img.alt = "";
  img.decoding = "async";
  img.loading = "lazy";
  img.className = "bandwidth_static";
  img.setAttribute("data-bandwidth", "static");
  Object.assign(img.style, {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  });
  section.prepend(img);
}

function loadBandwidthImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (typeof img.decode !== "function") {
        resolve(img);
        return;
      }
      img.decode().then(() => resolve(img), () => resolve(img));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function mountBandwidthScene(section, img, opts) {
  const canvas = document.createElement("canvas");
  canvas.className = "bandwidth_canvas";
  canvas.setAttribute("data-bandwidth", "canvas");
  Object.assign(canvas.style, {
    width: "100%",
    height: "100%",
    display: "block",
    position: "absolute",
    top: "0",
    left: "0",
    zIndex: "1",
  });
  section.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const texture = new THREE.Texture(img);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTexture: { value: texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImageResolution: {
      value: new THREE.Vector2(img.naturalWidth, img.naturalHeight),
    },
    uCursor: { value: new THREE.Vector2(0.5, 0.5) },
    uHoverState: { value: 0 },
    uTime: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: BANDWIDTH_VERT,
    fragmentShader: BANDWIDTH_FRAG,
    uniforms,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));

  const clock = new THREE.Clock();
  let rafId = null;

  function frame() {
    rafId = null;
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);

    if (uniforms.uHoverState.value > 0.0001) requestRender();
  }

  function requestRender() {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  function resize() {
    const rect = section.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    uniforms.uResolution.value.set(rect.width, rect.height);
    requestRender();
  }
  resize();

  const lastCursor = new THREE.Vector2(0.5, 0.5);
  const currentCursor = new THREE.Vector2();
  let moveTimeout = null;

  function toSectionUv(event, target) {
    const rect = section.getBoundingClientRect();
    return target.set(
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height,
    );
  }

  function fadeHover() {
    gsap.to(uniforms.uHoverState, {
      value: 0,
      duration: 1.5,
      ease: "power1.out",
      overwrite: "auto",
      onUpdate: requestRender,
    });
  }

  function onPointerMove(event) {
    toSectionUv(event, currentCursor);

    const distanceMoved = currentCursor.distanceTo(lastCursor);
    lastCursor.copy(currentCursor);

    const intensity = Math.min(Math.max(0.25, distanceMoved * 120), 1);

    gsap.to(uniforms.uCursor.value, {
      x: currentCursor.x,
      y: currentCursor.y,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: requestRender,
    });

    gsap.to(uniforms.uHoverState, {
      value: intensity,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: requestRender,
    });

    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(fadeHover, 60);
  }

  function onPointerEnter(event) {
    toSectionUv(event, lastCursor);
    uniforms.uCursor.value.copy(lastCursor);
  }

  function onPointerLeave() {
    clearTimeout(moveTimeout);
    fadeHover();
  }

  if (opts.interactive) {
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerenter", onPointerEnter);
    section.addEventListener("pointerleave", onPointerLeave);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(section);

  section._bandwidthDispose = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (opts.interactive) {
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerenter", onPointerEnter);
      section.removeEventListener("pointerleave", onPointerLeave);
    }
    clearTimeout(moveTimeout);
    gsap.killTweensOf([uniforms.uCursor.value, uniforms.uHoverState]);
    resizeObserver.disconnect();
    geometry.dispose();
    material.dispose();
    texture.dispose();
    renderer.dispose();
    canvas.remove();
  };
}

document.addEventListener("DOMContentLoaded", () => {
  initHeroSequence();
  initProcessAnimation();
  initTechSection();
  initTeamModals();
  initBandwidth();
});
