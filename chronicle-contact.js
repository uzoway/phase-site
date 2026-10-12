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

    [data-contact="trigger"][aria-expanded="true"]::before {
      transform: scaleX(1);
      transform-origin: left;
    }

    [data-contact="menu"] {
      --contact-cyan: var(--_color---primary--cyan, #15b6de);
      --contact-line: rgba(21, 182, 222, 0.25);
      position: absolute;
      left: 0;
      bottom: calc(100% + 1rem);
      z-index: 5;
      width: 19rem;
      max-width: calc(100vw - 2.5rem);
      padding: 0.5rem 1.25rem;
      background-color: var(--_color---primary--black, #000);
      border: 1px solid var(--contact-line);
      text-align: left;
      visibility: hidden;
      opacity: 0;
      transition: opacity 200ms ease, visibility 0s linear 200ms;
    }

    [data-contact="menu"][data-open] {
      visibility: visible;
      opacity: 1;
      transition: opacity 200ms ease, visibility 0s;
    }

    [data-contact="corner"] {
      position: absolute;
      width: 0.375rem;
      aspect-ratio: 1;
      background-color: var(--contact-cyan);
    }

    [data-contact="corner"]:nth-child(1) { top: -0.1875rem; left: -0.1875rem; }
    [data-contact="corner"]:nth-child(2) { top: -0.1875rem; right: -0.1875rem; }
    [data-contact="corner"]:nth-child(3) { bottom: -0.1875rem; left: -0.1875rem; }
    [data-contact="corner"]:nth-child(4) { bottom: -0.1875rem; right: -0.1875rem; }

    [data-contact="list"] {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    [data-contact="list"] > li + li {
      border-top: 1px solid var(--contact-line);
    }

    [data-contact="option"] {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 2.75rem;
      padding: 0.875rem 0;
      color: var(--_color---primary--white, #fff);
      text-decoration: none;
    }

    [data-contact="option"]:focus-visible {
      outline: 0.1875rem solid var(--contact-cyan);
      outline-offset: 0.25rem;
    }

    [data-contact="dot"] {
      flex: none;
      align-self: flex-start;
      width: 0.5rem;
      aspect-ratio: 1;
      margin-top: 0.3rem;
      background-color: var(--contact-cyan);
      transition: background-color 300ms ease;
    }

    [data-contact="text"] {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.375rem;
      min-width: 0;
    }

    [data-contact="label"] {
      position: relative;
      align-self: flex-start;
      font-family: var(--_typography---fonts--font-a-500, sans-serif);
      font-size: 1rem;
      line-height: 1.1;
    }

    [data-contact="label"]::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -0.125rem;
      width: 100%;
      height: 1px;
      background-color: currentColor;
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 300ms ease-in-out;
    }

    [data-contact="email"] {
      font-family: var(--_typography---fonts--font-c, monospace);
      font-size: 0.75rem;
      line-height: 1.2;
      color: var(--contact-cyan);
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    [data-contact="option"]:is(:hover, :focus-visible) [data-contact="dot"] {
      background-color: var(--_color---primary--white, #fff);
    }

    [data-contact="option"]:is(:hover, :focus-visible) [data-contact="label"]::after {
      transform: scaleX(1);
      transform-origin: left;
    }

    @media (prefers-reduced-motion: no-preference) {
      [data-contact="menu"] {
        clip-path: inset(calc(100% + 0.5rem) -0.5rem -0.5rem -0.5rem);
        transition:
          opacity 200ms ease,
          clip-path 400ms cubic-bezier(0.16, 1, 0.3, 1),
          visibility 0s linear 400ms;
      }

      [data-contact="menu"][data-open] {
        clip-path: inset(-0.5rem);
        transition:
          opacity 200ms ease,
          clip-path 450ms cubic-bezier(0.16, 1, 0.3, 1),
          visibility 0s;
      }
    }
  `;
  document.head.appendChild(style);

  const host = trigger.parentElement;
  host.setAttribute("data-contact", "host");

  const make = (tag, part, text) => {
    const el = document.createElement(tag);
    if (part) el.setAttribute("data-contact", part);
    if (text) el.textContent = text;
    return el;
  };

  const menu = make("div", "menu");
  menu.id = "contact-menu";
  for (let i = 0; i < 4; i++) {
    const corner = make("span", "corner");
    corner.setAttribute("aria-hidden", "true");
    menu.append(corner);
  }
  const list = make("ul", "list");
  list.setAttribute("aria-label", "Contact options");

  OPTIONS.forEach(({ label, email }) => {
    const link = make("a", "option");
    link.href = `mailto:${email}`;
    const dot = make("span", "dot");
    dot.setAttribute("aria-hidden", "true");
    const text = make("span", "text");
    text.append(make("span", "label", label), make("span", "email", email));
    link.append(dot, text);
    const item = document.createElement("li");
    item.append(link);
    list.append(item);
  });

  menu.append(list);
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
