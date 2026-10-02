import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export async function updateGitHub({
  file = new URL("../public/data/github.json", import.meta.url),
  fetchImpl = fetch,
  token = process.env.GITHUB_TOKEN,
} = {}) {
  const username = "itay123458";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "itay100k-profile",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let previous = null;
  try {
    previous = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  async function github(path, options = {}) {
    const response = await fetchImpl(`https://api.github.com${path}`, {
      headers,
      signal: AbortSignal.timeout(15000),
      ...options,
    });
    if (!response.ok) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      const retryAfter = response.headers.get("retry-after");
      const reset = response.headers.get("x-ratelimit-reset");
      const limited =
        response.status === 429 ||
        (response.status === 403 && (remaining === "0" || retryAfter));
      const detail = limited
        ? `rate limited${retryAfter ? `; retry after ${retryAfter}s` : reset ? `; reset at ${new Date(Number(reset) * 1000).toISOString()}` : ""}`
        : `HTTP ${response.status}`;
      throw new Error(`GitHub ${detail}`);
    }
    return response.json();
  }

  try {
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
      const languages = await github(
        `/repos/${username}/${repo.name}/languages`,
      );
      for (const [name, count] of Object.entries(languages))
        bytes[name] = (bytes[name] || 0) + count;
    }

    const updatedAt = new Date().toISOString();
    let contributions = previous?.contributions || null;
    let contributionsUpdatedAt =
      previous?.contributionsUpdatedAt || previous?.updatedAt || null;
    if (token) {
      try {
        const result = await github("/graphql", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query { user(login: "${username}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`,
          }),
        });
        const calendar =
          result.data?.user?.contributionsCollection?.contributionCalendar;
        if (result.errors || !calendar)
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
        contributionsUpdatedAt = updatedAt;
      } catch (error) {
        console.warn(
          `${error.message}; keeping the previous contribution calendar.`,
        );
      }
    }
    const data = {
      updatedAt,
      repositories: user.public_repos,
      stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
      languages: Object.entries(bytes)
        .map(([name, bytes]) => ({ name, bytes }))
        .sort((a, b) => b.bytes - a.bytes),
      contributions,
      contributionsUpdatedAt,
    };
    await mkdir(new URL("./", file), { recursive: true });
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`Updated public GitHub data for ${username}.`);
    return data;
  } catch (error) {
    if (!previous) throw error;
    console.warn(
      `${error.message}; keeping the last GitHub snapshot from ${previous.updatedAt}.`,
    );
    return previous;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  await updateGitHub();
}
