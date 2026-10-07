const SPHERE_DEFAULTS = {
  threeUrl: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
  sceneFollow: 4,
  sphereScale: 1.15,
  narrowFit: 1.05,
  dragBlock:
    "a, button, input, textarea, select, label, img, svg, video, [data-sphere-nodrag]",
  // Only the rendered lines of these block a drag, not their whole box.
  dragText: "h1, h2, h3, h4, h5, h6, p, li, blockquote, span, strong, em",
};

function injectSphereStyles() {
  if (document.querySelector("style[data-sphere-styles]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-sphere-styles", "");
  style.textContent = `
    [data-sphere="wrap"] { position: relative; isolation: isolate; }
    [data-sphere-layer] { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    [data-sphere-layer] canvas { position: sticky; top: 0; display: block; width: 100%; height: 100vh; height: 100lvh; }
    [data-sphere-canvas] { position: absolute; inset: 0; display: block; width: 100%; height: 100%; pointer-events: none; }
    .is-sphere-grab { cursor: grab; }
    .is-sphere-dragging,
    .is-sphere-dragging * { cursor: grabbing !important; user-select: none; -webkit-user-select: none; }
  `;
  document.head.appendChild(style);
}

function initChronicleSphere() {
  const wrap = document.querySelector('[data-sphere="wrap"]');
  if (!wrap) return;
  const steps = Array.from(wrap.querySelectorAll('[data-sphere="step"]'));
  if (steps.length < 2) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const lenis =
    window.lenis instanceof Object &&
    typeof window.lenis.scrollTo === "function"
      ? window.lenis
      : null;

  const CONFIG = {
    ...SPHERE_DEFAULTS,
    // Per step, in DOM order: 0 = sphere, 1 = scattered.
    stages: [0, 1, 0],
    snapDuration: reducedMotion ? 0.45 : 1.1,
    // Wheel events closer together than this belong to one gesture, so trackpad momentum can't skip a step.
    wheelGestureGapMs: 200,
    surgeRatio: 1.5,
    surgeMin: 8,
    settleDelayMs: 140,
    swipeThreshold: 0.12,
    swipeTriggerPx: 24,
    dragMaxScatter: 0.5,
  };

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  injectSphereStyles();

  const layer = document.createElement("div");
  layer.setAttribute("data-sphere-layer", "");
  layer.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  layer.appendChild(canvas);
  wrap.prepend(layer);

  const extraStops = Array.from(
    document.querySelectorAll('[data-sphere="snap"]'),
  );
  const EPS = 2;
  let stagePoints = [];
  let points = [];
  const measure = () => {
    const y = window.scrollY;
    const top = (el) => Math.round(el.getBoundingClientRect().top + y);
    stagePoints = steps.map(top);
    points = [...stagePoints, ...extraStops.map(top)].sort((a, b) => a - b);
  };
  const currentY = () => (lenis ? lenis.animatedScroll : window.scrollY);
  measure();
  new ResizeObserver(measure).observe(wrap);
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  function stepProgress(y) {
    const last = stagePoints.length - 1;
    if (y <= stagePoints[0]) return 0;
    if (y >= stagePoints[last]) return last;
    let i = 0;
    while (i < last - 1 && y >= stagePoints[i + 1]) i++;
    return (
      i + (y - stagePoints[i]) / Math.max(1, stagePoints[i + 1] - stagePoints[i])
    );
  }

  function stageAt(y) {
    const st = stepProgress(y);
    const i = Math.min(Math.floor(st), stagePoints.length - 2);
    const a = CONFIG.stages[i] ?? i % 2;
    const b = CONFIG.stages[i + 1] ?? (i + 1) % 2;
    return a + (b - a) * smooth(0, 1, st - i);
  }

  let snapping = false;
  let snapGoal = null;
  let swallowGesture = false;
  let lastWheel = 0;
  let lastDirection = 0;
  let lastMagnitude = 0;
  let snapSafety = 0;
  let settleTimer = 0;
  let touching = false;
  let touchStartY = null;

  function snapTo(y) {
    snapping = true;
    snapGoal = y;
    swallowGesture = true;
    clearTimeout(settleTimer);
    clearTimeout(snapSafety);
    const done = () => {
      snapping = false;
      snapGoal = null;
      clearTimeout(snapSafety);
    };
    snapSafety = setTimeout(done, CONFIG.snapDuration * 1000 + 400);
    if (lenis) {
      lenis.scrollTo(y, {
        duration: CONFIG.snapDuration,
        easing: easeInOutCubic,
        lock: true,
        force: true,
        onComplete: done,
      });
    } else {
      window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function stepTarget(direction, goal) {
    measure();
    if (snapping && snapGoal !== null) {
      const next =
        direction > 0
          ? points.find((p) => p > snapGoal + EPS)
          : [...points].reverse().find((p) => p < snapGoal - EPS);
      return next ?? null;
    }
    const y = currentY();
    const first = points[0];
    const last = points[points.length - 1];
    let target;

    if (direction > 0) {
      if (y >= first - EPS && y < last - EPS)
        target = points.find((p) => p > y + EPS);
      else if (y < first - EPS && goal > first) target = first;
    } else if (direction < 0) {
      if (y > first + EPS && y <= last + EPS)
        target = [...points].reverse().find((p) => p < y - EPS);
      else if (y > last + EPS && goal < last) target = last;
    }
    return target ?? null;
  }

  function handleStepIntent(direction, goal, magnitude = Infinity) {
    const now = performance.now();
    // Momentum only ever slows down in one direction, so a reversal or a sudden surge is a fresh swipe.
    const newGesture =
      now - lastWheel > CONFIG.wheelGestureGapMs ||
      direction !== lastDirection ||
      (magnitude > lastMagnitude * CONFIG.surgeRatio &&
        magnitude - lastMagnitude > CONFIG.surgeMin);
    lastWheel = now;
    lastDirection = direction;
    lastMagnitude = magnitude;
    if (!newGesture && (snapping || swallowGesture)) return true;
    swallowGesture = false;

    const target = stepTarget(direction, goal);
    if (target === null) return snapping;
    snapTo(target);
    return true;
  }

  if (lenis) {
    const previousHook = lenis.options.virtualScroll;
    lenis.options.virtualScroll = (data) => {
      if (typeof previousHook === "function" && previousHook(data) === false)
        return false;
      const event = data.event;
      if (
        !event.type.includes("wheel") ||
        event.ctrlKey ||
        !data.deltaY ||
        lenis.isStopped
      )
        return true;
      if (
        handleStepIntent(
          Math.sign(data.deltaY),
          lenis.targetScroll + data.deltaY,
          Math.abs(data.deltaY),
        )
      ) {
        if (event.cancelable) event.preventDefault();
        return false;
      }
      return true;
    };
  } else {
    window.addEventListener(
      "wheel",
      (event) => {
        if (event.ctrlKey || !event.deltaY) return;
        if (
          handleStepIntent(
            Math.sign(event.deltaY),
            window.scrollY + event.deltaY,
            Math.abs(event.deltaY),
          )
        )
          event.preventDefault();
      },
      { passive: false },
    );
  }

  window.addEventListener("keydown", (event) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    if (lenis && lenis.isStopped) return;
    const el = document.activeElement;
    if (
      el &&
      (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    )
      return;
    const down =
      ["ArrowDown", "PageDown"].includes(event.key) ||
      (event.key === " " && !event.shiftKey);
    const up =
      ["ArrowUp", "PageUp"].includes(event.key) ||
      (event.key === " " && event.shiftKey);
    if (!down && !up) return;
    const y = currentY();
    const step = window.innerHeight;
    lastWheel = 0;
    if (handleStepIntent(down ? 1 : -1, y + (down ? step : -step)))
      event.preventDefault();
  });

  function settle() {
    if (snapping || touching) return;
    if (performance.now() - lastWheel < CONFIG.wheelGestureGapMs) return;
    measure();
    const y = currentY();
    const first = points[0];
    const last = points[points.length - 1];
    const startY = touchStartY;
    touchStartY = null;
    if (y <= first + EPS || y >= last - EPS) return;
    if (points.some((p) => Math.abs(p - y) <= EPS)) return;

    const nearest = (v) =>
      points.reduce(
        (best, p, i) =>
          Math.abs(p - v) < Math.abs(points[best] - v) ? i : best,
        0,
      );
    let index = nearest(y);

    if (startY !== null && startY >= first - EPS && startY <= last + EPS) {
      const from = nearest(startY);
      const moved = y - startY;
      const size = (last - first) / (points.length - 1);
      if (moved > size * CONFIG.swipeThreshold)
        index = Math.min(from + 1, points.length - 1);
      else if (moved < -size * CONFIG.swipeThreshold)
        index = Math.max(from - 1, 0);
      else index = from;
    }
    snapTo(points[index]);
  }

  const scheduleSettle = () => {
    if (snapping) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, CONFIG.settleDelayMs);
  };
  if (lenis) lenis.on("scroll", scheduleSettle);
  else window.addEventListener("scroll", scheduleSettle, { passive: true });

  let swipe = null;

  window.addEventListener(
    "touchstart",
    (event) => {
      touching = true;
      if (!snapping) touchStartY = currentY();
      clearTimeout(settleTimer);
      const touch = event.touches[0];
      swipe =
        event.touches.length === 1
          ? { x: touch.clientX, y: touch.clientY, target: undefined }
          : null;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (!swipe || (lenis && lenis.isStopped)) return;
      const touch = event.touches[0];
      const dx = touch.clientX - swipe.x;
      const dy = swipe.y - touch.clientY;
      if (swipe.target === undefined) {
        if (!dx && !dy) return;
        if (Math.abs(dx) > Math.abs(dy)) swipe.target = null;
        else {
          const direction = Math.sign(dy);
          const target = stepTarget(direction, currentY() + direction);
          swipe.target = target ?? (snapping ? false : null);
        }
      }
      if (swipe.target === null) return;
      if (event.cancelable) event.preventDefault();
      if (
        swipe.target !== false &&
        !swipe.fired &&
        Math.abs(dy) >= CONFIG.swipeTriggerPx
      ) {
        swipe.fired = true;
        touchStartY = null;
        snapTo(swipe.target);
      }
    },
    { passive: false },
  );
  const touchEnd = () => {
    touching = false;
    scheduleSettle();
  };
  window.addEventListener("touchend", touchEnd, { passive: true });
  window.addEventListener("touchcancel", touchEnd, { passive: true });

  const sphereShown = () => stageAt(window.scrollY) < CONFIG.dragMaxScatter;
  const drag = attachSphereDrag(wrap, CONFIG, sphereShown);
  const releaseGrab = () => {
    if (!sphereShown()) drag.release();
  };
  if (lenis) lenis.on("scroll", releaseGrab);
  else window.addEventListener("scroll", releaseGrab, { passive: true });

  createSphereScene({
    canvas,
    observeTarget: wrap,
    getScatter: () => stageAt(window.scrollY),
    drag,
    config: CONFIG,
    reducedMotion,
  });
}

function attachSphereDrag(container, config, isEnabled = () => true) {
  const drag = { active: false, x: 0, y: 0, rotX: 0, rotY: 0, velX: 0 };
  const textRange = document.createRange();

  function isOverContent(event) {
    if (!(event.target instanceof Element)) return false;
    const blocked = event.target.closest(config.dragBlock);
    if (blocked && container.contains(blocked)) return true;
    const text = event.target.closest(config.dragText);
    if (!text || !container.contains(text)) return false;
    textRange.selectNodeContents(text);
    const pad = 4;
    for (const r of textRange.getClientRects()) {
      if (
        event.clientX >= r.left - pad &&
        event.clientX <= r.right + pad &&
        event.clientY >= r.top - pad &&
        event.clientY <= r.bottom + pad
      )
        return true;
    }
    return false;
  }

  const endDrag = () => {
    if (!drag.active) return;
    drag.active = false;
    container.classList.remove("is-sphere-dragging");
  };

  container.addEventListener("pointerdown", (event) => {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      !isEnabled() ||
      isOverContent(event)
    )
      return;
    event.preventDefault();
    drag.active = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    container.setPointerCapture(event.pointerId);
    container.classList.add("is-sphere-dragging");
  });
  container.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    if (!drag.active) {
      container.classList.toggle(
        "is-sphere-grab",
        isEnabled() && !isOverContent(event),
      );
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.rotY += dx * 0.005;
    drag.rotX += dy * 0.005;
    drag.velX = dy * 0.005;
  });
  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);
  container.addEventListener("lostpointercapture", endDrag);
  container.addEventListener("pointerleave", () =>
    container.classList.remove("is-sphere-grab"),
  );
  container.addEventListener(
    "selectstart",
    (event) => drag.active && event.preventDefault(),
  );
  container.addEventListener(
    "dragstart",
    (event) => drag.active && event.preventDefault(),
  );

  drag.release = () => {
    container.classList.remove("is-sphere-grab");
    endDrag();
  };
  return drag;
}

