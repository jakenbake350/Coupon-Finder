# Coupon Finder

A personal coupon/deal finder app that uses AI + web search to find live promo codes for any store. No ads, no referral links, no affiliate BS.

## How It Works

Enter a store name → the app uses Claude (Anthropic API) with live web search to find real, working promo codes → results are returned in a clean list with code, discount, and expiry info.

## Stack

- **Vite + React** — frontend
- **Anthropic API** (`claude-sonnet-4-20250514`) — AI with `web_search_20250305` tool for live results
- Builds to a static `dist/` folder — deployable anywhere (Vercel, Netlify, etc.)

## Setup

```bash
cp .env.example .env
# Add your Anthropic API key to .env:
# VITE_ANTHROPIC_API_KEY=sk-ant-...

npm install
npm run dev
```

## Cost

Each search costs roughly $0.01–0.02 in Anthropic API credits (separate from a Claude.ai subscription). The API key is baked into the JS bundle at build time — fine for personal/private use, not for public hosting.

## Deployment

```bash
npm run build
# Deploy the dist/ folder to any static host
```

## Planned: Free API Version

A future `free-api` branch will replace the Anthropic call with a free stack:
- **Tavily API** — web search (1,000 free searches/month)
- **Google Gemini API** — free LLM tier to parse results
- **Cloudflare Workers** — free backend proxy to keep keys server-side

This version will be suitable for public/shared hosting at light usage.
