# Locco

Locco is a Singapore-focused social food map MVP. The product promise is simple: food near where the user is going, filtered by people whose taste they trust.

The app should feel warm, social, and playful. The main experience is browsing trusted friends' saved places, then choosing where to go from a map or a saved-place stack.

Repo path on this machine:

```text
C:\Projects\locco
```

## Current Product Surface

- `/app/map` shows a MapLibre map centered on Singapore with clustered pins, provider-neutral text-first location search currently backed by OneMap, live trusted-list filtering, Ask Locco recommendations, coordinated top/bottom controls, and a mobile place bottom sheet.
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
- Motion for React
- Supabase Auth
- `@supabase/ssr`
- Provider-neutral server-side location-search route with a OneMap adapter
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

The client calls the provider-neutral `src/app/api/location-search/route.ts`. OneMap is the active server-side adapter in `src/lib/location-search/providers/onemap.ts`, and known Locco locations remain the local fallback if the live provider is unavailable. OneMap authentication, multi-page fetching, retries, timeout/backoff, and richer error classification are deliberately deferred; complete that hardening before treating OneMap as a dependable production fallback.

The approved controlled-prototype direction is a Google Maps renderer plus ordinary Google Places APIs, with MapLibre retained for the OneMap/Locco fallback mode. Google has not been implemented or activated: this repository does not add a Google key, SDK, script, API route, billing integration, or provider-backed persistence. No schema or canonical-place identity migration is part of the current boundary.

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

## Map Place Sheet

The map selected-place sheet is a Motion-based draggable bottom sheet with three snap states:

- `minimized`
- `mid`
- `expanded`

Current behavior:

- Opening a place defaults to `mid`.
- If the sheet is minimized and the user taps another pin, the next selected place stays minimized.
- Pulling down past minimized closes the sheet.
- The minimized card shows key place info and a compact `Directions` action.
- Mid and expanded states show richer place detail content and bottom actions.
- The minimized height is content-aware and clamped so short place names do not leave excessive blank space while longer names still fit.
- Map camera padding responds to the sheet snap state so the selected pin stays more visible.
- Save/status controls, SaveStatusSheet, remove saved place, mock fallback, signed-in saved state, and `/app/map?place=...` focus behavior are preserved.

Implementation note: core mobile gestures should use a proper motion/gesture architecture early. The current sheet uses transform-based Motion dragging and snap offsets instead of fragile patched height/pointer dragging.

## Map Controls And List Scope

The current map controls replace the former persistent selected-list chips and list drawer.

Top controls:

- The location search is text-first, with no visible magnifying-glass submit control. Its native search form submits with Enter and the mobile Search key.
- A clear `×` appears only when the field contains text. Clearing the field also clears the map reference marker.
- Search results stay anchored below the field. The loading spinner rotates around a stable center, and selecting a result sets the reference marker.
- A presentational profile placeholder sits above a circular `Map filters` trigger. The placeholder is intentionally not a functional profile surface yet.
- Top controls remain visible when no place is selected and when the place sheet is minimized or at mid. They become hidden and inert while the place sheet is expanded.

`MapFiltersSheet` is a presentation-oriented controlled dialog. `FoodMapApp` owns the durable applied list scope; Map Filters does not keep a second applied state, and Ask Locco consumes the same scope.

- Filters apply live, without Apply, Cancel, or Reset actions.
- Marker visibility and the URL update immediately.
- `Select all` and `Deselect all` are available.
- Owner groups are compact and collapsible. `Your lists` opens by default; friend groups start collapsed; each group shows its selected count.
- Grouping friend lists by `ownerName` is presentational only. Display names are not stable identity, and stable owner IDs plus duplicate-name handling remain future work.
- The sheet uses a viewport-safe maximum height with internal scrolling for longer list collections.

URL scope semantics:

| URL state | Meaning |
|---|---|
| no `lists` parameter | Default to all currently accessible lists |
| `lists=` | Explicit zero-list selection |
| `lists=a,b` | Sanitized selected subset |
| invalid-only list IDs | Canonicalize to explicit zero |
| duplicates | Remove duplicates and reorder to loaded-list order |

List IDs pass through one loaded-list-order canonicalization helper. Replace-style navigation avoids history spam, unrelated query parameters are preserved, and a stale `place=` is removed when filtering excludes the selected place. Direct `/app/map?place=...` focusing remains supported.

With zero selected lists:

- no saved-place markers are shown;
- a stale selected place is closed;
- the map shows `No lists selected` with a visible `Choose lists` recovery action;
- `Choose lists` opens Map Filters;
- the filter badge remains active.

Ask Locco uses exactly the same applied list scope as the map. Zero selected lists disable submission, and an explicit empty array is not broadened to `list_my`; an absent scope retains the legacy fallback. Changing scope clears the old result summary, result cards, and map highlights while preserving the typed query, and stale in-flight recommendation responses are aborted or invalidated. Recommendation parsing, scoring, and ranking remain deterministic and were not redesigned by this work.

Bottom controls:

- Ask Locco/Add actions and map navigation share one presentation component and tokenized vertical spacing.
- MapLibre attribution remains visible and clickable in the space between the action row and navigation. Its overrides are scoped to `.locco-map-page`.
- Bottom controls disappear while a place is selected and return when it closes.
- The zero-list recovery card shifts away from the controls in short landscape viewports.

This control redesign did not change the Motion place-sheet gesture architecture, its minimized/mid/expanded snap states, dynamic minimized height, map-padding architecture, Directions portal, Save Status, save/edit/remove behavior, canonical place identity, personal saved-place ownership, mock/no-Supabase fallback, signed-in saved-state architecture, or Add Place remaining local-only.

