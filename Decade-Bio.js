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
function initLogoScrollTransform() {
  const logo = getLogoElements();

  if (!logo) return;

  const { mark, text } = logo;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const desktop = window.matchMedia("(min-width: 768px)");

  const ease = getLogoEase();

  let isCollapsed = false;
  let ticking = false;

  function showFullLogo(immediate = false) {
    if (!isCollapsed && !immediate) return;

    isCollapsed = false;

    if (immediate) {
      gsap.set([mark, text], {
        clearProps: "opacity,visibility,transform",
      });

      return;
    }

    gsap.to(mark, {
      rotation: 0,
      duration: 0.65,
      ease: ease,
      overwrite: true,
    });

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

    gsap.to(mark, {
      rotation: 28,
      duration: 0.65,
      ease: ease,
      overwrite: true,
    });

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

    if (!desktop.matches || reducedMotion.matches) {
      showFullLogo(true);
      return;
    }

    if (!isCollapsed && window.scrollY > 120) {
      showMarkOnly();
      return;
    }

    if (isCollapsed && window.scrollY < 64) {
      showFullLogo();
    }
  }

  function handleScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateLogoState);
  }

  function handlePreferenceChange() {
    updateLogoState();
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  desktop.addEventListener("change", handlePreferenceChange);
  reducedMotion.addEventListener("change", handlePreferenceChange);

  updateLogoState();
}

document.addEventListener("DOMContentLoaded", function () {
  initMobileNavigation();
  initLogoDirectionalRotation();
  //   initLogoDirectionalLean();
  //   initLogoScrollState();
  //   initLogoScrollTransform();
});
