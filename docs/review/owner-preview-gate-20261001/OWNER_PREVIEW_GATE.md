# Owner Preview Gate

**Result: FAIL**

- Passed: 12
- Failed: 2

| Gate | Result | Time |
|---|---:|---:|
| integrated-node-48 | PASS | 2.62s |
| home-visual-contract | PASS | 0.1s |
| navigation-truth | PASS | 0.07s |
| character-registry | PASS | 0.08s |
| gated-ecosystem | PASS | 0.07s |
| manifest | PASS | 0.1s |
| search-discovery | PASS | 0.1s |
| nonhome-truth | PASS | 0.09s |
| cartridge-isolation | PASS | 0.18s |
| render-freshness | FAIL | 0.09s |
| pages-basepath | PASS | 0.12s |
| static-links | PASS | 0.36s |
| staging-robots | PASS | 0.11s |
| browser-matrix | FAIL | 43.92s |

## Blocking gates

### render-freshness
    - /characters/toadal/ render contains stale phrase: before that system exists
    - /news/ render stale/missing sentinel: Stories, Manga, and Reader preview surfaces are available
    - /news/ render contains stale phrase: Story updates unavailable
    - /news/ render contains stale phrase: A story archive and publishing schedule have not been made available
    - /media/ render stale/missing sentinel: not a downloadable press or media library
    - /media/ render contains stale phrase: not a published media library
    - render missing for /search/: dist\search\index.html
    - rendered local-search-index.json missing

### browser-matrix
    PASS|desktop|/about/|
    PASS|mobile|/about/|
    PASS|desktop|/coming-soon/|
    PASS|mobile|/coming-soon/|
    PASS|desktop|/legal/|
    PASS|mobile|/legal/|
    PASS|large-mobile|/|
    SUMMARY|{"schema":"toadal-feast.owner-preview-browser-matrix.v1","status":"FAIL","routes":30,"cases":77,"passed":69,"failed":8,"issueCounts":{"companion-control-overlap":3,"clipped-controls":2,"missing-title":4,"missing-lang":4,"missing-viewport":4,"h1-count":4,"main-count":4,"network-errors":4}}
