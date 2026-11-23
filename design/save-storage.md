# Campaign storage

The northern and fiscal continuation exposed a production storage problem: two completed Standard campaigns used about 2.6 million characters before compaction, almost a typical 5 MiB Web Storage allowance when stored as UTF-16. Additional regional campaigns could fail to autosave. Retaining the full history for each start remains required.

`save-codec.js` stores losslessly compressed JSON using lz-string 1.5.0's UTF-16 storage format. A versioned wrapper records the original character count and a checksum to detect damage. Game schema version, campaign keys, all annual reports, political decisions, ownership and financial references remain unchanged. Loading accepts the earlier JSON format as well as the compact format. [Compression library and license](https://github.com/pieroxy/lz-string), [third-party notice](../THIRD_PARTY_NOTICES.md)

At launch, the game checks only its known regional campaign and archive keys. It replaces readable, valid earlier saves only when their packed representation is smaller. Web Storage replacement is atomic. A failed write, an unreadable record or an unsupported format is left intact. Unrelated application data is untouched. The atlas uses the same decoder as campaign loading, so it continues to identify and resume existing campaigns.

Older game builds that lack the decoder cannot read compact saves. This is a documented storage-format incompatibility, rather than a change to the campaign simulation. Reverting an application build does not restore the earlier save encoding. The current source includes the decoder and a reproducible capacity tool.

## Verification

`npm test` includes Unicode and legacy round trips, checksum and truncated-data rejection, lossless migration, failed-write preservation and nine complete Standard campaigns. `node tools/save-capacity.mjs` runs every 1946 start through 1985 using legal political decisions and an initial Food commitment. It verifies each packed result and compares their combined storage with a 5 MiB budget. The check requires the uncompressed set to reproduce the problem and the compact set to stay below 2 MiB, leaving room for settings and archive saves.

Production browser acceptance additionally completes Punjab and West Bengal through 1985, reloads after Jammu's rail transition, stores nine real simulated campaign records in Web Storage, migrates an inactive legacy save and checks every completed campaign in the atlas. Resume of a different region verifies that the loaded result retains its full history. Browser pacing, broader accessibility and the rest of the public release gates remain separate requirements.

Measured in the current nine-campaign benchmark: 22,769,224 bytes uncompressed and 1,779,022 bytes compacted (92.2% smaller). The browser separately stored all nine and resumed Assam after a legacy migration, with no runtime exceptions.
