function initAboutUsParallax() {
  const section = document.querySelector('[data-parallax="section"]');
  const card = document.querySelector('[data-parallax="card"]');

  if (!section || !card) return;

  const mm = gsap.matchMedia();

  mm.add(
    "(prefers-reduced-motion: no-preference) and (min-width: 479px)",
    () => {
      gsap.to(card, {
        y: "-=100",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    },
  );
}

function initEraParallax() {
  const section = document.querySelector('[data-parallax="era-section"]');
  const card = document.querySelector('[data-parallax="era-card"]');
  const img1 = document.querySelector('[data-parallax="era-img-1"]');
  const img2 = document.querySelector('[data-parallax="era-img-2"]');
  const img3 = document.querySelector('[data-parallax="era-img-3"]');
  const img4 = document.querySelector('[data-parallax="era-img-4"]');

  if (!section || !card || !img1 || !img2 || !img3 || !img4) return;

  const mm = gsap.matchMedia();

  mm.add(
    "(prefers-reduced-motion: no-preference) and (min-width: 479px)",
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(card, { y: "-=80", ease: "none" }, 0)
        .to(img2, { y: "-=130", ease: "none" }, 0)
        .to(img1, { y: "+=50", ease: "none" }, 0)
        .to(img3, { y: "-=30", ease: "none" }, 0)
        .to(img4, { y: "+=90", ease: "none" }, 0);
    },
  );
}

document.addEventListener("DOMContentLoaded", () => {
  initAboutUsParallax();
  initEraParallax();
});
