# Statistics

The project’s size, quality and performance, one row per release, the newest first ([issue 84](issues/84-project-statistics.md)). `npm run stats` measures them and writes this page before each release’s commit ([releasing.md](releasing.md)); run again for the same version, it replaces that version’s numbers. The key numbers show in brackets their change since the release below.

A — is a number not measured for that release yet. The releases before the command existed hold only the exact numbers, the ones that do not depend on the machine: `npm run stats -- --history` reads them from each release’s tag, its code, its git history and its build with its own locked dependencies, on the release’s date, and gives the same numbers every time. The test runs, the coverage, the page load and the running app can be added to those rows later.

## Where it was measured

The page loads and the running app are measured in Chromium through Playwright, headless, in a 1440 × 900 window at twice the pixels (a Retina screen), on the built site served from this computer. A page load is the median of 3, each a first visit with an empty cache. Each state of the running app starts in a fresh page, settles for 2 s, then is measured for 10 s, the same each time. Other work on the machine skews the timings: measure on a quiet one.

| Version | Date | Machine | Browser |
| --- | --- | --- | --- |
| 1.23.0 | 2026-11-04 | Apple M2, 8 cores, 16 GB, macOS 27.0.1 | Chromium 156.0.8078.4, headless |
| 1.22.0 | 2026-11-03 | Apple M2, 8 cores, 16 GB, macOS 27.0.1 | Chromium 156.0.8078.4, headless |
| 1.21.1 | 2026-11-02 | Apple M2, 8 cores, 16 GB, macOS 27.0.1 | Chromium 156.0.8078.4, headless |
| 1.21.0 | 2026-11-02 | — | — |
| 1.20.0 | 2026-11-01 | — | — |
| 1.19.0 | 2026-10-31 | — | — |
| 1.18.0 | 2026-10-31 | — | — |
| 1.17.0 | 2026-10-31 | Apple M2, 8 cores, 16 GB, macOS 27.0.1 | Chromium 156.0.8078.4, headless |
| 1.16.1 | 2026-10-30 | — | — |
| 1.16.0 | 2026-10-30 | — | — |
| 1.15.1 | 2026-10-29 | — | — |
| 1.15.0 | 2026-10-28 | — | — |
| 1.14.1 | 2026-10-28 | — | — |
| 1.14.0 | 2026-10-28 | — | — |
| 1.13.0 | 2026-10-28 | — | — |
| 1.12.4 | 2026-10-27 | — | — |
| 1.12.3 | 2026-10-27 | — | — |
| 1.12.2 | 2026-10-27 | — | — |
| 1.12.1 | 2026-10-27 | — | — |
| 1.12.0 | 2026-10-27 | — | — |
| 1.11.1 | 2026-10-27 | — | — |
| 1.11.0 | 2026-10-27 | — | — |
| 1.10.0 | 2026-10-26 | — | — |
| 1.9.0 | 2026-10-26 | — | — |
| 1.8.1 | 2026-10-26 | — | — |
| 1.8.0 | 2026-10-26 | — | — |
| 1.7.0 | 2026-10-26 | — | — |
| 1.6.0 | 2026-10-26 | — | — |
| 1.5.0 | 2026-10-25 | — | — |
| 1.4.1 | 2026-10-25 | — | — |
| 1.4.0 | 2026-10-25 | — | — |
| 1.3.1 | 2026-10-25 | — | — |
| 1.3.0 | 2026-10-25 | — | — |
| 1.2.0 | 2026-10-24 | — | — |
| 1.1.0 | 2026-10-24 | — | — |
| 1.0.0 | 2026-10-24 | — | — |

- **Date:** the day it was measured, or for a history row the day of the release.
- **Machine:** the computer: its processor, cores, memory and system (— for a history row, whose numbers do not depend on it).
- **Browser:** the browser the page loads and the running app were measured in.

## Size

Counted in the files git tracks.

