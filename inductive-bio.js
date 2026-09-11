const SEGMENTED_LOTTIE_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.80.0/+esm";

const SEGMENTED_LOTTIE_PARTS = 8;
const SEGMENTED_LOTTIE_MAX_DPR = 2;

const SEGMENTED_FADE_MIN = 0.4;
const SEGMENTED_FADE_MAX = 1;

const SEGMENTED_FADE_VISIBLE_START = 0.4;
const SEGMENTED_FADE_VISIBLE_FULL = 0.55;

const SEGMENTED_LABS_VISIBLE_SYNC = 0.4;

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

function getSegmentedLottieDevicePixelRatio() {
  return Math.max(
    1,
    Math.min(window.devicePixelRatio || 1, SEGMENTED_LOTTIE_MAX_DPR),
  );
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

    renderConfig: {
      autoResize: true,
      devicePixelRatio: getSegmentedLottieDevicePixelRatio(),
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

function ensurePinWrapper(host) {
  const existing = host.parentElement;

  if (existing && existing.classList.contains("seg-pin-wrapper")) {
    return existing;
  }

  const wrapper = document.createElement("div");

  wrapper.className = "seg-pin-wrapper";

  wrapper.style.display = "flex";
  wrapper.style.justifyContent = "center";
  wrapper.style.alignItems = "center";

  host.parentNode.insertBefore(wrapper, host);

  wrapper.appendChild(host);

  return wrapper;
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

  const contentWraps = rows.map(function getContent(row) {
    return row.querySelector(config.contentSelector);
  });

  if (
    !rowsWrap ||
    rows.length !== config.rowCount ||
    visuals.some(function hasMissingVisual(visual) {
      return !visual;
    }) ||
    hosts.some(function hasMissingHost(host) {
      return !host;
    }) ||
    contentWraps.some(function hasMissingContent(content) {
      return !content;
    })
  ) {
    return null;
  }

  return {
    rowsWrap: rowsWrap,
    rows: rows,
    visuals: visuals,
    hosts: hosts,
    contentWraps: contentWraps,
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

function getSegmentedVisibleRatio(element) {
  const rect = element.getBoundingClientRect();

  if (!rect.height) {
    return 0;
  }

  const viewportHeight = window.innerHeight;

  const visibleTop = Math.max(rect.top, 0);

  const visibleBottom = Math.min(rect.bottom, viewportHeight);

  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  return gsap.utils.clamp(0, 1, visibleHeight / rect.height);
}

function getSegmentedFadeOpacity(element) {
  const rect = element.getBoundingClientRect();

  const viewportHeight = window.innerHeight;

  if (rect.bottom <= 0 || rect.top >= viewportHeight) {
    return SEGMENTED_FADE_MIN;
  }

  const visibleRatio = getSegmentedVisibleRatio(element);

  if (rect.top >= 0) {
    if (visibleRatio <= SEGMENTED_FADE_VISIBLE_START) {
      return SEGMENTED_FADE_MIN;
    }

    const maximumPossibleRatio = Math.min(1, viewportHeight / rect.height);

    const fullRatio = Math.max(
      SEGMENTED_FADE_VISIBLE_START + 0.01,
      Math.min(SEGMENTED_FADE_VISIBLE_FULL, maximumPossibleRatio),
    );

    const progress = gsap.utils.clamp(
      0,
      1,
      gsap.utils.mapRange(
        SEGMENTED_FADE_VISIBLE_START,
        fullRatio,
        0,
        1,
        visibleRatio,
      ),
    );

    return gsap.utils.interpolate(
      SEGMENTED_FADE_MIN,
      SEGMENTED_FADE_MAX,
      progress,
    );
  }

  if (rect.top < 0 && rect.bottom > viewportHeight) {
    return SEGMENTED_FADE_MAX;
  }

  if (visibleRatio >= SEGMENTED_FADE_VISIBLE_START) {
    return SEGMENTED_FADE_MAX;
  }

  const exitProgress = gsap.utils.clamp(
    0,
    1,
    visibleRatio / SEGMENTED_FADE_VISIBLE_START,
  );

  return gsap.utils.interpolate(
    SEGMENTED_FADE_MIN,
    SEGMENTED_FADE_MAX,
    exitProgress,
  );
}

function setSegmentedFadeOpacity(element) {
  gsap.set(element, {
    opacity: getSegmentedFadeOpacity(element),
  });
}

function buildContentFade(wrap, modeState) {
  setSegmentedFadeOpacity(wrap);

  const trigger = ScrollTrigger.create({
    trigger: wrap,

    start: "top bottom",
    end: "bottom top",

    invalidateOnRefresh: true,

    onUpdate: function updateFade() {
      setSegmentedFadeOpacity(wrap);
    },

    onEnter: function enterFade() {
      setSegmentedFadeOpacity(wrap);
    },

    onEnterBack: function enterFadeBack() {
      setSegmentedFadeOpacity(wrap);
    },

    onLeave: function leaveFade() {
      gsap.set(wrap, {
        opacity: SEGMENTED_FADE_MIN,
      });
    },

    onLeaveBack: function leaveFadeBack() {
      gsap.set(wrap, {
        opacity: SEGMENTED_FADE_MIN,
      });
    },

    onRefresh: function refreshFade() {
      setSegmentedFadeOpacity(wrap);
    },
  });

  modeState.triggers.push(trigger);
}

function getLabsVisibleSyncPosition(row, visibleRatio) {
  const rowHeight = row.getBoundingClientRect().height;

  const viewportHeight = window.innerHeight;

  const visibleHeight = rowHeight * visibleRatio;

  return viewportHeight - visibleHeight;
}

function getLabsScrubDistance(row) {
  const rowHeight = row.getBoundingClientRect().height;

  const viewportHeight = window.innerHeight;

  return Math.max(80, Math.min(viewportHeight * 0.22, rowHeight * 0.16));
}

function createProcessRowScrubConfig(rows, index, syncAnchor) {
  const last = rows.length - 1;

  const start = index === 0 ? "top bottom" : syncAnchor;

  if (index < last) {
    return {
      trigger: rows[index],
      start: start,

      endTrigger: rows[index + 1],

      end: syncAnchor,
    };
  }

  return {
    trigger: rows[index],
    start: start,

    endTrigger: rows[index],
    end: "center center",
  };
}

function createLabsRowScrubConfig(rows, index) {
  const row = rows[index];

  if (index === 0) {
    return {
      trigger: row,

      start: "top bottom",

      end: function getFirstLabsEnd() {
        const position = getLabsVisibleSyncPosition(
          row,
          SEGMENTED_LABS_VISIBLE_SYNC,
        );

        return `top ${position}px`;
      },
    };
  }

  return {
    trigger: row,

    start: function getLabsStart() {
      const position = getLabsVisibleSyncPosition(
        row,
        SEGMENTED_LABS_VISIBLE_SYNC,
      );

      return `top ${position}px`;
    },

    end: function getLabsEnd() {
      return `+=${getLabsScrubDistance(row)}`;
    },
  };
}

function getSegmentedPinEndConfig(config, rows, contentWraps) {
  const lastIndex = rows.length - 1;

  if (config.pinEndMode === "content-center") {
    return {
      endTrigger: contentWraps[lastIndex],
      end: "center center",
    };
  }

  return {
    endTrigger: rows[lastIndex],
    end: "bottom bottom",
  };
}

function cleanupSegmentedMode(state, hosts, contentWraps) {
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

  gsap.set(contentWraps, {
    clearProps: "opacity",
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

  const { rows, visuals, hosts, contentWraps } = elements;

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
        cleanupSegmentedMode(state, hosts, contentWraps);
      };

      async function setupDesktopMode(modeState) {
        gsap.set(hosts[0], {
          autoAlpha: 1,
        });

        gsap.set(hosts.slice(1), {
          autoAlpha: 0,
        });

        gsap.set(contentWraps, {
          opacity: SEGMENTED_FADE_MIN,
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

          const pinWrapper = ensurePinWrapper(hosts[0]);

          const pinEndConfig = getSegmentedPinEndConfig(
            config,
            rows,
            contentWraps,
          );

          const pinTrigger = ScrollTrigger.create({
            trigger: pinWrapper,

            start: "center center",

            endTrigger: pinEndConfig.endTrigger,

            end: pinEndConfig.end,

            pin: pinWrapper,

            pinSpacing: false,

            invalidateOnRefresh: true,
          });

          modeState.triggers.push(pinTrigger);

          rows.forEach(function createRowTrigger(row, index) {
            const part = parts[index];

            const triggerConfig =
              config.scrubMode === "visible"
                ? createLabsRowScrubConfig(rows, index)
                : createProcessRowScrubConfig(rows, index, config.syncAnchor);

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

          contentWraps.forEach(function createContentFade(wrap) {
            buildContentFade(wrap, modeState);
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

        gsap.set(contentWraps, {
          opacity: 1,
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

        gsap.set(contentWraps, {
          opacity: 1,
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

          contentSelector: ".process_row-content-wrap",

          rowCount: 3,

          startPart: 0,

          firstPartStartOffset: 0,

          scrubMode: "between",

          syncAnchor: "center bottom",

          pinEndMode: "content-center",
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

          contentSelector: ".labs_row-content-wrap",

          rowCount: 5,

          startPart: 3,

          firstPartStartOffset: 70,

          scrubMode: "visible",

          pinEndMode: "row-bottom",
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
