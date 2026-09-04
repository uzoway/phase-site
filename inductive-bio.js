const SEGMENTED_LOTTIE_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.80.0/+esm";

const SEGMENTED_LOTTIE_PARTS = 8;

let segmentedLottieModulePromise = null;
let segmentedRefreshFrame = null;

function loadSegmentedLottieModule() {
  if (!segmentedLottieModulePromise) {
    segmentedLottieModulePromise = import(SEGMENTED_LOTTIE_MODULE_URL);
  }

  return segmentedLottieModulePromise;
}

function getSegmentedLottiePart(totalFrames, partIndex) {
  const start = Math.round((totalFrames * partIndex) / SEGMENTED_LOTTIE_PARTS);

  const nextStart = Math.round(
    (totalFrames * (partIndex + 1)) / SEGMENTED_LOTTIE_PARTS,
  );

  return {
    start: start,

    end: Math.max(start, nextStart - 1),
  };
}

function getSectionLottiePart(totalFrames, config, rowIndex) {
  const part = getSegmentedLottiePart(totalFrames, config.startPart + rowIndex);

  if (rowIndex !== 0 || !config.firstPartStartOffset) {
    return part;
  }

  return {
    start: Math.min(part.end, part.start + config.firstPartStartOffset),

    end: part.end,
  };
}

