import { mkdir, writeFile } from "node:fs/promises";

const username = "itay123458";
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "itay100k-profile",
};
if (process.env.GITHUB_TOKEN)
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  return response.json();
}

const user = await github(`/users/${username}`);
const repos = [];
for (let page = 1; ; page++) {
  const batch = await github(
    `/users/${username}/repos?per_page=100&page=${page}`,
  );
  repos.push(...batch);
  if (batch.length < 100) break;
}
const bytes = {};
for (const repo of repos.filter((repo) => !repo.fork)) {
  const languages = await github(`/repos/${username}/${repo.name}/languages`);
  for (const [name, count] of Object.entries(languages))
    bytes[name] = (bytes[name] || 0) + count;
}

let contributions = null;
if (process.env.GITHUB_TOKEN) {
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query { user(login: "${username}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    const calendar =
      result.data?.user?.contributionsCollection?.contributionCalendar;
    if (!response.ok || result.errors || !calendar)
      throw new Error("Contribution calendar unavailable");
    const levels = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    };
    contributions = {
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks.map((week) => ({
        contributionDays: week.contributionDays.map((day) => ({
          date: day.date,
          contributionCount: day.contributionCount,
          level: levels[day.contributionLevel] ?? 0,
        })),
      })),
    };
  } catch (error) {
    console.warn(error.message);
  }
}

const data = {
  updatedAt: new Date().toISOString(),
  repositories: user.public_repos,
  stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
  languages: Object.entries(bytes)
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes),
  contributions,
};
const directory = new URL("../public/data/", import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(
  new URL("github.json", directory),
  `${JSON.stringify(data, null, 2)}\n`,
);
console.log(`Updated public GitHub data for ${username}.`);
