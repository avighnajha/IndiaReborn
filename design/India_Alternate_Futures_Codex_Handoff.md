# India: Alternate Futures
## Game Design Document + Codex Implementation Handoff
**Version:** 0.2 | **Status:** Agreed concept and proposed staged roadmap | **Date:** 8 November 2026

> **Core promise:** Start with the India that existed before independence. Build the India that could have existed instead.

## 1. Executive summary
A browser-based, single-player, turn-based strategy game inspired by Civilization's long-range planning, focused entirely on the Indian subcontinent. Players choose a historical region around 1946, navigate independence and political reorganization, and steer development across decades. The first prototype focuses on historical Bihar (including territory now in Jharkhand), with a geographically meaningful map and a lightweight AI-controlled surrounding world. A standard turn advances one year; seasonal phenomena are simulated within the turn. The player is an abstract, persistent governing force ('immortal governor'), not a particular political party or individual. Players directly choose development priorities and projects; outcomes depend on geography, economic interactions, and occasional political events. Historical plausibility is the default, but outcomes are not predetermined.

Section 15 defines the playable outcomes from the first Bihar siting challenge through the India-wide 1946 release. Codex owns the implementation and stage transitions.

## 2. Decision register
### Confirmed by user
- Browser-based game, accessible without installation; Civilization-like, turn-based regional development and alternate history.
- Indian subcontinent is the playable universe; highly detailed geographic variation within regions, not generic state-wide bonuses.
- Start **before independence** and participate in independence-era integration and subsequent state formation/reorganization.
- Playable regions may be larger or smaller than current states; mergers, splits, and evolving borders are central.
- First prototype focuses on **Bihar**, with surrounding areas for meaningful interactions.
- Alternate history is **historically grounded**, with plausible institutional, political, and economic constraints.
- **Multiple victory paths**, not conquest alone.
- Player directly governs development as an abstract, continuous entity, without attachment to an electoral party.
- Politics should be **customizable** in complexity and not dominate gameplay; prioritize long-term influence over granular negotiation.
- Campaigns should target roughly 1–4 hours, with a longer campaign around four hours.
- One-year turns with seasonal simulation and meaningful within-year effects are the accepted working direction.
- Deliver both game design and actionable Codex implementation guidance.

- Use **1946** as the opening year for the full India-wide campaign, as requested in this roadmap update. Earlier Bihar test scenarios can use a simplified timeline.

### Working design recommendations (not immutable commitments)
- Working title: **India: Alternate Futures**.
- Opening chapter length and event cadence through the 1950s.
- A long campaign could span roughly 100 annual turns from 1946. Short scenario endpoints remain open.
- Political complexity presets: Light (initial implementation), Standard, Deep (future); do not promise fully distinct modes in MVP.
- 2D hex map; React + TypeScript + PixiJS; deterministic TypeScript simulation engine separate from rendering.
- Optional political events, AI state actors, and geography-driven emergent economy; development remains the core loop.
- For splits, player chooses one successor region and AI controls the other; for mergers, player continues as merged region. Needs UX validation.
- Initial victory concepts: prosperity, economic, science/education, culture, environmental stewardship, and territorial/diplomatic; prototype only a subset.

### Explicitly open for testing / later decisions
- Exact campaign endpoints, real-time pacing, difficulty and save frequency.
- Hex scale and historical dataset resolution; district boundaries vs gameplay hexes.
- Precise powers of player vs national government and effects of political presets.
- Which development projects and indicators provide the best fun/clarity.
- Which victory paths should ship in first release and their scoring thresholds.
- Degree of real historical event scripting vs systemic emergence.
- Whether a modern-day starting mode and custom map editor should be built after MVP.

