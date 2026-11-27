# India Alternate Futures Current Design

Updated 24 November 2026. The original design and [implementation handoff](India_Alternate_Futures_Codex_Handoff.md) are the baseline. The decisions below record where subsequent play and feedback have changed the approach. Items marked proposed are ready for discussion before implementation.

## Core thesis

**Start with the India that existed before independence. Build the India that could have existed instead.** Choose a province or princely state in 1946 and guide it through independence, political reorganization and decades of development. Its rivers, terrain, towns and trading partners shape which futures are plausible. The choices should change what the region becomes by the end of the campaign.

- **Geography gives each start a reason to play differently.** Show where programmes work, which places benefit, and how floodplains, markets and new boundaries change the result. Use the main map for the decision and reveal local detail as the player zooms in.
- **The player sets direction at Cabinet scale.** Choose coverage, funding, partners and where to build lasting capability. Let the works office handle individual sites. Education, Food & Water and Trade & Industry each support deeper investment and combinations, with meaningful timing and opportunity costs.
- **History supplies constraints and opportunities.** Independence and reorganization change responsibilities, assets and access. Ground offers and rupee amounts in the period. Give the player plausible terms, agency over the response and a visible result under either political preset.
- **The map and brief show what changed and why.** Connect a decision to places, then to harvest, workforce, production or access, then to future choices. Headline the result and keep the calculation available on demand. Use the same department labels and icons throughout, with colour as reinforcement.
- **The ending tells the story of the region.** Reward different, viable outcomes and show how earlier commitments helped or constrained them. Players can combine departments. A routine sequence through every affordable programme should still leave meaningful choices about the region's future.

For every gameplay sprint, name the player's decision, the plausible alternative and what the player can observe after each. Review both routes from the same starting position in the production build when feasible. Capture an immediate cost, an outcome on the map or in the brief, and a later opportunity affected by the choice. Give modeling detail priority when it changes a decision, explains an outcome or resolves a release requirement. National coverage, historical and map rights review, accessibility, performance and human playtime retain their release gates.

## Design commitments

| Area | Current decision | Relationship to original handoff |
| --- | --- | --- |
| Campaign and agency | One year per turn, with seasonal effects. The player is a continuing regional steward. Nine campaigns start in 1946. Punjab's short campaign ends in 1970, five years later than the other short campaigns. All long campaigns finish in 1985. | Retains the decision register and annual cadence in sections 2, 5 and 6. The founding campaign has separate autosaves from the earlier regional scenarios. |
| Development | Players approve regional programmes, set budget and policy, and decide whether to accelerate delivery. The works office places individual works. | Changes the interaction in sections 5, 6 and 11 from routine placement to commitments at corridor, district or basin scale. The underlying geography still affects results. |
| Seasonal pressure | The annual monsoon drives local food production. In the [1965–66 drought](food-crisis.md), Bihar and Orissa can rely on earlier farms and stores or purchase finite Union deliveries. Connected stores throughout the campaign can send surplus to simulated shortages through routes with capacity. | Makes weather, supply and the consequences of earlier storage and market investments visible in the map and brief. |
| Finance and politics | Show nominal rupees in lakh and crore. Use sourced fiscal anchors for the playable development envelope. Keep occasional negotiations and conditional political events. | Retains scarcity, player agency and light political management. [Fiscal source notes](fiscal-sources.md) distinguish historical records from modeled allocations and project prices. |
| Map and territories | Keep physical sites, period jurisdictions, and development history separate. Regional maps show continuous terrain, sourced geographic features and census-derived state outlines that change with the planning year. | Retains sections 4, 7, 9 and 17. Site identities and saves remain stable. [Production map notes](map-production.md). |
| Outcomes | Prosperity and industrial development are the two starting victory paths. Founding campaigns assess connected production across four of the final five years. The ending compares reserves, training and output with the opening years and shows actual partnership and trade results. The optional regional mandate remains a separate commitment. | Retains multiple victory paths and historically plausible divergence in sections 3 and 10. |
| Release scope | The founding build runs from the national atlas through independence, reorganization, regional development and a scorecard. Nine playable starts interact with trading partners and a linked domestic food market from 1946 under Standard politics. | Launch roster review, wider competitive systems, playtime validation and public-release checks remain open against section 15. |

