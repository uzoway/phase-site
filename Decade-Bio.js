/* Mobile Navigation Toggle */
function initMobileNavigation() {
  const nav = document.querySelector('[data-nav="root"]');
  const toggle = document.querySelector('[data-nav="toggle"]');
  const menu = document.querySelector('[data-nav="menu"]');

  if (!nav || !toggle || !menu) return;

  const links = menu.querySelectorAll('[data-nav="link"]');
  const topLine = toggle.querySelector('[data-nav-line="top"]');
  const middleLine = toggle.querySelector('[data-nav-line="middle"]');
  const bottomLine = toggle.querySelector('[data-nav-line="bottom"]');

  if (!topLine || !middleLine || !bottomLine) return;

  const mediaQuery = window.matchMedia("(max-width: 767px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  CustomEase.create("ease-out-quint", "0.23,1,0.32,1");

  let isOpen = false;
  let timeline = null;

  function setAccessibilityState(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );

    if (open) {
      menu.removeAttribute("inert");
      menu.removeAttribute("aria-hidden");
    } else {
      menu.setAttribute("inert", "");
      menu.setAttribute("aria-hidden", "true");
    }
  }

  function setClosedState() {
    gsap.set(menu, {
      autoAlpha: 0,
      y: reducedMotion.matches ? 0 : -12,
    });

    gsap.set(links, {
      opacity: reducedMotion.matches ? 1 : 0,
      y: reducedMotion.matches ? 0 : -8,
    });

    gsap.set(topLine, {
      y: 0,
      rotation: 0,
    });

    gsap.set(middleLine, {
      scaleX: 1,
      opacity: 1,
    });

    gsap.set(bottomLine, {
      y: 0,
      rotation: 0,
    });
  }

  function buildTimeline() {
    timeline?.kill();

    timeline = gsap.timeline({
      paused: true,
      defaults: {
        overwrite: "auto",
      },
    });

    if (reducedMotion.matches) {
      timeline
        .set(menu, {
          autoAlpha: 1,
          y: 0,
        })
        .set(links, {
          opacity: 1,
          y: 0,
        })
        .set(
          topLine,
          {
            y: 3.2,
            rotation: 45,
          },
          0,
        )
        .set(
          middleLine,
          {
            scaleX: 0,
            opacity: 0,
          },
          0,
        )
        .set(
          bottomLine,
          {
            y: -3.2,
            rotation: -45,
          },
          0,
        );

      return;
    }

    timeline
      .to(
        menu,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          ease: "ease-out-quint",
        },
        0,
      )
      .to(
        topLine,
        {
          y: 3.2,
          rotation: 45,
          duration: 0.4,
          ease: "ease-out-quint",
        },
        0,
      )
      .to(
        middleLine,
        {
          scaleX: 0,
          opacity: 0,
          duration: 0.22,
          ease: "ease-out-quart",
        },
        0,
      )
      .to(
        bottomLine,
        {
          y: -5.3,
          rotation: -45,
          duration: 0.4,
          ease: "ease-out-quint",
        },
        0,
      )
      .to(
        links,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.045,
          ease: "ease-out-quint",
        },
        0.08,
      );
  }

  function openNavigation() {
    if (isOpen || !mediaQuery.matches) return;

    isOpen = true;
    setAccessibilityState(true);

    timeline?.play();
  }

  function closeNavigation({ restoreFocus = false } = {}) {
    if (!isOpen) return;

    isOpen = false;
    setAccessibilityState(false);

    if (reducedMotion.matches) {
      timeline?.reverse(0);
    } else {
      timeline?.reverse();
    }

    if (restoreFocus) {
      toggle.focus();
    }
  }

  function toggleNavigation() {
    if (isOpen) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Escape" || !isOpen) return;

    event.preventDefault();
    closeNavigation({ restoreFocus: true });
  }

  function handleLinkClick() {
    if (!mediaQuery.matches) return;

    closeNavigation();
  }

  function handleViewportChange() {
    timeline?.kill();
    timeline = null;

    isOpen = false;

    if (mediaQuery.matches) {
      setAccessibilityState(false);
      setClosedState();
      buildTimeline();
      return;
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");

    menu.removeAttribute("inert");
    menu.removeAttribute("aria-hidden");

    gsap.set([menu, links, topLine, middleLine, bottomLine], {
      clearProps: "all",
    });
  }

  function handleMotionPreferenceChange() {
    if (!mediaQuery.matches) return;

    const wasOpen = isOpen;

    timeline?.kill();
    timeline = null;

    setClosedState();
    buildTimeline();

    if (wasOpen) {
      timeline.progress(1);
    }
  }

  toggle.addEventListener("click", toggleNavigation);
  document.addEventListener("keydown", handleKeydown);

  links.forEach(function (link) {
    link.addEventListener("click", handleLinkClick);
  });

  mediaQuery.addEventListener("change", handleViewportChange);
  reducedMotion.addEventListener("change", handleMotionPreferenceChange);

  handleViewportChange();
}