## 3. Player fantasy and experience pillars
**Fantasy:** 'What could I have made Bihar if I had guided its development from independence?'
1. **Geography matters:** Kosi floodplain and flood risk; Ganga river corridors; southern plateau and mineral zones; cities and transport routes. No homogeneous Bihar tile modifier.
2. **Scarcity creates choices:** Budget, infrastructure capacity, skilled labor, energy, water, and time compete.
3. **Direct decisions, emergent results:** A factory can be ordered; success, jobs, migration and spillovers are simulated, not guaranteed.
4. **Alternative history, not deterministic reenactment:** Historic events provide context and pressure; choices and state conditions can produce different outcomes.
5. **Politics adds consequence, not paperwork:** Most elections and party dynamics run in the background; rare major events can alter territory and rules.
6. **Replayability:** Distinct plausible development paths, including agriculture, manufacturing, education, transport, and mixed strategies.

## 4. Starting world and historical framing
- Model **British-administered provinces and princely states** as distinct 1946 entity types. Do not incorrectly call every region a kingdom.
- Bihar in 1946 included most of present-day Jharkhand; boundaries and administrative arrangements must be validated against historical sources before public claims.
- Distinguish the **1947 Partition of British India** from **later Indian state reorganization**; do not collapse these into one event.
- The subcontinent may be the eventual world map, but the first prototype can cover Bihar and adjacent regions with simplified off-map actors.
- Historic provinces, princely states, integration, constitution, and linguistic/regional state formation should be modeled as systems with historical reference scenarios, not hard-coded guaranteed outcomes.
- Use careful, evidence-based historical framing, especially for displacement, violence, identities, and contested political events. Avoid treating communities as having innate economic or political personalities.

## 5. Player role and politics
**Player role:** An abstract 'immortal governor' / enduring regional steward, not an individual chief minister or party. Player retains direct agency over development across governments and political transitions.

**Direct controls:** budget priorities, major construction sites, infrastructure corridors, public-service investment, economic incentives, research/education priorities, and responses to occasional major political events.

**Simulated or indirect:** business location and investment, migration, agricultural yields, citizen wellbeing, elections, national decisions, political movements, project effectiveness, and economic spillovers.

**Political presets:**
- **Light (MVP):** political context is mostly background; occasional strategic modifiers and major boundary events. No routine party bargaining or coalition micromanagement.
- **Standard (future):** elections and institutions alter budgets, approvals, and effectiveness while retaining player agency.
- **Deep (future):** optional negotiations, coalitions, and institutional constraints. Avoid committing to this before the basic game proves fun.

Design rule: Never block the player's entire development loop because an AI government changed. Avoid a second AI government independently spending the same budget as the player in MVP; it confuses agency.

## 6. Turn structure and playtime
**Default:** one turn = one year; seasonal simulation inside each turn. 100 turns in a four-hour game implies ~2.4 minutes per turn on average, including inspection and decision-making. A 25-turn short scenario may target roughly an hour. Actual pacing must be playtested.

**Suggested yearly loop:**
1. Review year-start dashboard: finances, growth, wellbeing, pending projects, regional map, and alerts.
2. Inspect geography and district/city opportunities.
3. Set a small number of strategic priorities; allocate a finite budget.
4. Place 0–3 major projects (e.g., roads, irrigation, schools, power, industry).
5. Optionally respond to one consequential event; avoid mandatory repetitive prompts.
6. Click **Advance Year**.
7. Engine simulates seasonal rainfall, crops, project progress, production, trade, migration, public services, political pressure, and finances.
8. Show clear year-end report explaining changes and cause/effect; update map.

**Automation:** Routine maintenance, minor investments and ordinary operations should run automatically, with explicit policy levers where needed.

## 7. Geography and map design
Maintain three independent layers:
1. **Physical geography** (stable base): hex IDs, elevation, slope, soil, river adjacency, water, coast, climate, land cover, resource potential, ecological sites, natural wonders.
2. **Political geography** (dynamic): region IDs, hex/district ownership, boundaries, mergers, splits, autonomy, capital locations.
3. **Human/economic geography** (dynamic): population, settlement, literacy/education, health, jobs, production, infrastructure, migration, environmental conditions.

**Continuity requirement:** Stable hex IDs must never depend on current state ownership. A boundary event updates political membership, not physical hex IDs or existing assets.

