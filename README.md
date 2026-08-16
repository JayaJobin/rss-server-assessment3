# RSS Server — Assessment 2

A containerised RSS Server backend built with Next.js, Sequelize, and SQLite, integrated with the Assessment 1 React frontend.

## Repository

This is the dedicated repository for **Assessment 2**, kept separate from the Assessment 1 frontend repository per the tutor's advice to use one repository per assessment.

- **Assessment 2 (this repo):** https://github.com/JayaJobin/rss-server-assessment2
- **Assessment 1:** https://github.com/JayaJobin/rss-server-frontend

## Architecture

wk5docker/
- frontend/  — Next.js UI (Assessment 1), extended to consume the live API, including an RSS Client page
- api/       — Next.js API-only app: Sequelize models, repositories, migrations, CRUD + operational routes
- docker-compose.yml

| Service    | Role                          | Tech                          | Port |
|------------|-------------------------------|--------------------------------|------|
| frontend   | React UI + RSS Client         | Next.js (production build)     | 3000 |
| api        | REST API + RSS feed           | Next.js + Sequelize + SQLite (production build) | 4000 |

The database lives in a named Docker volume (sqlite_data), mounted directly into the api service at /app/sqlite. There is no separate "database container" — SQLite is a file-based embedded database, so it doesn't run as its own server process; the volume just needs to be attached to whichever container touches the file, which is api.

## Backend code organization

The API's app/lib folder is organized by concern rather than one large file:

- app/lib/models/ — one file per Sequelize model (FeedSource.ts, Author.ts, Post.ts, RequestCounter.ts), plus associations.ts for relationships and db.ts for the Sequelize connection. index.ts re-exports everything as a single import point.
- app/lib/repositories/ — one repository per model (postRepository, feedSourceRepository, authorRepository, requestCounterRepository). Route handlers call these instead of touching Sequelize models directly, so query logic is reusable and route files stay thin.
- app/lib/validationSchemas.ts — zod schemas for every CRUD payload (create/update), shared by all routes.
- app/lib/cors.ts / app/lib/apiResponse.ts — centralised CORS headers and response/error helpers (jsonOk, jsonError, withErrorHandling), used by every route instead of each file redeclaring its own.
- app/lib/rss.ts — shared RSS 2.0 XML builder used by both /api/rss and /api/rss/[category].

## Database schema

The database uses Sequelize ORM with SQLite. The main models are Author, FeedSource and Post.

- Author — id, name, email (unique)
- FeedSource — id, name, url (unique)
- Post — id, slug (unique), title, author, publishedAt (native DATE), category, summary, body, imageUrl, link, readTime, feedSourceId (FK), authorId (FK)

Indexes: Post.feedSourceId, Post.authorId, Post.category, and Post.publishedAt all have indexes, in addition to the unique index on Post.slug.

A FeedSource can contain multiple Posts, and an Author can create multiple Posts. Each Post stores information such as title, author/description, publication date, image, link and category.

Relationships:
- FeedSource.hasMany(Post) / Post.belongsTo(FeedSource)
- Author.hasMany(Post) / Post.belongsTo(Author)

Note on Post.author: Post.author stores the author's display name as a plain string at the time the post was published (the byline), while Post.authorId is a foreign key to the Author table used for relational queries such as "all posts by this author." This is intentional denormalization: RSS feeds conventionally show a fixed byline string even if the underlying Author record is later renamed or removed, so author preserves historical accuracy independent of the Author table's current state.

## API endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST/PATCH/DELETE | /api/posts | CRUD for posts (zod-validated) |
| GET/POST/PATCH/DELETE | /api/feedsources | CRUD for feed sources (zod-validated, unique url) |
| GET/POST/PATCH/DELETE | /api/authors | CRUD for authors (zod-validated, unique email) |
| GET | /api/health | Heartbeat (status, uptime, timestamp) |
| GET | /api/count | Running count of API requests (persisted in SQLite) |
| GET | /api/stats | Feed statistics (totals + request count) |
| GET | /api/rss | Live RSS 2.0 XML feed generated from Posts |
| GET | /api/rss/[category] | Live RSS 2.0 XML feed filtered to one category |

The CRUD routes (posts, feedsources, authors), the RSS feed route, and /api/count itself all increment the shared request counter. /api/health and /api/stats only read the current value, they do not increment it. The counter is stored in a RequestCounters table, so it survives container restarts.

## API validation and error handling