/* Logo subtle scroll interaction */
function getLogoElements() {
  const root = document.querySelector('[data-logo="root"]');
  const mark = document.querySelector('[data-logo="mark"]');
  const text = document.querySelector('[data-logo="text"]');

  if (!root || !mark || !text) return null;

  return { root, mark, text };
}

function getLogoEase() {
  if (typeof CustomEase === "undefined") {
    return "power3.out";
  }

  gsap.registerPlugin(CustomEase);
  CustomEase.create("logo-ease-out-quint", "0.23,1,0.32,1");

  return "logo-ease-out-quint";
}

/* Type 1 */
function initLogoDirectionalRotation() {
  const logo = getLogoElements();

  if (!logo) return;

  const { mark } = logo;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches) return;

  const ease = getLogoEase();
  const rotateTo = gsap.quickTo(mark, "rotation", {
    duration: 0.35,
    ease: ease,
  });

  let lastScrollY = window.scrollY;
  let rotation = 0;
  let ticking = false;

  function updateRotation() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    lastScrollY = currentScrollY;
    ticking = false;

    if (Math.abs(delta) < 1) return;

    const direction = delta > 0 ? 1 : -1;
    const amount = gsap.utils.clamp(0.35, 5, Math.abs(delta) * 0.16);

    rotation += direction * amount;

    rotateTo(rotation);
  }

  function handleScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateRotation);
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });
}

/* Type 2 */
// function initLogoDirectionalLean() {
//   const logo = getLogoElements();

//   if (!logo) return;

//   const { mark, text } = logo;
//   const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

//   if (reducedMotion.matches) return;

//   const ease = getLogoEase();

//   let lastScrollY = window.scrollY;
//   let ticking = false;
//   let settleAnimation = null;

//   function settleLogo() {
//     gsap.to(mark, {
//       rotation: 0,
//       duration: 0.65,
//       ease: ease,
//       overwrite: true,
//     });

//     gsap.to(text, {
//       x: 0,
//       duration: 0.65,
//       ease: ease,
//       overwrite: true,
//     });
//   }

//   function updateLogo() {
//     const currentScrollY = window.scrollY;
//     const delta = currentScrollY - lastScrollY;

//     lastScrollY = currentScrollY;
//     ticking = false;

//     if (Math.abs(delta) < 1) return;

//     const direction = delta > 0 ? 1 : -1;

//     gsap.to(mark, {
//       rotation: direction * 22,
//       duration: 0.35,
//       ease: ease,
//       overwrite: true,
//     });

//     gsap.to(text, {
//       x: direction * -3,
//       duration: 0.35,
//       ease: ease,
//       overwrite: true,
//     });

//     settleAnimation?.kill();

//     settleAnimation = gsap.delayedCall(0.14, settleLogo);
//   }

//   function handleScroll() {
//     if (ticking) return;

//     ticking = true;
//     requestAnimationFrame(updateLogo);
//   }

