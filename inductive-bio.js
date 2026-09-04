const DOTLOTTIE_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.80.0/+esm";

const PROCESS_PARTS = 8;
const PROCESS_ROWS = 3;

let dotLottieModulePromise = null;

function loadDotLottieModule() {
  if (!dotLottieModulePromise) {
    dotLottieModulePromise = import(DOTLOTTIE_MODULE_URL);
  }

  return dotLottieModulePromise;
}

function getProcessSegment(totalFrames, index) {
  const start = Math.round((totalFrames * index) / PROCESS_PARTS);

  const nextStart = Math.round((totalFrames * (index + 1)) / PROCESS_PARTS);

  return {
    start: start,
    end: Math.max(start, nextStart - 1),
  };
}

function setProcessFrame(record, frame) {
  if (!record) {
    return;
  }

  const nextFrame = Math.round(frame);

  if (record.currentFrame === nextFrame) {
    return;
  }

  record.currentFrame = nextFrame;

  record.player.setFrame(nextFrame);
}

function createProcessPlayer(host, DotLottie) {
  const src = host.getAttribute("data-process-lottie-src");

  if (!src) {
    return Promise.reject(new Error("Missing data-process-lottie-src"));
  }

  const canvas = document.createElement("canvas");

  canvas.setAttribute("aria-hidden", "true");

  host.replaceChildren(canvas);

  const player = new DotLottie({
    canvas: canvas,
    src: src,
    autoplay: false,
    loop: false,

    layout: {
      fit: "contain",
      align: [0.5, 0.5],
    },
  });

  return new Promise(function resolvePlayer(resolve, reject) {
    function handleLoad() {
      player.removeEventListener("load", handleLoad);

      player.removeEventListener("loadError", handleError);

      const totalFrames = Math.max(1, Math.floor(player.totalFrames));

      resolve({
        host: host,
        canvas: canvas,
        player: player,
        totalFrames: totalFrames,
        currentFrame: null,
      });
    }

    function handleError(error) {
      player.removeEventListener("load", handleLoad);

      player.removeEventListener("loadError", handleError);

      reject(error);
    }

    player.addEventListener("load", handleLoad);

    player.addEventListener("loadError", handleError);
  });
}

function destroyProcessPlayer(record) {
  if (!record) {
    return;
  }

  try {
    record.player.pause();
    record.player.destroy();
  } catch (error) {
    console.warn("Could not destroy process Lottie:", error);
  }

  record.host.replaceChildren();
}

