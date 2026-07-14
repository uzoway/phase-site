// function initAboutUsParallax() {
//   const section = document.querySelector('[data-parallax="section"]');
//   const card = document.querySelector('[data-parallax="card"]');

//   if (!section || !card) return;

//   const mm = gsap.matchMedia();

//   mm.add(
//     "(prefers-reduced-motion: no-preference) and (min-width: 479px)",
//     () => {
//       gsap.to(card, {
//         y: "-=100",
//         ease: "none",
//         scrollTrigger: {
//           trigger: section,
//           start: "top bottom",
//           end: "bottom top",
//           scrub: true,
//           invalidateOnRefresh: true,
//         },
//       });
//     },
//   );
// }

// function initEraParallax() {
//   const section = document.querySelector('[data-parallax="era-section"]');
//   const card = document.querySelector('[data-parallax="era-card"]');
//   const img1 = document.querySelector('[data-parallax="era-img-1"]');
//   const img2 = document.querySelector('[data-parallax="era-img-2"]');
//   const img3 = document.querySelector('[data-parallax="era-img-3"]');
//   const img4 = document.querySelector('[data-parallax="era-img-4"]');

//   if (!section || !card || !img1 || !img2 || !img3 || !img4) return;

//   const mm = gsap.matchMedia();

//   mm.add(
//     "(prefers-reduced-motion: no-preference) and (min-width: 479px)",
//     () => {
//       const tl = gsap.timeline({
//         scrollTrigger: {
//           trigger: section,
//           start: "top bottom",
//           end: "bottom top",
//           scrub: true,
//           invalidateOnRefresh: true,
//         },
//       });

//       tl.to(card, { y: "-=80", ease: "none" }, 0)
//         .to(img2, { y: "-=130", ease: "none" }, 0)
//         .to(img1, { y: "+=50", ease: "none" }, 0)
//         .to(img3, { y: "-=30", ease: "none" }, 0)
//         .to(img4, { y: "+=90", ease: "none" }, 0);
//     },
//   );
// }

// document.addEventListener("DOMContentLoaded", () => {
//   initAboutUsParallax();
//   initEraParallax();
// });

// CustomEase.create("stripeSmooth", "M0,0 C0.16,1 0.3,1 1,1");

// function initNavigation() {
//   const mm = gsap.matchMedia();
//   const ease = "stripeSmooth";
//   const duration = 0.6;
//   const fadeDuration = 0.3;

//   const triggers = document.querySelectorAll(".nav_trigger");
//   const drawers = document.querySelectorAll(".nav_drawer-wrapper");
//   const mainBar = document.querySelector(".nav_main-bar");
//   const langToggles = document.querySelectorAll(
//     ".nav_lang-toggle, .nav_lang-toggle-mobile",
//   );
//   const langModal = document.querySelector(".nav_lang-modal");
//   const langCloseBtn = document.querySelector(".nav_lang-close-desktop");
//   const langBackBtn = document.querySelector(".nav_lang-back");
//   const hamburger = document.querySelector(".nav_hamburger-button");
//   const hamburgerLines = document.querySelectorAll(
//     ".nav_hamburger-button-line",
//   );

//   let activeDrawer = null;

//   function toggleScroll(lock) {
//     if (lock) {
//       document.documentElement.classList.add("scroll-locked");
//       if (window.lenis) window.lenis.stop();
//     } else {
//       document.documentElement.classList.remove("scroll-locked");
//       if (window.lenis) window.lenis.start();
//     }
//   }

//   function injectAccessibility() {
//     triggers.forEach((trigger, i) => {
//       const parentItem = trigger.closest(".nav_main-item");
//       const targetDrawer = parentItem.querySelector(".nav_drawer-wrapper");

//       if (targetDrawer) {
//         const id = `nav-drawer-${i}`;
//         targetDrawer.id = id;
//         trigger.setAttribute("aria-controls", id);
//         trigger.setAttribute("aria-expanded", "false");
//         trigger.setAttribute("aria-haspopup", "true");
//         targetDrawer.setAttribute("aria-hidden", "true");

//         const links = targetDrawer.querySelectorAll("a, button");
//         links.forEach((link) => link.setAttribute("tabindex", "-1"));
//       }
//     });

//     langModal.id = "lang-modal";
//     langToggles.forEach((toggle) => {
//       toggle.setAttribute("aria-controls", "lang-modal");
//       toggle.setAttribute("aria-expanded", "false");
//       toggle.setAttribute("aria-haspopup", "dialog");
//     });
//     langModal.setAttribute("aria-hidden", "true");
//     langModal.setAttribute("aria-modal", "true");
//   }

//   function openDrawer(trigger, drawer, isDesktop) {
//     if (activeDrawer && activeDrawer !== drawer) {
//       const activeTrigger = document.querySelector(
//         `[aria-controls="${activeDrawer.id}"]`,
//       );
//       closeDrawer(activeTrigger, activeDrawer, isDesktop);
//     }