//   window.addEventListener("scroll", handleScroll, {
//     passive: true,
//   });
// }

/* Type 3 */
// function initLogoScrollState() {
//   const logo = getLogoElements();

//   if (!logo) return;

//   const { text } = logo;

//   const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

//   const desktop = window.matchMedia("(min-width: 768px)");

//   const ease = getLogoEase();

//   let isCollapsed = false;
//   let ticking = false;

//   function showWordmark(immediate = false) {
//     if (!isCollapsed && !immediate) return;

//     isCollapsed = false;

//     if (immediate) {
//       gsap.set(text, {
//         clearProps: "opacity,visibility,transform",
//       });

//       return;
//     }

//     gsap.to(text, {
//       autoAlpha: 1,
//       x: 0,
//       scaleX: 1,
//       duration: 0.5,
//       ease: ease,
//       overwrite: true,
//     });
//   }

//   function hideWordmark() {
//     if (isCollapsed) return;

//     isCollapsed = true;

//     gsap.to(text, {
//       autoAlpha: 0,
//       x: -10,
//       scaleX: 0.94,
//       duration: 0.45,
//       ease: ease,
//       overwrite: true,
//     });
//   }

//   function updateLogoState() {
//     ticking = false;

//     if (!desktop.matches || reducedMotion.matches) {
//       showWordmark(true);
//       return;
//     }

//     if (!isCollapsed && window.scrollY > 120) {
//       hideWordmark();
//       return;
//     }

//     if (isCollapsed && window.scrollY < 64) {
//       showWordmark();
//     }
//   }

//   function handleScroll() {
//     if (ticking) return;

//     ticking = true;
//     requestAnimationFrame(updateLogoState);
//   }

//   function handlePreferenceChange() {
//     updateLogoState();
//   }

//   window.addEventListener("scroll", handleScroll, {
//     passive: true,
//   });

//   desktop.addEventListener("change", handlePreferenceChange);
//   reducedMotion.addEventListener("change", handlePreferenceChange);

//   updateLogoState();
// }

/* Type 4*/
// function initLogoScrollTransform() {
//   const logo = getLogoElements();

//   if (!logo) return;

//   const { mark, text } = logo;

//   const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

//   const desktop = window.matchMedia("(min-width: 768px)");

//   const ease = getLogoEase();

//   let isCollapsed = false;
//   let ticking = false;

//   function showFullLogo(immediate = false) {
//     if (!isCollapsed && !immediate) return;

//     isCollapsed = false;

//     if (immediate) {
//       gsap.set([mark, text], {
//         clearProps: "opacity,visibility,transform",
//       });

//       return;
//     }

//     gsap.to(mark, {
//       rotation: 0,
//       duration: 0.65,
//       ease: ease,
//       overwrite: true,
//     });

//     gsap.to(text, {
//       autoAlpha: 1,
//       x: 0,
//       scaleX: 1,
//       duration: 0.55,
//       ease: ease,
//       overwrite: true,
//     });
//   }

//   function showMarkOnly() {
//     if (isCollapsed) return;

//     isCollapsed = true;

//     gsap.to(mark, {
//       rotation: 28,
//       duration: 0.65,
//       ease: ease,
//       overwrite: true,
//     });

//     gsap.to(text, {
//       autoAlpha: 0,
//       x: -10,
//       scaleX: 0.94,
//       duration: 0.45,
//       ease: ease,
//       overwrite: true,
//     });
//   }

//   function updateLogoState() {
//     ticking = false;

//     if (!desktop.matches || reducedMotion.matches) {
//       showFullLogo(true);
//       return;
//     }

//     if (!isCollapsed && window.scrollY > 120) {
//       showMarkOnly();
//       return;
//     }

//     if (isCollapsed && window.scrollY < 64) {
//       showFullLogo();
//     }
//   }

//   function handleScroll() {
//     if (ticking) return;

//     ticking = true;
//     requestAnimationFrame(updateLogoState);
//   }