function initProcessSection(section, DotLottie) {
  const rowsWrap = section.querySelector("[data-process-rows]");

  const rows = Array.from(section.querySelectorAll("[data-process-row]")).slice(
    0,
    PROCESS_ROWS,
  );

  if (!rowsWrap || rows.length < PROCESS_ROWS) {
    return;
  }

  const visuals = rows.map(function getVisual(row) {
    return row.querySelector("[data-process-visual]");
  });

  const hosts = rows.map(function getHost(row) {
    return row.querySelector("[data-process-lottie]");
  });

  if (
    visuals.some(function missingVisual(visual) {
      return !visual;
    }) ||
    hosts.some(function missingHost(host) {
      return !host;
    })
  ) {
    return;
  }

  const media = gsap.matchMedia();

  const mobilePlayed = new Set();

  media.add(
    {
      desktop: "(min-width: 768px)",

      mobile: "(max-width: 767px)",

      reduce: "(prefers-reduced-motion: reduce)",
    },

    function setupMode(context) {
      const conditions = context.conditions;

      const state = {
        cancelled: false,
        players: [],
        triggers: [],
        eventCleanups: [],
      };

      if (conditions.reduce) {
        setupReducedMotion(state);

        return function cleanupReduced() {
          cleanupMode(state);
        };
      }

      if (conditions.desktop) {
        setupDesktop(state);

        return function cleanupDesktop() {
          cleanupMode(state);
        };
      }

      setupMobile(state);

      return function cleanupMobile() {
        cleanupMode(state);
      };

      async function setupDesktop(modeState) {
        gsap.set(hosts.slice(1), {
          autoAlpha: 0,
        });

        try {
          const record = await createProcessPlayer(hosts[0], DotLottie);

          if (modeState.cancelled) {
            destroyProcessPlayer(record);

            return;
          }

          modeState.players.push(record);

          const segments = Array.from(
            {
              length: PROCESS_ROWS,
            },

            function createSegment(_, index) {
              return getProcessSegment(record.totalFrames, index);
            },
          );

          setProcessFrame(record, segments[0].start);

          const pinTrigger = ScrollTrigger.create({
            trigger: visuals[0],

            start: "center center",

            endTrigger: rows[PROCESS_ROWS - 1],

            end: "center center",

            pin: hosts[0],

            pinSpacing: false,

            anticipatePin: 1,

            invalidateOnRefresh: true,
          });

          modeState.triggers.push(pinTrigger);

          rows.forEach(function createRowScrub(row, index) {
            const segment = segments[index];

            let config;

            if (index === 0) {
              config = {
                trigger: visuals[0],

                start: "center center",

                endTrigger: row,

                end: "bottom center",
              };
            } else if (index === PROCESS_ROWS - 1) {
              config = {
                trigger: row,

                start: "top center",

                end: "center center",
              };
            } else {
              config = {
                trigger: row,

                start: "top center",

                end: "bottom center",
              };
            }

            const trigger = ScrollTrigger.create({
              ...config,

              invalidateOnRefresh: true,

              onUpdate: function updateFrame(self) {
                const frame = gsap.utils.interpolate(
                  segment.start,
                  segment.end,
                  self.progress,
                );

                setProcessFrame(record, frame);
              },

              onEnter: function enterSegment() {
                setProcessFrame(record, segment.start);
              },

              onEnterBack: function enterSegmentBack() {
                setProcessFrame(record, segment.end);
              },

              onLeave: function finishSegment() {
                setProcessFrame(record, segment.end);
              },

              onLeaveBack: function resetSegment() {
                setProcessFrame(record, segment.start);
              },
            });

            modeState.triggers.push(trigger);
          });

          window.requestAnimationFrame(function refreshDesktop() {
            if (!modeState.cancelled) {
              ScrollTrigger.refresh();
            }
          });
        } catch (error) {
          console.error("Process Lottie failed to load:", error);
        }
      }

      async function setupMobile(modeState) {
        gsap.set(hosts, {
          autoAlpha: 1,
        });

        for (let index = 0; index < PROCESS_ROWS; index += 1) {
          if (modeState.cancelled) {
            return;
          }

          try {
            const record = await createProcessPlayer(hosts[index], DotLottie);

            if (modeState.cancelled) {
              destroyProcessPlayer(record);

              return;
            }

            modeState.players.push(record);

            const segment = getProcessSegment(record.totalFrames, index);

            if (mobilePlayed.has(index)) {
              setProcessFrame(record, segment.end);

              continue;
            }

            record.player.setSegment(segment.start, segment.end);

            setProcessFrame(record, segment.start);

            const trigger = ScrollTrigger.create({
              trigger: visuals[index],

              start: "top 75%",

              once: true,

              onEnter: function playSegment() {
                if (mobilePlayed.has(index)) {
                  return;
                }

                mobilePlayed.add(index);

                record.player.setSegment(segment.start, segment.end);

                setProcessFrame(record, segment.start);

                function handleComplete() {
                  record.player.removeEventListener("complete", handleComplete);

                  record.player.pause();

                  setProcessFrame(record, segment.end);
                }

                record.player.addEventListener("complete", handleComplete);

                modeState.eventCleanups.push(function removeCompleteListener() {
                  record.player.removeEventListener("complete", handleComplete);
                });

                record.player.play();
              },
            });

            modeState.triggers.push(trigger);
          } catch (error) {
            console.error("Process Lottie failed to load:", error);
          }
        }

        window.requestAnimationFrame(function refreshMobile() {
          if (!modeState.cancelled) {
            ScrollTrigger.refresh();
          }
        });
      }

      async function setupReducedMotion(modeState) {
        gsap.set(hosts, {
          autoAlpha: 1,
        });

        for (let index = 0; index < PROCESS_ROWS; index += 1) {
          if (modeState.cancelled) {
            return;
          }

          try {
            const record = await createProcessPlayer(hosts[index], DotLottie);

            if (modeState.cancelled) {
              destroyProcessPlayer(record);

              return;
            }

            modeState.players.push(record);

            const segment = getProcessSegment(record.totalFrames, index);

            record.player.pause();

            setProcessFrame(record, segment.end);
          } catch (error) {
            console.error("Process Lottie failed to load:", error);
          }
        }

        window.requestAnimationFrame(function refreshReducedMotion() {
          if (!modeState.cancelled) {
            ScrollTrigger.refresh();
          }
        });
      }

      function cleanupMode(modeState) {
        modeState.cancelled = true;

        modeState.eventCleanups.forEach(function runCleanup(cleanup) {
          cleanup();
        });

        modeState.triggers.forEach(function killTrigger(trigger) {
          trigger.kill(true);
        });

        modeState.players.forEach(function destroyPlayer(record) {
          destroyProcessPlayer(record);
        });

        gsap.set(hosts, {
          clearProps: "opacity,visibility,transform",
        });

        window.requestAnimationFrame(function refreshAfterCleanup() {
          ScrollTrigger.refresh();
        });
      }
    },
  );
}

async function initProcessScroll() {
  const sections = document.querySelectorAll("[data-process]");

  if (!sections.length) {
    return;
  }

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("Process animation requires GSAP and ScrollTrigger.");

    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  try {
    const module = await loadDotLottieModule();

    const DotLottie = module.DotLottie;

    if (!DotLottie) {
      throw new Error("DotLottie runtime unavailable.");
    }

    if (typeof DotLottie.preload === "function") {
      DotLottie.preload();
    }

    sections.forEach(function setupSection(section) {
      initProcessSection(section, DotLottie);
    });
  } catch (error) {
    console.error("Unable to initialize DotLottie runtime:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initProcessScroll();
});