//     activeDrawer = drawer;
//     trigger.setAttribute("aria-expanded", "true");
//     drawer.setAttribute("aria-hidden", "false");
//     drawer
//       .querySelectorAll("a, button")
//       .forEach((link) => link.setAttribute("tabindex", "0"));

//     if (isDesktop) {
//       gsap.to(drawer, {
//         autoAlpha: 1,
//         pointerEvents: "auto",
//         duration: fadeDuration,
//         ease: "power2.out",
//       });
//       gsap.to(mainBar, {
//         borderBottomLeftRadius: 0,
//         borderBottomRightRadius: 0,
//         duration: fadeDuration,
//         ease: "power2.out",
//       });
//     } else {
//       gsap.to(drawer, { height: "auto", duration, ease });
//       gsap.to(trigger.querySelector(".nav_trigger-icon"), {
//         rotation: 180,
//         duration,
//         ease,
//       });
//     }
//   }

//   function closeDrawer(trigger, drawer, isDesktop) {
//     activeDrawer = null;
//     trigger.setAttribute("aria-expanded", "false");
//     drawer.setAttribute("aria-hidden", "true");
//     drawer
//       .querySelectorAll("a, button")
//       .forEach((link) => link.setAttribute("tabindex", "-1"));

//     if (isDesktop) {
//       gsap.to(drawer, {
//         autoAlpha: 0,
//         pointerEvents: "none",
//         duration: fadeDuration,
//         ease: "power2.in",
//       });
//       gsap.to(mainBar, {
//         borderBottomLeftRadius: "0.75rem",
//         borderBottomRightRadius: "0.75rem",
//         duration: fadeDuration,
//         ease: "power2.in",
//       });
//     } else {
//       gsap.to(drawer, { height: 0, duration, ease });
//       gsap.to(trigger.querySelector(".nav_trigger-icon"), {
//         rotation: 0,
//         duration,
//         ease,
//       });
//     }
//   }

//   function openLangModal() {
//     toggleScroll(true);
//     langToggles.forEach((t) => t.setAttribute("aria-expanded", "true"));
//     langModal.setAttribute("aria-hidden", "false");
//     gsap.to(langModal, {
//       x: "0%",
//       autoAlpha: 1,
//       visibility: "visible",
//       pointerEvents: "auto",
//       duration,
//       ease,
//     });

//     if (window.innerWidth <= 990 && hamburger) {
//       hamburger.style.pointerEvents = "none";
//     }
//   }

//   function closeLangModal() {
//     toggleScroll(false);
//     langToggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
//     langModal.setAttribute("aria-hidden", "true");
//     gsap.to(langModal, {
//       x: "100%",
//       autoAlpha: 0,
//       pointerEvents: "none",
//       duration,
//       ease,
//     });

//     if (hamburger) {
//       hamburger.style.pointerEvents = "auto";
//     }
//   }

//   injectAccessibility();

//   mm.add("(prefers-reduced-motion: reduce)", () => {
//     gsap.globalTimeline.timeScale(1000);
//   });

//   mm.add("(min-width: 991px)", () => {
//     gsap.set(drawers, {
//       height: "auto",
//       autoAlpha: 0,
//       pointerEvents: "none",
//       clearProps: "paddingTop,paddingBottom",
//     });
//     gsap.set(mainBar, { clearProps: "all" });
//     gsap.set(langModal, { x: "100%", autoAlpha: 0, pointerEvents: "none" });
//     if (hamburger) hamburger.style.pointerEvents = "auto";

//     activeDrawer = null;
//     toggleScroll(false);

//     const clickHandler = (e) => {
//       const trigger = e.target.closest(".nav_trigger");
//       if (trigger) {
//         const drawer = document.getElementById(
//           trigger.getAttribute("aria-controls"),
//         );
//         if (trigger.getAttribute("aria-expanded") === "true") {
//           closeDrawer(trigger, drawer, true);
//         } else {
//           openDrawer(trigger, drawer, true);
//         }
//       } else if (!e.target.closest(".nav_drawer-wrapper") && activeDrawer) {
//         const activeTrigger = document.querySelector(
//           `[aria-controls="${activeDrawer.id}"]`,
//         );
//         closeDrawer(activeTrigger, activeDrawer, true);
//       }

//       if (e.target.closest(".nav_drawer-close")) {
//         const activeTrigger = document.querySelector(
//           `[aria-controls="${activeDrawer.id}"]`,
//         );
//         closeDrawer(activeTrigger, activeDrawer, true);
//       }
//     };

//     document.addEventListener("click", clickHandler);
//     langToggles.forEach((toggle) =>
//       toggle.addEventListener("click", openLangModal),
//     );
//     if (langCloseBtn) langCloseBtn.addEventListener("click", closeLangModal);

