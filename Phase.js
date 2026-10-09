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
      if (loaded === config.frames) {
        resize();
        window.addEventListener("resize", resize);
        requestAnimationFrame(loop);
      }
    };
    images.push(img);
  }
}

/* -- PROCESS VIDEO STEP ANIMATION -- */
const SHOW_STEP_INDICATORS = true;
const PROCESS_TRANSITION_SIDE_RATIO = 0.1;
const PROCESS_VIDEO_FIT = 0.9;
const PROCESS_VIDEO_MAX_WIDTH = 1.15;
const PROCESS_INTRO_FADE = 0.4;
const PROCESS_FALLBACK_FPS = 24;
const PROCESS_PARTICLE_GRID = 320;
const PROCESS_MOBILE_SOURCES_QUERY = "(max-width: 767px)";

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
  // section spans dot N -> dot N+1 and transitions land on dots 2..N.
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

      scenes[0].setVisualState(0, 0, 0);
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

        const stepSlot = 1 / total;
        const transitionSide = stepSlot * PROCESS_TRANSITION_SIDE_RATIO;

        let activeScenes = new Set();
        let sectionVisible = false;
        let scrollDirection = 1;
        let lastProgress = 0;

        positionStepNodes(stepNodes, isMobile);

        gsap.set(texts, {
          autoAlpha: 0,
          y: 15,
          willChange: "transform, opacity",
        });

        gsap.set(videoMounts, {
          autoAlpha: 0,
          zIndex: 0,
          willChange: "opacity",
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

        function smoothstep(value) {
          const t = clamp(value);
          return t * t * (3 - 2 * t);
        }

        function getTransition(progress) {
          for (let to = 1; to < total; to++) {
            const center = to / total;
            const start = center - transitionSide;
            const end = center + transitionSide;

            if (progress >= start && progress <= end) {
              return {
                from: to - 1,
                to,
                progress: clamp((progress - start) / (end - start)),
              };
            }
          }

          return null;
        }

        function getStableStep(progress) {
          return Math.min(total - 1, Math.floor(clamp(progress) * total));
        }

        // Plays the scenes that are on screen and pauses the rest. Scenes
        // entered while scrolling down replay their intro clip.
        function setActiveScenes(indices) {
          const next = new Set(sectionVisible ? indices : []);

          activeScenes.forEach((index) => {
            if (!next.has(index)) scenes[index].deactivate();
          });

          next.forEach((index) => {
            if (!activeScenes.has(index)) {
              scenes[index].activate(scrollDirection);
            }
          });

          activeScenes = next;
        }

        function tickActiveScenes(time, deltaTime) {
          const delta = Math.min(deltaTime / 1000, 0.1);

          activeScenes.forEach((index) => scenes[index].tick(delta));
        }

        function hideTexts() {
          gsap.set(texts, {
            autoAlpha: 0,
            y: 15,
          });
        }

        function showStableText(step) {
          hideTexts();

          gsap.set(texts[step], {
            autoAlpha: 1,
            y: 0,
          });
        }

        function showTransitionText(from, to, transitionProgress) {
          const eased = smoothstep(transitionProgress);

          hideTexts();

          gsap.set(texts[from], {
            autoAlpha: 1 - eased,
            y: -12 * eased,
          });

          gsap.set(texts[to], {
            autoAlpha: eased,
            y: 12 * (1 - eased),
          });
        }

        function hideVideoMounts() {
          gsap.set(videoMounts, {
            autoAlpha: 0,
            zIndex: 0,
          });
        }

        function showVideoMount(index, opacity = 1, zIndex = 1) {
          gsap.set(videoMounts[index], {
            autoAlpha: opacity,
            zIndex,
          });
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

        function renderStableStep(step) {
          hideVideoMounts();

          showVideoMount(step, 1, 2);

          showStableText(step);

          setActiveScenes([step]);

          scenes[step].setVisualState(0, 0, step * 4);

          scenes[step].render();
        }

        function renderParticleTransition(transition) {
          const { from, to, progress: transitionProgress } = transition;

          const eased = smoothstep(transitionProgress);

          const flowTime = from * 4 + eased * 3;

          hideVideoMounts();

          showVideoMount(from, 1, 2);

          showVideoMount(to, 1, 1);

          showTransitionText(from, to, transitionProgress);

          setActiveScenes([from, to]);

          scenes[from].setVisualState(eased, eased, flowTime);

          scenes[to].setVisualState(1 - eased, 1 - eased, flowTime);

          scenes[from].render();
          scenes[to].render();
        }

        function updateProcessState(rawProgress) {
          const progress = clamp(rawProgress);

          if (progress !== lastProgress) {
            scrollDirection = progress > lastProgress ? 1 : -1;
            lastProgress = progress;
          }

          updateProgress(progress);

          const transition = getTransition(progress);

          if (!transition) {
            renderStableStep(getStableStep(progress));

            return;
          }

          renderParticleTransition(transition);
        }

        const processTrigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${total * 100}%`,
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

            updateProcessState(self.progress);
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
            scrollDirection = self.direction;

            updateProcessState(processTrigger.progress);
          },
        });

        gsap.ticker.add(tickActiveScenes);

        scenes.forEach((scene) => scene.refresh());

        sectionVisible = visibilityTrigger.isActive;
        lastProgress = processTrigger.progress;

        updateProcessState(processTrigger.progress);

        return () => {
          gsap.ticker.remove(tickActiveScenes);

          sectionVisible = false;
          setActiveScenes([]);

          processTrigger.kill();
          visibilityTrigger.kill();

          gsap.set(texts, {
            clearProps: "opacity,visibility,transform,willChange",
          });

          gsap.set(videoMounts, {
            clearProps: "opacity,visibility,zIndex,willChange",
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

    uTransition: {
      value: 0,
    },

    uScatter: {
      value: 0,
    },

    uTime: {
      value: 0,
    },

    uCanvasAspect: {
      value: 1,
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

  const particleGeometry = buildParticleGeometry(PROCESS_PARTICLE_GRID);

  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,

      uPixelRatio: {
        value: Math.min(window.devicePixelRatio, 2),
      },

      uSize: {
        value: 2.5,
      },
    },

    vertexShader: PARTICLE_VERT,

    fragmentShader: PARTICLE_FRAG,

    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  scene.add(particles);

  let destroyed = false;
  let active = false;
  let phase = introClip ? "idle" : "loop";
  let introFade = null;
  let needsRender = true;
  let lastFrameTimes = clips.map(() => -1);

  function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
  }

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

    uniforms.uCanvasAspect.value = width / height;

    uniforms.uVideoScale.value.set(videoWidth / width, videoHeight / height);

    particleMaterial.uniforms.uSize.value = Math.max(
      1.5,
      (videoHeight / PROCESS_PARTICLE_GRID) * 2,
    );

    needsRender = true;
  }

  function render() {
    if (destroyed) return;

    textures.forEach((texture) => {
      if (texture.image.readyState >= 2) texture.needsUpdate = true;
    });

    const showParticles = uniforms.uTransition.value > 0.001;

    particles.visible = showParticles;
    videoMesh.visible = uniforms.uTransition.value < 0.999;

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

  function setVisualState(transition, scatter, time) {
    uniforms.uTransition.value = clamp(transition);

    uniforms.uScatter.value = clamp(scatter);

    uniforms.uTime.value = time;

    needsRender = true;
  }

  function resize() {
    const width = mount.clientWidth;
    const height = mount.clientHeight || width;

    if (!width || !height) return;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    renderer.setPixelRatio(pixelRatio);

    renderer.setSize(width, height, false);

    particleMaterial.uniforms.uPixelRatio.value = pixelRatio;

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
    particleMaterial.dispose();

    videoGeometry.dispose();
    particleGeometry.dispose();

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
    setVisualState,
    destroy,
  };
}

function buildParticleGeometry(gridSize) {
  const count = gridSize * gridSize;

  const positions = new Float32Array(count * 3);

  const uvs = new Float32Array(count * 2);

  const randoms = new Float32Array(count * 3);

  let index = 0;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      positions[index * 3] = (x / (gridSize - 1)) * 2 - 1;

      positions[index * 3 + 1] = (y / (gridSize - 1)) * 2 - 1;

      positions[index * 3 + 2] = 0;

      uvs[index * 2] = x / (gridSize - 1);

      uvs[index * 2 + 1] = y / (gridSize - 1);

      randoms[index * 3] = Math.random();

      randoms[index * 3 + 1] = Math.random();

      randoms[index * 3 + 2] = Math.random();

      index++;
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));

  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));

  return geometry;
}

// Shared by both fragment shaders: blends the intro clip into the loop clip
// and fades pixels that match the section background, so the video frame has
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

  uniform float uTransition;

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

    vec4 color = sampleProcessVideo(vUv);

    gl_FragColor =
      vec4(
        color.rgb,
        color.a *
        (1.0 - uTransition)
      );
  }
`;

const PARTICLE_VERT = `
  attribute vec2 aUv;
  attribute vec3 aRandom;

  uniform float uScatter;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uCanvasAspect;
  uniform vec2 uVideoScale;
  uniform float uRotation;

  varying vec2 vUv;
  varying float vAlpha;
  varying float vEdge;

  vec2 rotate2D(vec2 value, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * value;
  }

  vec2 flowField(vec2 point, float time) {
    float n1 =
      sin(point.x * 3.0 + time * 0.5) *
      cos(point.y * 2.5 + time * 0.4);

    float n2 =
      cos(point.x * 2.0 - time * 0.3) *
      sin(point.y * 3.5 - time * 0.6);

    return vec2(n1, n2);
  }

  void main() {
    vUv =
      rotate2D(
        aUv - 0.5,
        uRotation
      ) +
      0.5;

    vec3 pos = vec3(position.xy * uVideoScale, 0.0);

    vec2 aspect =
      vec2(
        uCanvasAspect,
        1.0
      );

    vec2 physicalPos =
      position.xy *
      uVideoScale *
      aspect;

    // Scatter distances are relative to the video size, so the effect
    // reads the same however large the video is drawn.
    float scatterAmount =
      uScatter *
      uVideoScale.y *
      (
        0.4 +
        aRandom.x * 1.6
      );

    vec2 flow =
      flowField(
        position.xy * 1.5 +
        aRandom.xy,

        uTime +
        aRandom.z *
        6.28
      );

    vec2 displacement =
      flow *
      scatterAmount *
      0.5;

    vec2 radial =
      normalize(
        physicalPos +
        vec2(0.0001)
      ) *
      scatterAmount *
      0.2;

    displacement += radial;

    pos.xy +=
      displacement /
      aspect;

    // Scattered particles thin out towards the canvas edge so the cloud
    // stays round instead of showing the canvas rectangle.
    vEdge =
      1.0 -
      smoothstep(
        0.7,
        1.0,
        length(pos.xy)
      );

    vAlpha =
      1.0 -
      smoothstep(
        0.3,
        0.95 +
        aRandom.x *
        0.05,
        uScatter
      );

    gl_Position =
      vec4(
        pos,
        1.0
      );

    gl_PointSize =
      uSize *
      uPixelRatio *
      (
        1.0 +
        aRandom.z *
        0.4
      );
  }
`;

const PARTICLE_FRAG = `
  ${PROCESS_SAMPLE_CHUNK}

  uniform float uTransition;

  varying vec2 vUv;
  varying float vAlpha;
  varying float vEdge;

  void main() {
    vec2 center =
      gl_PointCoord -
      0.5;

    float distanceFromCenter =
      length(center);

    if (
      distanceFromCenter >
      0.5
    ) {
      discard;
    }

    if (
      vUv.x < 0.0 ||
      vUv.x > 1.0 ||
      vUv.y < 0.0 ||
      vUv.y > 1.0
    ) {
      discard;
    }

    float pointAlpha =
      smoothstep(
        0.5,
        0.4,
        distanceFromCenter
      );

    vec4 color =
      sampleProcessVideo(vUv);

    gl_FragColor =
      vec4(
        color.rgb,

        color.a *
        vAlpha *
        pointAlpha *
        vEdge *
        uTransition
      );
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
