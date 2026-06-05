
## `IMPLEMENTATION_NOTES.md`

```md
# Implementation Notes

## What Changed

This pass refactored the Locco map UI from a dashboard-style overlay into a mobile-first map experience. The map is now the primary full-screen surface, with compact floating controls and bottom drawers for secondary actions.

Latest focused update: `/app/map` now has a compact floating Home / Map / Lists navigation pill so users can leave the full-screen map without restoring the larger bottom navigation.

Supabase seed update: the database setup now uses stable readable text IDs that match the current mock data, and `supabase/seed.sql` can insert the demo users, lists, places, saved-place relationships, tags, comments, and source links.

Supabase read-only update: the project now reads demo lists, places, saved-place relationships, tags, comments, and source links from Supabase when public env values are present and the queries succeed. Missing env values, failed queries, or incomplete demo data still fall back to local mock data.

URL persistence update: selected food lists on `/app/map` now sync live into the `lists` query parameter, so a filtered map view can be shared or recovered.

Ask Locco results update: recommendation results now appear as compact map-oriented cards with distance, tags, saved-by context, and a short reason explaining why Locco suggested each place.

Recommendation focus update: recommended places now keep the normal place-pin style with a subtle highlight layered on top. Selecting a recommendation also uses stronger zoom and camera padding so the selected pin stays above the compact place sheet.

Ask Locco flow update: after selecting a recommendation, the place sheet now includes a compact `← Recommendations` action in the header that reopens the previous Ask Locco results without rerunning the prompt. The rule-based recommender also has a lightweight confidence guard so meaningless prompts do not return unrelated Orchard-default results.

Latest list UX update: `/app/lists` now uses a friend/list-owner discovery layout with Locco palette pills and large swipeable saved-list cards. The page is desktop-responsive instead of being constrained to a phone-width layout.

Latest list-detail update: `/app/lists/[id]` now renders an interactive `PlaceStack` client component. Saved places behave more like an Apple Wallet-style animated stack: users can move through the stack with mouse wheel, trackpad scroll, or finger swipe; the active card comes forward; surrounding cards compress neatly above and below; and tapping the active card flips it to show place details.

Design palette update: the old cream tone is being replaced with Butter `#FFF1B5`, alongside Berry Good `#ECC4C3`, Usu Koubai Blossom `#B97D7B`, Meadow Mauve `#928E5E`, Soldier Green/Forest `#575527`, and Ink `#231F20`.

Image-cover decision: list cards should not use placeholder image files for now. When the database/source data is ready, list cover images should be generated automatically from live place images, TikTok/source thumbnails, or a dedicated `cover_image_url` field.

## Files Edited

- `src/components/AppShell.tsx`
- `src/components/BottomNav.tsx`
- `src/components/PlaceStack.tsx`
- `src/app/globals.css`
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

## Bottom Navigation

The normal bottom navigation has been restyled into a floating rounded pill using the Locco palette. The old full-width fixed bottom bar caused a grey rectangle across the bottom of the screen, so the nav container is now pointer-safe and visually limited to the rounded pill itself.

- Active route uses Forest/Soldier Green.
- The nav background uses Berry/Butter-style softness.
- The full-width grey bar should not return unless intentionally redesigned.

## Visual System

The current palette is:

- Butter: `#FFF1B5`
- Berry Good: `#ECC4C3`
- Usu Koubai Blossom: `#B97D7B`
- Meadow Mauve: `#928E5E`
- Soldier Green / Forest: `#575527`
- Ink: `#231F20`

`src/app/globals.css` should expose Butter as the replacement for the older `cream` token if existing components still use `bg-cream` or `text-cream`.

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