# Locco

Locco is a Singapore-focused social food map MVP. The product promise is simple: food near where the user is going, filtered by people whose taste they trust.

The app should feel warm, social, and playful. The main experience is browsing trusted friends' saved places, then choosing where to go from a map or a saved-place stack.

Repo path on this machine:

```text
C:\Projects\locco
```

## Current Product Surface

- `/app/map` shows a MapLibre map centered on Singapore with selected trusted lists, clustered pins, OneMap search, Ask Locco recommendations, and a mobile place bottom sheet.
- `/app/lists` shows friend/list-owner discovery with Locco palette pills and large saved-list cards.
- `/app/lists/[id]` shows a mobile-first saved-place stack with swipe/scroll navigation and flippable cards.
- `/app/place/[id]` provides a place detail route foundation.
- `/login` supports Supabase email-password sign in and sign up.
- `/app` routes are protected by middleware when Supabase public env values are configured.
- In no-Supabase local development, the app still runs against mock/demo data.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MapLibre GL JS
- Supabase Auth
- `@supabase/ssr`
- Server-side OneMap search route
- Mock food-data fallback for development without Supabase credentials

## Run Locally

Install dependencies:

```powershell
npm.cmd install
```

Start the dev server:

```powershell
npm.cmd run dev
```

Then open:

```text
http://localhost:3000
```

Useful routes:

```text
http://localhost:3000/app/map
http://localhost:3000/app/lists
http://localhost:3000/app/lists/list_annj
http://localhost:3000/app/map?lists=list_annj
http://localhost:3000/login
```

Checks:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Environment Variables

The app should remain runnable without Supabase credentials. Add local env values only when testing Supabase-backed auth and persistence.