## National coverage

The atlas and Domestic market distinguish playable starts, annual market accounts and contextual territories. The atlas previews the actual graph by year. Archived reports use only their saved accounts. Manipur and Tripura have separate annual economies from 1950, with limited roads to Imphal from 1950 and Agartala from 1955. Arunachal Pradesh enters the market model in 1972 through Bomdila. Himachal enters in 1948, the scoped Jammu exchange in 1949 and domestic Sikkim in 1975. Jammu gains rail capacity in 1973 after the station opens in 1972. From 1950 Port Blair has its own account, sea routes and a choice of food or timber charters for Calcutta and Madras. These are modeled market economies with dated references for transitions and access. Coverage work continues for the other islands, coastal enclaves and territory beyond the Jammu exchange. See the [national coverage review](national-coverage.md).

Nearby and domestic AI use a market share of historical fiscal references where available. Revenue receipts and annual Plan outlays retain separate measures and model rates. Allowances post once, before works commitments; operating and trade receipts stay separate. No future-year reference funds an earlier turn. The ledger exposes the year and source and identifies modeled allowances in missing periods. Opening cash, portfolio shares and prices remain game values. [AI fiscal model](market-fiscal-research.md)

Player and AI final-period profiles now share later revenue observations, retaining more precise equal-year regional accounts. New player reports freeze allocation, fiscal provenance and monetary receipts. The brief shows public allocations separately from earned receipts; missing provenance in earlier reports is disclosed. The [late campaign balance review](late-campaign-balance.md) records existing surpluses and the next work on nominal prices, continuing departmental commitments and later objectives. Reference alignment does not establish strategic scarcity.

## Why the brief separates causes

The earlier report put the weather label and food results in different places. Its baseline already included the weather adjustment. In a severe flood, new irrigation can lose part of its potential yield before the remainder reaches the harvest. The brief now separates the weather, investment, reserve and purchase contributions.

### Annual brief

Use one plain-language headline, up to three outcomes, and one useful next decision. Keep the numerical breakdown available under **Why this happened**. During a quiet year, leave room for the map and skip outcomes that offer no new information. A major event can link to the affected sites when the report has verified location data.

Example from the existing 1946 starting seed with Northern Food Security approved and **Store surplus** selected:

> **1946 · Floods left a food shortfall**
>
> **Food** · 32 of 34 units needed were covered. Reserves are empty.
>
> **Programme** · The first Northern Food Security works began producing.
>
> **Treasury** · ₹18 lakh available for next year.
>
> **Next decision** · Consider authorizing emergency purchases for next year, or keep the cash available for works.

The food explanation shows `33 normal base + 6 potential from irrigation − 10 flood losses = 29 harvested`, followed by `29 harvested + 3 from reserves = 32 supplied`. Flood losses include 8 from baseline production and 2 from the new fields. These are game units. The new reports save each year's contributions. Earlier reports use recorded totals and label the missing weather breakdown.

### Food presentation options

| Option | What the player sees and decides | Cost of the change |
| --- | --- | --- |
| **Food security as the headline** | “Covered”, “covered using reserves”, or “shortfall”. Grain, stock and trade appear in the explanation. Put the weather effect and the programme's contribution on the same line of reasoning. | Presentation and turn attribution. Start here and keep current balance while assessing readability. |
| **A buffer for bad years** | Show how much of next year's modeled demand the emergency reserve could cover. Give the buffer more prominence when there is a credible warning. | A clearer reason to invest in storage. Exact percentages are optional. Avoid implying real tonnage or months unless the model supports them. |
| **An emergency response** | When harvest is at risk, authorize a capped food purchase, reserve cash for relief, or accept the risk and keep funding works. State the cost, what supplies are reachable and the conditions that trigger action. | A policy change. Try after the brief if players still struggle to connect weather to a decision. Routine years keep the standing policy. |

