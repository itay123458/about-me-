const paths = {
  "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
  "arrow-down": '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M2 12v4m20-4v4m-13 0h6"/><path d="M8 12h.01M16 12h.01"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  gamepad:
    '<path d="M7 7h10c3 0 4 3 5 10 .5 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.5 1-4-2 1-7 2-10 5-10Z"/><path d="M7 10v5m-2.5-2.5h5M16 11h.01M19 14h.01"/>',
  zap: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16"/>',
  terminal:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
};

const brands = {
  github:
    '<path fill="currentColor" d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.76-.24.76-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.5-1.3-1.25-1.64-1.25-1.64-1.03-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.5-.29-5.13-1.25-5.13-5.54 0-1.23.44-2.23 1.16-3.01-.11-.29-.5-1.43.11-2.98 0 0 .95-.3 3.08 1.15a10.72 10.72 0 0 1 5.61 0c2.14-1.45 3.08-1.15 3.08-1.15.62 1.55.23 2.7.12 2.98.72.78 1.15 1.78 1.15 3.01 0 4.3-2.63 5.25-5.14 5.53.4.35.77 1.03.77 2.08v3.1c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/>',
  discord:
    '<path fill="currentColor" d="M19.74 4.45a18.2 18.2 0 0 0-4.55-1.4c-.2.37-.43.87-.59 1.27a16.9 16.9 0 0 0-5.2 0c-.16-.4-.4-.9-.6-1.27a18.2 18.2 0 0 0-4.54 1.4C1.38 8.74.6 12.91.99 17.03a18.6 18.6 0 0 0 5.59 2.83c.45-.62.85-1.28 1.2-1.98-.66-.25-1.29-.56-1.88-.92l.46-.36c3.61 1.67 7.53 1.67 11.1 0l.46.36c-.6.36-1.23.67-1.89.92.35.7.75 1.36 1.2 1.98a18.6 18.6 0 0 0 5.58-2.83c.46-4.77-.78-8.9-3.07-12.58ZM8.52 14.5c-1.08 0-1.97-1-1.97-2.23s.86-2.23 1.97-2.23 1.99 1 1.97 2.23c0 1.23-.87 2.23-1.97 2.23Zm6.96 0c-1.08 0-1.97-1-1.97-2.23s.86-2.23 1.97-2.23 1.99 1 1.97 2.23c0 1.23-.86 2.23-1.97 2.23Z"/>',
};

export function icon(name) {
  const body = brands[name] || paths[name] || paths.code;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function renderIcons(root = document) {
  for (const element of root.querySelectorAll("[data-icon]"))
    element.innerHTML = icon(element.dataset.icon);
}
