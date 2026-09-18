/* -- Hero Image Sequence -- */
function initHeroSequence() {
  const canvas = document.querySelector('[data-canvas-seq="hero"]');
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const config = {
    frames: 34,
    fps: 30,
    url: "https://cdn.jsdelivr.net/gh/uzoway/phase-site@main/Phase%20Header/phase-header",
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
const PROCESS_SCRUB_FPS = 30;

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

  const stepNodes = SHOW_STEP_INDICATORS
    ? buildStepNodes(progressWrap, total)
    : [];

  const scenes = videoMounts.map((mount) => {
    const rotation = parseInt(
      mount.getAttribute("data-video-rotation") || "0",
      10,
    );

    return createDualScene(
      mount,
      mount.getAttribute("data-video-src"),
      rotation,
    );
  });

  return Promise.all(scenes.map((scene) => scene.ready)).then(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      const isMobile = window.matchMedia("(max-width: 990px)").matches;

      positionStepNodes(stepNodes, isMobile, total);

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
      scenes[0].seek(0);
      scenes[0].render();

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

        const finalStageStart = (total - 1) / total;

        positionStepNodes(stepNodes, isMobile, total);

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
                center,
                start,
                end,
                progress: clamp((progress - start) / (end - start)),
              };
            }
          }

          return null;
        }

        function getStableStep(progress) {
          return Math.min(total - 1, Math.floor(clamp(progress) * total));
        }

        function getStableVideoProgress(step, progress) {
          const start = step === 0 ? 0 : step / total + transitionSide;

          const end =
            step === total - 1 ? 1 : (step + 1) / total - transitionSide;

          if (end <= start) return 0;

          return clamp((progress - start) / (end - start));
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
          const barProgress =
            finalStageStart > 0 ? clamp(progress / finalStageStart) : 1;

          gsap.set(progressBar, {
            [barAxis]: barProgress,
          });

          stepNodes.forEach((node, index) => {
            const nodePosition = total === 1 ? 0 : index / (total - 1);

            const completed = barProgress + 0.0001 >= nodePosition;

            gsap.set(node, {
              autoAlpha: completed ? 1 : 0.25,
              scale: completed ? 1 : 0.6,
            });
          });
        }

        function renderStableStep(step, progress) {
          const videoProgress = getStableVideoProgress(step, progress);

          hideVideoMounts();

          showVideoMount(step, 1, 2);

          showStableText(step);

          scenes[step].setVisualState(0, 0, step * 4 + videoProgress * 2);

          scenes[step].seek(videoProgress);

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

          scenes[from].seek(1);
          scenes[to].seek(0);

          scenes[from].setVisualState(eased, eased, flowTime);

          scenes[to].setVisualState(1 - eased, 1 - eased, flowTime);

          scenes[from].render();
          scenes[to].render();
        }

        function renderFinalCrossfade(transition) {
          const { from, to, progress: transitionProgress } = transition;

          const eased = smoothstep(transitionProgress);

          hideVideoMounts();

          showVideoMount(from, 1 - eased, 2);

          showVideoMount(to, eased, 1);

          showTransitionText(from, to, transitionProgress);

          scenes[from].seek(1);
          scenes[to].seek(0);

          scenes[from].setVisualState(0, 0, from * 4);

          scenes[to].setVisualState(0, 0, to * 4);

          scenes[from].render();
          scenes[to].render();
        }

        function updateProcessState(rawProgress) {
          const progress = clamp(rawProgress);

          updateProgress(progress);

          const transition = getTransition(progress);

          if (!transition) {
            const step = getStableStep(progress);

            renderStableStep(step, progress);

            return;
          }

          const isFinalTransition = transition.to === total - 1;

          if (isFinalTransition) {
            renderFinalCrossfade(transition);

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

        scenes.forEach((scene) => scene.refresh());

        updateProcessState(processTrigger.progress);

        return () => {
          processTrigger.kill();

          scenes.forEach((scene) => scene.destroy());

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

function createDualScene(mount, videoSrc, rotation) {
  const video = document.createElement("video");

  video.src = videoSrc;
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.loop = false;
  video.playsInline = true;
  video.autoplay = false;
  video.preload = "auto";

  video.setAttribute("playsinline", "");

  video.pause();
  video.load();

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setClearColor(0x000000, 0);

  mount.appendChild(renderer.domElement);

  Object.assign(renderer.domElement.style, {
    width: "100%",
    height: "100%",
    display: "block",
  });

  const texture = new THREE.VideoTexture(video);

  texture.minFilter = THREE.LinearFilter;

  texture.magFilter = THREE.LinearFilter;

  texture.format = THREE.RGBAFormat;

  texture.flipY = true;

  const uniforms = {
    uTexture: {
      value: texture,
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

    uContainerAspect: {
      value: 1,
    },

    uVideoAspect: {
      value: 1,
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

  const GRID_SIZE = 320;

  const particleGeometry = buildParticleGeometry(GRID_SIZE);

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

  particleMaterial.uniforms.uTexture = uniforms.uTexture;

  particleMaterial.uniforms.uTransition = uniforms.uTransition;

  particleMaterial.uniforms.uScatter = uniforms.uScatter;

  particleMaterial.uniforms.uTime = uniforms.uTime;

  particleMaterial.uniforms.uContainerAspect = uniforms.uContainerAspect;

  particleMaterial.uniforms.uVideoAspect = uniforms.uVideoAspect;

  particleMaterial.uniforms.uRotation = uniforms.uRotation;

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  scene.add(particles);

  const frameDuration = 1 / PROCESS_SCRUB_FPS;

  let desiredVideoProgress = 0;
  let requestedTime = null;
  let seekInFlight = false;
  let seekRafId = null;
  let videoFrameCallbackId = null;
  let destroyed = false;

  function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
  }

  function getSafeEnd() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return 0;
    }

    return Math.max(0, video.duration - frameDuration);
  }

  function getDesiredTime() {
    const safeEnd = getSafeEnd();

    if (!safeEnd) return 0;

    const rawTime = desiredVideoProgress * safeEnd;

    const quantizedTime = Math.round(rawTime / frameDuration) * frameDuration;

    return clamp(quantizedTime, 0, safeEnd);
  }

  function updateAspect() {
    const width = mount.clientWidth;

    const height = mount.clientHeight;

    if (!width || !height) {
      return;
    }

    uniforms.uContainerAspect.value = width / height;

    if (video.videoWidth && video.videoHeight) {
      const isRotated90 = rotation === 90 || rotation === 270;

      uniforms.uVideoAspect.value = isRotated90
        ? video.videoHeight / video.videoWidth
        : video.videoWidth / video.videoHeight;
    }
  }

  function render() {
    if (destroyed) return;

    renderer.render(scene, camera);
  }

  function renderDecodedFrame() {
    if (destroyed) return;

    if (typeof video.requestVideoFrameCallback === "function") {
      if (
        videoFrameCallbackId !== null &&
        typeof video.cancelVideoFrameCallback === "function"
      ) {
        video.cancelVideoFrameCallback(videoFrameCallbackId);
      }

      videoFrameCallbackId = video.requestVideoFrameCallback(() => {
        videoFrameCallbackId = null;

        texture.needsUpdate = true;

        render();
      });

      return;
    }

    texture.needsUpdate = true;
    render();
  }

  function scheduleSeek() {
    if (destroyed || seekRafId !== null) {
      return;
    }

    seekRafId = requestAnimationFrame(flushSeek);
  }

  function flushSeek() {
    seekRafId = null;

    if (destroyed) return;

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    if (seekInFlight || video.seeking) {
      return;
    }

    const targetTime = getDesiredTime();

    const currentTime = video.currentTime;

    if (Math.abs(targetTime - currentTime) < frameDuration * 0.5) {
      render();
      return;
    }

    seekInFlight = true;
    requestedTime = targetTime;

    try {
      video.currentTime = targetTime;
    } catch {
      seekInFlight = false;
      requestedTime = null;
      render();
    }
  }

  function handleSeeked() {
    if (destroyed) return;

    seekInFlight = false;

    renderDecodedFrame();

    const latestTarget = getDesiredTime();

    if (
      requestedTime === null ||
      Math.abs(latestTarget - requestedTime) >= frameDuration * 0.5
    ) {
      scheduleSeek();
    }
  }

  function seek(progress) {
    desiredVideoProgress = clamp(progress);

    scheduleSeek();
  }

  function setVisualState(transition, scatter, time) {
    uniforms.uTransition.value = clamp(transition);

    uniforms.uScatter.value = clamp(scatter);

    uniforms.uTime.value = time;
  }

  function resize() {
    const width = mount.clientWidth;

    if (!width) return;

    const height = width;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    mount.style.height = `${height}px`;

    renderer.setPixelRatio(pixelRatio);

    renderer.setSize(width, height, false);

    particleMaterial.uniforms.uPixelRatio.value = pixelRatio;

    updateAspect();
    render();
  }

  function handleMetadata() {
    updateAspect();

    desiredVideoProgress = 0;

    scheduleSeek();
    render();
  }

  video.addEventListener("loadedmetadata", handleMetadata);

  video.addEventListener("loadeddata", handleMetadata);

  video.addEventListener("seeked", handleSeeked);

  const resizeObserver = new ResizeObserver(resize);

  resizeObserver.observe(mount);

  resize();

  const ready = new Promise((resolve) => {
    const failsafe = setTimeout(resolve, 3000);

    if (video.readyState >= 2) {
      clearTimeout(failsafe);

      resolve();
      return;
    }

    video.addEventListener(
      "loadeddata",
      () => {
        clearTimeout(failsafe);

        resolve();
      },
      {
        once: true,
      },
    );
  });

  function destroy() {
    destroyed = true;

    if (seekRafId !== null) {
      cancelAnimationFrame(seekRafId);
    }

    if (
      videoFrameCallbackId !== null &&
      typeof video.cancelVideoFrameCallback === "function"
    ) {
      video.cancelVideoFrameCallback(videoFrameCallbackId);
    }

    resizeObserver.disconnect();

    video.removeEventListener("loadedmetadata", handleMetadata);

    video.removeEventListener("loadeddata", handleMetadata);

    video.removeEventListener("seeked", handleSeeked);

    video.pause();

    videoMaterial.dispose();
    particleMaterial.dispose();

    videoGeometry.dispose();
    particleGeometry.dispose();

    texture.dispose();
    renderer.dispose();
  }

  return {
    ready,
    seek,
    render,
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

const VIDEO_VERT = `
  varying vec2 vUv;

  uniform float uContainerAspect;
  uniform float uVideoAspect;
  uniform float uRotation;

  vec2 rotate2D(vec2 value, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * value;
  }

  void main() {
    vec2 sampleUv = uv - 0.5;

    if (uContainerAspect > uVideoAspect) {
      sampleUv.y *= uVideoAspect / uContainerAspect;
    } else {
      sampleUv.x *= uContainerAspect / uVideoAspect;
    }

    sampleUv = rotate2D(sampleUv, uRotation);
    sampleUv += 0.5;

    vUv = sampleUv;

    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const VIDEO_FRAG = `
  uniform sampler2D uTexture;
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

    vec4 color = texture2D(uTexture, vUv);

    float alpha =
      color.a *
      (1.0 - uTransition);

    gl_FragColor =
      vec4(
        color.rgb,
        alpha
      );
  }
`;

const PARTICLE_VERT = `
  attribute vec2 aUv;
  attribute vec3 aRandom;

  uniform float uTransition;
  uniform float uScatter;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uContainerAspect;
  uniform float uVideoAspect;
  uniform float uRotation;

  varying vec2 vUv;
  varying float vAlpha;

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
    vec3 pos = position;

    vec2 sampleUv =
      aUv - 0.5;

    if (
      uContainerAspect >
      uVideoAspect
    ) {
      sampleUv.y *=
        uVideoAspect /
        uContainerAspect;
    } else {
      sampleUv.x *=
        uContainerAspect /
        uVideoAspect;
    }

    sampleUv =
      rotate2D(
        sampleUv,
        uRotation
      );

    sampleUv += 0.5;

    vUv = sampleUv;

    vec2 physicalPos =
      pos.xy *
      vec2(
        uContainerAspect,
        1.0
      );

    float scatterAmount =
      uScatter *
      (
        0.4 +
        aRandom.x * 1.6
      );

    vec2 flow =
      flowField(
        physicalPos * 1.5 +
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
      vec2(
        uContainerAspect,
        1.0
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
  uniform sampler2D uTexture;
  uniform float uTransition;

  varying vec2 vUv;
  varying float vAlpha;

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
      texture2D(
        uTexture,
        vUv
      );

    gl_FragColor =
      vec4(
        color.rgb,

        color.a *
        vAlpha *
        pointAlpha *
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

function positionStepNodes(nodes, isMobile, total) {
  nodes.forEach((node, index) => {
    const percentage = total === 1 ? 0 : (index / (total - 1)) * 100;

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