| Version | App code | Tests | Tests written | Docs | Presets | Tutorials | Issues | Commits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.23.0 | 24,192 lines, 169 files (+1,619) | 25,835 lines, 161 files (+2,637) | 1,045 unit, 257 engine, 515 end-to-end (+158) | 13,326 lines, 336 files | 142 | 7 | 179 done, 38 open | 1,234 |
| 1.22.0 | 22,573 lines, 158 files (+462) | 23,198 lines, 153 files (+676) | 962 unit, 240 engine, 457 end-to-end (+38) | 12,178 lines, 314 files | 142 | 7 | 159 done, 40 open | 1,074 |
| 1.21.1 | 22,111 lines, 158 files (+10) | 22,522 lines, 152 files (+16) | 938 unit, 231 engine, 452 end-to-end | 10,712 lines, 279 files | 142 | 7 | 111 done, 62 open | 996 |
| 1.21.0 | 22,101 lines, 158 files (+2,366) | 22,506 lines, 152 files (+3,123) | 938 unit, 231 engine, 452 end-to-end (+203) | 10,644 lines, 277 files | 142 | 7 | 111 done, 60 open | 979 |
| 1.20.0 | 19,735 lines, 148 files (+2,088) | 19,383 lines, 143 files (+3,592) | 805 unit, 206 engine, 407 end-to-end (+206) | 10,005 lines, 274 files | 142 | 7 | 109 done, 62 open | 876 |
| 1.19.0 | 17,647 lines, 139 files (+252) | 15,791 lines, 130 files (+265) | 680 unit, 180 engine, 352 end-to-end (+20) | 7,751 lines, 232 files | 142 | 7 | 108 done, 30 open | 676 |
| 1.18.0 | 17,395 lines, 138 files (+563) | 15,526 lines, 129 files (+833) | 666 unit, 177 engine, 349 end-to-end (+53) | 7,023 lines, 210 files | 142 | 7 | 105 done, 19 open | 622 |
| 1.17.0 | 16,832 lines, 132 files (+3,055) | 14,693 lines, 121 files (+1,563) | 647 unit, 152 engine, 340 end-to-end (+130) | 6,340 lines, 196 files | 142 (+1) | 7 | 103 done, 18 open | 569 |
| 1.16.1 | 13,777 lines, 122 files (+730) | 13,130 lines, 113 files (+1,659) | 541 unit, 146 engine, 322 end-to-end (+97) | 6,085 lines, 190 files | 141 (+5) | 4 | 101 done, 21 open | 537 |
| 1.16.0 | 13,047 lines, 120 files (+877) | 11,471 lines, 111 files (+566) | 504 unit, 101 engine, 307 end-to-end (+47) | 3,835 lines, 144 files | 136 (+29) | 4 | 86 done, 10 open | 478 |
| 1.15.1 | 12,170 lines, 120 files (+15) | 10,905 lines, 111 files (+33) | 486 unit, 80 engine, 299 end-to-end (+2) | 3,376 lines, 130 files | 107 | 4 | 76 done, 7 open | 417 |
| 1.15.0 | 12,155 lines, 120 files (+508) | 10,872 lines, 111 files (+1,039) | 486 unit, 80 engine, 297 end-to-end (+80) | 3,363 lines, 130 files | 107 | 4 | 76 done, 7 open | 412 |
| 1.14.1 | 11,647 lines, 114 files | 9,833 lines, 101 files (+11) | 431 unit, 77 engine, 275 end-to-end | 2,561 lines, 101 files | 107 | 4 | 58 done, 7 open | 356 |
| 1.14.0 | 11,647 lines, 114 files (+147) | 9,822 lines, 101 files (+215) | 431 unit, 77 engine, 275 end-to-end (+16) | 2,560 lines, 101 files | 107 (+1) | 4 | 58 done, 7 open | 353 |
| 1.13.0 | 11,500 lines, 113 files (+256) | 9,607 lines, 100 files (+241) | 422 unit, 77 engine, 268 end-to-end (+20) | 2,513 lines, 100 files | 106 | 4 | 58 done, 6 open | 318 |
| 1.12.4 | 11,244 lines, 112 files (+1) | 9,366 lines, 99 files | 409 unit, 76 engine, 262 end-to-end | 2,422 lines, 94 files | 106 | 4 | 53 done, 5 open | 284 |
| 1.12.3 | 11,243 lines, 112 files (+42) | 9,366 lines, 99 files (+35) | 409 unit, 76 engine, 262 end-to-end (+4) | 2,421 lines, 94 files | 106 | 4 | 53 done, 5 open | 282 |
| 1.12.2 | 11,201 lines, 112 files (+137) | 9,331 lines, 99 files (+58) | 406 unit, 75 engine, 262 end-to-end (+7) | 2,397 lines, 92 files | 106 | 4 | 52 done, 5 open | 279 |
| 1.12.1 | 11,064 lines, 111 files (+288) | 9,273 lines, 99 files (+251) | 401 unit, 75 engine, 260 end-to-end (+15) | 2,380 lines, 91 files | 106 (+2) | 4 | 51 done, 5 open | 268 |
| 1.12.0 | 10,776 lines, 110 files (+47) | 9,022 lines, 98 files (+75) | 396 unit, 75 engine, 250 end-to-end (+6) | 2,350 lines, 90 files | 104 | 4 | 50 done, 5 open | 251 |
| 1.11.1 | 10,729 lines, 110 files | 8,947 lines, 98 files | 393 unit, 74 engine, 248 end-to-end | 2,282 lines, 88 files | 104 | 4 | 48 done, 7 open | 243 |
| 1.11.0 | 10,729 lines, 110 files (+521) | 8,947 lines, 98 files (+371) | 393 unit, 74 engine, 248 end-to-end (+27) | 2,281 lines, 88 files | 104 | 4 | 49 done, 7 open | 241 |
| 1.10.0 | 10,208 lines, 103 files (+936) | 8,576 lines, 95 files (+341) | 386 unit, 72 engine, 230 end-to-end (+29) | 2,095 lines, 83 files | 104 | 4 | 44 done, 11 open | 234 |
| 1.9.0 | 9,272 lines, 97 files (+397) | 8,235 lines, 91 files (+299) | 368 unit, 72 engine, 219 end-to-end (+20) | 2,034 lines, 81 files | 104 | 0 | 41 done, 12 open | 229 |
| 1.8.1 | 8,875 lines, 95 files (+5) | 7,936 lines, 88 files (+14) | 362 unit, 68 engine, 209 end-to-end (+1) | 1,048 lines, 58 files | 104 | 0 | 36 done, 6 open | 205 |
| 1.8.0 | 8,870 lines, 95 files (+8) | 7,922 lines, 88 files (+175) | 362 unit, 68 engine, 208 end-to-end (+7) | 1,047 lines, 58 files | 104 | 0 | 36 done, 6 open | 203 |
| 1.7.0 | 8,862 lines, 95 files (+15) | 7,747 lines, 87 files (+133) | 362 unit, 66 engine, 203 end-to-end (+5) | 1,009 lines, 57 files | 104 | 0 | 35 done, 6 open | 195 |
| 1.6.0 | 8,847 lines, 95 files (+11) | 7,614 lines, 86 files (+132) | 362 unit, 66 engine, 198 end-to-end (+4) | 1,008 lines, 57 files | 104 | 0 | 34 done, 7 open | 192 |
| 1.5.0 | 8,836 lines, 95 files (+346) | 7,482 lines, 85 files (+228) | 362 unit, 66 engine, 194 end-to-end (+18) | 947 lines, 51 files | 104 | 0 | 34 done, 1 open | 186 |
| 1.4.1 | 8,490 lines, 93 files (+22) | 7,254 lines, 83 files (+12) | 350 unit, 66 engine, 188 end-to-end | 886 lines, 46 files | 104 | 0 | 31 done, 1 open | 174 |
| 1.4.0 | 8,468 lines, 93 files (+352) | 7,242 lines, 83 files (+582) | 350 unit, 66 engine, 188 end-to-end (+24) | 885 lines, 46 files | 104 (+13) | 0 | 31 done, 1 open | 170 |
| 1.3.1 | 8,116 lines, 91 files (+98) | 6,660 lines, 79 files (+101) | 340 unit, 65 engine, 175 end-to-end (+8) | 795 lines, 38 files | 91 | 0 | 22 done, 3 open | 155 |
| 1.3.0 | 8,018 lines, 90 files (+805) | 6,559 lines, 77 files (+824) | 336 unit, 65 engine, 171 end-to-end (+70) | 791 lines, 38 files | 91 | 0 | 21 done, 4 open | 153 |
| 1.2.0 | 7,213 lines, 85 files (+379) | 5,735 lines, 72 files (+299) | 310 unit, 56 engine, 136 end-to-end (+13) | 767 lines, 37 files | 91 | 0 | 17 done, 8 open | 130 |
| 1.1.0 | 6,834 lines, 82 files | 5,436 lines, 71 files | 309 unit, 56 engine, 124 end-to-end | 581 lines, 26 files | 91 | 0 | 14 done, 2 open | 122 |
| 1.0.0 | 6,834 lines, 82 files | 5,436 lines, 71 files | 309 unit, 56 engine, 124 end-to-end | 581 lines, 26 files | 91 | 0 | 14 done, 2 open | 121 |

