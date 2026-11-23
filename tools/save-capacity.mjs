import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const regionFlag = process.argv.indexOf("--region");
if (regionFlag >= 0) {
  const region = process.argv[regionFlag + 1];
  globalThis.location = { search: `?region=${region}` };
  const { Campaign } = await import("../src/campaign.js");
  const { World } = await import("../src/scenario.js");
  const { foundingSaveKey } = await import("../src/journey.js");
  const { approveProgramme } = await import("../src/programmes.js");
  const { encodeSave, decodeSave } = await import("../src/save-codec.js");
  let game = approveProgramme(Campaign.newGame(1946, { end: 1985, preset: "standard" }), "food");
  while (game.year <= 1985) {
    let decision;
    while ((decision = Campaign.nextDecision(game))) {
      const choice = Object.keys(decision.choices).find((key) => (decision.priced?.[key] ?? 0) <= game.cash);
      assert.ok(choice, `${region}: ${decision.title}`);
      game = Campaign.decide(game, choice);
    }
    const next = Campaign.advance(game);
    assert.equal(next.year, game.year + 1, `${region}: advance`);
    game = next;
  }
  const packed = encodeSave(game);
  assert.deepEqual(decodeSave(packed), game);
  assert.equal(game.reports.length, 40);
  process.stdout.write(JSON.stringify({ region: World.key, key: foundingSaveKey(World.key), packed,
    plainChars: JSON.stringify(game).length, packedChars: packed.length, reports: game.reports.length }));
} else {
  const regions = ["bihar", "orissa", "mayurbhanj", "west-bengal", "bombay", "punjab", "madras", "central", "assam"];
  const records = regions.map((region) => JSON.parse(execFileSync(process.execPath,
    [fileURLToPath(import.meta.url), "--region", region], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })));
  const plain = records.reduce((sum, record) => sum + (record.key.length + record.plainChars) * 2, 0);
  const packed = records.reduce((sum, record) => sum + (record.key.length + record.packedChars) * 2, 0);
  assert.ok(plain > 5 * 1024 * 1024, "The benchmark must reproduce the uncompressed storage problem.");
  assert.ok(packed < 2 * 1024 * 1024, "Nine long campaigns must leave room under a 5 MiB budget.");
  const outputFlag = process.argv.indexOf("--output");
  if (outputFlag >= 0) writeFileSync(process.argv[outputFlag + 1], JSON.stringify(records), "utf8");
  process.stdout.write(JSON.stringify({ campaigns: records.length, totalPlainBytes: plain, totalPackedBytes: packed,
    records: records.map(({ region, plainChars, packedChars, reports }) => ({ region, plainChars, packedChars, reports })) }) + "\n");
}
