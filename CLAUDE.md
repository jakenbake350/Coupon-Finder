# Coupon Finder

A personal coupon/deal finder app that uses AI + web search to find live promo codes for any store. No ads, no referral links.

## Current State

**Branch `claude/artifact-hosting-app-dduZT`** — working Vite + React app.
- Calls Anthropic API directly from the browser using `VITE_ANTHROPIC_API_KEY`
- Uses `claude-sonnet-4-20250514` with the `web_search_20250305` tool to find live codes
- Requires `anthropic-dangerous-direct-browser-access: true` header for browser use
- Builds to a static `dist/` folder — deployable anywhere (Vercel, Netlify, any static host)
- API key gets baked into the JS bundle at build time (fine for personal/hidden use, not for public)

**This version is good for personal use.** Each search costs ~$0.01–0.02 in API credits (separate from Claude.ai subscription).

## Planned: Free API Version

**Branch to create: `free-api`**

Replace the Anthropic call with a free stack:
- **Tavily API** — web search, free tier is 1,000 searches/month. Purpose-built for AI search, returns clean structured results.
- **Google Gemini API** — free LLM tier (generous daily limits). Used to parse Tavily results and format them into the coupon JSON structure the UI expects.
- **Cloudflare Workers** — free tier backend proxy to keep API keys server-side. Required so keys aren't exposed in the browser bundle.

This version would be suitable for hosting publicly (e.g. a hidden URL on a personal website) since it costs nothing at light usage.

## Repo Branch Strategy

- `main` — stable baseline
- `claude/artifact-hosting-app-dduZT` — Anthropic API version (personal use, current)
- `free-api` — Tavily + Gemini version (future, for public/shared hosting)

## Running Locally

```bash
cp .env.example .env   # add VITE_ANTHROPIC_API_KEY
npm install
npm run dev
```

## TODO

- [ ] Sync repo to desktop
- [ ] Decide on hosting for personal-use version
- [ ] Build free-api branch when ready (Tavily + Gemini + Cloudflare Workers proxy)