- **App code:** the lines with something on them, and the files, of the code the app runs: `src/`’s TypeScript and CSS, its tests apart.
- **Tests:** the same for the tests: the unit and engine tests in `src/`, their helpers, the end-to-end tests in `e2e/` and the scripts’ tests.
- **Tests written:** the tests declared in each suite’s files, `it(…)` and `test(…)`, counted in the code rather than run: a test written once in a loop counts once, so the suites run more.
- **Docs:** the same for every Markdown file: the docs, the issues, the reviews, the README and the project’s rules.
- **Presets:** the factory Presets, Init included.
- **Tutorials:** the Tutorials (0 before there were any).
- **Issues:** the issues in `docs/issues` done, and open (not done, closed, superseded or ongoing).
- **Commits:** the commits in the history up to the one measured.

## Quality

| Version | Unit tests | Engine tests | End-to-end tests | Coverage | Lint | Type errors |
| --- | --- | --- | --- | --- | --- | --- |
| 1.23.0 | 1,236 of 1,236 (+90) | 514 of 514 (+22) | 1,495 of 1,497 (+166) | 66.0% of lines, 57.7% of branches (+2.2 pt) | 0 errors, 0 warnings | 0 |
| 1.22.0 | 1,146 of 1,146 (+24) | 492 of 492 (+9) | 1,329 of 1,331 (+12) | 63.9% of lines, 57.5% of branches (+0.4 pt) | 0 errors, 0 warnings | 0 |
| 1.21.1 | 1,122 of 1,122 | 483 of 483 | 1,316 of 1,319 | 63.4% of lines, 57.3% of branches | 0 errors, 0 warnings | 0 |
| 1.21.0 | — | — | — | — | — | — |
| 1.20.0 | — | — | — | — | — | — |
| 1.19.0 | — | — | — | — | — | — |
| 1.18.0 | — | — | — | — | — | — |
| 1.17.0 | 734 of 734 | 384 of 384 | 981 of 981 | 53.7% of lines, 50.3% of branches | 0 errors, 0 warnings | 0 |
| 1.16.1 | — | — | — | — | — | — |
| 1.16.0 | — | — | — | — | — | — |
| 1.15.1 | — | — | — | — | — | — |
| 1.15.0 | — | — | — | — | — | — |
| 1.14.1 | — | — | — | — | — | — |
| 1.14.0 | — | — | — | — | — | — |
| 1.13.0 | — | — | — | — | — | — |
| 1.12.4 | — | — | — | — | — | — |
| 1.12.3 | — | — | — | — | — | — |
| 1.12.2 | — | — | — | — | — | — |
| 1.12.1 | — | — | — | — | — | — |
| 1.12.0 | — | — | — | — | — | — |
| 1.11.1 | — | — | — | — | — | — |
| 1.11.0 | — | — | — | — | — | — |
| 1.10.0 | — | — | — | — | — | — |
| 1.9.0 | — | — | — | — | — | — |
| 1.8.1 | — | — | — | — | — | — |
| 1.8.0 | — | — | — | — | — | — |
| 1.7.0 | — | — | — | — | — | — |
| 1.6.0 | — | — | — | — | — | — |
| 1.5.0 | — | — | — | — | — | — |
| 1.4.1 | — | — | — | — | — | — |
| 1.4.0 | — | — | — | — | — | — |
| 1.3.1 | — | — | — | — | — | — |
| 1.3.0 | — | — | — | — | — | — |
| 1.2.0 | — | — | — | — | — | — |
| 1.1.0 | — | — | — | — | — | — |
| 1.0.0 | — | — | — | — | — | — |

