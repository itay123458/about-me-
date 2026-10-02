const labels = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
  unknown: "Status unavailable",
};
const activityLabels = {
  0: "PLAYING",
  1: "STREAMING",
  2: "LISTENING TO",
  3: "WATCHING",
  5: "COMPETING IN",
};

function setStatus(status) {
  const value = Object.hasOwn(labels, status) ? status : "unknown";
  for (const element of document.querySelectorAll(".status-dot")) {
    if (element.dataset.status !== value) element.dataset.status = value;
  }
  for (const element of document.querySelectorAll(".presence-label")) {
    const label = element.querySelector("span:last-child");
    if (label.textContent !== labels[value]) label.textContent = labels[value];
  }
}

function renderProfile(data) {
  setStatus(data.available ? data.status : "unknown");
  const connected = document.querySelector(".discord-connection");
  connected.dataset.connected = Boolean(data.available);
  document.querySelector("#discord-connection").textContent = data.available
    ? "Live via Discord · refreshes every 30s"
    : "Discord presence unavailable";
  if (data.user) {
    document.querySelector("#discord-title").textContent =
      data.user.displayName;
    document.querySelector("#discord-username").textContent =
      `@${data.user.username}`;
    document.querySelector(".portrait-handle").textContent =
      `@${data.user.username}`;
    const avatar = data.user.avatarUrl;
    if (avatar && /^https:\/\/cdn\.discordapp\.com\//.test(avatar)) {
      for (const id of ["#discord-avatar", "#hero-avatar"]) {
        const image = document.querySelector(id);
        if (image.src !== avatar) image.src = avatar;
        image.alt = `${data.user.displayName}'s Discord avatar`;
      }
    }
  }
  const customStatus = document.querySelector("#discord-custom-status");
  customStatus.hidden = !data.available || !data.customStatus;
  customStatus.textContent = data.available ? data.customStatus || "" : "";
  const activityCard = document.querySelector("#discord-activity");
  const activity = data.available ? data.activity : null;
  activityCard.hidden = !activity;
  activityCard.replaceChildren();
  if (activity) {
    const label = document.createElement("span");
    label.className = "mono-label";
    label.textContent = activityLabels[activity.type] || "ACTIVITY";
    const name = document.createElement("strong");
    name.textContent = activity.name;
    const details = document.createElement("p");
    details.textContent = [activity.details, activity.state]
      .filter(Boolean)
      .join(" · ");
    activityCard.append(label, name, details);
  }
}

export function startPresence(endpoint) {
  let busy = false;
  async function update() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const response = await fetch(endpoint || "./api/discord", {
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Presence unavailable");
      renderProfile(await response.json());
    } catch {
      renderProfile({ available: false });
    } finally {
      busy = false;
    }
  }
  update();
  setInterval(update, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) update();
  });
}