function createSphereScene({
  canvas,
  observeTarget,
  getScatter,
  drag,
  config,
  reducedMotion,
}) {
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const loadThree = () =>
    window.THREE
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = config.threeUrl;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

  loadThree()
    .then(() => initScene(window.THREE))
    .catch((error) => console.warn("[sphere] three.js failed to load", error));

  function initScene(THREE) {
    const P = {
      slices: 9,
      sliceThicknessPx: 5,
      sliceOpacity: 0.08,
      sliceColor: "#22b8e6",
      rimOpacity: 0.73,
      rimColor: "#145476",
      points: 60,
      pointSpacing: 0.97,
      pointOpacity: 0.7,
      pointSizePx: 6,
      pointColor: "#003052",
      pointBorder: "#003052",
      minPairs: 6,
      maxPairs: 12,
      linkSpeed: 0.8,
      speedVariation: 0.35,
      linkG1: "#b8e4ff",
      linkG2: "#1e6594",
      linkG3: "#75b9d7",
      dropPoints: 0.75,
      linkOpacity: 0.4,
      linkWidth: 3,
      arcLift: 0,
      spin: -0.06,
      scatterScale: 0.5,
    };

    const R = 1;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    const tilt = new THREE.Group();
    const spin = new THREE.Group();
    tilt.add(spin);
    scene.add(tilt);
    tilt.rotation.set(0.954, 0, -0.62);

    let worldPerPx = 0.003;
    let halfW = 1.5;
    let halfH = 1.5;

    const sliceMat = new THREE.MeshBasicMaterial({
      color: P.sliceColor,
      transparent: true,
      opacity: P.sliceOpacity,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const rimMat = new THREE.LineBasicMaterial({
      color: P.rimColor,
      transparent: true,
      opacity: P.rimOpacity,
      depthWrite: false,
    });
    const sliceGroup = new THREE.Group();
    spin.add(sliceGroup);
    const sliceHolders = [];

    function circleGeo(r, seg = 128) {
      const pts = [];
      for (let i = 0; i < seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    }

    function buildSlices() {
      const n = Math.max(1, Math.round(P.slices));
      const span = R * 0.9;
      for (let i = 0; i < n; i++) {
        const y = n === 1 ? 0 : -span + (i * 2 * span) / (n - 1);
        const r = Math.sqrt(Math.max(0, R * R - y * y));
        const holder = new THREE.Group();
        holder.position.y = y;
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, 1, 128, 1, false),
          sliceMat,
        );
        const rimTop = new THREE.LineLoop(circleGeo(r), rimMat);
        const rimBot = new THREE.LineLoop(circleGeo(r), rimMat);
        holder.add(disc, rimTop, rimBot);
        holder.userData = {
          disc,
          rimTop,
          rimBot,
          y,
          r,
          delay: Math.random() * 0.3,
          rx: Math.PI / 2 + (Math.random() * 2 - 1) * 0.9,
          ry: Math.random() * Math.PI * 2,
          rz: (Math.random() * 2 - 1) * 0.6,
          wx: (Math.random() * 2 - 1) * 0.08,
          wy: (Math.random() * 2 - 1) * 0.12,
          tz: (Math.random() * 2 - 1) * 0.3,
        };
        sliceGroup.add(holder);
        sliceHolders.push(holder);
      }
      placeSliceTargets();
      applyThickness();
    }

    function placeSliceTargets() {
      const placed = [];
      sliceHolders.forEach((h) => {
        let best = null;
        let bestD = -1;
        for (let t = 0; t < 60; t++) {
          const c = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
          const d = placed.reduce(
            (m, q) => Math.min(m, Math.hypot(c.x - q.x, c.y - q.y)),
            9,
          );
          if (d > bestD) {
            bestD = d;
            best = c;
          }
          if (d > 0.7) break;
        }
        placed.push(best);
        h.userData.tx = best.x;
        h.userData.ty = best.y;
      });
    }

    const _m = new THREE.Matrix4();
    const _pInv = new THREE.Matrix4();
    const _home = new THREE.Matrix4();
    const _hp = new THREE.Vector3();
    const _hq = new THREE.Quaternion();
    const _hs = new THREE.Vector3();
    const _tp = new THREE.Vector3();
    const _tq = new THREE.Quaternion();
    const _e = new THREE.Euler();

    function updateSlices(s, time) {
      scene.updateMatrixWorld();
      _pInv.copy(sliceGroup.matrixWorld).invert();
      sliceHolders.forEach((h, i) => {
        const u = h.userData;
        const k = smooth(u.delay, u.delay + 0.7, s);
        if (k <= 0.0001) {
          h.position.set(0, u.y, 0);
          h.quaternion.identity();
          h.scale.set(1, 1, 1);
          return;
        }
        _home.makeTranslation(0, u.y, 0).premultiply(sliceGroup.matrixWorld);
        _home.decompose(_hp, _hq, _hs);
        const sr = u.r * P.scatterScale;
        const hw = Math.max(0, halfW - sr - 0.05);
        const hh = Math.max(0, halfH - sr - 0.05);
        _tp.set(
          u.tx * hw + Math.sin(time * 0.3 + i) * 0.03,
          u.ty * hh + Math.cos(time * 0.27 + i * 1.7) * 0.03,
          u.tz,
        );
        _e.set(u.rx + time * u.wx, u.ry + time * u.wy, u.rz);
        _tq.setFromEuler(_e);
        _hp.lerp(_tp, k);
        _hq.slerp(_tq, k);
        const sc = 1 + (P.scatterScale - 1) * k;
        _m.compose(_hp, _hq, _hs.set(sc, 1, sc));
        _m.premultiply(_pInv);
        _m.decompose(h.position, h.quaternion, h.scale);
      });
    }

    function applyThickness() {
      const t = Math.max(0.0005, P.sliceThicknessPx * worldPerPx);
      sliceHolders.forEach((h) => {
        h.userData.disc.scale.y = t;
        h.userData.rimTop.position.y = t / 2;
        h.userData.rimBot.position.y = -t / 2;
      });
    }

    let pointVecs = [];
    const pointMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uSize: { value: P.pointSizePx },
        uPR: { value: renderer.getPixelRatio() },
        uColor: { value: new THREE.Color(P.pointColor) },
        uBorder: { value: new THREE.Color(P.pointBorder) },
        uScatter: { value: 0 },
        uHalf: { value: new THREE.Vector2(1.5, 1.5) },
        uTime: { value: 0 },
        uDrop: { value: P.dropPoints },
        uOpacity: { value: P.pointOpacity },
      },
      vertexShader: `
        uniform float uSize; uniform float uPR; uniform float uDrop;
        attribute float aRank;
        varying float vAlpha;
        uniform float uScatter; uniform vec2 uHalf; uniform float uTime;
        attribute vec3 aTarget; attribute float aDelay;
        varying float vFace;
        void main() {
          float k = smoothstep(aDelay, aDelay + 0.7, uScatter);
          vec4 mvS = modelViewMatrix * vec4(position, 1.0);
          vec3 tw = vec3(
            aTarget.x * uHalf.x + 0.03 * sin(uTime * 0.4 + aTarget.y * 9.0),
            aTarget.y * uHalf.y + 0.03 * cos(uTime * 0.35 + aTarget.x * 7.0),
            aTarget.z);
          vec4 mvT = viewMatrix * vec4(tw, 1.0);
          vec4 mv = mix(mvS, mvT, k);
          vFace = mix(normalize(normalMatrix * position).z, 1.0, k);
          float gone = step(aRank, uDrop - 0.0001) * smoothstep(aDelay, aDelay + 0.5, uScatter);
          vAlpha = 1.0 - gone;
          gl_PointSize = uSize * uPR * (1.0 - gone);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform vec3 uBorder; uniform float uSize; uniform float uOpacity;
        varying float vFace; varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord;
          float e = min(min(p.x, 1.0 - p.x), min(p.y, 1.0 - p.y));
          vec3 col = e < (1.0 / uSize) ? uBorder : uColor;
          float a = mix(0.35, 1.0, smoothstep(-0.35, 0.35, vFace));
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(col, a * vAlpha * uOpacity);
        }`,
    });

    function randomOnSphere() {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      return new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
    }

    function buildPoints() {
      pointVecs = [];
      const n = Math.max(2, Math.round(P.points));
      let guard = 0;
      while (pointVecs.length < n && guard++ < n * 200) {
        const v = randomOnSphere();
        if (pointVecs.every((q) => q.dot(v) < P.pointSpacing)) pointVecs.push(v);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(
        pointVecs.map((v) => v.clone().multiplyScalar(R)),
      );
      const tgt = new Float32Array(pointVecs.length * 3);
      const del = new Float32Array(pointVecs.length);
      for (let i = 0; i < pointVecs.length; i++) {
        tgt[i * 3] = (Math.random() * 2 - 1) * 0.95;
        tgt[i * 3 + 1] = (Math.random() * 2 - 1) * 0.92;
        tgt[i * 3 + 2] = (Math.random() * 2 - 1) * 0.3;
        del[i] = Math.random() * 0.3;
      }
      geo.setAttribute("aTarget", new THREE.BufferAttribute(tgt, 3));
      geo.setAttribute("aDelay", new THREE.BufferAttribute(del, 1));
      const order = [...Array(pointVecs.length).keys()].sort(
        () => Math.random() - 0.5,
      );
      const rank = new Float32Array(pointVecs.length);
      order.forEach((idx, j) => {
        rank[idx] = (j + 0.5) / pointVecs.length;
      });
      geo.setAttribute("aRank", new THREE.BufferAttribute(rank, 1));
      const pointsObj = new THREE.Points(geo, pointMat);
      pointsObj.frustumCulled = false;
      pointsObj.renderOrder = 10;
      spin.add(pointsObj);
    }

    const SEG = 96;
    const links = [];
    const busy = new Set();

    const linkMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uWidth: { value: P.linkWidth },
        uPR: { value: renderer.getPixelRatio() },
        uOpacity: { value: P.linkOpacity },
      },
      vertexShader: `
        attribute vec3 prev; attribute vec3 next; attribute float side; attribute vec3 color;
        uniform vec2 uRes; uniform float uWidth; uniform float uPR;
        varying vec3 vColor;
        void main() {
          mat4 m = projectionMatrix * modelViewMatrix;
          vec4 c = m * vec4(position, 1.0);
          vec4 p = m * vec4(prev, 1.0);
          vec4 n = m * vec4(next, 1.0);
          vec2 half_ = uRes * 0.5;
          vec2 ps = p.xy / p.w * half_;
          vec2 ns = n.xy / n.w * half_;
          vec2 d = ns - ps;
          d = length(d) > 1e-5 ? normalize(d) : vec2(1.0, 0.0);
          vec2 nrm = vec2(-d.y, d.x);
          c.xy += nrm * side * (uWidth * 0.5) / half_ * c.w;
          gl_Position = c;
          vColor = color;
        }`,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() { gl_FragColor = vec4(vColor, uOpacity); }`,
    });

    const g1 = new THREE.Color(P.linkG1);
    const g2 = new THREE.Color(P.linkG2);
    const g3 = new THREE.Color(P.linkG3);
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    class Link {
      constructor(ia, ib, speed) {
        this.ia = ia;
        this.ib = ib;
        const a = pointVecs[ia];
        const b = pointVecs[ib];
        const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
        const so = Math.sin(omega);
        const pos = new Float32Array((SEG + 1) * 3);
        for (let i = 0; i <= SEG; i++) {
          const t = i / SEG;
          const wa = Math.sin((1 - t) * omega) / so;
          const wb = Math.sin(t * omega) / so;
          const lift =
            1 + P.arcLift * Math.sin(Math.PI * t) * (omega / Math.PI);
          pos[i * 3] = (a.x * wa + b.x * wb) * R * lift;
          pos[i * 3 + 1] = (a.y * wa + b.y * wb) * R * lift;
          pos[i * 3 + 2] = (a.z * wa + b.z * wb) * R * lift;
        }
        const geo = new THREE.BufferGeometry();
        const col = new Float32Array((SEG + 1) * 3);
        const c = new THREE.Color();
        for (let i = 0; i <= SEG; i++) {
          const t = i / SEG;
          if (t < 0.5) c.copy(g1).lerp(g2, t * 2);
          else c.copy(g2).lerp(g3, (t - 0.5) * 2);
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }
        const N = SEG + 1;
        const P2 = new Float32Array(N * 6);
        const PR = new Float32Array(N * 6);
        const NX = new Float32Array(N * 6);
        const SD = new Float32Array(N * 2);
        const C2 = new Float32Array(N * 6);
        for (let i = 0; i < N; i++) {
          const ip = Math.max(0, i - 1);
          const inx = Math.min(N - 1, i + 1);
          for (let k = 0; k < 2; k++) {
            const v = i * 2 + k;
            for (let a3 = 0; a3 < 3; a3++) {
              P2[v * 3 + a3] = pos[i * 3 + a3];
              PR[v * 3 + a3] = pos[ip * 3 + a3];
              NX[v * 3 + a3] = pos[inx * 3 + a3];
              C2[v * 3 + a3] = col[i * 3 + a3];
            }
            SD[v] = k === 0 ? -1 : 1;
          }
        }
        const idx = [];
        for (let i = 0; i < SEG; i++) {
          const a0 = i * 2;
          const a1 = a0 + 1;
          const b0 = a0 + 2;
          const b1 = a0 + 3;
          idx.push(a0, b0, a1, a1, b0, b1);
        }
        geo.setIndex(idx);
        geo.setAttribute("position", new THREE.BufferAttribute(P2, 3));
        geo.setAttribute("prev", new THREE.BufferAttribute(PR, 3));
        geo.setAttribute("next", new THREE.BufferAttribute(NX, 3));
        geo.setAttribute("side", new THREE.BufferAttribute(SD, 1));
        geo.setAttribute("color", new THREE.BufferAttribute(C2, 3));
        this.line = new THREE.Mesh(geo, linkMat);
        this.line.frustumCulled = false;
        this.line.renderOrder = 5;
        geo.setDrawRange(0, 0);
        spin.add(this.line);
        this.dur = (0.6 + 1.4 * (omega / Math.PI)) / speed;
        this.hold = (0.25 + Math.random() * 0.9) / speed;
        this.head = 0;
        this.tail = 0;
        this.phase = 0;
        this.done = false;
      }
      update(dt) {
        if (this.phase === 0) {
          this.head += dt / this.dur;
          if (this.head >= 1) {
            this.head = 1;
            this.phase = 1;
          }
        } else if (this.phase === 1) {
          this.hold -= dt;
          if (this.hold <= 0) this.phase = 2;
        } else {
          this.tail += dt / this.dur;
          if (this.tail >= 1) {
            this.tail = 1;
            this.done = true;
          }
        }
        const s = Math.floor(ease(this.tail) * SEG);
        const h = Math.ceil(ease(this.head) * SEG);
        this.line.geometry.setDrawRange(s * 6, Math.max(0, h - s) * 6);
      }
      dispose() {
        spin.remove(this.line);
        this.line.geometry.dispose();
      }
    }

    function pickPair() {
      const free = [];
      for (let i = 0; i < pointVecs.length; i++) if (!busy.has(i)) free.push(i);
      if (free.length < 2) return null;
      for (let tries = 0; tries < 40; tries++) {
        const a = free[(Math.random() * free.length) | 0];
        const b = free[(Math.random() * free.length) | 0];
        if (a === b) continue;
        const d = pointVecs[a].dot(pointVecs[b]);
        if (d > 0.95 || d < -0.92) continue;
        return [a, b];
      }
      return null;
    }

    let scatter = 0;
    let targetPairs = 6;
    let retargetIn = 0;
    let spawnCooldown = 0;

    function updateLinks(dt) {
      retargetIn -= dt;
      const lo = Math.round(Math.min(P.minPairs, P.maxPairs));
      const hi = Math.round(Math.max(P.minPairs, P.maxPairs));
      if (retargetIn <= 0) {
        targetPairs = lo + Math.floor(Math.random() * (hi - lo + 1));
        retargetIn = 2.5 + Math.random() * 3.5;
      }
      spawnCooldown -= dt;
      if (
        scatter < 0.02 &&
        links.length < targetPairs &&
        (spawnCooldown <= 0 || links.length < lo)
      ) {
        const pair = pickPair();
        if (pair) {
          const v = P.speedVariation;
          const speed = Math.max(
            0.05,
            P.linkSpeed * (1 + (Math.random() * 2 - 1) * v),
          );
          links.push(new Link(pair[0], pair[1], speed));
          busy.add(pair[0]);
          busy.add(pair[1]);
          spawnCooldown = 0.15 + Math.random() * 0.45;
        }
      }
      for (let i = links.length - 1; i >= 0; i--) {
        const l = links[i];
        l.update(dt);
        if (l.done) {
          busy.delete(l.ia);
          busy.delete(l.ib);
          l.dispose();
          links.splice(i, 1);
        }
      }
    }

    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const fit =
        camera.aspect >= 1 ? 1.28 / config.sphereScale : config.narrowFit;
      const dist = fit / (halfTan * Math.min(1, camera.aspect));
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      worldPerPx = (2 * dist * halfTan) / h;
      halfH = dist * halfTan;
      halfW = halfH * camera.aspect;
      pointMat.uniforms.uHalf.value.set(halfW, halfH);
      pointMat.uniforms.uPR.value = renderer.getPixelRatio();
      linkMat.uniforms.uPR.value = renderer.getPixelRatio();
      renderer.getDrawingBufferSize(linkMat.uniforms.uRes.value);
      linkMat.uniforms.uRes.value.divideScalar(renderer.getPixelRatio());
      applyThickness();
    }
    new ResizeObserver(resize).observe(canvas);

    buildSlices();
    buildPoints();
    resize();
    scatter = getScatter();

    let last = performance.now();
    let time = 0;
    let rafId = 0;
    let running = false;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;

      scatter +=
        (getScatter() - scatter) *
        (1 - Math.exp(-dt * config.sceneFollow));
      if (Math.abs(scatter) < 1e-4) scatter = 0;
      linkMat.uniforms.uOpacity.value =
        P.linkOpacity * (1 - smooth(0, 0.2, scatter));
      pointMat.uniforms.uScatter.value = scatter;
      pointMat.uniforms.uTime.value = time;

      spin.rotation.y += drag.rotY;
      tilt.rotation.x += drag.rotX;
      drag.rotY = 0;
      drag.rotX = 0;
      if (!drag.active) {
        spin.rotation.y += P.spin * dt * (reducedMotion ? 0.3 : 1);
        drag.velX *= 0.92;
        tilt.rotation.x += drag.velX * 0.1;
      }
      updateLinks(dt);
      updateSlices(scatter, time);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }

    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    }).observe(observeTarget);
  }
}

function initChronicleFooterSphere() {
  const holder = document.querySelector('[data-sphere="footer"]');
  if (!holder) return;
  injectSphereStyles();

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-sphere-canvas", "");
  canvas.setAttribute("aria-hidden", "true");
  holder.prepend(canvas);

  const container = holder.parentElement || holder;
  const drag = attachSphereDrag(container, SPHERE_DEFAULTS);

  createSphereScene({
    canvas,
    observeTarget: holder,
    getScatter: () => 0,
    drag,
    config: SPHERE_DEFAULTS,
    reducedMotion,
  });
}

function initChronicleTeam() {
  const cards = Array.from(document.querySelectorAll('[data-team="card"]'));
  if (!cards.length) return;

  const lenis =
    window.lenis instanceof Object && typeof window.lenis.stop === "function"
      ? window.lenis
      : null;
  let activeModal = null;
  let opener = null;
  let inertElements = [];

  cards.forEach((card, index) => {
    const openButton = card.querySelector('[data-team="open"]');
    const modal = card.querySelector('[data-team="modal"]');
    if (!openButton || !modal) return;

    const name =
      card.querySelector('[data-team="name"]')?.textContent.trim() || "";
    const heading = modal.querySelector('[data-team="modal-name"]');
    const closeButton = modal.querySelector('[data-team="close"]');
    const id = `team-modal-${index + 1}`;

    modal.id = id;
    modal.tabIndex = -1;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("data-lenis-prevent", "");
    if (heading) {
      heading.id = heading.id || `${id}-name`;
      modal.setAttribute("aria-labelledby", heading.id);
    } else {
      modal.setAttribute("aria-label", name);
    }

    openButton.type = "button";
    openButton.setAttribute("aria-label", `${name}, view bio`);
    openButton.setAttribute("aria-haspopup", "dialog");
    openButton.setAttribute("aria-controls", id);
    openButton.addEventListener("click", () => openModal(modal, openButton));

    if (closeButton) {
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", "Close");
      closeButton.querySelectorAll("img").forEach((img) => (img.alt = ""));
      closeButton.addEventListener("click", closeModal);
    }

    modal.querySelectorAll("a[href]").forEach((link) => {
      const network = /linkedin\./i.test(link.href)
        ? "LinkedIn"
        : /\/\/(www\.)?(x|twitter)\.com/i.test(link.href)
          ? "X"
          : "";
      if (network && name)
        link.setAttribute("aria-label", `${network}: ${name}`);
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.body.appendChild(modal);
  });

  function openModal(modal, button) {
    if (activeModal) return;
    activeModal = modal;
    opener = button;

    inertElements = Array.from(document.body.children).filter(
      (el) =>
        el !== modal && !el.inert && !/^(SCRIPT|STYLE|LINK)$/.test(el.tagName),
    );
    inertElements.forEach((el) => (el.inert = true));
    document.documentElement.classList.add("is-team-modal-open");
    if (lenis) lenis.stop();

    const panel = modal.querySelector('[data-team="panel"]');
    if (panel) panel.scrollTop = 0;
    modal.classList.add("is-open");
    (modal.querySelector('[data-team="close"]') || modal).focus({
      preventScroll: true,
    });
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.classList.remove("is-open");
    inertElements.forEach((el) => (el.inert = false));
    inertElements = [];
    document.documentElement.classList.remove("is-team-modal-open");
    if (lenis) lenis.start();
    if (opener) opener.focus({ preventScroll: true });
    activeModal = null;
    opener = null;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      event.preventDefault();
      closeModal();
    }
  });
}

function initChronicleTech() {
  const root = document.querySelector('[data-tech="visual"]');
  if (!root) return;

  const steps = Array.from(root.querySelectorAll('[data-tech="step"]'));
  const ring = root.querySelector('[data-tech="ring"]');
  const canvas = root.querySelector('[data-tech="canvas"]');
  const gaps = root.querySelector('[data-tech="ring-gaps"]');
  const text = document.querySelector('[data-tech="text"]');
  const titles = Array.from(
    document.querySelector('[data-tech="titles"]')?.children || [],
  );
  const descriptions = Array.from(
    document.querySelector('[data-tech="descriptions"]')?.children || [],
  );
  if (steps.length !== 4) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const CONFIG = {
    riveUrl: "https://unpkg.com/@rive-app/canvas@2.44.0/rive.js",
    animation: "Timeline 1",
    loop: 12,
    // Seconds in the Rive timeline where Read, Resolve, Return and Generate begin.
    bounds: [2.2, 5.6, 8.3, 11.3],
    // Frames where each step's drawing has settled; clicks land and hold here.
    holds: [2.0, 5.4, 7.5, 11.0],
    seekRate: 8,
    seekMin: 0.4,
    seekMax: 0.9,
    ringDraw: 1.2,
    ringErase: 0.7,
    textLeaveMs: 360,
    gapMargin: 12,
  };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const ease = (v) => {
    const x = clamp(v, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  const wrap = (v) => ((v % CONFIG.loop) + CONFIG.loop) % CONFIG.loop;

  function stepAt(t) {
    const [read, resolve, ret, generate] = CONFIG.bounds;
    if (t >= generate || t < read) return 0;
    if (t < resolve) return 1;
    if (t < ret) return 2;
    return 3;
  }

  let ringClosed = false;

  function ringAt(t) {
    const [read, resolve, ret, generate] = CONFIG.bounds;
    if (t >= read && t < resolve) {
      const u = t - read;
      if (ringClosed && u < CONFIG.ringErase)
        return [4 * ease(u / CONFIG.ringErase), 4];
      const start = ringClosed ? CONFIG.ringErase : 0;
      return [0, ease((u - start) / CONFIG.ringDraw)];
    }
    if (t >= resolve && t < ret)
      return [0, 1 + ease((t - resolve) / CONFIG.ringDraw)];
    if (t >= ret && t < generate)
      return [0, 2 + ease((t - ret) / CONFIG.ringDraw)];
    if (!ringClosed) return [0, 0];
    return [0, 3 + ease(wrap(t - generate) / CONFIG.ringDraw)];
  }

  if (text) {
    text.id = text.id || "tech-step-text";
    text.setAttribute("aria-live", "off");
    steps.forEach((step) => step.setAttribute("aria-controls", text.id));
  }

  let t = reducedMotion ? CONFIG.holds[0] : 0;
  let tween = null;
  let activeStep = -1;
  let userPaused = reducedMotion;
  let focusPaused = false;
  let inView = false;
  let rafId = 0;
  let last = 0;
  let riveInstance = null;

  function splitWords(el) {
    const label = el.textContent.trim().replace(/\s+/g, " ");
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let i = 0;
    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.append(part);
          return;
        }
        const word = document.createElement("span");
        word.setAttribute("data-tech-word", "");
        word.style.setProperty("--i", i++);
        word.textContent = part;
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    while (el.firstChild) visual.append(el.firstChild);
    const spoken = document.createElement("span");
    spoken.setAttribute("data-tech-sr", "");
    spoken.textContent = label;
    el.append(spoken, visual);
  }

  [...titles, ...descriptions].forEach(splitWords);

  function layoutGaps() {
    if (!gaps) return;
    const box = root.getBoundingClientRect();
    if (!box.width) return;
    const scale = 100 / box.width;
    const m = CONFIG.gapMargin;
    gaps.innerHTML = Array.from(
      root.querySelectorAll('[data-tech="square"], [data-tech="label"]'),
    )
      .map((el) => {
        const r = el.getBoundingClientRect();
        const x = (r.left - box.left - m) * scale;
        const y = (r.top - box.top - m) * scale;
        const w = (r.width + m * 2) * scale;
        const h = (r.height + m * 2) * scale;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}"></rect>`;
      })
      .join("");
  }

  new ResizeObserver(layoutGaps).observe(root);
  if (document.fonts) document.fonts.ready.then(layoutGaps);

  const leaveTimers = new Map();

  function setActive(index) {
    if (index === activeStep) return;
    activeStep = index;
    steps.forEach((step, i) => {
      if (i === index) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    [titles, descriptions].forEach((items) =>
      items.forEach((el, i) => {
        const leaving = el.classList.contains("is-active") && i !== index;
        el.classList.toggle("is-active", i === index);
        clearTimeout(leaveTimers.get(el));
        el.classList.toggle("is-leaving", leaving);
        if (leaving)
          leaveTimers.set(
            el,
            setTimeout(
              () => el.classList.remove("is-leaving"),
              CONFIG.textLeaveMs,
            ),
          );
      }),
    );
  }

  function render() {
    if (stepAt(t) === 3) ringClosed = true;
    const [a, b] = ringAt(t);
    if (ring) {
      ring.style.strokeDasharray = `${Math.max(0, b - a)} 4`;
      ring.style.strokeDashoffset = `${-a}`;
    }
    setActive(tween ? tween.index : stepAt(t));
    if (riveInstance) riveInstance.scrub(CONFIG.animation, t);
  }

  const autoplaying = () => inView && !userPaused && !focusPaused;

  function tick(now) {
    rafId = 0;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (tween) {
      const p = Math.min(1, (now - tween.start) / (tween.duration * 1000));
      t = wrap(tween.from + tween.distance * ease(p));
      if (p >= 1) tween = null;
    } else if (autoplaying()) {
      t = wrap(t + dt);
    }
    render();
    if (tween || autoplaying()) wake();
  }

  function wake() {
    if (rafId) return;
    if (!last) last = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function goTo(index) {
    userPaused = true;
    if (text) text.setAttribute("aria-live", "polite");
    const target = CONFIG.holds[index];
    let distance = wrap(target - t);
    if (distance > CONFIG.loop / 2) distance -= CONFIG.loop;
    if (reducedMotion || Math.abs(distance) < 0.01) {
      tween = null;
      t = target;
      render();
      return;
    }
    tween = {
      index,
      from: t,
      distance,
      duration: clamp(
        Math.abs(distance) / CONFIG.seekRate,
        CONFIG.seekMin,
        CONFIG.seekMax,
      ),
      start: performance.now(),
    };
    last = 0;
    wake();
  }

  steps.forEach((step, index) =>
    step.addEventListener("click", () => goTo(index)),
  );

  root.addEventListener("focusin", () => {
    focusPaused = true;
  });
  root.addEventListener("focusout", (event) => {
    if (root.contains(event.relatedTarget)) return;
    focusPaused = false;
    last = 0;
    wake();
  });

  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        last = 0;
        wake();
      }
    },
    { threshold: 0.35 },
  ).observe(root);

  const loadRive = () =>
    window.rive
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = CONFIG.riveUrl;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

  const riveObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      riveObserver.disconnect();
      const src = root.getAttribute("data-tech-src");
      if (!src || !canvas) return;
      loadRive()
        .then(() => {
          const instance = new window.rive.Rive({
            src,
            canvas,
            animations: CONFIG.animation,
            autoplay: false,
            layout: new window.rive.Layout({
              fit: window.rive.Fit.Contain,
              alignment: window.rive.Alignment.Center,
            }),
            onLoad: () => {
              instance.resizeDrawingSurfaceToCanvas();
              riveInstance = instance;
              render();
            },
          });
          new ResizeObserver(() =>
            instance.resizeDrawingSurfaceToCanvas(),
          ).observe(canvas);
        })
        .catch((error) => console.warn("[tech] Rive failed to load", error));
    },
    { rootMargin: "50% 0px" },
  );
  riveObserver.observe(root);

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  initChronicleSphere();
  initChronicleFooterSphere();
  initChronicleTeam();
  initChronicleTech();
});