- **Unit tests:** the unit tests that passed, of all of them (Vitest’s unit project, in Node).
- **Engine tests:** the same for the engine tests, which render real audio in headless Chromium (Vitest’s engine project).
- **End-to-end tests:** the same for Playwright’s tests of the built site, each counted once in Chromium and once in WebKit.
- **Coverage:** the share of the app code’s lines, and of its branches, that the unit and engine tests run (Vitest’s V8 coverage; the end-to-end tests are not counted).
- **Lint:** Biome’s errors and warnings (`npm run lint`).
- **Type errors:** the errors TypeScript finds (`npx tsc`).

## Build and load

| Version | JavaScript | CSS | Unit run | Engine run | End-to-end run | First paint | Largest paint | Blocking time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.23.0 | 915.2 kB (281.9 kB gzipped, +7.6 kB) | 71.5 kB (14.8 kB gzipped, +0.3 kB) | 6 s | 216 s | 1418 s (+164 s) | 328 ms (+32 ms) | 328 ms (+32 ms) | 0 ms |
| 1.22.0 | 893.8 kB (274.2 kB gzipped, +2.6 kB) | 69.6 kB (14.5 kB gzipped) | 5 s | 196 s | 1253 s (+241 s) | 296 ms (−8 ms) | 296 ms (−8 ms) | 0 ms |
| 1.21.1 | 887.4 kB (271.6 kB gzipped, −0.2 kB) | 69.6 kB (14.5 kB gzipped, +0.1 kB) | 5 s | 179 s | 1013 s | 304 ms | 304 ms | 0 ms |
| 1.21.0 | 889.8 kB (271.8 kB gzipped, +17.5 kB) | 69.3 kB (14.4 kB gzipped, +0.4 kB) | — | — | — | — | — | — |
| 1.20.0 | 838.6 kB (254.3 kB gzipped, +10.8 kB) | 67.9 kB (14.1 kB gzipped, +1.3 kB) | — | — | — | — | — | — |
| 1.19.0 | 804.9 kB (243.5 kB gzipped, +2.2 kB) | 60.9 kB (12.8 kB gzipped, +0.6 kB) | — | — | — | — | — | — |
| 1.18.0 | 796.4 kB (241.3 kB gzipped, +3.6 kB) | 58.8 kB (12.2 kB gzipped) | — | — | — | — | — | — |
| 1.17.0 | 784.5 kB (237.7 kB gzipped, +18.1 kB) | 58.9 kB (12.2 kB gzipped, +0.7 kB) | 4 s | 41 s | 675 s | 208 ms | 228 ms | 0 ms |
| 1.16.1 | 732.0 kB (219.6 kB gzipped, +5.2 kB) | 55.8 kB (11.5 kB gzipped, +0.2 kB) | — | — | — | — | — | — |
| 1.16.0 | 716.3 kB (214.5 kB gzipped, +7.9 kB) | 54.7 kB (11.3 kB gzipped, +0.5 kB) | — | — | — | — | — | — |
| 1.15.1 | 688.6 kB (206.6 kB gzipped) | 51.9 kB (10.8 kB gzipped, +0.1 kB) | — | — | — | — | — | — |
| 1.15.0 | 688.6 kB (206.6 kB gzipped, +2.0 kB) | 51.4 kB (10.7 kB gzipped, +0.3 kB) | — | — | — | — | — | — |
| 1.14.1 | 684.1 kB (204.5 kB gzipped) | 50.1 kB (10.4 kB gzipped) | — | — | — | — | — | — |
| 1.14.0 | 684.1 kB (204.5 kB gzipped, +1.1 kB) | 50.1 kB (10.4 kB gzipped) | — | — | — | — | — | — |
| 1.13.0 | 680.6 kB (203.4 kB gzipped, +1.6 kB) | 49.9 kB (10.4 kB gzipped, +0.3 kB) | — | — | — | — | — | — |
| 1.12.4 | 676.5 kB (201.8 kB gzipped) | 48.1 kB (10.1 kB gzipped) | — | — | — | — | — | — |
| 1.12.3 | 676.5 kB (201.8 kB gzipped, +0.2 kB) | 48.1 kB (10.1 kB gzipped) | — | — | — | — | — | — |
| 1.12.2 | 675.7 kB (201.6 kB gzipped, +0.7 kB) | 47.8 kB (10.1 kB gzipped, +0.1 kB) | — | — | — | — | — | — |
| 1.12.1 | 673.0 kB (201.0 kB gzipped, +2.6 kB) | 46.9 kB (9.9 kB gzipped, +0.2 kB) | — | — | — | — | — | — |
| 1.12.0 | 663.6 kB (198.3 kB gzipped, +0.3 kB) | 46.2 kB (9.8 kB gzipped) | — | — | — | — | — | — |
| 1.11.1 | 662.7 kB (198.0 kB gzipped) | 46.1 kB (9.8 kB gzipped) | — | — | — | — | — | — |
| 1.11.0 | 662.7 kB (198.0 kB gzipped, +2.8 kB) | 46.1 kB (9.8 kB gzipped, +0.1 kB) | — | — | — | — | — | — |
| 1.10.0 | 653.9 kB (195.2 kB gzipped, +6.8 kB) | 45.6 kB (9.6 kB gzipped, +0.7 kB) | — | — | — | — | — | — |
| 1.9.0 | 629.4 kB (188.4 kB gzipped, +2.5 kB) | 41.8 kB (8.9 kB gzipped, +0.2 kB) | — | — | — | — | — | — |
| 1.8.1 | 620.9 kB (185.9 kB gzipped) | 40.7 kB (8.7 kB gzipped) | — | — | — | — | — | — |
| 1.8.0 | 620.9 kB (185.9 kB gzipped) | 40.5 kB (8.7 kB gzipped) | — | — | — | — | — | — |
| 1.7.0 | 620.8 kB (185.9 kB gzipped) | 40.4 kB (8.7 kB gzipped) | — | — | — | — | — | — |
| 1.6.0 | 620.8 kB (185.9 kB gzipped) | 40.2 kB (8.7 kB gzipped) | — | — | — | — | — | — |
| 1.5.0 | 620.8 kB (185.9 kB gzipped, +2.1 kB) | 40.0 kB (8.7 kB gzipped, +0.1 kB) | — | — | — | — | — | — |
| 1.4.1 | 614.7 kB (183.8 kB gzipped) | 39.5 kB (8.5 kB gzipped, +0.1 kB) | — | — | — | — | — | — |
| 1.4.0 | 614.5 kB (183.8 kB gzipped, +3.1 kB) | 39.1 kB (8.5 kB gzipped, +0.3 kB) | — | — | — | — | — | — |
| 1.3.1 | 604.0 kB (180.7 kB gzipped, +0.4 kB) | 37.6 kB (8.1 kB gzipped, +0.1 kB) | — | — | — | — | — | — |
| 1.3.0 | 602.7 kB (180.3 kB gzipped, +5.0 kB) | 37.0 kB (8.0 kB gzipped, +0.9 kB) | — | — | — | — | — | — |
| 1.2.0 | 586.5 kB (175.3 kB gzipped, +2.1 kB) | 32.4 kB (7.1 kB gzipped, +0.7 kB) | — | — | — | — | — | — |
| 1.1.0 | 579.8 kB (173.2 kB gzipped) | 28.9 kB (6.5 kB gzipped) | — | — | — | — | — | — |
| 1.0.0 | 579.8 kB (173.2 kB gzipped) | 28.9 kB (6.5 kB gzipped) | — | — | — | — | — | — |

