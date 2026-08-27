# DCC Crawler Portal

A private, Cloudflare-native digital companion for managing crawlers and campaigns. The project is intentionally separate from CampaignCodex and is designed around the mechanics mapped from the supplied 650-page rulebook.

## Current foundation

- React 19 and TypeScript interface built with Vite
- Cloudflare Worker API served alongside Workers Static Assets
- D1 schema for users, campaigns, memberships, characters, skills, and inventory
- App-managed player accounts with salted, secret-keyed password credentials, secure sessions, administrator-controlled resets, and self-service password changes
- Guided Level 10/20/30 crawler creation across identity, race, class, Stats, skills, and review screens, with concise rulebook summaries and page references
- Standard-array or manual d6 Stat creation, level-package points, automatic Race/Class Stat changes and caps, and derived Mana/Popularity
- In-app d2, d3, d4, d6, d8, d10, d12, d20, and d100 roller with d20 advantage/disadvantage and recent-roll history
- Dashboard, owner-wide crawler roster, character deletion, responsive multi-section player sheets, private character-art uploads, campaign creation, and compendium shell
- Digital character-sheet fields mapped only from pages 4–21 of the supplied portrait sheet: core status, attacks, hotlist, gear, skills, and inventory
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

Open the local URL printed by Vite. On a fresh local database, use `local-setup` as the temporary setup token to create the first administrator.

## Validation

```bash
npm run check
npm run deploy:dry-run
```

## Cloudflare setup

1. Authenticate Wrangler with `npx wrangler login`.
2. Create the production database with `npx wrangler d1 create dccrpg-db` and allow Wrangler to update `wrangler.jsonc` with its database ID.
3. Create the private artwork bucket with `npx wrangler r2 bucket create dccrpg-character-art`.
4. Set the permanent credential-signing secret with `npx wrangler secret put AUTH_SECRET` (use a unique random value of at least 32 characters and retain it securely; changing it invalidates existing passwords).
5. Set the one-time production setup token with `npx wrangler secret put ADMIN_SETUP_TOKEN`.
6. Apply migrations with `npm run db:migrate:remote`.
7. Deploy with `npm run deploy`. The custom domain is already configured in `wrangler.jsonc`.
8. Create the first owner account from the setup screen, and then delete `ADMIN_SETUP_TOKEN` with `npx wrangler secret delete ADMIN_SETUP_TOKEN`.
9. Create and manage individual player passwords under **Player access**. The owner can view and edit every character; players can view and edit only characters they own.

Cloudflare Access should not be enabled on the app hostname when using the built-in login, otherwise players would face two separate login screens.
`workers.dev` and preview URLs are disabled by default in `wrangler.jsonc`; keep them disabled while player data is private.

The repository deliberately does not contain the source PDF. `*.pdf`, `reference/`, and the earlier `Sourcebook` placeholder are ignored to prevent accidental publication of copyrighted material.

## Git workflow

The configured remote is intended to be:

```text
https://github.com/ThirdDimensionYT/DCCRPG.git
```

No deployment or push is performed automatically. Review the initial commit locally before pushing it to GitHub.
