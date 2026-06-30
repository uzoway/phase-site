// const SHOW_STEP_INDICATORS = true;

// function initProcessAnimation() {
//   const section = document.querySelector('[data-process="section"]');
//   if (!section) return Promise.resolve();

//   const texts = gsap.utils.toArray('[data-process$="-text"]');
//   const lotties = gsap.utils.toArray('[data-process$="-lottie"]');
//   const progressBar = document.querySelector('[data-process="progress-bar"]');
//   const progressWrap = document.querySelector(".process_progress-bar-wrap");

//   if (!texts.length || !lotties.length || texts.length !== lotties.length) {
//     return Promise.resolve();
//   }

//   const total = texts.length;
//   const spansPerText = texts.map((t) =>
//     t.querySelectorAll(".process_description-span"),
//   );

//   gsap.set([texts, lotties], { willChange: "transform, opacity" });

//   const stepNodes = SHOW_STEP_INDICATORS
//     ? buildStepNodes(progressWrap, total)
//     : [];

//   const lottieData = [];
//   const loadPromises = lotties.map(
//     (el) =>
//       new Promise((resolve) => {
//         const anim = lottie.loadAnimation({
//           container: el,
//           renderer: "canvas",
//           loop: false,
//           autoplay: false,
//           path: el.getAttribute("data-src"),
//         });
//         anim.addEventListener("DOMLoaded", () => resolve(anim));
//         lottieData.push({ instance: anim, frame: 0 });
//       }),
//   );

//   return Promise.all(loadPromises).then(() => {
//     const mm = gsap.matchMedia();

//     mm.add(
//       {
//         isDesktop: "(min-width: 991px)",
//         isMobile: "(max-width: 990px)",
//       },
//       (context) => {
//         const { isMobile } = context.conditions;
//         const stepDuration = 2;
//         const totalDuration = (total - 1) * stepDuration;
//         const barAxis = isMobile ? "scaleX" : "scaleY";
//         const barOrigin = isMobile ? "left center" : "top center";

//         // Fresh initial state on every breakpoint change.
//         // Matchmedia reverts these when the context unmounts.
//         gsap.set(texts, { autoAlpha: 1, y: 0 });
//         gsap.set(texts.slice(1), { autoAlpha: 0, y: 20 });
//         spansPerText[0] && gsap.set(spansPerText[0], { autoAlpha: 1 });
//         spansPerText
//           .slice(1)
//           .forEach((spans) => gsap.set(spans, { autoAlpha: 0 }));
//         gsap.set(lotties, { autoAlpha: 0, scale: 1.12 });
//         gsap.set(lotties[0], { autoAlpha: 1, scale: 1 });

//         gsap.set(progressBar, {
//           scaleX: isMobile ? 0 : 1,
//           scaleY: isMobile ? 1 : 0,
//           transformOrigin: barOrigin,
//         });

//         positionStepNodes(stepNodes, isMobile, total);
//         gsap.set(stepNodes, { autoAlpha: 0.25, scale: 0.6 });

//         // Reset all lottie frames to 0 so they re-scrub from the start
//         lottieData.forEach((d) => {
//           d.frame = 0;
//           d.instance.goToAndStop(0, true);
//         });

//         const tl = gsap.timeline({
//           defaults: { ease: "none" },
//           scrollTrigger: {
//             trigger: section,
//             start: "top top",
//             end: () => `+=${total * 100}%`,
//             pin: true,
//             scrub: 0.7,
//             invalidateOnRefresh: true,
//             refreshPriority: 1,
//           },
//         });

//         tl.to(progressBar, { [barAxis]: 1, duration: totalDuration }, 0);

//         stepNodes.forEach((node, i) => {
//           tl.to(
//             node,
//             { autoAlpha: 1, scale: 1, duration: 0.35 },
//             i * stepDuration,
//           );
//         });

//         texts.forEach((text, i) => {
//           const startTime = i * stepDuration;
//           const anim = lottieData[i].instance;

//           tl.to(
//             lottieData[i],
//             {
//               frame: anim.totalFrames - 1,
//               duration: stepDuration * 0.65,
//               onUpdate: () => anim.goToAndStop(lottieData[i].frame, true),
//             },
//             startTime,
//           );

//           if (i < total - 1) {
//             const handoff = (i + 1) * stepDuration - 0.5;
//             const currentSpans = spansPerText[i];
//             const nextText = texts[i + 1];
//             const nextSpans = spansPerText[i + 1];

