function initChronicleContact() {
  const trigger = document.querySelector('[data-contact="trigger"]');
  if (!trigger || !trigger.parentElement) return;

  const OPTIONS = [
    { label: "General inquiries", email: "info@chroniclebio.com" },
    { label: "Research team", email: "research@chroniclebio.com" },
    { label: "News and media", email: "media@chroniclebio.com" },
  ];

  const style = document.createElement("style");
  style.textContent = `
    [data-contact="host"] { position: relative; }
    [data-contact="menu"] {
      position: absolute;
      left: 0;
      bottom: calc(100% + 0.75rem);
      z-index: 5;
      min-width: 16rem;
      max-width: calc(100vw - 2.5rem);
      margin: 0;
      padding: 0.375rem;
      list-style: none;
      background-color: #071020;
      border: 1px solid rgba(21, 182, 222, 0.35);
      visibility: hidden;
      opacity: 0;
      transition: opacity 200ms ease, visibility 0s linear 200ms;
    }
    [data-contact="menu"][data-open] {
      visibility: visible;
      opacity: 1;
      transition: opacity 200ms ease, visibility 0s;
    }
    [data-contact="option"] {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.25rem;
      min-height: 2.75rem;
      padding: 0.75rem 1rem;
      color: #fff;
      text-decoration: none;
    }
    [data-contact="option"]:hover,
    [data-contact="option"]:focus-visible {
      background-color: rgba(21, 182, 222, 0.08);
    }
    [data-contact="option"]:focus-visible {
      outline: 0.1875rem solid #15b6de;
      outline-offset: -0.1875rem;
    }
    [data-contact="label"] { font-size: 0.875rem; line-height: 1.2; }
    [data-contact="email"] { font-size: 0.75rem; line-height: 1.2; color: #15b6de; }
    @media (prefers-reduced-motion: no-preference) {
      [data-contact="menu"] {
        transform: translate3d(0, 0.25rem, 0);
        transition: opacity 200ms ease, transform 200ms ease, visibility 0s linear 200ms;
      }
      [data-contact="menu"][data-open] {
        transform: none;
        transition: opacity 200ms ease, transform 250ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s;
      }
    }
  `;
  document.head.appendChild(style);

  const host = trigger.parentElement;
  host.setAttribute("data-contact", "host");

  const menu = document.createElement("ul");
  menu.id = "contact-menu";
  menu.setAttribute("data-contact", "menu");
  menu.setAttribute("aria-label", "Contact");
  OPTIONS.forEach(({ label, email }) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `mailto:${email}`;
    link.setAttribute("data-contact", "option");
    const name = document.createElement("span");
    name.setAttribute("data-contact", "label");
    name.textContent = label;
    const address = document.createElement("span");
    address.setAttribute("data-contact", "email");
    address.textContent = email;
    link.append(name, address);
    item.append(link);
    menu.append(item);
  });
  host.append(menu);

  const options = Array.from(menu.querySelectorAll('[data-contact="option"]'));

  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", menu.id);

  const isOpen = () => menu.hasAttribute("data-open");

  function open(focusIndex) {
    menu.setAttribute("data-open", "");
    trigger.setAttribute("aria-expanded", "true");
    if (focusIndex !== undefined) options[focusIndex].focus();
  }

  function close(returnFocus) {
    if (!isOpen()) return;
    menu.removeAttribute("data-open");
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (isOpen()) close(false);
    else open(event.detail === 0 ? 0 : undefined);
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      if (isOpen()) close(false);
      else open(0);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open(event.key === "ArrowDown" ? 0 : options.length - 1);
    } else if (event.key === "Escape") {
      close(false);
    }
  });

  menu.addEventListener("keydown", (event) => {
    const index = options.indexOf(document.activeElement);
    const moves = {
      ArrowDown: (index + 1) % options.length,
      ArrowUp: (index - 1 + options.length) % options.length,
      Home: 0,
      End: options.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      options[moves[event.key]].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    }
  });

  options.forEach((option) =>
    option.addEventListener("click", () => close(false)),
  );

  host.addEventListener("focusout", (event) => {
    if (!host.contains(event.relatedTarget)) close(false);
  });

  document.addEventListener("pointerdown", (event) => {
    if (isOpen() && !host.contains(event.target)) close(false);
  });
}

document.addEventListener("DOMContentLoaded", initChronicleContact);
