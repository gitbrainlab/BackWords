# BackWords

BackWords is a linguistic time machine for tracing semantic drift across time.

This repository is split across two deploy targets:
- The PWA frontend lives in `pwa/` and is deployed to GitHub Pages / `backwords.art`.
- The API lives in Netlify Functions under `pwa/netlify/functions/` and is deployed via `netlify.toml`.

## Repository Layout

- `pwa/`: React + Vite PWA frontend and Netlify functions
- `data/`: seed words, knowledge pages, and passages
- `packages/shared-schema/`: shared JSON schemas
- `docs/`: product and API documentation
- `netlify.toml`: Netlify build, headers, and runtime config

## Local Development

Prerequisites:
- Node.js 20+
- npm

Frontend:

```bash
cd pwa
npm ci
npm run dev
```

Useful commands:

```bash
cd pwa
npm run typecheck
npm run test:unit
npm run build
```

## Deployment Model

Frontend:
- Built from `pwa/`
- Deployed to GitHub Pages by `.github/workflows/deploy.yml`

API:
- Deployed by Netlify using `netlify.toml`
- Functions source: `pwa/netlify/functions/`

## Environment Variables

Keep secrets in Netlify UI, not in git:
- `XAI_API_KEY`: required for live xAI-backed API calls
- `BENCHMARK_API_KEY`: optional shared secret for benchmark access

Repo-controlled defaults:
- Benchmark is enabled by default in code
- `netlify.toml` also sets `BENCHMARK_ENABLED=true` for production as an explicit runtime default

To disable benchmarking in a given environment, set:

```text
BENCHMARK_ENABLED=false
```

## Benchmark Endpoint

Endpoint:

```text
POST /.netlify/functions/benchmark
```

Notes:
- Designed to benchmark synthetic prompt scenarios without exercising normal app flows
- Requires `X-Benchmark-Key` only if `BENCHMARK_API_KEY` is configured
- Hard server-side limits are enforced for concurrency, iterations, timeout, and token budget

See `docs/api-contract.md` for the request/response schema.

## VS Code

Optional extension for Netlify deploy visibility in VS Code:
- `shailen.netlify`

Use the extension for status visibility, but keep deploy/runtime configuration in `netlify.toml` so the repository remains self-contained.