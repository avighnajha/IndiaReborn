const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.location = { search: "?region=mayurbhanj" };

test("Mayurbhanj reaches the campaign ending with either merger settlement", async () => {
  const { Campaign } = await import("./src/campaign.js");
  const { campaignName } = await import("./src/journey.js");
  for (const settlement of ["merger", "compact"]) {
    let game = Campaign.newGame(1946, { end: 1965, preset: "standard" });
    for (let year = 1946; year <= 1965; year++) {
      let decision;
      while ((decision = Campaign.nextDecision(game))) {
        const choice = decision.id === "mayurbhanj-merger" ? settlement : Object.keys(decision.choices)[0];
        const next = Campaign.decide(game, choice);
        assert.notEqual(next, game, decision.title);
        game = next;
      }
      game = Campaign.advance(game);
      assert.equal(game.year, year + 1);
    }
    assert.equal(campaignName(game), settlement === "merger" ? "Orissa" : "Mayurbhanj");
    assert.equal(Campaign.score(game).latest.year, 1965);
  }
});
