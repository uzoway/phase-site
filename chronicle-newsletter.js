function initChronicleNewsletter() {
  const form = document.querySelector('[data-newsletter="form"]');
  if (!form) return;

  const CONFIG = {
    companyId: "SuUr7P",
    listId: "SS3Wny",
    revision: "2026-07-15",
    source: "website-footer",
  };

  const scope = form.parentElement || document;
  const success = scope.querySelector('[data-newsletter="success"]');
  const error = scope.querySelector('[data-newsletter="error"]');
  const input = form.querySelector('input[type="email"]');
  const submit = form.querySelector('[type="submit"]');
  if (!input) return;

  const announcer = document.createElement("p");
  announcer.setAttribute("aria-live", "polite");
  announcer.style.cssText =
    "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;";
  scope.append(announcer);

  function announce(text) {
    announcer.textContent = "";
    requestAnimationFrame(() => {
      announcer.textContent = text;
    });
  }

  const idleLabel = submit ? submit.value : "";
  const waitLabel = submit ? submit.getAttribute("data-wait") || idleLabel : "";

  function setBusy(busy) {
    if (!submit) return;
    submit.disabled = busy;
    submit.value = busy ? waitLabel : idleLabel;
  }

  function subscribe(email) {
    return fetch(
      `https://a.klaviyo.com/client/subscriptions?company_id=${CONFIG.companyId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: CONFIG.revision,
        },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              custom_source: CONFIG.source,
              profile: {
                data: {
                  type: "profile",
                  attributes: {
                    email,
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              },
            },
            relationships: {
              list: { data: { type: "list", id: CONFIG.listId } },
            },
          },
        }),
      },
    ).then((response) => {
      if (!response.ok)
        throw new Error(`Klaviyo subscription failed (${response.status})`);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }

    if (error) error.style.display = "none";
    setBusy(true);

    subscribe(input.value.trim().toLowerCase())
      .then(() => {
        form.style.display = "none";
        if (success) {
          success.style.display = "block";
          success.setAttribute("tabindex", "-1");
          success.focus({ preventScroll: true });
        }
      })
      .catch((reason) => {
        console.warn("[newsletter]", reason);
        if (error) {
          error.style.display = "block";
          announce(error.textContent.trim());
        }
        input.focus();
      })
      .finally(() => setBusy(false));
  });
}

document.addEventListener("DOMContentLoaded", initChronicleNewsletter);
