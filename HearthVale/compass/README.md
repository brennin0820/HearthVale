# HearthVale Compass

NightRaven Compass — project guidance UI for building **HearthVale** with God's Eye memory and NightRaven orchestration.

**Motto chain:** God's Eye thinks · NightRaven builds · Auditor verifies · Compass points.

## Run (browser)

```bash
cd compass
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Run (macOS app)

```bash
cd compass
npm install
npm run mac:dev
```

Starts Vite + Electron with native macOS window (`hiddenInset` title bar, traffic lights).

## Build Mac `.app`

```bash
cd compass
npm run build:mac
```

Output: `compass/release/HearthVale Compass.app` (and `.dmg`).

## Registry

Compass reads God's Eye workspaces from `../scripts/gods-eye-projects.conf` at the HearthVale repo root. Default project: **HearthVale**.

## Verify

```bash
npm run build
npm run lint
```

**Smoke:** Dashboard loads HearthVale handoff; Settings shows registry; edit `docs/14_SESSION_HANDOFF.md` → within ~10s **Updated** badge (auto-refresh on).

## Phases live (1–8)

Dashboard · Scope Map · Roadmap · Priority Board · task queues · Next Prompt · Decisions · Blockers · Not Now · Auditor Queue · Progress · Done Criteria · Memory Feed · Loop Detector · Reports · Settings