- **JavaScript:** the size of the built page’s JavaScript, as built and gzipped (what a visitor downloads).
- **CSS:** the same for its CSS.
- **Unit run:** how long the unit tests took, from the command to its end, coverage on (a little longer than a plain run).
- **Engine run:** the same for the engine tests.
- **End-to-end run:** the same for the end-to-end tests, the site’s build included.
- **First paint:** when the first text or picture was drawn, after the page was asked for (First Contentful Paint).
- **Largest paint:** when the largest text or picture was drawn (Largest Contentful Paint).
- **Blocking time:** Total Blocking Time: of each task longer than 50 ms after the first paint, what went over 50 ms, added up (the page could not answer a click meanwhile).

## The running app

Three states, each with the same five numbers:

- **Frames a second:** how many frames Chromium drew each second, counted by `requestAnimationFrame` (60 at most, headless).
- **Slowest frame:** the longest gap between two frames: a stutter shows here even when the average is smooth.
- **Main thread busy:** the share of the time the page’s main thread spent running tasks (DevTools’ `TaskDuration`): what is left is room to spare.
- **CPU:** the processor time all of Chromium’s processes used, the audio’s included, as a share of one core (above 100% means more than one).
- **Memory:** the JavaScript heap in use at the end, after a garbage collection (DevTools’ `JSHeapUsedSize`).