- POST/PATCH bodies are validated with zod schemas (app/lib/validationSchemas.ts) — type, format (URL/email), length, and required-field checks. Invalid input returns 400 with an error/fields breakdown of exactly which field failed and why.
- CORS headers and JSON error/success responses are centralised in app/lib/cors.ts and app/lib/apiResponse.ts, so every route returns a consistent shape instead of each file repeating its own try/catch and header object.

## Running locally

docker-compose up -d --build

Frontend: http://localhost:3000
RSS Client: http://localhost:3000/rss-client
API: http://localhost:4000/api/...

Both services use production Next.js builds (next build + next start), not next dev, and there are no bind-mounted source directories — the containers run the code that was baked into the image at build time. This means a code change requires a rebuild (docker-compose up -d --build) to take effect, unlike a dev server with hot reload.

On startup, the api service runs npx sequelize-cli db:migrate before starting the server, so the schema is brought up to date from api/migrations/ every time the container starts — no manual migration step required.

## Environment configuration

The frontend reads the API's public address from NEXT_PUBLIC_API_URL. Because the frontend uses a production Next.js build, this value is baked into the client-side JavaScript bundle at build time, not read at runtime — so it's passed as a Docker build argument in docker-compose.yml:

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: http://<deployment-ip>:4000

Changing this value requires rebuilding the frontend image (docker-compose up -d --build frontend), not just restarting the container.

## Frontend-backend integration

frontend/lib/apiServer.ts fetches posts server-side over Docker's internal network (http://api:3000) for the homepage and feeds pages. frontend/lib/apiClient.ts is used by client-side components (ManageFeeds, ManagePosts) running in the browser to read/write data against the API's public address. frontend/app/rss-client/page.tsx acts as an independent RSS Client: it fetches /api/rss directly and parses the raw RSS 2.0 XML in the browser.

## Docker architecture

Two services, defined in docker-compose.yml:

| Service | Build | Purpose |
|---|---|---|
| frontend | multi-stage build from frontend/Dockerfile | Next.js UI, port 3000 |
| api | multi-stage build from api/Dockerfile | Next.js + Sequelize API, port 4000 (mapped from container port 3000) |

Each Dockerfile uses a multi-stage build:
1. deps — installs full dependencies (including dev dependencies needed to compile).
2. builder — copies source and runs next build, producing an optimized production build.
3. prod-deps — a separate, production-only dependency install (npm install --omit=dev), keeping the final image free of dev tooling.
4. runner — the actual image that runs: copies only the compiled .next output and production node_modules from the earlier stages, then starts with next start (api also runs pending migrations first).

The SQLite database file lives in the named volume sqlite_data, mounted directly at /app/sqlite inside the api container, so data persists across container restarts and rebuilds.

## RSS Server → RSS Client Workflow

1. Posts are created via POST /api/posts (through the Manage Posts admin page or directly against the API).
2. GET /api/rss (or /api/rss/[category]) queries the Post table (via postRepository) with Sequelize and serialises the results into RSS 2.0 XML on the fly — there is no separate "feed generation" step or cache.
3. frontend/app/rss-client/page.tsx acts as an independent RSS Client: it fetches that XML directly with fetch(), parses it in the browser with DOMParser, and renders it as cards — completely separate from the admin "Feeds" page, demonstrating a genuine server → client feed handoff.
4. The category filter buttons on that page are populated dynamically from GET /api/posts, so a new category typed into a post automatically becomes a filter option without any code change.

## Testing

Manual endpoint testing performed via curl against the running Docker containers:

| Request | Expected | Result |
|---|---|---|
| GET /api/health | 200, status: "ok" | Pass |
| GET /api/count | 200, numeric count | Pass |
| GET /api/stats | 200, totals object | Pass |
| GET /api/posts | 200, array of posts | Pass |
| GET /api/feedsources | 200, array of feed sources | Pass |
| POST /api/feedsources with invalid url | 400, field-level validation error | Pass |
| GET /api/rss | 200, valid RSS 2.0 XML | Pass |
| GET /api/rss/[category] | 200, XML filtered to that category only | Pass |
| docker-compose ps | Both containers "Up" | Pass |
| Container restart | /api/stats request count persists (does not reset to 0) | Pass |