//   function handlePreferenceChange() {
//     updateLogoState();
//   }

//   window.addEventListener("scroll", handleScroll, {
//     passive: true,
//   });

//   desktop.addEventListener("change", handlePreferenceChange);
//   reducedMotion.addEventListener("change", handlePreferenceChange);

//   updateLogoState();
// }

/* Type 5 */
function initLogoScrollDirection() {
  const logo = getLogoElements();

  if (!logo) return;

  const { mark, text } = logo;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ease = getLogoEase();

  let isCollapsed = false;
  let ticking = false;
  let lastScroll = window.scrollY;
  let rotation = 0;

  // We initialize this once. It must not be killed by other tweens.
  const rotateMark = gsap.quickTo(mark, "rotation", {
    duration: 0.45,
    ease: ease,
  });

  function showFullLogo(immediate = false) {
    if (!isCollapsed && !immediate) return;

    isCollapsed = false;
    rotation = 0;

    if (immediate) {
      gsap.set([mark, text], {
        clearProps: "opacity,visibility,transform",
      });
      return;
    }

    // Safely animate back to 0 using the existing quickTo instance
    // to prevent GSAP from overwriting and killing our scroll tween
    rotateMark(0);

    gsap.to(text, {
      autoAlpha: 1,
      x: 0,
      scaleX: 1,
      duration: 0.55,
      ease: ease,
      overwrite: true,
    });
  }

  function showMarkOnly() {
    if (isCollapsed) return;

    isCollapsed = true;

    gsap.to(text, {
      autoAlpha: 0,
      x: -10,
      scaleX: 0.94,
      duration: 0.45,
      ease: ease,
      overwrite: true,
    });
  }

  function updateLogoState() {
    ticking = false;

    // We only check for accessibility preferences now
    if (reducedMotion.matches) {
      showFullLogo(true);
      return;
    }

    const currentScroll = window.scrollY;
    const delta = currentScroll - lastScroll;

    if (currentScroll > 120) {
      showMarkOnly();

      if (Math.abs(delta) > 0) {
        const movement = gsap.utils.clamp(-15, 15, delta * 0.25);
        rotation += movement;
        rotateMark(rotation);
      }
    }

    if (currentScroll < 64 && isCollapsed) {
      showFullLogo();
    }

    lastScroll = currentScroll;
  }

  function handleScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateLogoState);
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  reducedMotion.addEventListener("change", updateLogoState);

  updateLogoState();
}