//     const subItems = document.querySelectorAll(".nav_drawer-subitem");
//     subItems.forEach((subItem) => {
//       const subMenu = subItem.querySelector(".nav_drawer-submenu");
//       if (subMenu) {
//         gsap.set(subMenu, { autoAlpha: 0, pointerEvents: "none" });
//         let submenuTimeout;

//         const openSub = () => {
//           clearTimeout(submenuTimeout);
//           gsap.to(subMenu, {
//             autoAlpha: 1,
//             pointerEvents: "auto",
//             duration: 0.2,
//             ease: "power1.out",
//           });
//         };
//         const closeSub = () => {
//           submenuTimeout = setTimeout(() => {
//             gsap.to(subMenu, {
//               autoAlpha: 0,
//               pointerEvents: "none",
//               duration: 0.2,
//               ease: "power1.in",
//             });
//           }, 400);
//         };

//         subItem.addEventListener("mouseenter", openSub);
//         subItem.addEventListener("mouseleave", closeSub);
//         subMenu.addEventListener("mouseenter", openSub);
//         subMenu.addEventListener("mouseleave", closeSub);
//       }
//     });

//     document.addEventListener("keydown", (e) => {
//       if (e.key === "Escape") {
//         if (activeDrawer) {
//           const activeTrigger = document.querySelector(
//             `[aria-controls="${activeDrawer.id}"]`,
//           );
//           closeDrawer(activeTrigger, activeDrawer, true);
//         }
//         if (langModal.getAttribute("aria-hidden") === "false") closeLangModal();
//       }
//     });

//     return () => {
//       document.removeEventListener("click", clickHandler);
//     };
//   });

//   mm.add("(max-width: 990px)", () => {
//     gsap.set(drawers, {
//       height: 0,
//       autoAlpha: 1,
//       pointerEvents: "auto",
//       clearProps: "paddingTop,paddingBottom",
//     });
//     gsap.set(langModal, { x: "100%", autoAlpha: 0, pointerEvents: "none" });
//     if (hamburger) hamburger.style.pointerEvents = "auto";

//     let isMenuOpen = false;

//     const menuTl = gsap
//       .timeline({ paused: true })
//       .to(mainBar, {
//         autoAlpha: 1,
//         pointerEvents: "auto",
//         duration: 0.4,
//         ease: "power2.inOut",
//       })
//       .to(
//         hamburger,
//         { backgroundColor: "#00843d", duration: 0.3, ease: "power2.out" },
//         0,
//       )
//       .to(
//         hamburgerLines,
//         { backgroundColor: "#ffffff", duration: 0.3, ease: "power2.out" },
//         0,
//       )
//       .to(hamburgerLines[1], { autoAlpha: 0, duration: 0.2 }, 0)
//       .to(hamburgerLines[0], { y: 5, rotation: 45, duration: 0.4, ease }, 0)
//       .to(hamburgerLines[2], { y: -5, rotation: -45, duration: 0.4, ease }, 0);

//     const toggleMenu = () => {
//       isMenuOpen = !isMenuOpen;
//       toggleScroll(isMenuOpen);
//       isMenuOpen ? menuTl.play() : menuTl.reverse();
//     };

//     hamburger.addEventListener("click", toggleMenu);

//     const clickHandler = (e) => {
//       const trigger = e.target.closest(".nav_trigger");
//       if (trigger) {
//         const drawer = document.getElementById(
//           trigger.getAttribute("aria-controls"),
//         );
//         if (trigger.getAttribute("aria-expanded") === "true") {
//           closeDrawer(trigger, drawer, false);
//         } else {
//           openDrawer(trigger, drawer, false);
//         }
//       }
//     };

//     mainBar.addEventListener("click", clickHandler);
//     langToggles.forEach((toggle) =>
//       toggle.addEventListener("click", openLangModal),
//     );
//     if (langBackBtn) langBackBtn.addEventListener("click", closeLangModal);

//     const mobileSublinks = document.querySelectorAll(".nav_sublink");
//     mobileSublinks.forEach((link) => {
//       const subMenu = link.nextElementSibling;
//       if (subMenu && subMenu.classList.contains("nav_drawer-submenu")) {
//         gsap.set(subMenu, { height: 0, overflow: "hidden", autoAlpha: 1 });

//         link.addEventListener("click", (e) => {
//           e.preventDefault();
//           const isOpen = link.classList.contains("is-open");

//           if (isOpen) {
//             link.classList.remove("is-open");
//             gsap.to(subMenu, { height: 0, duration, ease });
//           } else {
//             link.classList.add("is-open");
//             gsap.to(subMenu, { height: "auto", duration, ease });
//           }
//         });
//       }
//     });

//     return () => {
//       mainBar.removeEventListener("click", clickHandler);
//       hamburger.removeEventListener("click", toggleMenu);
//     };
//   });
// }

// document.addEventListener("DOMContentLoaded", initNavigation);