Frontend integration was verified manually in-browser: homepage and Feeds page display live database content, and the RSS Client page correctly switches feeds when a category button is clicked.

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| NEXT_PUBLIC_API_URL | frontend (browser-side, build-time) | Public address of the API, e.g. http://<ec2-ip>:4000, passed as a Docker build arg |
| API_INTERNAL_URL | frontend (server-side, runtime) | Internal Docker network address of the API (defaults to http://api:3000) used for server-rendered pages |
| NODE_ENV | both services | Set to production; also determines which SQLite file the API connects to (config/config.json / app/lib/models/db.ts both key off this) |

## Git Branching Strategy

Backend and integration work for Assessment 2 was developed on feature/assessment-2-backend, kept separate from main (Assessment 1's frontend-only state) until reviewed and merged. Commits on that branch track incremental backend work: schema/migrations, CRUD routes, operational endpoints, Docker setup, the RSS Client, and the dynamic category-filtering feature. A later hardening pass added schema indexes/constraints, zod validation, a repository layer, and the production Docker configuration described above.

## Known Limitations

- Post.author is a free-text display name separate from the optional Post.authorId relationship — this was a deliberate choice to support posts from feeds without a registered author profile, but it means the two can technically disagree if not kept in sync manually.
- Foreign keys (feedSourceId, authorId) are nullable to allow posts to be created without a linked feed/author; a stricter schema could enforce these as required once all data sources are guaranteed to supply them.
- The production Docker image installs sequelize-cli as a runtime dependency so migrations can run on container startup; a larger-scale deployment might instead run migrations as a separate one-off job/step rather than on every container start.
- `docker-compose.yml` bakes a specific EC2 public IP into `NEXT_PUBLIC_API_URL` as a build arg, since that value has to be known at Next.js build time for browser-side fetches. This works for the deployed instance this project currently runs on, but is not portable out of the box — running the stack against a different host requires updating that one line (or overriding it via `docker-compose build --build-arg NEXT_PUBLIC_API_URL=http://<new-host>:4000 frontend`) before rebuilding. A more portable setup would resolve this at runtime (e.g. a same-origin API proxy) rather than baking a fixed URL in at build time; that refactor was out of scope for this iteration.

---

## Assessment 3 — Data-driven web application and reporting

Assessment 3 extends the Assessment 2 backend with a dashboard, per-feed/
per-client observability, simulated data, and automated testing.

### New database tables

- **RequestLogs** — one row per RSS-feed request, storing `path`,
  `method`, `clientId` and (when it maps to a known feed) `feedSourceId`.
  Backs the "requests per feed" and "requests per client" metrics and the
  unique-client count.
- **FeedStatuses** — one row per feed source, storing its current
  `status` (`ok` / `empty` / `error`), an optional `message`, and
  `lastCheckedAt`. Updated every time that feed is fetched via
  `/api/rss/[category]`, or via `/api/simulate`.

### New/updated API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Heartbeat — returns 200 OK with status/uptime (unchanged from Assessment 2) |
| GET | /api/stats | Extended: totalFeedSources, totalPosts, totalApiRequests, totalLoggedRequests, uniqueClientCount, requestsPerFeed[], requestsPerClient[], feedStatuses[] |
| POST | /api/simulate | Generates simulated feed sources, authors, posts and request traffic, and deliberately marks one feed "empty" and one "error" so the dashboard has ok/empty/error states to demonstrate |
| GET | /api/rss/[category] | Unchanged output, but now logs the request against the matching feed source and updates that feed's status (ok/empty) on every fetch |

`/api/rss/[category]` resolves "which feed" a request belongs to by
matching the category name against `FeedSource.name` (case-sensitive
match on the seeded names from `/api/simulate`, e.g. "Campus
Announcements"). Requests that don't match a known feed are still logged
(for total/unique-client counts) with `feedSourceId: null`.

### Dashboard (`/dashboard`)

Client-rendered page that polls `/api/stats` and `/api/health` every 10
seconds and shows: an API-health pill, five metric cards (total
requests, logged requests, RSS feed count, total posts, unique clients),
a requests-per-feed table, a requests-per-client table, and a feed status
list with colour-coded OK/EMPTY/ERROR badges and messages. A "Generate
simulated traffic" button calls `/api/simulate` directly from the UI for
live demonstration.

### Testing

- **Playwright** (`tests/server.spec.ts`, `tests/client.spec.ts`) — see
  [TESTING.md](./TESTING.md).
- **JMeter** (`jmeter/load-test-plan.jmx`) — parameterised staged load
  test (x1/x10/x100/x1000/x10000), see [TESTING.md](./TESTING.md).
- **Lighthouse** — accessibility run against the frontend, see
  [TESTING.md](./TESTING.md).

### Running the new migrations

```bash
docker-compose exec api npx sequelize-cli db:migrate
```

(or rebuild the containers — the production image runs pending
migrations on startup, per the Known Limitations note above).
