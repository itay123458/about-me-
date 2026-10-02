import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { updateGitHub } from "../scripts/update-github.js";

for (const status of [403, 429]) {
  test(`GitHub ${status} rate limits preserve the complete last snapshot without retries`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "itay-github-test-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const file = pathToFileURL(join(directory, "github.json"));
    const snapshot = {
      updatedAt: "2026-10-01T00:00:00Z",
      repositories: 4,
      stars: 1,
      languages: [],
      contributions: { totalContributions: 12, weeks: [] },
    };
    const original = `${JSON.stringify(snapshot)}\n`;
    await writeFile(file, original);
    let calls = 0;
    const result = await updateGitHub({
      file,
      token: null,
      fetchImpl: async () => {
        calls++;
        return new Response("{}", {
          status,
          headers: { "x-ratelimit-remaining": "0", "retry-after": "60" },
        });
      },
    });
    assert.deepEqual(result, snapshot);
    assert.equal(await readFile(file, "utf8"), original);
    assert.equal(calls, 1);
  });
}

test("a failed contribution refresh retains its original data and timestamp", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "itay-github-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = pathToFileURL(join(directory, "github.json"));
  const previous = {
    updatedAt: "2026-10-01T00:00:00Z",
    contributions: { totalContributions: 12, weeks: [] },
  };
  await writeFile(file, JSON.stringify(previous));
  const result = await updateGitHub({
    file,
    token: "test-only",
    fetchImpl: async (url) => {
      if (url.endsWith("/graphql"))
        return new Response('{"errors":[{"message":"Unavailable"}]}');
      return new Response(
        JSON.stringify(url.includes("/repos?") ? [] : { public_repos: 4 }),
      );
    },
  });
  assert.deepEqual(result.contributions, previous.contributions);
  assert.equal(result.contributionsUpdatedAt, previous.updatedAt);
  assert.equal(result.repositories, 4);
});