Recommended sequence is food-security presentation and causal attribution first. Add a reserve buffer where it changes a decision. Explore a capped emergency policy after a short playthrough. Treat normal rain, drought and damaging floods as understandable scenario conditions. Retain uncertainty, while showing how local exposure, protection, reserves and market access mediate the result.

### Investment outcomes in the annual brief

Show each important investment as **what opened → what changed this year → what it makes possible**. During construction, show the next delivery date. After delivery, report the outcome when it first appears or materially changes. Use **Why this happened** for detail such as how much workshop output came from skills, market access or mineral sites. Capture those contributions when the turn resolves so a past report still describes that year's map and economy.

The Technical Education Network is the reference case. Fund it in 1946 and keep its original schedule. Patna and Gaya open in 1947 and add 2 modeled skill points. Ranchi opens in 1948, bringing the total to 5 and unlocking the Applied Industry Partnership. Each school adds one point per operating year, including the opening year, up to 7 per school. Every 6 points adds one output per operating workshop, up to 3 per workshop. In a controlled 1955 comparison, the same connected Patna workshop produces 10 output with mature schools and 7 without. The school network also contributes toward the 20-skill shared prosperity target.

Example summary for 1948 with the network as the opening investment:

> **Ranchi’s technical school opened** · Bihar now has 5 skill points, up 3 this year. The Applied Industry Partnership is available once you can fund it. Workshop output is still zero because no workshops are operating.

The annual brief’s **Earned receipts** adds workshop, market, freight and food sale receipts in nominal rupees. Public allocations, grants, emergency food purchases and upkeep appear in the treasury ledger. The brief compares the latest closing balance with the previous one and itemizes net planning changes before turn resolution. When Skills increase the output each workshop receives, the brief identifies the extra output from the higher rate.

Workshop output measures industrial production in game units. The economy view separates earned receipts from the modeled public allocation. At opening rates, workshop receipts use ₹0.8 lakh per output and connected towns after the first two use ₹1 lakh each. The founding campaign scales those rates to the current price year. Market access adds four output to served workshops and more links can raise the emergency food purchase limit. Regional GDP would require comparable value-added measures for agriculture, industry and services. [Period price rules](period-prices.md)

## Technical school charters

From 1953, a founding campaign with two schools that have each taught for a full year can adopt one charter for the rest of the campaign. Each mature school supplies one team. Industrial Apprenticeships assigns teams to market-connected workshops and adds three output per served workshop each year. Agricultural Extension assigns teams to irrigated growing areas, prioritizing uncovered flood exposure. It adds one food unit per served area and recovers up to one drought loss or two uncovered flood losses per area. The Works view previews the sites. New sites enter service as the network grows.

Both paths use the same setup and annual fees in a given jurisdiction. In lakh rupees, the modeled fees are 18 and 4 for Bihar, 13 and 3 for Orissa, and 8 and 2 for autonomous Mayurbhanj. Service starts the year after adoption. Losing schools or eligible works can pause service. A charter also pauses if the treasury cannot cover upkeep at the start of the turn. Upkeep is set aside before emergency purchases. The annual brief and scorecard record the effects.

