# DCC Crawler Portal

A private, Cloudflare-native digital companion for managing crawlers and campaigns. The project is intentionally separate from CampaignCodex and is designed around the mechanics mapped from the supplied 650-page rulebook.

## Current foundation

- React 19 and TypeScript interface built with Vite
- Cloudflare Worker API served alongside Workers Static Assets
- D1 schema for users, campaigns, memberships, characters, skills, and inventory
- Cloudflare Access identity in production, with a localhost-only development identity
- Dashboard, crawler roster, interactive sheet foundation, campaign creation, and compendium shell
- Selective Worker routing for `/api/*`, generated binding types, observability, and source maps

This is an initial product slice, not a finished rules implementation. See [docs/PRODUCT.md](docs/PRODUCT.md) for the delivery roadmap.

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run cf-typegen
npm run db:migrate:local
npm run dev
```

Open the local URL printed by Vite. Local requests use `local-crawler@dccrpg.test`; deployed API requests require the `Cf-Access-Authenticated-User-Email` header supplied by Cloudflare Access.

## Validation

```bash
npm run check
npm run deploy:dry-run
```

## Cloudflare setup

1. Authenticate Wrangler with `npx wrangler login`.
2. Create the production database with `npx wrangler d1 create dccrpg-db` and allow Wrangler to update `wrangler.jsonc` with its database ID.
3. Apply migrations with `npm run db:migrate:remote`.
4. Deploy with `npm run deploy`.
5. Attach the Worker to your chosen custom domain or subdomain.
6. Put the application behind Cloudflare Access and restrict it to your players before sharing it.
7. `workers.dev` and preview URLs are disabled by default in `wrangler.jsonc`; keep them disabled while player data is private.

The repository deliberately does not contain the source PDF. `*.pdf`, `reference/`, and the earlier `Sourcebook` placeholder are ignored to prevent accidental publication of copyrighted material.

## Git workflow

The configured remote is intended to be:

```text
https://github.com/ThirdDimensionYT/DCCRPG.git
```

No deployment or push is performed automatically. Review the initial commit locally before pushing it to GitHub.
