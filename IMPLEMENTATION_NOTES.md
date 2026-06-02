# Implementation Notes

## What Changed

This pass refactored the Locco map UI from a dashboard-style overlay into a mobile-first map experience. The map is now the primary full-screen surface, with compact floating controls and bottom drawers for secondary actions.

Latest focused update: `/app/map` now has a compact floating Home / Map / Lists navigation pill so users can leave the full-screen map without restoring the larger bottom navigation.

Supabase foundation update: the project now includes Supabase client factories, database types, and a mock-backed data access layer. The current UI still runs on mock data until credentials and real query implementations are added.

URL persistence update: selected food lists on `/app/map` now sync live into the `lists` query parameter, so a filtered map view can be shared or recovered.

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
- Recommendation results

Selecting a recommendation closes the chat drawer and focuses the place on the map.

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
11. Tap a map pin and confirm the place bottom sheet is scrollable.
12. Tap the bottom `Home`, `Map`, and `Lists` navigation pill links.
13. Confirm `Map` is visually active while on `/app/map`.
14. Open `http://localhost:3000/app/lists`.
15. Click a list card, then click `View this list on map`.
16. Confirm `/app/map?lists=<listId>` loads with only that list selected.
17. Confirm the app still runs without `.env.local`.
18. Optional: add Supabase values to `.env.local` and confirm the app still builds; live queries are not enabled yet.

## Known Limitations

- Add-place saves are still local state only.
- Ask Locco is still rule-based and keyword-driven.
- The map uses OpenStreetMap raster tiles for a no-key MVP.
- The list filter now persists in the URL, but the URL is only updated while the user is on `/app/map`.
- The compact map navigation is intentionally separate from the full app bottom nav, so nav styling is duplicated lightly for now.
- Supabase clients are scaffolded, but the data layer still returns mock data.
- No real authentication or Supabase persistence is connected yet.

## Recommended Next Fixes

- Add a compact mobile place-results drawer after recommendation queries.
- Replace mock data helper bodies with Supabase queries.
- Add Supabase auth and saved-place persistence.
- Add proper PWA icons and service worker.