/* Approach section scroll interaction */
function initApproachScroll() {
  const section = document.querySelector('[data-approach="section"]');
  const contentColumn = document.querySelector(
    '[data-approach="content-column"]',
  );

  if (!section || !contentColumn) return;

  const blocks = contentColumn.querySelectorAll('[data-approach="block"]');

  if (blocks.length < 2) return;

  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let tween = null;

  function getScrollDistance() {
    return Math.max(0, contentColumn.scrollHeight - contentColumn.clientHeight);
  }

  function createScrollAnimation() {
    if (reducedMotion.matches) return;

    const scrollDistance = getScrollDistance();

    if (scrollDistance <= 0) return;

    tween = gsap.to(blocks, {
      y: function () {
        return -getScrollDistance();
      },
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () {
          return "+=" + getScrollDistance();
        },
        pin: section,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  function destroyScrollAnimation() {
    tween?.scrollTrigger?.kill();
    tween?.kill();

    tween = null;

    gsap.set(blocks, {
      clearProps: "transform",
    });
  }

  function handleMotionPreferenceChange() {
    destroyScrollAnimation();

    if (!reducedMotion.matches) {
      createScrollAnimation();
      ScrollTrigger.refresh();
    }
  }

  reducedMotion.addEventListener("change", handleMotionPreferenceChange);

  createScrollAnimation();

  if (document.fonts?.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
}

/* Process scroll interaction */
// function initProcessSection() {
//   const section = document.querySelector("[data-process-section]");
//   if (!section || typeof gsap === "undefined") return;

//   const rows = section.querySelectorAll("[data-process-row]");
//   if (!rows.length) return;

//   const playedGraphs = new WeakSet();
//   const reducedMotion = window.matchMedia(
//     "(prefers-reduced-motion: reduce)",
//   ).matches;

//   function getTimeline(row) {
//     const visual = row.querySelector("[data-pv]");
//     return visual
//       ? visual.__decodeTimeline ||
//           visual.__scatterTimeline ||
//           visual.__lineTimeline
//       : null;
//   }

//   function playGraph(row) {
//     if (reducedMotion || playedGraphs.has(row)) return;

//     const tl = getTimeline(row);
//     if (tl) {
//       tl.restart();
//       playedGraphs.add(row);
//     }
//   }

//   function pauseGraphs() {
//     rows.forEach((row) => {
//       const tl = getTimeline(row);
//       if (tl && !playedGraphs.has(row) && tl.progress() > 0) {
//         tl.pause();
//         tl.progress(0);
//       }
//     });
//   }

//   pauseGraphs();
//   setTimeout(pauseGraphs, 50);

//   const mm = gsap.matchMedia();

//   mm.add("(min-width: 768px)", () => {
//     if (reducedMotion) {
//       gsap.set(rows, { autoAlpha: 1, gridArea: "auto" });
//       gsap.set(section, { height: "auto", overflow: "visible" });
//       return;
//     }

//     const visuals = Array.from(rows).map((row) =>
//       row.querySelector("[data-process-visual-wrap]"),
//     );

//     gsap.set(rows, { autoAlpha: 0, zIndex: 0, gridArea: "1 / 1" });
//     gsap.set(rows[0], { autoAlpha: 1, zIndex: 2 });
//     gsap.set(visuals, { scale: 0.96 });
//     gsap.set(visuals[0], { scale: 1 });

//     const tl = gsap.timeline({
//       scrollTrigger: {
//         trigger: section,
//         start: "top top",
//         end: () => `+=${window.innerHeight * 2.5}`,
//         pin: true,
//         scrub: 1,
//         invalidateOnRefresh: true,
//         onUpdate: (self) => {
//           const activeIndex = Math.min(
//             rows.length - 1,
//             Math.floor(self.progress * rows.length),
//           );
//           playGraph(rows[activeIndex]);
//         },
//       },
//     });

//     rows.forEach((row, index) => {
//       if (index === rows.length - 1) return;

//       const nextRow = rows[index + 1];
//       const currentVisual = visuals[index];
//       const nextVisual = visuals[index + 1];

//       tl.to(
//         currentVisual,
//         { scale: 0.96, duration: 1, ease: "power2.inOut" },
//         index,
//       )
//         .to(
//           row,
//           { autoAlpha: 0, zIndex: 0, duration: 1, ease: "power2.inOut" },
//           index,
//         )
//         .fromTo(
//           nextRow,
//           { autoAlpha: 0, zIndex: 1 },
//           { autoAlpha: 1, zIndex: 2, duration: 1, ease: "power2.inOut" },
//           index,
//         )
//         .fromTo(
//           nextVisual,
//           { scale: 0.96 },
//           { scale: 1, duration: 1, ease: "power2.out" },
//           index,
//         );
//     });

//     ScrollTrigger.create({
//       trigger: section,
//       start: "top center",
//       once: true,
//       onEnter: () => playGraph(rows[0]),
//     });

//     return () => {
//       gsap.set(rows, { clearProps: "all" });
//       gsap.set(visuals, { clearProps: "all" });
//     };
//   });

//   mm.add("(max-width: 767px)", () => {
//     gsap.set(rows, { autoAlpha: 1, gridArea: "auto" });
//     gsap.set(section, { height: "auto", overflow: "visible" });

//     if (reducedMotion) return;

//     rows.forEach((row) => {
//       const visualWrap = row.querySelector("[data-process-visual-wrap]");

//       ScrollTrigger.create({
//         trigger: visualWrap,
//         start: "top 50%",
//         once: true,
//         onEnter: () => playGraph(row),
//       });
//     });

//     return () => {
//       gsap.set(rows, { clearProps: "all" });
//       gsap.set(section, { clearProps: "all" });
//     };
//   });
// }

function initProcessSection() {
  const section = document.querySelector("[data-process-section]");
  if (!section || typeof gsap === "undefined") return;

  const stage = section.querySelector("[data-process-stage]");
  const rows = section.querySelectorAll("[data-process-row]");

  if (!stage || !rows.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function getTimeline(row) {
    if (!row) return null;
    const visual = row.querySelector("[data-pv]");
    return visual
      ? visual.__decodeTimeline ||
          visual.__scatterTimeline ||
          visual.__lineTimeline
      : null;
  }

  function resetGraphs() {
    rows.forEach((row) => {
      const tl = getTimeline(row);
      if (tl && tl.progress() > 0 && tl.progress() < 1) {
        tl.pause(0);
      }
    });
  }

  resetGraphs();
  setTimeout(resetGraphs, 50);

  const mm = gsap.matchMedia();

  // Desktop Setup
  mm.add("(min-width: 768px)", () => {
    if (reducedMotion) {
      gsap.set(rows, { autoAlpha: 1 });
      return;
    }

    gsap.set(rows, { autoAlpha: 0, zIndex: 0, pointerEvents: "none" });
    gsap.set(rows[0], { autoAlpha: 1, zIndex: 1, pointerEvents: "auto" });

    let lastActive = -1;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 4}`,
        pin: true,
        scrub: 1,
        snap: {
          snapTo: [0, 0.5, 1],
          duration: { min: 0.2, max: 0.6 },
          delay: 0.05,
          ease: "power2.inOut",
        },
        onUpdate: (self) => {
          const p = self.progress;
          let active = 0;

          if (p >= 0.7) active = 2;
          else if (p >= 0.3) active = 1;

          if (active !== lastActive) {
            const direction = active > lastActive ? 1 : -1;

            if (direction === -1 && lastActive >= 0) {
              getTimeline(rows[lastActive])?.reverse();
            }

            getTimeline(rows[active])?.restart();

            rows.forEach((r, i) => {
              r.style.pointerEvents = i === active ? "auto" : "none";
              r.style.zIndex = i === active ? 1 : 0;
            });

            lastActive = active;
          }
        },
      },
    });

    tl.to({}, { duration: 2 })
      .to(rows[0], { autoAlpha: 0, duration: 1 })
      .to(rows[1], { autoAlpha: 1, duration: 1 })
      .to({}, { duration: 2 })
      .to(rows[1], { autoAlpha: 0, duration: 1 })
      .to(rows[2], { autoAlpha: 1, duration: 1 })
      .to({}, { duration: 2 });

    return () => {
      gsap.set(rows, { clearProps: "all" });
    };
  });

  // Mobile Setup
  mm.add("(max-width: 767px)", () => {
    gsap.set(rows, { autoAlpha: 1, gridArea: "auto", pointerEvents: "auto" });
    gsap.set(section, { height: "auto", overflow: "visible" });

    if (reducedMotion) return;

    const triggers = [];

    rows.forEach((row) => {
      const visualWrap = row.querySelector("[data-process-visual-wrap]");

      const trigger = ScrollTrigger.create({
        trigger: visualWrap,
        start: "top 60%",
        onEnter: () => getTimeline(row)?.restart(),
        onEnterBack: () => getTimeline(row)?.restart(),
      });

      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
      gsap.set(rows, { clearProps: "all" });
      gsap.set(section, { clearProps: "all" });
    };
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initMobileNavigation();
  //   initLogoDirectionalRotation();
  //   initLogoDirectionalLean();
  //   initLogoScrollState();
  //   initLogoScrollTransform();
  initLogoScrollDirection();
  initApproachScroll();
  initProcessSection();
});
