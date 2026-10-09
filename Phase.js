/* -- Hero Image Sequence -- */
function initHeroSequence() {
  const canvas = document.querySelector('[data-canvas-seq="hero"]');
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const config = {
    frames: 53,
    fps: 24,
    url: "https://cdn.jsdelivr.net/gh/uzoway/phase-site@bb0de94a03b1ae118a23995ecd50ae45e44aaf4a/Phase%20Header/phase-header",
    ext: ".webp",
  };

  const images = [];
  let loaded = 0;
  let frame = 0;
  let lastTime = 0;
  const interval = 1000 / config.fps;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    draw(images[frame]);
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
  }

  function loop(time) {
    requestAnimationFrame(loop);
    const delta = time - lastTime;
    if (delta > interval) {
      frame = (frame + 1) % config.frames;
      draw(images[frame]);
      lastTime = time - (delta % interval);
    }
  }

  for (let i = 0; i < config.frames; i++) {
    const img = new Image();
    img.src = `${config.url}${i.toString().padStart(2, "0")}${config.ext}`;
    img.onload = function () {
      loaded++;

      // Show the first frame as soon as it arrives and hold it until the
      // whole sequence has loaded, so the hero is never blank.
      if (i === 0) {
        resize();
        window.addEventListener("resize", resize);
      }

      if (loaded === config.frames) {
        resize();
        requestAnimationFrame(loop);
      }
    };
    images.push(img);
  }
}

/* -- PROCESS VIDEO STEP ANIMATION -- */
const SHOW_STEP_INDICATORS = true;
const PROCESS_SECTION_SCROLL = 50;
const PROCESS_VIDEO_FIT = 0.9;
const PROCESS_VIDEO_MAX_WIDTH = 1.15;
const PROCESS_INTRO_FADE = 0.4;
const PROCESS_FALLBACK_FPS = 24;
const PROCESS_MOBILE_SOURCES_QUERY = "(max-width: 767px)";

// Timed handoff between sections: the outgoing video shrinks and fades, then
// the incoming one settles in from a larger, blurred state.
const PROCESS_OUT_DURATION = 0.55;
const PROCESS_OUT_SCALE = 0.75;
const PROCESS_IN_DURATION = 0.9;
const PROCESS_IN_DELAY = 0.4;
const PROCESS_IN_SCALE = 1.5;
const PROCESS_IN_BLUR_RATIO = 0.03;

function initProcessAnimation() {
  const section = document.querySelector('[data-process="section"]');
  if (!section) return Promise.resolve();

  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined" ||
    typeof THREE === "undefined"
  ) {
    return Promise.resolve();
  }

  if (section.dataset.processInitialized === "true") {
    return Promise.resolve();
  }

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
    return Promise.resolve();
  }

  section.dataset.processInitialized = "true";

  const total = texts.length;

  // One dot at the start of every section plus one closing dot, so each
  // section spans dot N -> dot N+1 and transitions fire on dots 2..N.
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

  return Promise.all(scenes.map((scene) => scene.ready)).then(() => {
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
          willChange: "transform, opacity, filter",
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
          const blur = mountBlur[index].value;

          videoMounts[index].style.filter =
            blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
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

        // Plays every scene that is on screen or settling in, pauses the
        // rest. Scenes entered while scrolling down replay their intro clip.
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

          // Wait for the outgoing video to mostly clear before the next one
          // arrives, unless we are reversing back into a half-visible one.
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
              duration: PROCESS_OUT_DURATION,
              ease: "power2.in",
            });
          });

          const incomingText = texts[step];

          gsap.killTweensOf(incomingText);

          if (!isShown(incomingText)) {
            gsap.set(incomingText, { autoAlpha: 0, y: 12 });
          }

          gsap.to(incomingText, {
            autoAlpha: 1,
            y: 0,
            duration: PROCESS_IN_DURATION * 0.8,
            delay,
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

        // Videos only play while the section is on screen. Playback starts
        // once the section is halfway into the viewport.
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

          videoMounts.forEach((mount) => {
            mount.style.filter = "";
          });

          gsap.set(texts, {
            clearProps: "opacity,visibility,transform,willChange",
          });

          gsap.set(videoMounts, {
            clearProps: "opacity,visibility,transform,zIndex,willChange",
          });
        };
      },
    );
  });
}

