const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

test("compressed campaigns preserve Unicode, legacy JSON and damage detection", async () => {
  const { encodeSave, decodeSave } = await import("./src/save-codec.js");
  const sample = { year: 1973, name: "कोलकाता · ₹ · 🏫", history: Array.from({ length: 300 }, (_, year) => ({ year, school: "Technical school", receipt: year / 10 })) };
  const packed = encodeSave(sample);
  assert.deepEqual(decodeSave(packed), sample);
  assert.deepEqual(decodeSave(JSON.stringify(sample)), sample);
  assert.ok(packed.length < JSON.stringify(sample).length / 3);
  assert.throws(() => decodeSave(packed.slice(0, -8)));
  assert.throws(() => decodeSave(packed.replace(/:[0-9a-f]{8}:/, ":00000000:")));
  assert.throws(() => decodeSave(packed.replace("/1:", "/2:")));
});

test("legacy compaction is lossless and preserves unreadable or unwritable saves", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { foundingSaveKey } = await import("./src/journey.js");
  const { World } = await import("./src/scenario.js");
  const game = Campaign.newGame(1946, { end: 1985, preset: "standard" });
  const key = foundingSaveKey(World.key);
  const original = JSON.stringify(game);
  const data = new Map([[key, original], ["unrelated-app-data", "retain"]]);
  const storage = { getItem: (id) => data.get(id) ?? null, setItem: (id, value) => data.set(id, value) };
  assert.equal(Campaign.compactSaves(storage), 1);
  assert.deepEqual(Campaign.load(storage, true), game);
  assert.deepEqual(Campaign.advance(Campaign.load(storage, true)), Campaign.advance(game));
  assert.equal(Campaign.compactSaves(storage), 0);
  assert.equal(data.get("unrelated-app-data"), "retain");
  data.set(key, original);
  assert.equal(Campaign.compactSaves({ ...storage, setItem: () => { throw new Error("Quota"); } }), 0);
  assert.equal(data.get(key), original);
  data.set(key, "unreadable saved data");
  assert.equal(Campaign.compactSaves(storage), 0);
  assert.equal(data.get(key), "unreadable saved data");
});

test("all nine Standard long campaigns fit the shared storage budget", () => {
  const result = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, "tools/save-capacity.mjs")],
    { encoding: "utf8", maxBuffer: 1024 * 1024 }));
  assert.equal(result.campaigns, 9);
  assert.ok(result.totalPlainBytes > 5 * 1024 * 1024);
  assert.ok(result.totalPackedBytes < 2 * 1024 * 1024);
});
