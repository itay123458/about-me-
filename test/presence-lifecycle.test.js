import test from "node:test";
import assert from "node:assert/strict";
import { startPresence } from "../public/js/discord.js";

test("presence polling survives page restoration from the browser history cache", async (t) => {
  const saved = Object.fromEntries(
    ["window", "document", "fetch", "setInterval", "clearInterval"].map(
      (name) => [name, globalThis[name]],
    ),
  );
  t.after(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  });
  const elements = new Map();
  globalThis.window = new EventTarget();
  globalThis.document = Object.assign(new EventTarget(), {
    hidden: false,
    querySelectorAll: () => [],
    querySelector: (selector) => {
      if (!elements.has(selector))
        elements.set(selector, { dataset: {}, replaceChildren() {} });
      return elements.get(selector);
    },
  });
  const timers = new Map();
  let requests = 0;
  globalThis.setInterval = (callback) => {
    timers.set(1, callback);
    return 1;
  };
  globalThis.clearInterval = (id) => timers.delete(id);
  globalThis.fetch = async () => {
    requests++;
    return { ok: true, json: async () => ({ available: false }) };
  };
  startPresence("/api/discord");
  await new Promise(setImmediate);
  window.dispatchEvent(new Event("pagehide"));
  const restored = new Event("pageshow");
  Object.defineProperty(restored, "persisted", { value: true });
  window.dispatchEvent(restored);
  await new Promise(setImmediate);
  assert.equal(
    timers.size,
    1,
    "polling must remain active after history restoration",
  );
  const previous = requests;
  for (const callback of timers.values()) callback();
  await new Promise(setImmediate);
  assert.equal(requests, previous + 1);
});