## Place Actions

- Place cards and the map place bottom sheet use one `Directions` action instead of separate Apple/Google buttons.
- The Directions sheet includes `Copy address`, `Open in Apple Maps`, `Open in Google Maps`, and `Cancel`.
- `DirectionsAction` renders its overlay through a full-screen portal so it is not clipped by the map sheet.
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
- `src/components/MapTopControls.tsx` - presentation layout for map search, profile placeholder, and filter trigger
- `src/components/MapFiltersSheet.tsx` - controlled list-scope dialog; applied state remains in `FoodMapApp`
- `src/components/MapBottomControls.tsx` - shared Ask Locco/Add and map-navigation presentation
- `src/components/PlaceBottomSheet.tsx` - selected-place mobile sheet
- `src/components/SaveStatusSheet.tsx` - save/edit/remove status sheet
- `src/components/PlaceSaveStatusControls.tsx` - `Want to try` / `Visited` controls
- `src/components/SearchLocationBox.tsx` - provider-neutral text-first search UI and request lifecycle
- `src/components/ChatRecommendationPanel.tsx` - Ask Locco UI using the applied map list scope
- `src/utils/recommendations.ts` - rule-based recommendation parsing and scoring
- `src/app/app/lists/page.tsx` - saved-list discovery route
- `src/app/app/lists/[id]/page.tsx` - saved-place stack route
- `src/components/PlaceStack.tsx` - swipe/scroll/flippable card stack
- `src/app/login/page.tsx` - email-password auth UI
- `src/middleware.ts` - `/app` route protection
- `src/app/api/auth/profile/ensure/route.ts` - profile readiness endpoint
- `src/app/api/places/save/route.ts` - save/unsave persistence endpoint
- `src/types/locationSearch.ts` - normalized provider-neutral search and renderer-mode contracts
- `src/lib/location-search/` - local fallback, coordinate validation, active search boundary, and provider adapters
- `src/app/api/location-search/route.ts` - provider-neutral server-side location search
- `src/app/api/recommend/route.ts` - recommendation API route

## Current Limitations

- The app intentionally supports no-Supabase mock/demo mode for local development.
- Add Place is still local-only and does not persist new places yet.
- The Add Place modal still needs dialog semantics, focus management, keyboard dismissal, and a complete accessibility pass.
- Saves currently target the user's default private saved list rather than a full multi-list save picker.
- Map Filters currently groups friend lists by display `ownerName`; stable owner IDs and duplicate display-name handling are not implemented.
- OneMap is primarily a location/address source rather than a comprehensive business-discovery provider.
- OneMap search currently requests only page 1. The server returns at most 8 merged results and the client displays at most 4.
- OneMap authentication, retry, timeout/backoff, multi-page fetching, and comprehensive error handling are not implemented, so it is not yet a dependable production fallback.
- Chain-business coverage may be incomplete, and intermittent upstream failure remains possible.
- Search autocomplete while typing is not implemented.
- `SearchLocationBox` declares combobox/list-autocomplete semantics, but its popup still uses native buttons rather than a complete listbox/option pattern, and active-option keyboard semantics are not implemented. This branch does not repair that interaction model; it is deferred to the future search/accessibility redesign.
- Rich business data such as ratings, photos, opening hours, categories, and comprehensive outlet identity is not implemented.
- Comments, photos, tags, source links, and recommendations need more product polish.
- Recommendation logic is deterministic keyword matching, not an LLM.
- Map tiles use OpenStreetMap raster tiles for a no-key MVP.
- The map still sits below the beige `AppShell` header. Its current map-height calculation has a known roughly 24px mismatch that can produce document-level map scrolling.
- The profile icon in the top controls is presentational only.
- Expanded place detail spacing and section hierarchy can be polished later.
- Expanded-sheet internal scroll handoff is acceptable now; a fully native nested scroll-to-drag handoff can be revisited if needed.
- The Google Maps plus ordinary Places direction is approved only for a controlled future prototype. No Google provider code, keys, scripts, billing, network usage, or production activation is implemented.
- Provider results are normalized for transient search/reference use only; there is no provider-reference schema migration or change to Locco UUID and `place_key` identity.

## Near-Term Work

- Keep documentation current as auth, saves, and list flows evolve.
- Build `google-provider-controlled-prototype` behind the provider boundary: use a Google renderer with ordinary Google Places APIs, retain the MapLibre plus OneMap/Locco fallback mode, and keep paid capability activation independently disableable. That task must decide keys, billing controls, storage/display/attribution compliance, provider-ID handling, and prototype kill switches without changing Locco canonical identity by default.
- Harden the OneMap adapter before production fallback use with authenticated requests, multi-page fetching, retry policy, timeout/backoff, and comprehensive error classification.
- Keep `map-immersive-header-layout` separate. It should cover a route-specific full-height map shell, removal or replacement of the beige map header, correct `100dvh` and mobile safe-area handling, final top/bottom control placement, removal of document-level map scrolling, the AppShell/map height mismatch, and a real profile surface for Profile ready and Sign out. It should also decide whether a small Locco logo mark remains.
- Redesign place detail pages around the saved-place model.
- Add status filtering and a deliberate tag taxonomy/filter model.
- Expand from the default saved list to a multi-list save model.
- Deepen friend/list browsing.
- Persist Add Place.
- Add photo support and distinguish personal notes from social comments.
- Tune recommendations without describing the current deterministic scorer as full AI.
- Continue performance and mobile polish, including real-device mobile keyboard and touch-drag testing.