### Idle

The page open on Init, nothing playing.

| Version | Frames a second | Slowest frame | Main thread busy | CPU | Memory |
| --- | --- | --- | --- | --- | --- |
| 1.23.0 | 59.9 (+0.1) | 33 ms | 29.8% (−0.2 pt) | 62.4% (+0.8 pt) | 12.8 MB (+0.1 MB) |
| 1.22.0 | 59.8 | 50 ms | 30.0% (−1.6 pt) | 61.6% (−0.4 pt) | 12.7 MB (+0.5 MB) |
| 1.21.1 | 59.8 | 33 ms | 31.6% | 62.0% | 12.2 MB |
| 1.21.0 | — | — | — | — | — |
| 1.20.0 | — | — | — | — | — |
| 1.19.0 | — | — | — | — | — |
| 1.18.0 | — | — | — | — | — |
| 1.17.0 | 60.0 | 17 ms | 28.4% | 55.6% | 8.6 MB |
| 1.16.1 | — | — | — | — | — |
| 1.16.0 | — | — | — | — | — |
| 1.15.1 | — | — | — | — | — |
| 1.15.0 | — | — | — | — | — |
| 1.14.1 | — | — | — | — | — |
| 1.14.0 | — | — | — | — | — |
| 1.13.0 | — | — | — | — | — |
| 1.12.4 | — | — | — | — | — |
| 1.12.3 | — | — | — | — | — |
| 1.12.2 | — | — | — | — | — |
| 1.12.1 | — | — | — | — | — |
| 1.12.0 | — | — | — | — | — |
| 1.11.1 | — | — | — | — | — |
| 1.11.0 | — | — | — | — | — |
| 1.10.0 | — | — | — | — | — |
| 1.9.0 | — | — | — | — | — |
| 1.8.1 | — | — | — | — | — |
| 1.8.0 | — | — | — | — | — |
| 1.7.0 | — | — | — | — | — |
| 1.6.0 | — | — | — | — | — |
| 1.5.0 | — | — | — | — | — |
| 1.4.1 | — | — | — | — | — |
| 1.4.0 | — | — | — | — | — |
| 1.3.1 | — | — | — | — | — |
| 1.3.0 | — | — | — | — | — |
| 1.2.0 | — | — | — | — | — |
| 1.1.0 | — | — | — | — | — |
| 1.0.0 | — | — | — | — | — |