The 1950 Craftsmen Training Scheme and the 1953 National Extension Service inform the two directions. The shared school network, one-charter rule, fees and benefits are game design choices. [Directorate General of Training](https://dgt.gov.in/en/CTS), [Parliamentary Estimates Committee, National Extension Service](https://eparlib.sansad.in/bitstream/123456789/4915/1/ec_3_98_p1_1966.pdf).

In a matched 1954 Bihar start, extension secured all five final years and apprenticeships secured three. Apprenticeships added 12 workshop output in 1965. Extension mattered because the cabinet deferred the larger basin programme.

## Five-year priorities

From 1951, the Cabinet can commit to an optional five-year operating focus alongside construction. Education trains campus-bound cohorts whose Skills and workshop productivity begin the following year and persist. Food & Water adds harvest and recovers remaining weather losses; Trade & Industry raises linked workshop production while funded. Each uses the same department identity as its tree and regional programmes. Costs reserve a modeled share of the annual works allocation, and insufficient cash pauses extra services without removing baseline works. The brief and Economy map trace the saved spending and site effects. [Full rules and review](cabinet-priorities.md)

## Department development trees

Founding campaigns expose four tiers per department in the cabinet. The tree uses the same icons and facility labels across regions. Cards show the main effect, price or delivery date, and status. Selecting a card opens local names, map locations and prerequisites. Any domestic programme under construction occupies the works office across all departments. Training charters use their own fee and teaching capacity.

Cabinet tabs match the tree departments. Education uses blue, Food & Water uses green, and Trade & Industry uses amber. Applied workshops sit under Trade & Industry and show their Education prerequisite. Programme details link directly to the matching node. Regional follow-ons outside the four tiers show their department, and the cabinet keeps active work and the archive accessible while browsing any tab. The annual brief uses the same colours and names for delivered works and operating effects.

| Department | Tier I | Tier II | Tier III | Tier IV |
| --- | --- | --- | --- | --- |
| Education | Schools | Degree colleges and a choice of teaching charter | Regional university | Engineering or agricultural research institute, depending on the charter |
| Food & Water | Irrigation and basic storage | Local basin or water works | Reserve depot | Regional water network |
| Trade & Industry | Market links | Industrial or applied workshops | Freight terminal | Industrial park |

Colleges and universities build Skills and support connected workshops. Engineering adds industrial output and agricultural research improves harvests. Depots carry more food into future years. Regional water networks boost harvest and recover remaining monsoon losses. A freight terminal earns receipts from connected towns and can bring in more food when supplies are available. Industrial parks raise connected workshop production. The annual brief records the contributions, and the Works view shows the facilities.

Programmes use local names, sites and nominal lakh rupee costs. Late works stay within the retained administration after a Bihar split. A Mayurbhanj merger adds Orissa's opening and middle-tier options while preserving local works. Higher-tier costs and effects are scenario values. The charter choice persists, while the order and depth of funding remain open.

The Bihar and Orissa university programmes expand existing institutions. Their opening dates and outcomes follow the player's investment schedule. Utkal's historical move from Cuttack to Bhubaneswar informs the location. [Patna University history](https://pup.ac.in/History.aspx), [Utkal University history](https://utkaluniversity.ac.in/history/).

## Shared systems and regional content

Use shared programme families for **market access**, **food security**, **water and flood resilience**, **workforce development** and **industrial investment**. Each family uses common funding, eligibility, delivery, negotiation and reporting rules. A region supplies its own name, footprint, local constraints, historical sources, costs, phases and follow-on opportunities. The Ganga Market Corridor and Kosi Flood Compact are Bihar content. A corridor elsewhere should connect places and industries that matter there, and a water programme could focus on flood protection, storage or drought according to the region.

Bihar, Orissa, Mayurbhanj, West Bengal, Bombay, Punjab, Madras, Assam and Central Provinces and Berar supply local programmes and fiscal profiles. They use the same delivery and reporting rules. Orissa adds power allocation, Mayurbhanj can take responsibility for a larger province, and West Bengal can protect a jute-dependent mill through trade or domestic production.

### Regional mandates through 1985

Long founding campaigns offer an optional regional mandate after the main border changes. The player chooses one direction from 1974 through 1979. Each requires a final tier facility and an outcome sustained through the closing years or a new workforce trained since signing. The Cabinet links directly to the appropriate development tree, and archived annual briefs keep their recorded progress. [Targets and balance evidence](regional-mandates.md)

### Central Provinces and Berar

The cabinet starts in Nagpur and incorporates the eastern princely districts in 1948. Berar cotton can earn early receipts, but Madhya Pradesh loses Vidarbha and the works there in 1956. From Bhopal, the cabinet can invest in the retained Narmada and Chhattisgarh towns or develop the new Malwa districts. An optional agreement keeps freight moving through Nagpur and transfers to Maharashtra in 1960.

The 1957 dry monsoon tests the state’s reserves. Chambal irrigation raises food output, while the industrial agreement raises the output of connected workshops. Bhilai’s Union plant opens in 1959, when the state can fund supplier connections or a technical school. [Campaign chronology](central-chronology.md) · [Programme sources](central-programme-sources.md) · [Fiscal sources](central-sources.md)

### Assam

Partition transfers most of Sylhet and disrupts freight. The Assam Rail Link reopens in 1950. Local feeder investment raises purchase capacity and helps connected tea workshops. The 1950 earthquake choice compares immediate supplies with repairs that prevent part of the harvest loss.

The Brahmaputra agreement can deliver embankments and irrigated areas or a river terminal and reserve storage. The two paths compete for the same works office. Naga Hills leaves the state works office in 1958, and Nagaland statehood brings a corridor decision in 1963. The long campaign also transfers sites to Meghalaya and the Mizoram Union Territory before moving Assam’s seat to Dispur in 1973. [Assam campaign sources](assam-sources.md)

### Madras and Andhra

The player begins in composite Madras Province and chooses which side to govern when Andhra State forms in 1953. The former provincial works remain at their sites, including contracts still under construction. Andhra moves its capital from Kurnool to Hyderabad as Telangana joins in 1956. Madras receives the Kanyakumari area and gives up districts to Kerala and Mysore.

Each successor can choose an irrigation or industrial power commitment. Madras compares Cauvery drainage and pumped irrigation with Neyveli power for connected workshops. Andhra compares the Krishna and Godavari deltas with repair workshops and power in Rayalaseema. The effect persists once the relevant power connection opens and is attributed in the annual brief. [Madras and Andhra sources](madras-sources.md)

The retained Madras cabinet can negotiate with Pondicherry after the administrative transfer in 1954. Its two-year railway decision trades access to each side's food reserves against receipts from reserving the same line for textile freight. The chronicle distinguishes administrative handover from legal cession. [Pondicherry rail chapter](national-coverage.md#pondicherry-and-the-villupuram-railway)

### Domestic markets

In Standard politics, linked governments buy food from each other after settling the player's direct trade. Shortages take priority over restocking. Routes and budgets cap shipments, and buyers and sellers carry the resulting cash and reserves into later years. A busy route through a trading partner adds to the following year's freight orders. The player can compete for those orders with connected workshops and terminals. [Interregional model and sources](interregional-model.md)

In 1957, the first freight contract forecast puts a deadline on the choice to prioritize Trade & Industry. The Neighbors board compares the bid from approved works with the strongest known rival bid. Award results and earned fees appear in the annual brief. In matched Madhya Pradesh runs, building engineering workshops and Itarsi first wins the 1961 contract. Prioritizing the Chambal agreement instead delivers industrial power while Maharashtra wins the contract. [Contract rules](interregional-model.md#regional-freight-contracts)

The western network puts shipping and railway capacity into the annual economy. The islands' pre-1970 monsoon interruptions change how much administration rice arrives from Calicut. After 1973, Maharashtra faces a second export gateway for nearby sugar and oilcake orders. Mormugao's rail slots for ore and food appear alongside the actual shipments. The annual brief points to each route when it changes. [Western shipping design and sources](national-coverage.md#western-coast-shipping)

### Bombay

Bombay's opening programmes build on the western coast, cotton mills and technical schools. In 1949 the cabinet integrates modeled former princely sites. The 1956 expansion makes it possible to invest in Kandla or Nagpur before the state divides. These programmes compete for the same works office, and an investment in either area makes later development cheaper for the state that inherits it.

In 1960 the player can govern either Maharashtra or Gujarat. Works and their progress follow the sites. Each successor has a distinct budget and tree, with earlier works counting toward compatible local programmes. The other state takes its share of the cash and reserves and uses inherited operating farms, storage, workshops and terminals. [Bombay campaign sources](bombay-sources.md)

### Punjab

The player starts in Punjab’s eastern districts. Partition cuts off trade through Lahore and adds demand from resettlement. A 1953 chapter moves the administration to Chandigarh. The 1956 integration of PEPSU opens new cotton and canal programmes that pass to different successors in 1966.

The Bhakra–Nangal agreement offers canals or power first. Early canal delivery adds growing areas before the pumps begin raising harvests. Power-first delivery opens an engineering shop and improves output at connected workshops, with canals following later. Punjab and Haryana use distinct budgets and development portfolios after 1966. Operating Bhakra works continue to serve both states. [Punjab campaign sources](punjab-sources.md)

### West Bengal

The 1946 player governs the western districts of undivided Bengal. After Partition, mills commissioned by the Hooghly corridor lose two output each when their raw jute supply is disrupted. An open eastern corridor restores the loss. The Nadia Jute Supply Programme offers a domestic source that keeps working during restrictions. Its growing areas supply fibre and its road works serve collection. It occupies the same works office as food protection and diversification into coal-belt workshops.

Cooch Behar joins West Bengal in 1950. The player chooses whether to fund a technical school as part of the integration. In 1956, the historical transfer adds Purulia and the northern link, raises demand and opens plateau investment. An alternate transit compact retains the existing boundary and adds food purchase capacity when Bihar has supplies. The Damodar works offer local, wider state-funded and Union-supported flood protection. Revenue anchors set the scale of development funding in nominal rupees. [West Bengal campaign sources](west-bengal-sources.md)

## Kosi cabinet chapter

Finishing Northern Food Security opens three Kosi agreements. Saharsa protection is a focused Bihar-funded scheme. The Bihar basin plan extends coverage and delivers wider protection sooner than the Union basin agreement. Union co-funding reduces the state share but adds review time. The state pays its share when it signs, while Union funds go directly to the works. Programme coverage and prices are modeled scenario values. The [fiscal references](fiscal-sources.md) cover the historic scale and separate financing context.

When a severe flood hits after signing and before the embankments are ready, the cabinet can spend ₹8 lakh on emergency work to keep the schedule or keep the cash and defer the remaining works by a year. The brief records the choice, and later floods report losses prevented by the finished Kosi works.

## Mahanadi cabinet chapter

The 1948 survey costs ₹4 lakh and qualifies Orissa for the wider Hirakud agreement once Delta Food Security is delivered. The local delta package costs ₹24 lakh before discounts. Hirakud is modeled at ₹51 lakh, with ₹19 lakh paid directly to works by the Union. The local scheme delivers in two years and the wider one in four. Emergency repairs cost ₹6 lakh if a flood threatens the construction schedule.

The completed station asks the player to prioritize workshops or irrigation. Industry gains two output per connected workshop each year. Irrigation adds three food units to each harvest. The annual brief links to the decision and records the resulting gains. The 1948 survey and the terms are scenario choices informed by the period agreement, resettlement liabilities and power discussions. [Public Accounts Committee, Sixth Report (1953)](https://eparlib.sansad.in/bitstream/123456789/5005/1/pac_1_6_1953.pdf), [Parliamentary discussion of Hirakud power (1958)](https://eparlib.sansad.in/bitstream/123456789/901065/1/02_VI_21-11-1958_p48_p59_PII.pdf).

## Next delivery tasks

1. **Make a regional commitment change the long campaign.** The Second Plan offers one package in Bihar and Orissa. Earlier basin works or schools and market links prepare each bid. Compare how the delivered reserves and suppliers affect diplomacy, freight and the ending as the player continues to fund other departments. [Union development partnerships](union-partnerships.md)
2. **Teach and show the consequence in play.** Use the visual opening and short annual brief to connect investment, its footprint and the result. Compare a flood and a school-to-workshop payoff. Use existing emergency food planning to make a reserve versus spending decision tangible when weather threatens.
3. **Deepen cross-border choices where they affect the plan.** Compare local protection and storage to financing a shared reserve or relying on purchases. Compare joint freight investment to competing for existing routes. Bring pricing into this work where it changes affordability, access or the explanation. [Interregional model](interregional-model.md).

The [project record](../PROJECT.md) owns task status and feedback. The [campaign evolution brief](campaign-evolution.md) holds longer-term gameplay ideas.
