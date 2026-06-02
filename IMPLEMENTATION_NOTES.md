# Implementation Notes

## What Changed

This pass refactored the Locco map UI from a dashboard-style overlay into a mobile-first map experience. The map is now the primary full-screen surface, with compact floating controls and bottom drawers for secondary actions.

Latest focused update: `/app/map` now has a compact floating Home / Map / Lists navigation pill so users can leave the full-screen map without restoring the larger bottom navigation.

Supabase seed update: the database setup now uses stable readable text IDs that match the current mock data, and `supabase/seed.sql` can insert the demo users, lists, places, saved-place relationships, tags, comments, and source links.

Supabase foundation update: the project now includes Supabase client factories, database types, and a mock-backed data access layer. The current UI still runs on mock data until credentials and real query implementations are added.

URL persistence update: selected food lists on `/app/map` now sync live into the `lists` query parameter, so a filtered map view can be shared or recovered.

Ask Locco results update: recommendation results now appear as compact map-oriented cards with distance, tags, saved-by context, and a short reason explaining why Locco suggested each place.

Recommendation focus update: recommended places now keep the normal place-pin style with a subtle highlight layered on top. Selecting a recommendation also uses stronger zoom and camera padding so the selected pin stays above the compact place sheet.

Ask Locco flow update: after selecting a recommendation, the place sheet now includes a compact `← Recommendations` action in the header that reopens the previous Ask Locco results without rerunning the prompt. The rule-based recommender also has a lightweight confidence guard so meaningless prompts do not return unrelated Orchard-default results.

## Files Edited