### Playing the Demo

The Demo playing from its start.

| Version | Frames a second | Slowest frame | Main thread busy | CPU | Memory |
| --- | --- | --- | --- | --- | --- |
| 1.23.0 | 55.1 (−0.8) | 67 ms | 65.4% (+3.9 pt) | 120.8% (+8.8 pt) | 13.7 MB (+0.1 MB) |
| 1.22.0 | 55.9 (+0.3) | 50 ms | 61.6% (−2.9 pt) | 112.0% (−2.8 pt) | 13.5 MB (+0.4 MB) |
| 1.21.1 | 55.6 | 67 ms | 64.4% | 114.8% | 13.2 MB |
| 1.21.0 | — | — | — | — | — |
| 1.20.0 | — | — | — | — | — |
| 1.19.0 | — | — | — | — | — |
| 1.18.0 | — | — | — | — | — |
| 1.17.0 | 58.8 | 33 ms | 53.4% | 104.2% | 10.8 MB |
| 1.16.1 | — | — | — | — | — |
| 1.16.0 | — | — | — | — | — |
| 1.15.1 | — | — | — | — | — |
| 1.15.0 | — | — | — | — | — |
| 1.14.1 | — | — | — | — | — |
| 1.14.0 | — | — | — | — | — |
| 1.13.0 | — | — | — | — | — |
| 1.12.4 | — | — | — | — | — |
| 1.12.3 | — | — | — | — | — |
| 1.12.2 | — | — | — | — | — |
| 1.12.1 | — | — | — | — | — |
| 1.12.0 | — | — | — | — | — |
| 1.11.1 | — | — | — | — | — |
| 1.11.0 | — | — | — | — | — |
| 1.10.0 | — | — | — | — | — |
| 1.9.0 | — | — | — | — | — |
| 1.8.1 | — | — | — | — | — |
| 1.8.0 | — | — | — | — | — |
| 1.7.0 | — | — | — | — | — |
| 1.6.0 | — | — | — | — | — |
| 1.5.0 | — | — | — | — | — |
| 1.4.1 | — | — | — | — | — |
| 1.4.0 | — | — | — | — | — |
| 1.3.1 | — | — | — | — | — |
| 1.3.0 | — | — | — | — | — |
| 1.2.0 | — | — | — | — | — |
| 1.1.0 | — | — | — | — | — |
| 1.0.0 | — | — | — | — | — |

