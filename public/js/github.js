const colors = {
  JavaScript: "#e5c96b",
  TypeScript: "#8cb6f3",
  HTML: "#e6a083",
  CSS: "#b497e7",
  Python: "#87bda2",
  Other: "#9295a7",
};

export async function renderGitHub() {
  try {
    const response = await fetch(
      new URL("../data/github.json", import.meta.url),
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error("GitHub snapshot unavailable");
    const data = await response.json();
    document.querySelector("#stat-repos").textContent = data.repositories;
    document.querySelector("#stat-stars").textContent = data.stars;
    const calendar = data.contributions;
    const chart = document.querySelector("#contribution-chart");
    chart.replaceChildren();
    if (calendar) {
      document.querySelector("#stat-contributions").textContent =
        calendar.totalContributions.toLocaleString();
      const grid = document.createElement("div");
      grid.className = "heatmap";
      for (const week of calendar.weeks) {
        const column = document.createElement("div");
        column.className = "heatmap-week";
        for (const day of week.contributionDays) {
          const square = document.createElement("span");
          square.className = "heatmap-day";
          square.dataset.level = day.level;
          square.title = `${day.date}: ${day.contributionCount} contributions`;
          column.append(square);
        }
        grid.append(column);
      }
      const summary = document.createElement("p");
      summary.className = "sr-only";
      summary.textContent = `${calendar.totalContributions} contributions over the past year. The calendar shows daily contribution counts.`;
      chart.append(summary, grid);
      grid.setAttribute("aria-hidden", "true");
    } else {
      chart.innerHTML =
        '<p class="data-note">Contribution history is currently unavailable. <a href="https://github.com/itay123458">View it on GitHub.</a></p>';
    }
    document.querySelector("#github-updated").textContent =
      `Updated ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(data.updatedAt))}`;
    const total = data.languages.reduce(
      (sum, language) => sum + language.bytes,
      0,
    );
    for (const language of data.languages) {
      const percent = total ? (language.bytes / total) * 100 : 0;
      const color = colors[language.name] || colors.Other;
      const bar = document.createElement("span");
      bar.style.width = `${percent}%`;
      bar.style.backgroundColor = color;
      document.querySelector("#language-bar").append(bar);
      const item = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "language-dot";
      dot.style.backgroundColor = color;
      dot.setAttribute("aria-hidden", "true");
      const value = document.createElement("span");
      value.className = "language-percent";
      value.textContent = `${percent.toFixed(1)}%`;
      item.append(dot, document.createTextNode(`${language.name} `), value);
      document.querySelector("#language-list").append(item);
    }
    if (!total)
      document.querySelector("#language-note").textContent =
        "No language data available yet.";
  } catch {
    document.querySelector("#contribution-chart").innerHTML =
      '<p class="data-note">GitHub activity is temporarily unavailable. <a href="https://github.com/itay123458">View my GitHub profile.</a></p>';
    document.querySelector("#language-note").textContent =
      "Language data is temporarily unavailable.";
  }
}