**Prototype Bihar features:** Ganga corridor, Kosi river system and floodplain, north Bihar alluvial plains, southern plateau and mineral-bearing zones, Patna and other significant settlements, road/rail corridors. Treat modern terrain and river datasets as sources for physical geography, but reconstruct historical 1946 administrative and economic data separately. Natural wonders should have ecological, tourism, cultural, and scientific consequences, not merely flat bonuses.

**Hex resolution:** choose after performance and legibility tests. Never claim arbitrary hex boundaries exactly reproduce historical district boundaries. Store source provenance and uncertainty.

## 8. Economic and development systems
### Core resources (MVP candidates)
- Treasury / budget: pays for projects and maintenance.
- Food: production and food security.
- Production capacity: construction and industrial throughput.
- Knowledge / human capital: education, productivity, research.
- Infrastructure access: connectivity, power, water (represented by tile/city attributes rather than necessarily as spendable currencies).

### Core indicators
Population, employment, income/output, literacy/education, health, food security, infrastructure coverage, environmental stress, inequality/region disparity, fiscal balance. Keep a small dashboard initially; reveal advanced indicators on demand.

### Core project families
Agriculture and irrigation; roads and rail connectivity; schools/universities; hospitals; electricity; factories/industrial zones; flood resilience; markets and trade facilities. Projects have location, cost, build duration, maintenance, prerequisites, and conditional yields.

### Systems and feedback loops
- Education improves workforce capacity over years, not instantly.
- Industry needs transport, power, workers, and market access; can generate pollution.
- Roads and rail reduce trade friction and change city attractiveness.
- Flood protection has costs, location-specific effects and possible externalities.
- Investment concentration can improve output while increasing regional disparities.
- Population migration responds to opportunities, housing and public services.
- Seasonal monsoon variation affects agriculture and flood/drought exposure.

Use simplified transparent formulas first; do not represent game rules as validated real-world economic forecasts.

## 9. Borders and reorganization
Support state mergers and splits at district or region aggregation level. In standard historically grounded mode, changes require plausible political support and institutional processes; avoid a simple 'paint to annex' action.

**Event inputs:** regional economic disparities, administrative effectiveness, representation, fiscal arrangements, cultural/linguistic identity as historically contextual factors, public support, national constraints.

**Event outcomes:** autonomy reform, investment package, negotiated split, merger, or no change. No single factor automatically forces a split. A historical Jharkhand scenario is a strong prototype event, but it must be conditional rather than guaranteed in 2000.

**On split:** reassign stable districts/hexes, cities, projects, assets, population and revenues to successor regions; allocate shared assets and obligations via explicit rules; let player choose which successor to continue (working recommendation). Preserve game continuity and save compatibility.

## 10. Victory and campaign end
**Confirmed:** multiple victory paths. **Proposed full-game paths:**
- Prosperity: high wellbeing, education, health and broad-based opportunity.
- Economic: sustained productive economy and trade competitiveness.
- Knowledge: education, research and innovation.
- Cultural: learning, heritage and cultural influence.
- Ecological: resilience, conservation and environmental quality.
- Territorial/diplomatic: political integration, alliances and influence without requiring conquest.

Avoid rewarding GDP alone; compare player achievements with starting conditions and scenario difficulty. For MVP implement **prosperity and economic** victory prototypes plus a year-end scorecard, then test whether they generate interesting choices. Allow the player to finish at the campaign endpoint even without an early victory.

## 11. Interface and UX
Main screen is the geographic map, not a spreadsheet of politics. Top bar: year, treasury, food, population, prosperity, alerts. Left contextual panel: selected hex/city/district, terrain and project opportunities. Right or bottom panel: projects and annual priorities. A clear **Advance Year** button and readable report explain what changed and why.

Required flows by the V0.4 gate: new game → Bihar scenario → inspect map → choose a site → build/allocate → advance year → inspect outcomes → save/load → finish a short campaign.

Accessibility: keyboard-accessible controls, contrast, colorblind-safe map encoding, text alternatives to color-only statuses, responsive browser layout. Desktop-first is acceptable for prototype; avoid assuming mobile-friendly complex hex interactions without testing.