// Hidden <video> that feeds a WebGL texture. Autoplays muted; if the browser
// blocks playback (e.g. iOS Low Power Mode) it falls back to stepping through
// the video by seeking on a clock, which those browsers still allow.
function createProcessClip(src, loop) {
  const video = document.createElement("video");

  video.src = src;
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.loop = loop;
  video.playsInline = true;
  video.autoplay = false;
  video.preload = "auto";

  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  video.load();

  const frameDuration = 1 / PROCESS_FALLBACK_FPS;

  const clip = {
    video,
    onEnded: null,
    play,
    pause,
    restart,
    tick,
    destroy,
  };

  let manual = false;
  let playing = false;
  let manualTime = 0;
  let seekInFlight = false;

  function getDuration() {
    return Number.isFinite(video.duration) ? video.duration : 0;
  }

  function play() {
    playing = true;

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
  }

  function handleEnded() {
    if (!manual) clip.onEnded?.();
  }

  video.addEventListener("seeked", handleSeeked);
  video.addEventListener("ended", handleEnded);

  function destroy() {
    playing = false;

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
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setClearColor(0x000000, 0);

  // The canvas sits out of flow so its pixel size never feeds back into the
  // mount's layout; the mount is sized by Webflow.
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
    const texture = new THREE.VideoTexture(video);

    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.flipY = true;

    return texture;
  }

  const loopTexture = createTexture(loopClip.video);
  const introTexture = introClip ? createTexture(introClip.video) : loopTexture;

  const textures = introClip ? [introTexture, loopTexture] : [loopTexture];

  const background = new THREE.Color(backgroundColor || "#040510");

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
  let lastFrameTimes = clips.map(() => -1);

  function getVideoAspect() {
    const { videoWidth, videoHeight } = loopClip.video;

    if (!videoWidth || !videoHeight) return 1;

    const isRotated90 = rotation === 90 || rotation === 270;

    return isRotated90 ? videoHeight / videoWidth : videoWidth / videoHeight;
  }

  // Sizes the video to PROCESS_VIDEO_FIT of the canvas height. The clips have
  // wide empty margins, so the video may overflow the canvas width by up to
  // PROCESS_VIDEO_MAX_WIDTH before it starts shrinking.
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

    needsRender = true;
  }

  function render() {
    if (destroyed) return;

    textures.forEach((texture) => {
      if (texture.image.readyState >= 2) texture.needsUpdate = true;
    });

    renderer.render(scene, camera);

    needsRender = false;
    lastFrameTimes = clips.map((clip) => clip.video.currentTime);
  }

  function hasNewFrame() {
    return clips.some(
      (clip, index) => clip.video.currentTime !== lastFrameTimes[index],
    );
  }

  function tick(delta) {
    if (destroyed) return;

    clips.forEach((clip) => clip.tick(delta));

    if (needsRender || hasNewFrame()) render();
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

  function handleLoadedData() {
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

  function whenLoaded(video) {
    return new Promise((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }

      video.addEventListener("loadeddata", resolve, { once: true });
    });
  }

  const ready = new Promise((resolve) => {
    const failsafe = setTimeout(resolve, 3000);

    Promise.all(clips.map((clip) => whenLoaded(clip.video))).then(() => {
      clearTimeout(failsafe);

      resolve();
    });
  });

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
    ready,
    render,
    tick,
    activate,
    deactivate,
    showStill,
    refresh: resize,
    destroy,
  };
}

// Blends the intro clip into the loop clip and fades pixels that match the section background, so the video frame has
// no visible edge against the page.
const PROCESS_SAMPLE_CHUNK = `
  uniform sampler2D uTexture;
  uniform sampler2D uIntroTexture;
  uniform float uIntroMix;
  uniform vec3 uBackground;

  vec4 sampleProcessVideo(vec2 uv) {
    vec3 loopColor = texture2D(uTexture, uv).rgb;
    vec3 introColor = texture2D(uIntroTexture, uv).rgb;

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

  varying vec2 vUv;

  void main() {
    if (
      vUv.x < 0.0 ||
      vUv.x > 1.0 ||
      vUv.y < 0.0 ||
      vUv.y > 1.0
    ) {
      discard;
    }

    gl_FragColor = sampleProcessVideo(vUv);
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

  const ACTIVE_COLOR = "#030611";
  const INACTIVE_COLOR = "#6E97A2";
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

    gsap.set(readLabel, { color: ACTIVE_COLOR });
    gsap.set(writeLabel, { color: INACTIVE_COLOR });
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

    tl.to(progressBar, { scaleX: 1, duration: totalDuration }, 0);

    tl.to(readDescription, { autoAlpha: 0, y: -12, duration: 0.4 }, handoff);

    // Fade out specific Read visuals
    tl.to(readVisuals, { autoAlpha: 0, duration: 0.6 }, handoff);
    tl.to(readLabel, { color: INACTIVE_COLOR, duration: 0.4 }, handoff);

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
    tl.to(writeLabel, { color: ACTIVE_COLOR, duration: 0.4 }, handoff + 0.2);
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

    tl.to(progressBar, { scaleX: 1, duration: totalDuration }, 0);

    tl.to(readDescription, { autoAlpha: 0, y: -12, duration: 0.4 }, handoff);
    tl.to(readVisuals, { autoAlpha: 0, duration: 0.6 }, handoff);
    tl.to(readLabel, { color: INACTIVE_COLOR, duration: 0.4 }, handoff);

    if (bgOverlay) {
      tl.to(bgOverlay, { autoAlpha: 1, duration: 0.9 }, handoff - 0.1);
    }

    tl.to(writeVisuals, { autoAlpha: 1, duration: 0.65 }, handoff + 0.15);
    tl.to(
      writeDescription,
      { autoAlpha: 1, y: 0, duration: 0.5 },
      handoff + 0.2,
    );
    tl.to(writeLabel, { color: ACTIVE_COLOR, duration: 0.4 }, handoff + 0.2);
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    resetToReadState();
    gsap.set(progressBar, { scaleX: 0.5 });
  });
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

document.addEventListener("DOMContentLoaded", () => {
  initHeroSequence();
  initProcessAnimation().then(() => {
    initTechSection();
    ScrollTrigger.refresh();
  });
  initTeamModals();
});

let scrollResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(scrollResizeTimer);
  scrollResizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 350);
});
