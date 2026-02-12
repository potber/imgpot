# imgpot

Image hosting for [potber](https://potber.de). Users log in via potber-auth OAuth, upload images, and get optimized variations with ready-to-use BBCode for forum posts.

## Features

- OAuth login via potber-auth
- Drag-and-drop image uploads (JPEG, PNG, GIF, WebP, max 20MB)
- Automatic WebP conversion with 4 size variations (original, large, medium, small)
- CDN delivery via bunny.net
- Copy direct URLs and BBCode (including click-to-enlarge)
- Folder organization

## Tech Stack

- SvelteKit (TypeScript)
- PostgreSQL + Drizzle ORM
- Sharp (image processing)
- bunny.net (CDN storage)
- Tailwind CSS

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
| `DATABASE_URL` | PostgreSQL connection string |
| `BUNNY_STORAGE_ZONE` | bunny.net Storage Zone name |
| `BUNNY_STORAGE_API_KEY` | bunny.net Storage API key |
| `BUNNY_STORAGE_REGION` | bunny.net region endpoint |
| `BUNNY_CDN_HOSTNAME` | bunny.net Pull Zone hostname |
| `SESSION_SECRET` | Secret for session cookies |

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

Every uploaded image is converted to WebP and resized into 4 variations:

| Variation | Max Width | Quality | Use Case |
|---|---|---|---|
| original | unchanged | 90 | Full resolution |
| large | 1600px | 82 | Click-to-enlarge |
| medium | 800px | 80 | Inline forum embedding |
| small | 320px | 78 | Thumbnails |