//             tl.to(
//               currentSpans,
//               { autoAlpha: 0, duration: 0.3, stagger: 0.04 },
//               handoff,
//             );
//             tl.to(text, { y: -12, duration: 0.45 }, handoff);
//             tl.to(
//               lotties[i],
//               { autoAlpha: 0, scale: 0.88, duration: 0.6 },
//               handoff,
//             );
//             tl.to(
//               lotties[i + 1],
//               { autoAlpha: 1, scale: 1, duration: 0.65 },
//               handoff + 0.15,
//             );
//             tl.to(
//               nextText,
//               { autoAlpha: 1, y: 0, duration: 0.55 },
//               handoff + 0.2,
//             );
//             tl.to(
//               nextSpans,
//               { autoAlpha: 1, duration: 0.5, stagger: 0.18 },
//               handoff + 0.25,
//             );
//           }
//         });
//       },
//     );

//     mm.add("(prefers-reduced-motion: reduce)", () => {
//       gsap.set(texts, { autoAlpha: 0, y: 0 });
//       gsap.set(texts[0], { autoAlpha: 1 });
//       spansPerText.forEach((spans, i) =>
//         gsap.set(spans, { autoAlpha: i === 0 ? 1 : 0 }),
//       );
//       gsap.set(lotties, { autoAlpha: 0, scale: 1 });
//       gsap.set(lotties[0], { autoAlpha: 1 });
//     });
//   });
// }

// function buildStepNodes(wrap, count) {
//   if (!wrap) return [];
//   if (getComputedStyle(wrap).position === "static")
//     wrap.style.position = "relative";

//   const nodes = [];
//   for (let i = 0; i < count; i++) {
//     const node = document.createElement("div");
//     node.setAttribute("data-process", "progress-node");
//     Object.assign(node.style, {
//       position: "absolute",
//       width: "8px",
//       height: "8px",
//       borderRadius: "50%",
//       background: "currentColor",
//       transform: "translate(-50%, -50%)",
//       pointerEvents: "none",
//     });
//     wrap.appendChild(node);
//     nodes.push(node);
//   }
//   return nodes;
// }

// function positionStepNodes(nodes, isMobile, total) {
//   nodes.forEach((node, i) => {
//     const pct = total === 1 ? 0 : (i / (total - 1)) * 100;
//     node.style.top = isMobile ? "50%" : `${pct}%`;
//     node.style.left = isMobile ? `${pct}%` : "50%";
//   });
// }

/* -- PROCESS LOTTIE STEP ANIMATION -- */
const SHOW_STEP_INDICATORS = true;