Allowed public Supabase env variable names:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Optional legacy fallback:
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env.local`. Do not add service role keys, private Supabase keys, `sb_secret_*` values, tokens, cookies, or other secrets to client-side env variables or documentation.

OneMap search is called from `src/app/api/onemap/search/route.ts`. Keep OneMap calls server-side. The current search path can fall back to known Singapore locations if the live call fails.

## Auth

Auth is no longer mocked when Supabase public env values are configured.

- `/login` supports email-password sign in and sign up.
- Supabase Confirm Email is enabled, so newly created accounts may need email confirmation before sign-in.
- `src/middleware.ts` protects `/app/:path*` when Supabase public env values are available.
- If Supabase public env values are missing, middleware allows no-Supabase development mode.
- `POST /api/auth/profile/ensure` calls `getOrCreateCurrentProfile()` and creates a minimal profile safely for the signed-in user when needed.
- Server auth clients are built with `@supabase/ssr`.

## Saves And Status

Save persistence exists for signed-in users.

- `POST /api/places/save` saves a place for the current signed-in user.
- Repeated saves are idempotent: an existing saved relationship is updated instead of duplicated.
- `DELETE /api/places/save` removes only the current user's saved relationship from lists they own.
- If a saved place needs a personal list, the API creates or reuses the user's private `My saved places` list.
- Server-side duplicate prevention uses a computed `place_key`.
- Local Add Place entries with `local-` IDs are still local-only and are not persisted yet.

Saved-place status model:

- `saved_places.status` is `want_to_try` or `visited`.
- `saved_places.note` is the user's personal note.
- `saved_places.rating` is the user's personal rating for visited places.
- `Favourite` is a rating label, not a lifecycle status.

Current UI:

- The map place bottom sheet has `Want to try` and `Visited` controls.
- Choosing `Visited` can store a rating and personal note.
- Choosing `Want to try` can store a personal note only.
- The save status sheet can edit an existing save or remove it.
- Flippable list-detail cards do not show save/status controls.
- Non-map `PlaceCard` surfaces hide save/status controls by default unless `showSaveStatusControls` is explicitly opted in.

## Place Actions

- Place cards and the map place bottom sheet use one `Directions` action instead of separate Apple/Google buttons.
- The Directions sheet includes `Copy address`, `Open in Apple Maps`, `Open in Google Maps`, and `Cancel`.
- External map queries should prefer place name plus full address. Raw latitude/longitude should only be a fallback when text identity is unavailable.

## Data Model

Core entities:

- `places` is the canonical physical food location.
- `saved_places` is a user's personal relationship to a place.
- `food_lists` is a list/grouping of saved places.
- `profiles` stores the minimal display identity Locco needs for ownership and saved-by context.

Food data reads prefer Supabase when auth/env/session state is ready. If env values are missing, there is no session, reads fail, or rows cannot be mapped into Locco food data, the app falls back to `src/data/mockData.ts`.

## RLS And Manual SQL History

`saved_places` is intended to have authenticated `SELECT`, `INSERT`, `DELETE`, and `UPDATE` access under Supabase RLS.

- Authenticated users can read their own saved places.
- Authenticated users can insert saves only into lists they own.
- `DELETE` is restricted to the current user's own saves from lists they own.
- `UPDATE` is restricted to the current user's own saves from lists they own.
- The `UPDATE` policy uses both `USING` and `WITH CHECK` so a user cannot update an existing save into another user's list or ownership.

Manual remote SQL has previously been applied for `saved_places` `DELETE`/`UPDATE` grants and policies. `supabase/schema.sql` should be treated as the intended reference state for those grants and RLS policies, but do not run remote SQL or seed SQL unless a task explicitly asks for that work.

Current Supabase-related files:

- `src/lib/supabase/env.ts` - public env-name accessors
- `src/lib/supabase/authBrowser.ts` - browser auth client
- `src/lib/supabase/authServer.ts` - server auth client
- `src/lib/supabase/client.ts` - browser-safe data client foundation
- `src/lib/supabase/server.ts` - server data client foundation
- `src/lib/supabase/types.ts` - typed database shape
- `src/lib/auth/currentIdentity.ts` - authenticated identity with demo fallback
- `src/lib/auth/profile.ts` - current profile read/create helper
- `src/lib/data/supabaseFoodData.ts` - Supabase food-data mapper with mock fallback
- `src/lib/data/` - data access helpers
- `supabase/schema.sql` - database structure reference

Do not casually run `supabase/seed.sql`. Only run seed or remote SQL when a task explicitly asks for it.

## Important Files

- `src/app/app/map/page.tsx` - main map route
- `src/components/FoodMapApp.tsx` - map page state and composition
- `src/components/MapView.tsx` - MapLibre map, clustering, and pin selection
- `src/components/PlaceBottomSheet.tsx` - selected-place mobile sheet
- `src/components/SaveStatusSheet.tsx` - save/edit/remove status sheet
- `src/components/PlaceSaveStatusControls.tsx` - `Want to try` / `Visited` controls
- `src/components/ListDrawer.tsx` - compact list selector drawer
- `src/components/SelectedListChips.tsx` - selected-list chips on the map
- `src/components/ChatRecommendationPanel.tsx` - Ask Locco UI
- `src/utils/recommendations.ts` - rule-based recommendation parsing and scoring
- `src/app/app/lists/page.tsx` - saved-list discovery route
- `src/app/app/lists/[id]/page.tsx` - saved-place stack route
- `src/components/PlaceStack.tsx` - swipe/scroll/flippable card stack
- `src/app/login/page.tsx` - email-password auth UI
- `src/middleware.ts` - `/app` route protection
- `src/app/api/auth/profile/ensure/route.ts` - profile readiness endpoint
- `src/app/api/places/save/route.ts` - save/unsave persistence endpoint
- `src/app/api/onemap/search/route.ts` - server-side OneMap search
- `src/app/api/recommend/route.ts` - recommendation API route

## Current Limitations

- The app intentionally supports no-Supabase mock/demo mode for local development.
- Add Place is still local-only and does not persist new places yet.
- Saves currently target the user's default private saved list rather than a full multi-list save picker.
- Comments, photos, tags, source links, and recommendations need more product polish.
- Recommendation logic is deterministic keyword matching, not an LLM.
- Map tiles use OpenStreetMap raster tiles for a no-key MVP.
- No Google Maps paid API usage and no TikTok, Instagram, or Google Maps scraping is implemented.

## Near-Term Work

- Keep documentation current as auth, saves, and list flows evolve.
- Add draggable map place sheet snap states.
- Redesign place detail pages around the saved-place model.
- Add list status filters and edit-save flows from list contexts.
- Expand from the default saved list to a multi-list save model.
- Deepen friend/list browsing.
- Persist Add Place.
- Polish photos, comments, recommendations, tags, and source links.
