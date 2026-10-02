import { icon } from "./icons.js";

export function renderProjects(projects) {
  const container = document.querySelector("#project-list");
  for (const project of projects) {
    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `<div class="project-top"><span class="project-icon">${icon(project.icon)}</span><div><h3 class="project-title"></h3><p class="project-category"></p></div></div><p class="project-description"></p><div class="project-bottom"><ul class="project-tech"></ul></div>`;
    card.querySelector(".project-title").textContent = project.name;
    card.querySelector(".project-category").textContent = project.category;
    card.querySelector(".project-description").textContent =
      project.description;
    if (project.status) {
      const badge = document.createElement("span");
      badge.className = "project-status";
      badge.dataset.status = project.status;
      badge.textContent = project.status;
      card.querySelector(".project-top").append(badge);
    }
    for (const tech of project.stack) {
      const item = document.createElement("li");
      item.textContent = tech;
      card.querySelector(".project-tech").append(item);
    }
    if (project.url) {
      const link = document.createElement("a");
      link.className = "project-link";
      link.href = project.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = project.linkLabel || "View source";
      link.insertAdjacentHTML("beforeend", icon("arrow-up-right"));
      card.querySelector(".project-bottom").append(link);
    } else {
      const note = document.createElement("span");
      note.className = "project-unlinked";
      note.textContent = "More soon";
      card.querySelector(".project-bottom").append(note);
    }
    container.append(card);
  }
}