## 12. Technology architecture (proposed)
- Frontend: React + TypeScript + Vite.
- Rendering: PixiJS for performant 2D hex tiles, overlays and selection; ordinary React for HUD, menus and panels.
- State management: small store (e.g. Zustand) or simple React state until complexity justifies more.
- Simulation: framework-independent TypeScript module, pure functions where practical; seeded pseudo-randomness for replay/debugging.
- Data: typed JSON/GeoJSON-derived offline assets; validated at build time; separate source-data import scripts from runtime.
- Persistence: browser IndexedDB or localStorage for MVP with versioned save schema; choose based on actual save size.
- Testing: Vitest for engine, invariants and event rules; Playwright for basic end-to-end UI flows.
- Hosting: static web deployment initially. No backend, accounts, multiplayer, or monetization in MVP.

**Suggested module boundaries:**
```
src/
  app/             # application shell, screens, UI state
  map/             # hex geometry, renderer, overlays, hit testing
  engine/          # turns, economy, projects, events, RNG, victory
  data/            # validated scenario and reference data
  scenarios/       # 1946 Bihar setup and scripted/conditional events
  persistence/     # versioned save/load
  ui/              # panels, tooltips, reports, accessibility
  tests/           # engine and integration tests
scripts/           # geographic-data import / transformation
```

## 13. Suggested core types
```ts
type HexId = string;
type RegionId = string;
type DistrictId = string;
type CityId = string;

type Hex = {
  id: HexId;
  q: number; r: number;
  elevationM: number;
  terrain: 'plain' | 'hill' | 'plateau' | 'mountain' | 'wetland' | 'water';
  riverEdges: number[];
  soilFertility: number;
  floodExposure: number;
  mineralPotential: number;
  districtId: DistrictId;
};

type Region = {
  id: RegionId;
  name: string;
  districtIds: DistrictId[];
  treasury: number;
  policyPriorities: Record<string, number>;
};

type Project = {
  id: string;
  kind: string;
  hexId: HexId;
  ownerRegionId: RegionId;
  yearsRemaining: number;
  costRemaining: number;
};

type GameState = {
  schemaVersion: number;
  year: number;
  seed: number;
  playerRegionId: RegionId;
  regions: Record<RegionId, Region>;
  hexes: Record<HexId, Hex>;
  projects: Project[];
  history: TurnReport[];
};
```
Types are illustrative; Codex should refine with normalized ownership tables, population/city records, scenario data, deterministic PRNG state and type-safe event definitions.

## 14. Prototype scope and exclusions
**Bihar MVP at the V0.4 gate:** Bihar + simplified adjacent regions, stylized but geographically recognizable hex map, a few cities, meaningful terrain and rivers, 4–6 project types, 3–5 indicators, annual turn simulation with monsoon variation, simple AI region behavior, a conditional reorganization demonstration, save/load, and a short 15–25-turn test campaign.

**Explicitly out of MVP:** nationwide fully researched 1946 dataset; detailed elections/party simulator; multiplayer; warfare/conquest; real-time seasons; complex constitutional law; full migration micro-simulation; all natural wonders; user-generated map editor; mobile-first UX; historical economic prediction claims; production-grade AI opponents.

## 15. Staged roadmap from Bihar to India

The V0.1–V1.0 labels describe proposed playable outcomes. V0.1–V0.4 together deliver the Bihar MVP. V0.5–V0.8 prove the systems that make a national campaign possible. V0.9 integrates them and V1.0 is the release gate. The gates below are the baseline for playtesting, and version labels carry no date commitments.

### How Codex owns delivery

Codex is the technical lead. Choose the stack, rendering, data structures, simulation methods, testing, and migration strategy. The examples in Sections 12–13 are optional starting points. Codex can reorder, merge, or split stages, or move a small risk test forward when evidence warrants it. Preserve every required player outcome, its prerequisites, and a runnable build at each milestone. Record what moved and why. Raise changes to confirmed product decisions, including player agency, historical grounding, and geographic ambition, for product review. Routine engineering choices belong to Codex.