function initProcessAnimation() {
  const section = document.querySelector('[data-process="section"]');
  if (!section) return Promise.resolve();

  const texts = gsap.utils.toArray('[data-process$="-text"]');
  const videoMounts = gsap.utils.toArray('[data-process$="-video"]');
  const progressBar = document.querySelector('[data-process="progress-bar"]');
  const progressWrap = document.querySelector(".process_progress-bar-wrap");

  if (
    !texts.length ||
    !videoMounts.length ||
    texts.length !== videoMounts.length
  ) {
    return Promise.resolve();
  }

  const total = texts.length;
  const spansPerText = texts.map((t) =>
    t.querySelectorAll(".process_description-span"),
  );

  gsap.set([texts, videoMounts], { willChange: "transform, opacity" });

  const stepNodes = SHOW_STEP_INDICATORS
    ? buildStepNodes(progressWrap, total)
    : [];

  // Build one ParticleScene per step. Each owns its video,
  // canvas, renderer, mesh, shader uniforms, and RAF loop.
  const scenes = videoMounts.map((mount) =>
    createParticleScene(mount, mount.getAttribute("data-video-src")),
  );

  // Wait for all videos to be ready enough to render
  // (readyState >= 2 = HAVE_CURRENT_DATA, first frame available).
  const ready = Promise.all(scenes.map((s) => s.ready));

  return ready.then(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 991px)",
        isMobile: "(max-width: 990px)",
      },
      (context) => {
        const { isMobile } = context.conditions;
        const stepDuration = 2;
        const totalDuration = (total - 1) * stepDuration;
        const barAxis = isMobile ? "scaleX" : "scaleY";
        const barOrigin = isMobile ? "left center" : "top center";

        // Fresh initial state on every breakpoint change.
        gsap.set(texts, { autoAlpha: 1, y: 0 });
        gsap.set(texts.slice(1), { autoAlpha: 0, y: 20 });
        spansPerText[0] && gsap.set(spansPerText[0], { autoAlpha: 1 });
        spansPerText
          .slice(1)
          .forEach((spans) => gsap.set(spans, { autoAlpha: 0 }));
        gsap.set(videoMounts, { autoAlpha: 0, scale: 1.12 });
        gsap.set(videoMounts[0], { autoAlpha: 1, scale: 1 });

        gsap.set(progressBar, {
          scaleX: isMobile ? 0 : 1,
          scaleY: isMobile ? 1 : 0,
          transformOrigin: barOrigin,
        });

        positionStepNodes(stepNodes, isMobile, total);
        gsap.set(stepNodes, { autoAlpha: 0.25, scale: 0.6 });

        // Reset scene uniforms: step 0 fully visible, others scattered out.
        scenes.forEach((scene, i) => {
          scene.setProgress(i === 0 ? 0 : 1);
          scene.play();
        });

        // Track current step for boundary-crossing detection.
        // Held in a closure so the onUpdate handler can mutate it.
        const state = { currentStep: 0 };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${total * 100}%`,
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            refreshPriority: 1,
            onUpdate: (self) => {
              // Determine which step we should be in based on scroll progress.
              // Boundaries sit at the same scroll progress where text handoffs
              // happen, so videos transition in sync with text changes.
              const targetStep = Math.min(
                total - 1,
                Math.max(0, Math.floor(self.progress * total)),
              );

              if (targetStep !== state.currentStep) {
                transitionBetween(
                  scenes[state.currentStep],
                  scenes[targetStep],
                );
                state.currentStep = targetStep;
              }
            },
          },
        });

        tl.to(progressBar, { [barAxis]: 1, duration: totalDuration }, 0);

        stepNodes.forEach((node, i) => {
          tl.to(
            node,
            { autoAlpha: 1, scale: 1, duration: 0.35 },
            i * stepDuration,
          );
        });

        // Text handoffs — unchanged from the lottie version.
        texts.forEach((text, i) => {
          if (i < total - 1) {
            const handoff = (i + 1) * stepDuration - 0.5;
            const currentSpans = spansPerText[i];
            const nextText = texts[i + 1];
            const nextSpans = spansPerText[i + 1];

            tl.to(
              currentSpans,
              { autoAlpha: 0, duration: 0.3, stagger: 0.04 },
              handoff,
            );
            tl.to(text, { y: -12, duration: 0.45 }, handoff);
            tl.to(videoMounts[i], { autoAlpha: 0, duration: 0.6 }, handoff);
            tl.to(
              videoMounts[i + 1],
              { autoAlpha: 1, scale: 1, duration: 0.65 },
              handoff + 0.15,
            );
            tl.to(
              nextText,
              { autoAlpha: 1, y: 0, duration: 0.55 },
              handoff + 0.2,
            );
            tl.to(
              nextSpans,
              { autoAlpha: 1, duration: 0.5, stagger: 0.18 },
              handoff + 0.25,
            );
          }
        });

        // Cleanup on context revert
        return () => {
          scenes.forEach((s) => s.pause());
        };
      },
    );

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(texts, { autoAlpha: 0, y: 0 });
      gsap.set(texts[0], { autoAlpha: 1 });
      spansPerText.forEach((spans, i) =>
        gsap.set(spans, { autoAlpha: i === 0 ? 1 : 0 }),
      );
      gsap.set(videoMounts, { autoAlpha: 0 });
      gsap.set(videoMounts[0], { autoAlpha: 1 });
      scenes.forEach((scene, i) => {
        scene.setProgress(i === 0 ? 0 : 1);
        if (i === 0) scene.play();
      });
    });
  });
}

function transitionBetween(fromScene, toScene) {
  const TRANSITION_DURATION = 1.2;

  // Kill any in-flight transitions on these scenes so rapid
  // scrolling doesn't queue up conflicting tweens.
  gsap.killTweensOf([fromScene.uniforms.uProgress, toScene.uniforms.uProgress]);

  gsap.to(fromScene.uniforms.uProgress, {
    value: 1,
    duration: TRANSITION_DURATION,
    ease: "power2.in",
  });

  gsap.to(toScene.uniforms.uProgress, {
    value: 0,
    duration: TRANSITION_DURATION,
    ease: "power2.out",
    delay: TRANSITION_DURATION * 0.25,
  });
}

function createParticleScene(mount, videoSrc) {
  // Create the video element (not added to DOM — used as texture only).
  const video = document.createElement("video");
  video.src = videoSrc;
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;

  // Particle grid — each particle is one vertex.
  // GRID_SIZE² particles total. 220 = ~48k particles, good
  // density without tanking framerate on mobile.
  const GRID_SIZE = 220;
  const geometry = buildParticleGeometry(GRID_SIZE);

  const uniforms = {
    uTexture: { value: texture },
    uProgress: { value: 1 }, // start scattered; reset by caller
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 2.0 }, // base particle size in pixels
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Size canvas to mount element
  function resize() {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    renderer.setSize(w, h, false);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  let rafId = null;
  let playing = false;
  const clock = new THREE.Clock();

  function tick() {
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) return;
    playing = true;
    video.play().catch(() => {
      // Autoplay might be blocked; will retry on user gesture
    });
    clock.start();
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    video.pause();
  }

  // Promise that resolves when video has its first frame
  const ready = new Promise((resolve) => {
    if (video.readyState >= 2) {
      resolve();
    } else {
      video.addEventListener("loadeddata", () => resolve(), { once: true });
    }
  });

  return {
    uniforms,
    setProgress: (v) => {
      uniforms.uProgress.value = v;
    },
    play,
    pause,
    ready,
  };
}

function buildParticleGeometry(gridSize) {
  const count = gridSize * gridSize;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const randoms = new Float32Array(count); // per-particle randomness for scatter variation

  let i = 0;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Position in NDC space (-1 to 1)
      positions[i * 3 + 0] = (x / (gridSize - 1)) * 2 - 1;
      positions[i * 3 + 1] = (y / (gridSize - 1)) * 2 - 1;
      positions[i * 3 + 2] = 0;

      // UVs for sampling video texture (0 to 1, Y flipped)
      uvs[i * 2 + 0] = x / (gridSize - 1);
      uvs[i * 2 + 1] = 1 - y / (gridSize - 1);

      randoms[i] = Math.random();
      i++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  return geo;
}

const PARTICLE_VERT = `
  attribute vec2 aUv;
  attribute float aRandom;

  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vUv = aUv;

    vec3 pos = position;

    // Direction from center for radial scatter
    vec2 dir = normalize(pos.xy + vec2(0.0001));

    // Scatter amount — randomized per particle so they don't move uniformly
    float scatter = uProgress * (0.6 + aRandom * 1.4);

    // Add some swirl for organic feel
    float angle = aRandom * 6.28318 + uTime * 0.5;
    vec2 swirl = vec2(cos(angle), sin(angle)) * uProgress * 0.15;

    pos.xy += dir * scatter + swirl;

    // Fade out as scatter progresses, with per-particle variation
    vAlpha = 1.0 - smoothstep(0.0, 0.7 + aRandom * 0.3, uProgress);

    gl_Position = vec4(pos, 1.0);
    gl_PointSize = uSize * uPixelRatio * (1.0 + aRandom * 0.5);
  }