- `src/components/AppShell.tsx`
- `src/components/FoodMapApp.tsx`
- `src/components/MapView.tsx`
- `src/components/SearchLocationBox.tsx`
- `src/components/ChatRecommendationPanel.tsx`
- `src/components/PlaceBottomSheet.tsx`
- `src/components/ListDrawer.tsx`
- `src/components/SelectedListChips.tsx`
- `src/app/app/map/page.tsx`
- `src/app/app/lists/page.tsx`
- `src/app/app/lists/[id]/page.tsx`
- `README.md`
- `IMPLEMENTATION_NOTES.md`
- `package.json`
- `package-lock.json`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/types.ts`
- `src/lib/data/lists.ts`
- `src/lib/data/places.ts`
- `src/lib/data/savedPlaces.ts`
- `src/lib/data/comments.ts`
- `src/lib/data/placeSources.ts`
- `supabase/schema.sql`
- `supabase/seed.sql`

## Map Layout

`/app/map` now uses a `100dvh`-based viewport height and hides the normal bottom nav on the map page. The app shell keeps only a compact header, then the map fills the remaining screen. The default map UI now shows:

- Floating search bar near the top
- Compact list count button
- Small selected-list chips
- Bottom floating `Ask Locco` and `Add` buttons
- Compact floating Home / Map / Lists navigation pill
- Place details only when a pin is tapped

The desktop side list still exists on extra-wide screens, but it is narrower, shorter, and hidden on mobile.

## Map Navigation

The normal app bottom nav remains hidden on `/app/map` to preserve the full-screen map feel. `FoodMapApp.tsx` now renders a smaller map-specific floating navigation pill at the bottom of the viewport:

- `Home` links to `/app`
- `Map` links to `/app/map` and is visually active
- `Lists` links to `/app/lists`

The `Ask Locco` and `Add` controls were moved upward so they do not overlap with this navigation. The `5 lists` button remains only for filtering visible map pins, not for navigating to the Lists page.

## List Drawer

The old large list selector buttons were removed from the map view. `ListDrawer.tsx` now opens from the compact list count button. Each row includes:

- Avatar/initials
- List name
- Owner
- Number of places
- Toggle switch

The map prevents deselecting every list, so the user is never left with a blank state by accident.

## List URL Persistence

`FoodMapApp.tsx` now writes the selected list IDs to the URL whenever the selection changes:

```text
/app/map?lists=list_annj,list_isabella
```

This uses Next.js client navigation with `router.replace`, so toggling list filters does not trigger a full page reload. On initial load, `/app/map?lists=<listId>` still seeds the selected list state. Invalid list IDs are ignored, duplicate IDs are collapsed, and the map falls back to the default selected lists if no valid IDs are provided.

## Chat Drawer

The chatbot is collapsed by default. The map shows only an `Ask Locco` bottom pill. Tapping it opens a bottom sheet with:

- Example prompt
- Query input
- Compact recommendation cards with place name, distance, tags, saved-by context, and a short reason
- Helpful no-result state

Submitting a new query clears previous highlighted pins before the next result set appears. Selecting a recommendation closes the chat drawer, focuses the place on the map, and opens the place bottom sheet.

## Recommended Pin Focus

`MapView.tsx` keeps Ask Locco recommendation highlights on the normal clustered saved-place source:

- Recommended places keep their normal category-colored place pin and place-label behavior.
- Recommended pins add a subtle tomato glow/ring and slightly stronger outline.
- The selected place gets a stronger glow, larger pin, stronger outline, and label treatment.
- Recommended places can still merge into normal clusters when zoomed out, keeping the map cleaner.

When a place is selected, the map eases to it with a minimum zoom of `15.4` and bottom camera padding. This positions the selected pin in the visible map area above the place bottom sheet instead of directly behind it.

`PlaceBottomSheet.tsx` was shortened to a lighter preview sheet with a lower mobile max-height. The action buttons were moved higher in the sheet so Google Maps, Apple Maps, Save, and Details stay easier to reach.

## Returning To Recommendations

`FoodMapApp.tsx` now stores the last Ask Locco query, summary, and result cards while the user remains on `/app/map`. Selecting a recommendation closes the Ask Locco sheet but keeps that session state and keeps the recommended pin highlights active. The compact place sheet receives an optional `← Recommendations` action in the top-left header area when previous results exist.

Tapping `← Recommendations` reopens the Ask Locco bottom sheet with the same query and result cards. The user does not need to retype the prompt.

Closing Ask Locco directly with the backdrop or close button intentionally clears the previous results and removes old highlights.

## Low-Confidence Queries

The recommendation utility now checks whether the prompt contains at least one meaningful signal before using the default location fallback:

- Food/category/mood tag match
- Saved-by/list-owner match, such as `Isabella`
- Mock place-name match

If none are found, the API returns no results and the UI shows a helpful no-confidence state instead of unrelated default recommendations.

## List Detail Routes

`/app/lists` cards are now clickable. A new route, `/app/lists/[id]`, shows:

- List name
- Owner
- Description
- Number of places
- Saved places in that list
- `View this list on map` link

The map page accepts `?lists=<listId>` and starts with only that list selected.

## Supabase Foundation

`@supabase/supabase-js` is installed. The Supabase helpers are intentionally safe during MVP development:

- `createBrowserSupabaseClient()` returns a typed Supabase client when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist.
- `createServerSupabaseClient()` returns a typed service-role client when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist.
- If env values are missing, both helpers return `null`.

`supabase/schema.sql` now prepares the current MVP data shape:

- `profiles` for demo users and future account profiles
- `friendships` for trust relationships once social features are connected
- `food_lists` for owner-led lists, including list colors
- `places` for Singapore food places, coordinates, price range, and notes
- `saved_places` for list-place relationships, status, and rating
- `place_tags` for category and mood tags
- `comments` for place comments
- `place_sources` for Instagram, TikTok, website, manual, and other source links

IDs are text with UUID defaults. This keeps the seeded MVP rows readable, such as `list_annj` and `wild-honey`, while still allowing generated IDs later.

`supabase/seed.sql` is idempotent and seeds the current mock data:

- Demo profiles for You, Annj, Ryan, Isabella, and Josh
- The five current food lists
- All current mock places and coordinates
- Saved-place relationships for each list that saved each place
- Category and mood tags
- Existing notes, comments, ratings, statuses, and source links

The data access layer in `src/lib/data/` currently returns mock data and includes comments marking where Supabase queries should replace the fallback. Page-level reads now use these helpers where practical:

- `getFoodLists()`
- `getFoodListsWithCounts()`
- `getListById(listId)`
- `getAllFoodPlaces()`
- `getPlaceById(placeId)`
- `getPlacesForSelectedLists(listIds)`
- `getPlacesByListId(listId)`
- `createSavedPlace(input)`
- `getCommentsByPlaceId(placeId)`

This keeps the app working without Supabase credentials while giving the next pass a clear integration boundary.

## Supabase Manual Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy `.env.example` to `.env.local` only when testing Supabase clients locally.
6. Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
7. Keep `.env.local` out of git.

Live Supabase reads are not connected yet after this pass. The seeded database is ready for the future data-layer integration, but the current UI still uses mock data.

## Manual Test Steps

1. Start the app with `npm.cmd run dev`.
2. Open `http://localhost:3000/app/map`.
3. Confirm the map fills the screen and the default UI is compact.
4. Tap the `5 lists` button and toggle one or more lists.
5. Confirm map pins update and selected-list chips change.
6. Confirm the browser URL updates to `/app/map?lists=...` without a full reload.
7. Copy the URL, reload it, and confirm the same lists are selected.
8. Try `/app/map?lists=not_real,list_annj` and confirm only the valid list is selected.
9. Search for `Orchard MRT` and select a result.
10. Tap `Ask Locco`, ask `dessert near Orchard MRT`, and select a result.
11. Confirm each recommendation card shows distance, tags, saved-by context, and a short reason.
12. Tap a recommendation and confirm Ask Locco closes, the map focuses the place, and the place bottom sheet opens.
13. Tap `← Recommendations` in the place sheet header and confirm the previous query/results return without retyping.
14. Confirm the selected pin is visible above the compact place sheet instead of hidden behind it.
15. Confirm recommended pins still look like normal place pins with a subtle highlighted style while results are active.
16. Submit a different Ask Locco query and confirm highlighted pins update.
17. Close Ask Locco and confirm old recommendation highlights are removed.
18. Try `random nonsense place` and confirm Locco shows a helpful no-confidence state.
19. Tap a normal map pin and confirm the place bottom sheet still opens.
20. Tap the bottom `Home`, `Map`, and `Lists` navigation pill links.
21. Confirm `Map` is visually active while on `/app/map`.
22. Open `http://localhost:3000/app/lists`.
23. Click a list card, then click `View this list on map`.
24. Confirm `/app/map?lists=<listId>` loads with only that list selected.
25. Confirm the app still runs without `.env.local`.
26. Optional: create a Supabase project, run `supabase/schema.sql`, then run `supabase/seed.sql`.
27. Optional: add Supabase values to `.env.local` and confirm the app still builds; live queries are not enabled yet.

## Known Limitations

- Add-place saves are still local state only.
- Ask Locco is still rule-based and keyword-driven.
- Recommendation reasons are generated from deterministic scoring signals, not an LLM explanation.
- The low-confidence guard is keyword/place/list based and can still miss ambiguous natural language.
- The map uses OpenStreetMap raster tiles for a no-key MVP.
- Recommended pins are highlighted only while Ask Locco results are active.
- The list filter now persists in the URL, but the URL is only updated while the user is on `/app/map`.
- The compact map navigation is intentionally separate from the full app bottom nav, so nav styling is duplicated lightly for now.
- Supabase schema and seed files are prepared, but the data layer still returns mock data.
- No real authentication or Supabase persistence is connected yet.

## Recommended Next Fixes

- Add a compact mobile place-results drawer after recommendation queries.
- Replace mock data helper bodies with Supabase queries.
- Add Supabase auth and saved-place persistence.
- Add proper PWA icons and service worker.