For every gate, leave a browser build or documented clean launch path, a playable scenario, a short playtest script with expected outcomes, and evidence against the checks below and in Section 16 as applicable. Preserve a known-good build while changing the next one. Record what passed, any approximations or gaps, and the evidence that supports the next stage. If a gate fails, fix it or split off a smaller playable outcome before advancing.

Keep geography and jurisdiction distinct, use stable identities for places and projects, and keep scenario assumptions traceable. Prove new systems on one small scenario before generalizing. Add data, simulation detail, and performance work when they improve a player decision or resolve a measured limit. Treat synthetic data as provisional and label it in play.

### V0.1 — Bihar map and siting challenge

**Intention.** Show that geography can guide the first player decision.

**Player experience.** Explore Bihar, compare a river plain and a southern plateau site, and choose a location for a starter project. See the trade-off and replay the challenge.

**Scope.** A small browser scenario covering recognizable historical Bihar, including territory now in Jharkhand. Include selectable terrain, rivers, settlement markers, a terrain or ownership view, and one guided siting decision with feedback.

**Acceptance.** From a clean launch, inspect two candidate sites, see why their suitability differs, place the starter project on a legal site, and reach a result screen. Restart and demonstrate a different outcome at the other site. The starting map and provisional data are clearly labeled.

**Dependencies.** A small map fixture, a terrain legend, and a transparent suitability rule are enough. Scaffolding is work within this milestone.

**Future constraints.** Physical site identity survives political change. Defer a nationwide data pipeline, full budgets, and detailed simulation.

### V0.2 — Annual development loop

**Intention.** Make scarce funds and project timing create decisions worth revisiting each year.

**Player experience.** Choose where to spend, advance the year, watch construction progress, and use the report to plan the next investment.

**Scope.** A short multi-year challenge with treasury, a few contrasting project types, site and cost rules, annual income, project completion, and a simple objective or end summary.

**Acceptance.** Play at least five years to the summary. Verify that a valid build charges the displayed cost once, an unaffordable or invalid build is rejected without changing state, and a completed project changes the stated outcome. Compare two opening budgets and explain their different results from the reports.

**Dependencies.** The V0.1 placement flow, map context, and an initial project and budget fixture.

**Future constraints.** Keep costs, eligibility, and outcomes explainable. Defer full supply chains, detailed politics, and nationwide actors.

### V0.3 — Geography and economic consequences

**Intention.** Prove that several development strategies can work under different conditions.

**Player experience.** Weigh food security and flood exposure against industrial growth, connectivity, and slower returns from education.

**Scope.** Expand the Bihar scenario with agriculture, infrastructure, industry, education, a small set of indicators, and seasonal effects resolved within the annual turn. Finish a test scenario with a comparative scorecard.

**Acceptance.** From the same starting conditions and seed, run two different strategies for at least ten turns. Their trade-offs are visible in the reports. Repeating the same choices reproduces the outcome. Show a seasonal effect that varies by geography and a delayed payoff that affects a later decision.

**Dependencies.** A working annual loop, site attributes, and a small set of documented economic assumptions.

**Future constraints.** Use legible rules and tuneable inputs. Keep geographic effects portable across regions and avoid presenting modeled values as historical measurements or forecasts.

### V0.4 — Complete Bihar MVP campaign

**Intention.** Determine whether a new player wants to finish and replay a Bihar campaign.

**Player experience.** Start without developer help, pursue an economic or prosperity objective, respond to light neighbor pressure, and understand the end result.

**Scope.** A 15–25 turn playtest campaign, onboarding, a simplified adjacent world with lightweight AI, two prototype victory paths, local save and resume, and balance and accessibility review. Include the original prototype’s conditional reorganization demonstration in the campaign or a separate runnable test scenario.

**Acceptance.** A new player completes the browser campaign, resumes a saved game, and reaches a clear result with or without early victory. Show a viable run for each prototype path and matching results after save, load, and advance. Demonstrate the boundary case and verify that places and projects survive. Record pacing and clarity issues from playtesting.

**Dependencies.** The V0.3 decision loop, meaningful goal indicators, baseline map provenance, and a scoped event fixture.

**Future constraints.** The boundary demonstration can use a narrow scenario-specific rule. Leave the full political system, historical opening, and nationwide content for later. Document save compatibility.

