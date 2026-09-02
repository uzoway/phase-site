function initNavigation() {
  const navigations = document.querySelectorAll("[data-nav]");

  if (!navigations.length || typeof gsap === "undefined") {
    return;
  }

  navigations.forEach(function setupNavigation(navigation, index) {
    const navBar = navigation.querySelector("[data-nav-bar]");
    const menu = navigation.querySelector("[data-nav-menu]");
    const menuToggle = navigation.querySelector("[data-nav-toggle]");

    const toggleLines = Array.from(
      navigation.querySelectorAll("[data-nav-toggle-line]"),
    );

    const navItems = Array.from(navigation.querySelectorAll("[data-nav-item]"));

    const dropdown = navigation.querySelector("[data-nav-dropdown]");

    const dropdownToggle = navigation.querySelector(
      "[data-nav-dropdown-toggle]",
    );

    const dropdownIcon = navigation.querySelector("[data-nav-dropdown-icon]");

    const dropdownAccordion = navigation.querySelector(
      "[data-nav-dropdown-accordion]",
    );

    const dropdownPanel = navigation.querySelector("[data-nav-dropdown-panel]");

    const dropdownIntro = navigation.querySelector("[data-nav-dropdown-intro]");

    const dropdownGroups = Array.from(
      navigation.querySelectorAll("[data-nav-dropdown-group]"),
    );

    if (
      !navBar ||
      !menu ||
      !menuToggle ||
      !dropdown ||
      !dropdownToggle ||
      !dropdownAccordion ||
      !dropdownPanel
    ) {
      return;
    }

    const desktopMedia = window.matchMedia("(min-width: 992px)");

    const finePointerMedia = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    const reducedMotionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let menuOpen = false;
    let dropdownOpen = false;

    let lastInput = "pointer";
    let lastPointerType = "mouse";

    let desktopOpenTimer = null;
    let desktopCloseTimer = null;

    let hamburgerOffsets = {
      top: 0,
      bottom: 0,
    };

    let previousHtmlOverflow = "";
    let previousBodyOverflow = "";
    let scrollLocked = false;

    function isDesktop() {
      return desktopMedia.matches;
    }

    function getDuration(value) {
      return reducedMotionMedia.matches ? 0 : value;
    }

    function setInert(element, inert) {
      if (!element) {
        return;
      }

      element.inert = inert;
    }

    function clearDesktopTimers() {
      window.clearTimeout(desktopOpenTimer);
      window.clearTimeout(desktopCloseTimer);

      desktopOpenTimer = null;
      desktopCloseTimer = null;
    }

    function setupAccessibility() {
      if (!menu.id) {
        menu.id = `nav-menu-${index}`;
      }

      if (!dropdownPanel.id) {
        dropdownPanel.id = `nav-solutions-${index}`;
      }

      menuToggle.type = "button";

      menuToggle.setAttribute("aria-controls", menu.id);

      menuToggle.setAttribute("aria-expanded", "false");

      menuToggle.setAttribute("aria-label", "Open navigation menu");

      dropdownToggle.type = "button";

      dropdownToggle.setAttribute("aria-controls", dropdownPanel.id);

      dropdownToggle.setAttribute("aria-expanded", "false");
    }

    function setMenuClosedAccessibility() {
      menuToggle.setAttribute("aria-expanded", "false");

      menuToggle.setAttribute("aria-label", "Open navigation menu");

      menu.setAttribute("aria-hidden", "true");

      setInert(menu, true);
    }

    function setMenuOpenAccessibility() {
      menuToggle.setAttribute("aria-expanded", "true");

      menuToggle.setAttribute("aria-label", "Close navigation menu");

      menu.removeAttribute("aria-hidden");

      setInert(menu, false);
    }

    function setDropdownClosedAccessibility() {
      dropdownToggle.setAttribute("aria-expanded", "false");

      dropdownPanel.setAttribute("aria-hidden", "true");

      setInert(dropdownPanel, true);
    }

    function setDropdownOpenAccessibility() {
      dropdownToggle.setAttribute("aria-expanded", "true");

      dropdownPanel.removeAttribute("aria-hidden");

      setInert(dropdownPanel, false);
    }

    function handlePointerInput(event) {
      lastInput = "pointer";
      lastPointerType = event.pointerType || "mouse";
    }

    function handleKeyboardInput() {
      lastInput = "keyboard";
    }

    function clearTouchFocus(element) {
      if (
        lastInput !== "pointer" ||
        (lastPointerType !== "touch" && lastPointerType !== "pen")
      ) {
        return;
      }

      window.requestAnimationFrame(function blurTouchFocus() {
        element.blur();
      });
    }

    function lockPageScroll() {
      if (scrollLocked) {
        return;
      }

      scrollLocked = true;

      previousHtmlOverflow = document.documentElement.style.overflow;

      previousBodyOverflow = document.body.style.overflow;

      document.documentElement.style.overflow = "hidden";

      document.body.style.overflow = "hidden";
    }

    function unlockPageScroll() {
      if (!scrollLocked) {
        return;
      }

      scrollLocked = false;

      document.documentElement.style.overflow = previousHtmlOverflow;

      document.body.style.overflow = previousBodyOverflow;
    }

    function updateNavMetrics(updateViewport) {
      const navBarHeight = navBar.getBoundingClientRect().height;

      navigation.style.setProperty("--nav-bar-height", `${navBarHeight}px`);

      if (!updateViewport) {
        return;
      }

      const viewportHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

      navigation.style.setProperty(
        "--nav-viewport-height",
        `${viewportHeight}px`,
      );
    }

    function getFocusableElements(container) {
      return Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(function filterFocusable(element) {
        if (element.inert || element.closest("[inert]")) {
          return false;
        }

        return element.getClientRects().length > 0;
      });
    }

    function trapMobileFocus(event) {
      if (isDesktop() || !menuOpen || event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(navigation);

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function measureHamburger() {
      if (toggleLines.length < 3) {
        return;
      }

      const centers = toggleLines.map(function getLineCenter(line) {
        const rect = line.getBoundingClientRect();

        return rect.top + rect.height / 2;
      });

      hamburgerOffsets = {
        top: centers[1] - centers[0],

        bottom: centers[1] - centers[2],
      };
    }

    function animateHamburger(open) {
      if (toggleLines.length < 3) {
        return;
      }

      gsap.killTweensOf(toggleLines);

      gsap.to(toggleLines[0], {
        y: open ? hamburgerOffsets.top : 0,

        rotation: open ? 45 : 0,

        duration: getDuration(0.38),

        ease: "power3.inOut",

        overwrite: true,
      });

      gsap.to(toggleLines[1], {
        scaleX: open ? 0 : 1,
        autoAlpha: open ? 0 : 1,

        duration: getDuration(0.22),

        ease: "power2.out",

        overwrite: true,
      });

      gsap.to(toggleLines[2], {
        y: open ? hamburgerOffsets.bottom : 0,

        rotation: open ? -45 : 0,

        duration: getDuration(0.38),

        ease: "power3.inOut",

        overwrite: true,
      });
    }

    function animateDropdownIcon(open) {
      if (!dropdownIcon) {
        return;
      }

      gsap.to(dropdownIcon, {
        rotation: open ? 180 : 0,

        duration: getDuration(0.32),

        ease: "power3.inOut",

        overwrite: true,
      });
    }

    function getMobileDropdownGap() {
      const rootFontSize =
        parseFloat(
          window.getComputedStyle(document.documentElement).fontSize,
        ) || 16;

      return 1.44 * rootFontSize;
    }

    function getMobileDropdownHeight() {
      return dropdownPanel.offsetHeight + getMobileDropdownGap();
    }

    function clearDropdownMotionStyles() {
      const content = [dropdownIntro, ...dropdownGroups].filter(Boolean);

      gsap.killTweensOf([
        dropdownAccordion,
        dropdownPanel,
        dropdownIcon,
        ...content,
      ]);

      gsap.set(dropdownAccordion, {
        clearProps: "height,overflow",
      });

      gsap.set(dropdownPanel, {
        clearProps: "transform,opacity,visibility,pointerEvents,clipPath",
      });

      if (content.length) {
        gsap.set(content, {
          clearProps: "transform,opacity,visibility",
        });
      }

      if (dropdownIcon) {
        gsap.set(dropdownIcon, {
          clearProps: "transform",
        });
      }
    }

    function clearMenuMotionStyles() {
      gsap.killTweensOf([menu, ...navItems, ...toggleLines]);

      gsap.set(menu, {
        clearProps: "transform,opacity,visibility,pointerEvents",
      });

      gsap.set(navItems, {
        clearProps: "transform,opacity,visibility",
      });

      gsap.set(toggleLines, {
        clearProps: "transform,opacity,visibility",
      });
    }

    function resetHamburger() {
      gsap.killTweensOf(toggleLines);

      gsap.set(toggleLines, {
        y: 0,
        rotation: 0,
        scaleX: 1,
        autoAlpha: 1,
        transformOrigin: "50% 50%",
      });
    }

    function openMobileDropdown() {
      if (isDesktop() || dropdownOpen) {
        return;
      }

      dropdownOpen = true;

      setDropdownOpenAccessibility();
      animateDropdownIcon(true);

      const gap = getMobileDropdownGap();

      gsap.killTweensOf(dropdownAccordion);

      gsap.set(dropdownPanel, {
        y: gap,
        autoAlpha: 1,
        visibility: "visible",
        pointerEvents: "auto",
      });

      gsap.to(dropdownAccordion, {
        height: getMobileDropdownHeight(),

        duration: getDuration(0.5),

        ease: "power3.inOut",

        overwrite: true,
      });
    }

    function closeMobileDropdown(restoreFocus) {
      if (isDesktop() || !dropdownOpen) {
        return;
      }

      dropdownOpen = false;

      dropdownToggle.setAttribute("aria-expanded", "false");

      setInert(dropdownPanel, true);

      animateDropdownIcon(false);

      if (restoreFocus) {
        dropdownToggle.focus({
          preventScroll: true,
        });
      }

      gsap.killTweensOf(dropdownAccordion);

      gsap.to(dropdownAccordion, {
        height: 0,

        duration: getDuration(0.46),

        ease: "power3.inOut",

        overwrite: true,

        onComplete: function completeMobileDropdownClose() {
          setDropdownClosedAccessibility();

          gsap.set(dropdownPanel, {
            autoAlpha: 0,
            pointerEvents: "none",
          });
        },
      });
    }

    function resetMobileDropdown() {
      dropdownOpen = false;

      setDropdownClosedAccessibility();

      gsap.killTweensOf([dropdownAccordion, dropdownPanel]);

      gsap.set(dropdownAccordion, {
        height: 0,
        overflow: "hidden",
      });

      gsap.set(dropdownPanel, {
        y: 0,
        autoAlpha: 0,
        pointerEvents: "none",
      });

      if (dropdownIcon) {
        gsap.set(dropdownIcon, {
          rotation: 0,
        });
      }
    }

    function openMobileMenu() {
      if (isDesktop() || menuOpen) {
        return;
      }

      menuOpen = true;

      updateNavMetrics(true);
      lockPageScroll();

      setMenuOpenAccessibility();
      resetMobileDropdown();
      animateHamburger(true);

      gsap.killTweensOf([menu, ...navItems]);

      gsap.set(menu, {
        visibility: "visible",
        pointerEvents: "auto",
      });

      const timeline = gsap.timeline();

      timeline.to(
        menu,
        {
          xPercent: 0,
          autoAlpha: 1,

          duration: getDuration(0.52),

          ease: "power4.inOut",
        },
        0,
      );

      if (!reducedMotionMedia.matches) {
        timeline.fromTo(
          navItems,
          {
            autoAlpha: 0,
            y: 6,
          },
          {
            autoAlpha: 1,
            y: 0,

            duration: 0.28,

            stagger: 0.025,

            ease: "power3.out",
          },
          0.22,
        );
      }

      if (lastInput === "keyboard") {
        timeline.call(function focusFirstMenuItem() {
          const focusable = getFocusableElements(menu);

          if (focusable.length) {
            focusable[0].focus({
              preventScroll: true,
            });
          }
        });
      }
    }

    function closeMobileMenu(restoreFocus) {
      if (isDesktop() || !menuOpen) {
        return;
      }

      menuOpen = false;
      dropdownOpen = false;

      menuToggle.setAttribute("aria-expanded", "false");

      menuToggle.setAttribute("aria-label", "Open navigation menu");

      dropdownToggle.setAttribute("aria-expanded", "false");

      setInert(dropdownPanel, true);

      animateDropdownIcon(false);
      animateHamburger(false);

      if (restoreFocus) {
        menuToggle.focus({
          preventScroll: true,
        });
      }

      gsap.killTweensOf(menu);

      gsap.to(menu, {
        xPercent: -100,
        autoAlpha: 0,

        duration: getDuration(0.48),

        ease: "power4.inOut",

        overwrite: true,

        onComplete: function completeMobileMenuClose() {
          resetMobileDropdown();
          setMenuClosedAccessibility();

          gsap.set(menu, {
            visibility: "hidden",
            pointerEvents: "none",
          });

          unlockPageScroll();

          if (!restoreFocus) {
            clearTouchFocus(menuToggle);
          }
        },
      });
    }

    function openDesktopDropdown() {
      if (!isDesktop() || dropdownOpen) {
        return;
      }

      clearDesktopTimers();

      dropdownOpen = true;

      setDropdownOpenAccessibility();
      animateDropdownIcon(true);

      const content = [dropdownIntro, ...dropdownGroups].filter(Boolean);

      gsap.killTweensOf([dropdownPanel, ...content]);

      gsap.set(dropdownPanel, {
        autoAlpha: 1,
        visibility: "visible",
        pointerEvents: "auto",
      });

      const timeline = gsap.timeline();

      timeline.to(
        dropdownPanel,
        {
          clipPath: "inset(0% 0% 0% 0%)",

          duration: getDuration(0.42),

          ease: "power3.inOut",

          overwrite: true,
        },
        0,
      );

      if (content.length && !reducedMotionMedia.matches) {
        timeline.fromTo(
          content,
          {
            autoAlpha: 0,
            y: 6,
          },
          {
            autoAlpha: 1,
            y: 0,

            duration: 0.28,

            stagger: 0.025,

            ease: "power3.out",
          },
          0.1,
        );
      }
    }

    function closeDesktopDropdown(restoreFocus) {
      if (!isDesktop() || !dropdownOpen) {
        return;
      }

      clearDesktopTimers();

      dropdownOpen = false;

      dropdownToggle.setAttribute("aria-expanded", "false");

      setInert(dropdownPanel, true);

      animateDropdownIcon(false);

      if (restoreFocus) {
        dropdownToggle.focus({
          preventScroll: true,
        });
      }

      gsap.killTweensOf(dropdownPanel);

      gsap.to(dropdownPanel, {
        clipPath: "inset(0% 0% 100% 0%)",

        duration: getDuration(0.32),

        ease: "power3.inOut",

        overwrite: true,

        onComplete: function completeDesktopDropdownClose() {
          setDropdownClosedAccessibility();

          gsap.set(dropdownPanel, {
            autoAlpha: 0,
            pointerEvents: "none",
          });
        },
      });
    }

    function scheduleDesktopOpen() {
      window.clearTimeout(desktopCloseTimer);

      if (dropdownOpen) {
        return;
      }

      window.clearTimeout(desktopOpenTimer);

      desktopOpenTimer = window.setTimeout(openDesktopDropdown, 70);
    }

    function scheduleDesktopClose() {
      window.clearTimeout(desktopOpenTimer);

      window.clearTimeout(desktopCloseTimer);

      desktopCloseTimer = window.setTimeout(function closeAfterIntent() {
        closeDesktopDropdown(false);
      }, 160);
    }

    function setupDesktopMode() {
      menuOpen = false;
      dropdownOpen = false;

      clearDesktopTimers();
      unlockPageScroll();

      /* Remove every transform/layout value that mobile GSAP may have left behind. */
      clearMenuMotionStyles();
      clearDropdownMotionStyles();

      menuToggle.setAttribute("aria-expanded", "false");

      menuToggle.setAttribute("aria-label", "Open navigation menu");

      menu.removeAttribute("aria-hidden");

      setInert(menu, false);

      setDropdownClosedAccessibility();

      /* Wait until the browser has applied the desktop media-query layout before establishing the closed drawer state. */
      window.requestAnimationFrame(function setDesktopInitialState() {
        gsap.set(dropdownPanel, {
          clipPath: "inset(0% 0% 100% 0%)",

          autoAlpha: 0,
          pointerEvents: "none",
        });

        if (dropdownIcon) {
          gsap.set(dropdownIcon, {
            rotation: 0,
          });
        }
      });
    }

    function setupMobileMode() {
      menuOpen = false;
      dropdownOpen = false;

      clearDesktopTimers();
      unlockPageScroll();

      /* Remove desktop clip-path/content animation state before mobile takes ownership. */
      clearMenuMotionStyles();
      clearDropdownMotionStyles();

      updateNavMetrics(true);

      setMenuClosedAccessibility();
      resetHamburger();

      gsap.set(menu, {
        xPercent: -100,
        autoAlpha: 0,
        visibility: "hidden",
        pointerEvents: "none",
      });

      resetMobileDropdown();

      window.requestAnimationFrame(measureHamburger);
    }

    function handleBreakpointChange() {
      if (isDesktop()) {
        setupDesktopMode();
        return;
      }

      setupMobileMode();
    }

    function handleDropdownPointerEnter() {
      if (!isDesktop() || !finePointerMedia.matches) {
        return;
      }

      scheduleDesktopOpen();
    }

    function handleDropdownPointerLeave() {
      if (!isDesktop() || !finePointerMedia.matches) {
        return;
      }

      scheduleDesktopClose();
    }

    function handleDropdownFocusIn() {
      if (!isDesktop()) {
        return;
      }

      clearDesktopTimers();
      openDesktopDropdown();
    }

    function handleDropdownFocusOut() {
      if (!isDesktop()) {
        return;
      }

      window.requestAnimationFrame(function checkDropdownFocus() {
        if (dropdown.contains(document.activeElement)) {
          return;
        }

        closeDesktopDropdown(false);
      });
    }

    function handleDropdownToggle() {
      if (!isDesktop()) {
        if (dropdownOpen) {
          closeMobileDropdown(false);
        } else {
          openMobileDropdown();
        }

        clearTouchFocus(dropdownToggle);

        return;
      }

      if (lastPointerType === "mouse" && lastInput === "pointer") {
        openDesktopDropdown();
        return;
      }

      if (dropdownOpen) {
        closeDesktopDropdown(false);
      } else {
        openDesktopDropdown();
      }
    }

    function handleMenuToggle() {
      if (isDesktop()) {
        return;
      }

      if (menuOpen) {
        closeMobileMenu(lastInput === "keyboard");

        return;
      }

      openMobileMenu();
    }

    function handleOutsidePointer(event) {
      if (!isDesktop() || !dropdownOpen || dropdown.contains(event.target)) {
        return;
      }

      closeDesktopDropdown(false);
    }

    function handleDocumentKeydown(event) {
      trapMobileFocus(event);

      if (event.key !== "Escape") {
        return;
      }

      if (isDesktop()) {
        if (!dropdownOpen) {
          return;
        }

        event.preventDefault();

        closeDesktopDropdown(true);
        return;
      }

      if (!menuOpen) {
        return;
      }

      event.preventDefault();

      if (dropdownOpen) {
        closeMobileDropdown(true);
        return;
      }

      closeMobileMenu(true);
    }

    function handleMenuLinkClick(event) {
      if (isDesktop() || !menuOpen) {
        return;
      }

      const href = event.currentTarget.getAttribute("href");

      if (!href || href === "#") {
        return;
      }

      closeMobileMenu(false);
    }

    function handleResize() {
      updateNavMetrics(!menuOpen);

      if (!isDesktop() && dropdownOpen) {
        gsap.set(dropdownAccordion, {
          height: getMobileDropdownHeight(),
        });
      }

      if (!isDesktop() && !menuOpen) {
        measureHamburger();
      }
    }

    setupAccessibility();

    const menuLinks = Array.from(menu.querySelectorAll("a[href]"));

    document.addEventListener("pointerdown", handlePointerInput, true);

    document.addEventListener("keydown", handleKeyboardInput, true);

    document.addEventListener("keydown", handleDocumentKeydown);

    document.addEventListener("pointerdown", handleOutsidePointer);

    menuToggle.addEventListener("click", handleMenuToggle);

    dropdownToggle.addEventListener("click", handleDropdownToggle);

    dropdown.addEventListener("pointerenter", handleDropdownPointerEnter);

    dropdown.addEventListener("pointerleave", handleDropdownPointerLeave);

    dropdown.addEventListener("focusin", handleDropdownFocusIn);

    dropdown.addEventListener("focusout", handleDropdownFocusOut);

    menuLinks.forEach(function setupMenuLink(link) {
      link.addEventListener("click", handleMenuLinkClick);
    });

    desktopMedia.addEventListener("change", handleBreakpointChange);

    window.addEventListener("resize", handleResize);

    handleBreakpointChange();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initNavigation();
});