`;

const PARTICLE_FRAG = `
  uniform sampler2D uTexture;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    // Circular point shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    float pointAlpha = smoothstep(0.5, 0.4, dist);

    vec4 color = texture2D(uTexture, vUv);

    gl_FragColor = vec4(color.rgb, color.a * vAlpha * pointAlpha);
  }
`;

/* Step indicator helpers — unchanged */
function buildStepNodes(wrap, count) {
  if (!wrap) return [];
  if (getComputedStyle(wrap).position === "static")
    wrap.style.position = "relative";

  const nodes = [];
  for (let i = 0; i < count; i++) {
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
  nodes.forEach((node, i) => {
    const pct = total === 1 ? 0 : (i / (total - 1)) * 100;
    node.style.top = isMobile ? "50%" : `${pct}%`;
    node.style.left = isMobile ? `${pct}%` : "50%";
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
  const readLottieEl = section.querySelector('[data-tech="read-lottie"]');
  const writeLottieEl = section.querySelector('[data-tech="write-lottie"]');
  const progressBar = section.querySelector('[data-tech="progress-bar"]');
  const diagramWrap = section.querySelector(".tech_diagram-wrap");
  const [readLabel, writeLabel] = section.querySelectorAll(
    '[data-tech="progress-text"]',
  );

  if (!readDescription || !writeDescription || !readLottieEl || !writeLottieEl)
    return;

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

  gsap.set([readDescription, writeDescription, readLottieEl, writeLottieEl], {
    willChange: "transform, opacity",
  });

  function resetToReadState() {
    gsap.set(readDescription, { autoAlpha: 1, y: 0 });
    gsap.set(writeDescription, { autoAlpha: 0, y: 20 });
    gsap.set(readLottieEl, { autoAlpha: 1, scale: 1 });
    gsap.set(writeLottieEl, { autoAlpha: 0, scale: 1.12 });
    gsap.set(readLabel, { color: ACTIVE_COLOR });
    gsap.set(writeLabel, { color: INACTIVE_COLOR });
    gsap.set(progressBar, { scaleX: 0, transformOrigin: "left center" });
    if (bgOverlay) gsap.set(bgOverlay, { autoAlpha: 0 });
  }

  const mm = gsap.matchMedia();

  // DESKTOP + TABLET (≥768px): pinned, scroll-driven
  mm.add("(min-width: 768px)", () => {
    resetToReadState();

    const totalDuration = 10;
    const handoff = 4.5;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${totalDuration * 100}%`,
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });

    tl.to(progressBar, { scaleX: 1, duration: totalDuration }, 0);

    tl.to(readDescription, { autoAlpha: 0, y: -12, duration: 0.4 }, handoff);
    tl.to(readLottieEl, { autoAlpha: 0, scale: 0.88, duration: 0.6 }, handoff);
    tl.to(readLabel, { color: INACTIVE_COLOR, duration: 0.4 }, handoff);

    if (bgOverlay) {
      tl.to(bgOverlay, { autoAlpha: 1, duration: 0.9 }, handoff - 0.1);
    }

    tl.to(
      writeLottieEl,
      { autoAlpha: 1, scale: 1, duration: 0.65 },
      handoff + 0.15,
    );
    tl.to(
      writeDescription,
      { autoAlpha: 1, y: 0, duration: 0.5 },
      handoff + 0.2,
    );
    tl.to(writeLabel, { color: ACTIVE_COLOR, duration: 0.4 }, handoff + 0.2);
  });

  // MOBILE (≤767px): no pin, autoplay sequence on enter
  mm.add("(max-width: 767px)", () => {
    resetToReadState();

    const mobilePhaseDuration = 3;

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      once: true,
      onEnter: runMobileSequence,
    });

    function runMobileSequence() {
      gsap.to(progressBar, {
        scaleX: 0.5,
        duration: mobilePhaseDuration,
        ease: "none",
        onComplete: () => gsap.delayedCall(0.8, runHandoff),
      });
    }

    function runHandoff() {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      tl.to(readDescription, { autoAlpha: 0, y: -12, duration: 0.4 }, 0)
        .to(readLottieEl, { autoAlpha: 0, scale: 0.88, duration: 0.55 }, 0)
        .to(readLabel, { color: INACTIVE_COLOR, duration: 0.4 }, 0);

      if (bgOverlay) {
        tl.to(bgOverlay, { autoAlpha: 1, duration: 0.8 }, 0);
      }

      tl.to(writeLottieEl, { autoAlpha: 1, scale: 1, duration: 0.6 }, 0.15)
        .to(writeDescription, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.2)
        .to(writeLabel, { color: ACTIVE_COLOR, duration: 0.4 }, 0.2)
        .call(
          () => {
            gsap.to(progressBar, {
              scaleX: 1,
              duration: mobilePhaseDuration,
              ease: "none",
            });
          },
          null,
          0.5,
        );
    }
  });

  // REDUCED MOTION: static read state, no animation
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

    // ARIA wiring — each modal gets a unique id pair for labelling
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

    // Open button: type, accessible name from the member's name, and a11y relationships
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

    // Initial hidden state — set inline styles BEFORE removing .hide so there's no flash
    gsap.set(modal, { autoAlpha: 0 });
    gsap.set(innerCard, { scale: 0.96, y: 16 });
    modal.classList.remove("hide");
    modal.inert = true;

    openBtn.addEventListener("click", () =>
      openModal(modal, innerCard, openBtn),
    );
    closeBtn.addEventListener("click", () => closeModal());

    // Backdrop click — anywhere outside the inner card closes
    modal.addEventListener("click", (event) => {
      if (!innerCard.contains(event.target)) closeModal();
    });
  });

  // Global keydown — Escape and focus trap
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

    // Focus on next frame — by then GSAP has flipped visibility to visible
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

    // Vacuum close — card collapses in place, backdrop follows
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
      // Visible + actually focusable
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

  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const distanceFromTop = scrollTop;
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;

    // Smooth ramp into the mask rather than binary on/off
    const topMask = Math.min(1, distanceFromTop / FADE_THRESHOLD);
    const bottomMask = Math.min(1, distanceFromBottom / FADE_THRESHOLD);

    scrollEl.style.setProperty("--mask-top", topMask.toFixed(3));
    scrollEl.style.setProperty("--mask-bottom", bottomMask.toFixed(3));
  };

  scrollEl.addEventListener("scroll", update, { passive: true });

  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(scrollEl);

  update();
}

document.addEventListener("DOMContentLoaded", () => {
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