function setSegmentedLottieFrame(record, frame) {
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

function createSegmentedLottiePlayer(host, DotLottie) {
  const src =
    host.getAttribute("data-segmented-lottie-src") ||
    host.getAttribute("data-process-lottie-src") ||
    host.getAttribute("data-labs-lottie-src");

  if (!src) {
    return Promise.reject(new Error("Missing Lottie asset URL."));
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

      resolve({
        host: host,
        canvas: canvas,
        player: player,

        totalFrames: Math.max(1, Math.floor(player.totalFrames)),

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

function destroySegmentedLottiePlayer(record) {
  if (!record) {
    return;
  }

  try {
    record.player.pause();
    record.player.destroy();
  } catch (error) {
    console.warn("Could not destroy Lottie:", error);
  }

  record.host.replaceChildren();
}

function getSegmentedSectionElements(config) {
  const rowsWrap = config.section.querySelector(config.rowsSelector);

  const rows = Array.from(
    config.section.querySelectorAll(config.rowSelector),
  ).slice(0, config.rowCount);

  const visuals = rows.map(function getVisual(row) {
    return row.querySelector(config.visualSelector);
  });

  const hosts = rows.map(function getHost(row) {
    return row.querySelector(config.lottieSelector);
  });

  if (
    !rowsWrap ||
    rows.length !== config.rowCount ||
    visuals.some(function hasMissingVisual(visual) {
      return !visual;
    }) ||
    hosts.some(function hasMissingHost(host) {
      return !host;
    })
  ) {
    return null;
  }

  return {
    rowsWrap: rowsWrap,
    rows: rows,
    visuals: visuals,
    hosts: hosts,
  };
}

function createSegmentedSectionParts(totalFrames, config) {
  return Array.from(
    {
      length: config.rowCount,
    },

    function createPart(_, index) {
      return getSectionLottiePart(totalFrames, config, index);
    },
  );
}

function createDesktopRowTriggerConfig(rows, visuals, index) {
  const finalIndex = rows.length - 1;

  if (index === 0) {
    return {
      trigger: visuals[0],

      start: "center center",

      endTrigger: rows[0],

      end: "bottom center",
    };
  }

  if (index === finalIndex) {
    return {
      trigger: rows[index],

      start: "top center",

      end: "center center",
    };
  }

  return {
    trigger: rows[index],

    start: "top center",

    end: "bottom center",
  };
}

function cleanupSegmentedMode(state, hosts) {
  state.cancelled = true;

  state.eventCleanups.forEach(function runCleanup(cleanup) {
    cleanup();
  });

  state.triggers.forEach(function killTrigger(trigger) {
    trigger.kill(true);
  });

  state.players.forEach(function destroyPlayer(record) {
    destroySegmentedLottiePlayer(record);
  });

  gsap.set(hosts, {
    clearProps: "opacity,visibility,transform",
  });
}

function scheduleSegmentedRefresh() {
  if (segmentedRefreshFrame) {
    window.cancelAnimationFrame(segmentedRefreshFrame);
  }

  segmentedRefreshFrame = window.requestAnimationFrame(
    function refreshSegmentedScrollTriggers() {
      segmentedRefreshFrame = null;

      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    },
  );
}

function initSegmentedLottieSection(config, DotLottie) {
  const elements = getSegmentedSectionElements(config);

  if (!elements) {
    return;
  }

  const { rows, visuals, hosts } = elements;

  const mobilePlayed = new Set();

  const media = gsap.matchMedia();

  media.add(
    {
      desktop: "(min-width: 768px)",

      mobile: "(max-width: 767px)",

      reduce: "(prefers-reduced-motion: reduce)",
    },

    function setupMode(context) {
      const { desktop, mobile, reduce } = context.conditions;

      const state = {
        cancelled: false,
        players: [],
        triggers: [],
        eventCleanups: [],
      };

      if (reduce) {
        setupReducedMode(state);
      } else if (desktop) {
        setupDesktopMode(state);
      } else if (mobile) {
        setupMobileMode(state);
      }

      return function cleanupMode() {
        cleanupSegmentedMode(state, hosts);
      };

      async function setupDesktopMode(modeState) {
        gsap.set(hosts[0], {
          autoAlpha: 1,
        });

        gsap.set(hosts.slice(1), {
          autoAlpha: 0,
        });

        try {
          const record = await createSegmentedLottiePlayer(hosts[0], DotLottie);

          if (modeState.cancelled) {
            destroySegmentedLottiePlayer(record);

            return;
          }

          modeState.players.push(record);

          const parts = createSegmentedSectionParts(record.totalFrames, config);

          setSegmentedLottieFrame(record, parts[0].start);

          const pinTrigger = ScrollTrigger.create({
            trigger: visuals[0],

            start: "center center",

            endTrigger: rows[rows.length - 1],

            end: "center center",

            pin: hosts[0],

            pinSpacing: false,

            anticipatePin: 1,

            invalidateOnRefresh: true,
          });

          modeState.triggers.push(pinTrigger);

          rows.forEach(function createRowTrigger(row, index) {
            const part = parts[index];

            const triggerConfig = createDesktopRowTriggerConfig(
              rows,
              visuals,
              index,
            );

            const trigger = ScrollTrigger.create({
              ...triggerConfig,

              invalidateOnRefresh: true,

              onUpdate: function updateFrame(self) {
                const frame = gsap.utils.interpolate(
                  part.start,
                  part.end,
                  self.progress,
                );

                setSegmentedLottieFrame(record, frame);
              },

              onEnter: function enterPart() {
                setSegmentedLottieFrame(record, part.start);
              },

              onEnterBack: function enterPartBack() {
                setSegmentedLottieFrame(record, part.end);
              },

              onLeave: function finishPart() {
                setSegmentedLottieFrame(record, part.end);
              },

              onLeaveBack: function resetPart() {
                setSegmentedLottieFrame(record, part.start);
              },
            });

            modeState.triggers.push(trigger);
          });

          scheduleSegmentedRefresh();
        } catch (error) {
          console.error(`${config.name} Lottie failed to load:`, error);
        }
      }

      async function setupMobileMode(modeState) {
        gsap.set(hosts, {
          autoAlpha: 1,
        });

        for (let index = 0; index < config.rowCount; index += 1) {
          if (modeState.cancelled) {
            return;
          }

          try {
            const record = await createSegmentedLottiePlayer(
              hosts[index],
              DotLottie,
            );

            if (modeState.cancelled) {
              destroySegmentedLottiePlayer(record);

              return;
            }

            modeState.players.push(record);

            const part = getSectionLottiePart(
              record.totalFrames,
              config,
              index,
            );

            if (mobilePlayed.has(index)) {
              setSegmentedLottieFrame(record, part.end);

              continue;
            }

            record.player.setSegment(part.start, part.end);

            setSegmentedLottieFrame(record, part.start);

            const trigger = ScrollTrigger.create({
              trigger: visuals[index],

              start: "top 75%",

              once: true,

              onEnter: function playPart() {
                if (mobilePlayed.has(index)) {
                  return;
                }

                mobilePlayed.add(index);

                record.player.setSegment(part.start, part.end);

                setSegmentedLottieFrame(record, part.start);

                function handleComplete() {
                  record.player.removeEventListener("complete", handleComplete);

                  record.player.pause();

                  setSegmentedLottieFrame(record, part.end);
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
            console.error(`${config.name} Lottie failed to load:`, error);
          }
        }

        scheduleSegmentedRefresh();
      }

      async function setupReducedMode(modeState) {
        gsap.set(hosts, {
          autoAlpha: 1,
        });

        for (let index = 0; index < config.rowCount; index += 1) {
          if (modeState.cancelled) {
            return;
          }

          try {
            const record = await createSegmentedLottiePlayer(
              hosts[index],
              DotLottie,
            );

            if (modeState.cancelled) {
              destroySegmentedLottiePlayer(record);

              return;
            }

            modeState.players.push(record);

            const part = getSectionLottiePart(
              record.totalFrames,
              config,
              index,
            );

            record.player.pause();

            setSegmentedLottieFrame(record, part.end);
          } catch (error) {
            console.error(`${config.name} Lottie failed to load:`, error);
          }
        }

        scheduleSegmentedRefresh();
      }
    },
  );
}

async function initSegmentedLottieSections() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("Segmented Lottie animations require GSAP and ScrollTrigger.");

    return;
  }

  const processSection = document.querySelector("[data-process]");

  const labsSection = document.querySelector("[data-labs]");

  if (!processSection && !labsSection) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  try {
    const module = await loadSegmentedLottieModule();

    const DotLottie = module.DotLottie;

    if (!DotLottie) {
      throw new Error("DotLottie runtime unavailable.");
    }

    if (typeof DotLottie.preload === "function") {
      DotLottie.preload();
    }

    if (processSection) {
      initSegmentedLottieSection(
        {
          name: "Process",

          section: processSection,

          rowsSelector: "[data-process-rows]",

          rowSelector: "[data-process-row]",

          visualSelector: "[data-process-visual]",

          lottieSelector: "[data-process-lottie]",

          rowCount: 3,

          startPart: 0,

          firstPartStartOffset: 0,
        },

        DotLottie,
      );
    }

    if (labsSection) {
      initSegmentedLottieSection(
        {
          name: "Labs",

          section: labsSection,

          rowsSelector: "[data-labs-rows]",

          rowSelector: "[data-labs-row]",

          visualSelector: "[data-labs-visual]",

          lottieSelector: "[data-labs-lottie]",

          rowCount: 5,

          startPart: 3,

          firstPartStartOffset: 70,
        },

        DotLottie,
      );
    }

    scheduleSegmentedRefresh();
  } catch (error) {
    console.error("Unable to initialize segmented Lottie runtime:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initSegmentedLottieSections();
});