### V0.5 — Playable 1946 opening

**Intention.** Make independence-era change felt through regional decisions and consequences.

**Player experience.** Begin in 1946, learn the regional and national context, make investments under changing institutions, and play on after the transition.

**Scope.** A complete Bihar opening scenario with period-appropriate entities, a small set of sourced events, and a short post-transition chapter. Represent the difference between independence and Partition, integration, and later state reorganization. Use adjacent or off-map actors where adequate.

**Acceptance.** Start in 1946, play through the opening and reach an endpoint. Identify which events represent documented history, which details are approximations, and where scenario conditions or decisions allow divergence. Exercise at least two plausible branches and confirm both leave development playable.

**Dependencies.** Bihar campaign flow, historical scenario research, a timeline, and review of sensitive material.

**Future constraints.** Keep event conditions and dates independent of modern state boundaries. Preserve the player’s regional role across constitutional changes. Apply the historical and ethical review in Section 17.

### V0.6 — Political reorganization

**Intention.** Make changing borders consequential without interrupting the development campaign.

**Player experience.** See why a reorganization is possible, understand what each option changes, and continue governing after a settlement.

**Scope.** Build on the MVP demonstration with a conditional Bihar–Jharkhand scenario and a merger case. Cover negotiated change and an alternative with unchanged borders. Explain continuity, fiscal obligations, and the playable successor under the selected policy.

**Acceptance.** Play through a split, a merger, and a no-change branch across test scenarios. Verify unique ownership, retained physical places and project progress, explicit allocation of assets and liabilities, and a working next turn after saving and reloading each outcome.

**Dependencies.** The MVP boundary demonstration and persistence rules, historical review, and a tested ownership and continuation policy. The full opening is useful context and can proceed independently.

**Future constraints.** Apply the same ownership and continuity rules outside Bihar. Keep exact successor UX open to playtesting. Avoid a general constitutional simulator.

### V0.7 — Multiple playable regions

**Intention.** Show that Bihar’s development loop transfers to regions with different geography and starting conditions.

**Player experience.** Choose a region, discover different opportunities and constraints, and interact with neighbors across a shared map.

**Scope.** Add at least two playable regions with contrasting physical and economic geography and a complete short scenario for each. Extend regional AI and cross-border interactions far enough to affect a player decision. Add a repeatable content validation process.

**Acceptance.** Complete a campaign from each new start and replay Bihar. Demonstrate different sensible openings, consistent cross-border links, and visible effects from a neighboring actor. Check map and turn responsiveness on a documented target browser and representative map size.

**Dependencies.** Bihar playtest evidence, stable regional and place references, source coverage for the new starts, and reusable scenario rules.

**Future constraints.** Give regions distinct terrain, institutions, and starting conditions without cloning Bihar or assigning innate traits. Establish a national coverage plan and track missing data before scaling content.

### V0.8 — Interregional systems and optional politics

**Intention.** Make trade, migration, diplomacy, and political settings change development decisions across regions.

**Player experience.** Anticipate what neighbors will do, weigh internal investment against cross-border cooperation, and choose how much political complexity to manage.

**Scope.** A multi-region campaign with legible trade and migration, bounded AI responses, consequential diplomatic choices, and at least two distinguishable political settings for playtesting. Exact preset names and depth remain open.

**Acceptance.** In paired runs, show how a change in access or policy affects flows and outcomes on both sides of a border. Exercise a diplomatic choice with a visible cost or benefit. Complete the scenario under both political settings and show that each preserves meaningful development agency. Reports attribute the major effects.

**Dependencies.** Shared map and neighbors, comparable economic indicators, and rules for national and regional authority.

**Future constraints.** Validate individual systems before adding combinations. Keep politics optional in depth, protect turn pace, and use observed AI weaknesses to guide improvements.

### V0.9 — India wide campaign beta

**Intention.** Prove the full game fits together at national scale.

**Player experience.** Select a historical region, start in 1946, develop through political transitions, and pursue a distinct victory path over a chosen campaign length.

