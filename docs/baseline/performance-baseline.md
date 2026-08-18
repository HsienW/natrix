# Performance Baseline Template

Do not publish benchmark claims until every field below has been measured on a production build. Use the same scenario and environment when comparing later runtime modes.

## Pre-modernization tooling reproduction

Captured on 2026-08-18 before the Webpack 5 migration:

- Node.js: `v24.13.0`
- npm: `11.6.2`
- Install: succeeded with 891 packages and 79 reported vulnerabilities
- Production build: failed in Webpack 4 with `ERR_OSSL_EVP_UNSUPPORTED`
- Test and coverage commands: failed because Jest was referenced but not installed

These results explain the Phase 0 tooling upgrade. They are not browser performance measurements.

## Phase 0 tooling gate

Captured on 2026-08-18 after the Webpack 5 migration:

- Webpack: `5.109.2`
- Babel core and preset-env: `7.29.7`
- Jest: `30.4.2`
- Clean install: `npm ci` succeeded with 984 installed packages
- Security audit: 0 reported vulnerabilities
- Tests: 7 passed across 3 suites
- Statement coverage: 89.2% (recorded, not enforced as an arbitrary threshold)
- Production build: succeeded
- Development server: generated HTML and every referenced JavaScript bundle returned HTTP 200
- Production preview: generated HTML and every referenced JavaScript bundle returned HTTP 200
- Existing Netlify demo: page and referenced `main.js` returned HTTP 200

The in-app browser was unavailable in the execution environment, so interactive visual QA remains a manual check. The automated JSDOM smoke suite covers start, movement, scoring, pause, resume, and finish behavior.

## Browser measurement record

| Field | Value |
| --- | --- |
| Date | TBD |
| Git commit | TBD |
| Build mode | production |
| Browser and version | TBD |
| Operating system | TBD |
| Device / CPU | TBD |
| Display refresh rate | TBD |
| Map size | 41 by 41 |
| Scenario duration | TBD |
| Average FPS | TBD |
| Approximate frame time | TBD |
| DOM node count | TBD |
| Long tasks | TBD |

## Measurement procedure

1. Run `npm ci` and `npm run build` from a clean clone.
2. Serve `dist/` locally without development transforms.
3. Open browser DevTools Performance and use a normal viewport at 100% zoom.
4. Start a short match and follow a recorded input sequence for a fixed duration.
5. Record the fields above without rounding away meaningful variation.
6. Repeat at least three times and retain raw traces when publishing a comparison.

Later phases will replace the manual input sequence with a deterministic replay benchmark.