### An 8-Voice chord

Init with 8 Voices, eight keys held (A S D F G H J K, C4 to C5).

| Version | Frames a second | Slowest frame | Main thread busy | CPU | Memory |
| --- | --- | --- | --- | --- | --- |
| 1.23.0 | 59.8 (−0.1) | 50 ms | 32.3% (+3.2 pt) | 68.2% (+7.5 pt) | 12.8 MB (+0.4 MB) |
| 1.22.0 | 59.9 | 33 ms | 29.0% (−3.4 pt) | 60.7% (−3.3 pt) | 12.4 MB (+0.2 MB) |
| 1.21.1 | 59.9 | 33 ms | 32.4% | 63.9% | 12.2 MB |
| 1.21.0 | — | — | — | — | — |
| 1.20.0 | — | — | — | — | — |
| 1.19.0 | — | — | — | — | — |
| 1.18.0 | — | — | — | — | — |
| 1.17.0 | 60.0 | 17 ms | 29.3% | 58.3% | 8.9 MB |
| 1.16.1 | — | — | — | — | — |
| 1.16.0 | — | — | — | — | — |
| 1.15.1 | — | — | — | — | — |
| 1.15.0 | — | — | — | — | — |
| 1.14.1 | — | — | — | — | — |
| 1.14.0 | — | — | — | — | — |
| 1.13.0 | — | — | — | — | — |
| 1.12.4 | — | — | — | — | — |
| 1.12.3 | — | — | — | — | — |
| 1.12.2 | — | — | — | — | — |
| 1.12.1 | — | — | — | — | — |
| 1.12.0 | — | — | — | — | — |
| 1.11.1 | — | — | — | — | — |
| 1.11.0 | — | — | — | — | — |
| 1.10.0 | — | — | — | — | — |
| 1.9.0 | — | — | — | — | — |
| 1.8.1 | — | — | — | — | — |
| 1.8.0 | — | — | — | — | — |
| 1.7.0 | — | — | — | — | — |
| 1.6.0 | — | — | — | — | — |
| 1.5.0 | — | — | — | — | — |
| 1.4.1 | — | — | — | — | — |
| 1.4.0 | — | — | — | — | — |
| 1.3.1 | — | — | — | — | — |
| 1.3.0 | — | — | — | — | — |
| 1.2.0 | — | — | — | — | — |
| 1.1.0 | — | — | — | — | — |
| 1.0.0 | — | — | — | — | — |