**Scope.** Cover the whole intended India-wide map with clearly represented neighboring actors, a national 1946 setup, a launch roster of regional starts, competitive AI, multiple victory paths, short and long campaign settings, and complete campaign UI.

**Acceptance.** Finish short and long campaigns from contrasting regions. Demonstrate at least two viable victory strategies and a time-limit finish. Verify save and resume across transitions, review the map for gaps and misleading period boundaries, and measure pacing, map responsiveness, and turn times on the declared browser targets.

**Dependencies.** Scalable content loading, historical coverage and sourcing, proven reorganization and interregional systems, and a playtested candidate roster and win set.

**Future constraints.** Clarify which neighboring subcontinent regions are playable and which are represented at launch through product review. Preserve the broader subcontinent vision. Use the beta evidence to fix bottlenecks before expanding breadth.

### V1.0 — India wide 1946 release

**Intention.** Deliver a replayable, historically grounded regional strategy game at India-wide scale.

**Player experience.** Choose a region and campaign settings, see how local geography and national change shape decisions, and end with an account of what the region became.

**Scope.** Stabilize the V0.9 game with the reviewed launch roster, data and event coverage, political settings, victory paths, onboarding, accessibility, balance, and supported-browser save behavior.

**Acceptance.** Run a release playthrough matrix across launch regions, campaign lengths, and political settings. Cover victory and time-limit endings, boundary changes, and save recovery or documented incompatibility. Playtest shorter campaigns and the longer campaign against the roughly 1–4 hour target. Verify agreed performance targets, historical and licensing review, accessible core flows, and resolution of progression blockers.

**Dependencies.** Beta playtest results, agreed launch coverage, declared browser and save support, and a reviewed set of historical and accessibility checks.

**Future constraints.** Protect saved campaigns and the readable annual loop when adding content. Consider extra scenarios, deeper politics, or tools after release based on player need and product direction.

## 16. Testing and simulation invariants
- Seed + initial state + action sequence produces identical outcomes.
- Each hex belongs to exactly one political owner or is explicitly unassigned.
- Splits/mergers preserve physical tiles and assets, with explicit allocation of fiscal liabilities.
- Treasury/project costs never silently become invalid or negative unless debt is modeled.
- No project can be placed on invalid terrain or beyond permitted jurisdiction.
- Save → load → advance produces same result as uninterrupted play.
- Annual reports reconcile major changes in treasury, population, output and projects.
- Flood and resource effects vary by geographic attributes, not arbitrary modern-state stereotypes.

## 17. Data provenance and ethical design
Prioritize verifiable geographic sources (elevation, hydrography, land cover, geological/resource information) and authoritative historical maps, census and administrative records. Record licenses, source dates, coordinate reference systems, transformations and uncertainty. Do not fabricate precise 1946 district metrics; use clearly marked approximations where necessary. Avoid innate cultural/personality bonuses tied to regional populations. Model economic advantages through geography, institutions, history and changeable investment. Historical atrocities and population displacement should be treated respectfully, not as casual reward mechanics.

## 18. First Codex task (copy/paste)
> You are the technical lead for India: Alternate Futures. Read the decision register and roadmap, inspect the project, and deliver V0.1 as a runnable browser scenario. A player must be able to inspect two contrasting Bihar sites, choose a legal location for a starter project, see its result, and replay the alternative. Use the simplest suitable stack and clearly label provisional map data. Keep place identity independent of jurisdiction. Verify the V0.1 gate, document how to launch and play, and record the result and the smallest next increment. Choose the architecture and stage sequencing within the product constraints. Raise changes to confirmed product outcomes for review.

## 19. Open design questions for playtesting
1. Exact prototype map footprint and tile scale: district-level abstractions or denser hexes?
2. Which 4–6 initial projects yield the most meaningful early choices?
3. Should a reorganization event be in the first 20-turn slice or a dedicated test scenario?
4. What should the first player-facing win screen show beyond score?
5. How many decisions per turn feel right after a 30-minute playtest?

---
**Product guardrail:** Build a fun, explainable strategy game first. Add simulation fidelity only when it improves player decisions.
