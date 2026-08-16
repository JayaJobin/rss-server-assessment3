# RSS Server — Frontend

> **Note:** This README describes the frontend as it stood for **Assessment 1**.
> The project has since grown into a full-stack app across Assessments 2 and 3
> (live backend, database, dashboard, observability, testing). For the
> current, up-to-date project overview, see the **root [README.md](../README.md)**.
> This file is kept as-is below for historical reference on how the original
> Assessment 1 frontend rubric criteria were met.


CSE5006 Assessment 1: a usability-focused frontend for an RSS Server that
will eventually feed content into an LMS. This assessment is frontend
only — sample blog-style content stands in for a live feed until the
backend is built in Assessment 2.

**Author:** Jaya Jobin (Student ID: 22839039)

Built with TypeScript throughout (`.ts`/`.tsx`), using the Next.js App Router.

## Getting started

Requires Node.js v22 or later.

```bash
npm install
npm next dev
```

Open http://localhost:3000 in a browser. Edit any file under `app/` and
the page updates automatically.

To create a production build:

```bash
npm run build
npm start
```

## Project structure

```
app/
  layout.tsx            Root layout: fonts, theme init script, header/footer
  page.tsx               Home page (hero, workflow diagram, featured carousel, latest posts)
  about/page.tsx          About page (project summary, author, video)
  feeds/page.tsx           Feeds listing (filter + expandable cards)
  feeds/[slug]/page.tsx     Dynamic single-post page
  settings/page.tsx        Theme, layout, and stored-preference controls
components/
  Header.tsx, Footer.tsx     Site chrome
  Navbar.tsx                 Nav links + hamburger menu + theme toggle
  Breadcrumbs.tsx             Dynamic breadcrumb trail
  WorkflowSteps.tsx            Interactive RSS → LMS pipeline diagram
  Carousel.tsx                  Accessible featured-posts carousel (auto-advance, keyboard, dots)
  FeedCard.tsx                   Feed item card with hide/show preview
  Accordion.tsx                   Reusable hide/show content area (About FAQ, Settings Advanced)
  ToastProvider.tsx                Visual feedback layer for menu/theme/settings actions
  RecordView.tsx / useRecentlyViewed.ts  localStorage read/write for recently viewed posts
  ThemeProvider.tsx                 Theme context, persisted to localStorage
  LayoutPreferenceProvider.tsx       Compact-layout context, persisted to localStorage
  useClientStorage.ts                 Generic localStorage-backed state hook (built on lib/storageUtil.ts)
  ManageFeeds.tsx                    Add/remove RSS feed sources (the feed subscriptions themselves)
lib/storageUtil.ts       Separated localStorage / cookie helpers, with notes on why each is used where
data/posts.ts            Sample feed content (stand-in for live RSS data)
data/feedSources.ts      Sample feed sources the server subscribes to          Sample feed content (stand-in for live RSS data)
```

## Where each rubric criterion is met

**User Interface** — `components/Header.tsx`, `Navbar.tsx`, `Footer.tsx` and
`app/about/page.tsx` provide a consistent header, navigation, footer, and
About page across every route.

**Themes** — `ThemeProvider.tsx` holds light/dark state in React context,
persists it to `localStorage`, and an inline script in `app/layout.tsx`
applies the saved theme before first paint to avoid a flash of the wrong
theme. Toggle from the navbar or the Settings page.

**Hamburger menu** — `Navbar.tsx` / `Navbar.module.css`. The button animates
its three bars into an X with a CSS transform, is fully keyboard operable
(Enter/Space to toggle, Escape to close and return focus), and exposes
`aria-expanded` / `aria-controls`.

**Interactive frontend views + functionality** — the Home page's
`WorkflowSteps` component is a clickable RSS → LMS pipeline; a `Carousel`
of featured posts auto-advances and is fully keyboard/dot-navigable;
`FeedCard` supports hide/show previews; the Feeds page has a live category
filter plus a live text search; `feeds/[slug]` is a dynamic route per
post; breadcrumbs are generated from the current path; theme,
compact-layout, last menu state, and a "recently viewed posts" list are
all persisted to `localStorage`. `Accordion` is a single reusable
hide/show component used in two different content areas (the About page
FAQ and the Settings page Advanced section), and `ToastProvider` gives
visible confirmation whenever the menu opens/closes or a theme/layout
preference changes.

**Code quality and GitHub** — components are split by responsibility, CSS
Modules scope styles per component, and shared storage logic is factored
out into `lib/storageUtil.ts`, which separates `localStorageUtil` (client
UI preferences) from `cookieUtil` (kept ready for Assessment 2, where the
server will need to read some values back). `useClientStorage` is a thin
React hook wrapper over `localStorageUtil`. See the Git workflow notes
below before submitting.

**Managing feeds** — `components/ManageFeeds.tsx` on the Feeds page lets
a visitor add a new feed source (name + URL, validated) or remove an
existing one. This is the feed *subscription* list, distinct from the
sample posts those feeds have already delivered (`data/posts.ts`); it is
stored the same way other preferences are, via `localStorageUtil`.

## Accessibility notes

- Skip-to-content link at the top of every page.
- Visible focus ring (`:focus-visible`) on all interactive elements.
- Hamburger menu, theme toggle, filter buttons, and the carousel all
  expose correct ARIA state (`aria-expanded`, `aria-pressed`,
  `aria-current`, `aria-live`).
- The carousel pauses on hover/focus and respects
  `prefers-reduced-motion` (no auto-advance if the user has that OS
  setting enabled).
- Colour palette was chosen to keep body text and interactive text at or
  above WCAG AA contrast in both themes; re-check with a contrast checker
  after any palette changes.
- `prefers-reduced-motion` is respected globally in `app/globals.css`.