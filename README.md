# imgpot

Image hosting for [potber](https://potber.de). Users log in via potber-auth OAuth, upload images, and get optimized variations with ready-to-use BBCode for forum posts.

## Features

- OAuth login via potber-auth
- Drag-and-drop image uploads (JPEG, PNG, GIF, WebP, max 20MB)
- Automatic WebP conversion with up to 3 size variations (large, medium, small — skips sizes larger than the original)
- Opaque imgur-style CDN URLs (e.g. `aB3xK9mR2ql.webp`)
- CDN delivery via bunny.net
- Copy direct URLs and BBCode (including click-to-enlarge)
- Folder organization
- Account deletion with full CDN cleanup

## Tech Stack

- SvelteKit with adapter-node (TypeScript)
- PostgreSQL + Drizzle ORM
- Sharp (image processing)
- bunny.net (CDN storage)
- Tailwind CSS
- Kamal v2 (deployment)

## Getting Started

### Dev Container (recommended)

Open the project in VS Code and select **Reopen in Container**. This sets up Node.js, PostgreSQL, and all dependencies automatically.

Once inside the container:

```sh
npm run db:push   # create database tables
npm run dev       # start dev server on port 3000
```

### Local Setup

**Prerequisites:** Node.js 22+, PostgreSQL 17

1. Start PostgreSQL:

   ```sh
   docker compose up -d
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file from the example and fill in your values:

   ```sh
   cp .env.example .env
   ```

4. Push the schema to the database:

   ```sh
   npm run db:push
   ```

5. Start the dev server:

   ```sh
   npm run dev
   ```

   The app runs at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `BUNNY_DATABASE_URL` | Bunny Database libSQL connection URL |
| `BUNNY_DATABASE_AUTH_TOKEN` | Bunny Database auth token |
| `BUNNY_STORAGE_ZONE` | bunny.net Storage Zone name |
| `BUNNY_STORAGE_API_KEY` | bunny.net Storage API key |
| `BUNNY_STORAGE_REGION` | bunny.net region endpoint |
| `BUNNY_CDN_HOSTNAME` | bunny.net Pull Zone hostname |
| `SESSION_SECRET` | Secret for session cookies |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of frontend origins allowed to call `/api/*` with Bearer auth |
| `POTBER_AUTH_BASE` | Potber auth base URL used for the OAuth redirect |
| `POTBER_API_BASE` | Potber API base URL used to validate Bearer tokens |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run check` | TypeScript/Svelte type checking |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Image Variations

Every uploaded image is converted to WebP. Variations that would require upscaling are skipped, and at least one variation is always produced:

| Variation | Max Width | Quality | Use Case |
|---|---|---|---|
| large | 1600px | 82 | Click-to-enlarge |
| medium | 800px | 80 | Inline forum embedding |
| small | 320px | 78 | Thumbnails |

CDN URLs are flat and unguessable: `https://imgpot.de/aB3xK9mR2ql.webp` (10-char base62 token + variation suffix).

## Deployment

The app deploys to a Hetzner VPS via [Kamal v2](https://kamal-deploy.org/).

### Setup

1. Copy the secrets template and fill in your values:

   ```sh
   cp .kamal/secrets.example .kamal/secrets
   ```

2. Deploy:

   ```sh
   kamal setup
   ```

Database migrations run automatically on container startup.

### Schema Changes

1. Edit schema files in `src/lib/server/db/schema/`
2. Generate a migration: `npm run db:generate`
3. Commit the migration file
4. `kamal deploy` — migrations run automatically
