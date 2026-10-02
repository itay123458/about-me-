import test from "node:test";
import assert from "node:assert/strict";
import { publicProfile } from "../server/profile.js";
import { createProfileServer } from "../server/http.js";

const user = {
  username: "itay100k",
  globalName: "Itay",
  email: "private",
  token: "private",
  displayAvatarURL: () => "https://cdn.discordapp.com/avatars/example.png",
};
const presence = {
  status: "online",
  activities: [
    { type: 4, state: "Building a website", secrets: { join: "private" } },
    {
      type: 0,
      name: "Minecraft",
      details: "Playing",
      state: "Survival",
      party: { id: "private" },
    },
  ],
};

test("the public profile exposes only approved user and activity fields", () => {
  const result = publicProfile(user, presence, true);
  assert.deepEqual(result.user, {
    username: "itay100k",
    displayName: "Itay",
    avatarUrl: "https://cdn.discordapp.com/avatars/example.png",
  });
  assert.deepEqual(result.activity, {
    type: 0,
    name: "Minecraft",
    details: "Playing",
    state: "Survival",
  });
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("a disconnected Gateway never reports a cached online status or activity", () => {
  const result = publicProfile(user, presence, false);
  assert.equal(result.status, "unknown");
  assert.equal(result.customStatus, null);
  assert.equal(result.activity, null);
});

test("a verified member without a presence is offline; an unknown member is unavailable", () => {
  assert.equal(publicProfile(user, null, true).status, "offline");
  assert.equal(publicProfile(null, null, false).status, "unknown");
});

test("HTTP routes keep secrets private and restrict cross-origin access", async (t) => {
  const server = createProfileServer(
    () => publicProfile(user, presence, true),
    "https://itay123458.github.io",
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e%2f.env`)).status, 404);
  assert.equal((await fetch(`${base}/api/discord/another-user`)).status, 404);
  assert.equal(
    (await fetch(`${base}/api/discord`, { method: "POST" })).status,
    405,
  );
  const allowed = await fetch(`${base}/api/discord`, {
    headers: { Origin: "https://itay123458.github.io" },
  });
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "https://itay123458.github.io",
  );
  assert.equal(JSON.stringify(await allowed.json()).includes("private"), false);
  const denied = await fetch(`${base}/api/discord`, {
    headers: { Origin: "https://example.org" },
  });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal((await fetch(`${base}/about-me/api/discord`)).status, 200);
  assert.equal(
    (await fetch(`${base}/about-me`, { redirect: "manual" })).status,
    308,
  );
});
