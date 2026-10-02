export function trackNavigation() {
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = [...document.querySelectorAll(".main-column > section[id]")];
  function update() {
    let active = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= innerHeight * 0.35)
        active = section.id;
    }
    if (
      scrollY > 0 &&
      scrollY + innerHeight >= document.documentElement.scrollHeight - 2
    )
      active = sections.at(-1)?.id;
    for (const link of links) {
      if (link.hash === `#${active}`)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }
  let queued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        update();
        queued = false;
      });
    },
    { passive: true },
  );
  window.addEventListener("resize", update);
  update();
}
