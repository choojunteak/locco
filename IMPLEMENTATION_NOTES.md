# Implementation Notes

These notes capture the current Locco architecture and completed milestones at a high level. Keep them factual and concise; move contributor setup details to `README.md` and working rules to `AGENTS.md`.

## Current Architecture

Locco is a Next.js App Router app with TypeScript, Tailwind CSS, MapLibre GL JS, Supabase Auth, `@supabase/ssr`, a server-side OneMap search route, and mock/demo fallback data.

The app keeps the product model centered on trusted saved places:

- `places` is the canonical physical food location.
- `saved_places` is a user's personal relationship to a place.
- `food_lists` is a list/grouping of saved places.
- `profiles` provides minimal display identity for ownership and saved-by context.

Supabase-backed reads and writes are behind clear boundaries. When Supabase public env values, auth session, or reads are unavailable, the app stays runnable with mock/demo data.

## Completed Milestones

- Map MVP: `/app/map` uses MapLibre with Singapore-focused places, clustering, selected-list filtering, selected-list URL persistence, mobile bottom sheets, and compact floating navigation.
- OneMap search: address search runs through a server route with Singapore fallbacks.
- Ask Locco: recommendations use deterministic parsing/scoring and compact map-oriented result cards.
- List discovery: `/app/lists` uses a friend/list-owner browsing layout with Locco palette pills and large saved-list cards.
- Saved-place stack: `/app/lists/[id]` uses `PlaceStack` for swipe/scroll navigation, animated stack compression, and tap-to-flip details.
- Auth foundation: Supabase auth clients are split between browser/server helpers using public env accessors and `@supabase/ssr`.
- Email-password login: `/login` supports sign in and sign up, with copy that expects Supabase Confirm Email to be enabled.
- Profile auto-creation: `POST /api/auth/profile/ensure` creates a minimal profile for the signed-in user when needed.
- Route protection: `src/middleware.ts` protects `/app/:path*` when Supabase public env values are configured, while preserving no-Supabase development fallback.
- UUID foundation: Supabase types and save APIs use UUID-backed persisted entities while still tolerating mock/demo IDs at the UI boundary.
- Save persistence: `POST /api/places/save` persists a signed-in user's save, creates or reuses a private default list, and uses a server-computed `place_key` for duplicate prevention.
- Read persisted saved places: Supabase food-data mapping reads profiles, lists, places, saved places, tags, comments, and sources, then merges authenticated personal saves with social mock browsing data.
- Unsave persistence: `DELETE /api/places/save` removes only the current user's owned saved relationship.
- Place detail actions foundation: place routes and map sheet actions now have a persistence-aware save/unsave foundation.
- Directions action foundation: place surfaces use one `Directions` action that opens a sheet with Copy address, Apple Maps, Google Maps, and Cancel. Map links prefer place name plus full address, with coordinates only as fallback identity.
- Saved place status model: `saved_places.status` is `want_to_try` or `visited`; `note` and `rating` are personal fields; `Favourite` is a rating label.
- Save status sheet UI: the map place sheet opens a save/edit/remove flow where `Visited` can store rating plus note and `Want to try` stores note only.
- Visual system refresh: Locco uses Butter, Berry Good, Usu Koubai Blossom, Meadow Mauve, Soldier Green/Forest, and Ink across the current light playful UI.
- Saved-place RLS/grants: `saved_places` is intended to support authenticated select/insert/delete/update under RLS. Delete and update are restricted to the current user's own saves from lists they own, and update uses both `USING` and `WITH CHECK` to prevent moving a save into another user's list or ownership. Manual remote SQL has previously been applied for the saved-place delete/update grants and policies; `supabase/schema.sql` should reflect the intended reference state.

## Current Boundaries

- Add Place remains local-only for now; `local-` entries are not persisted by `/api/places/save`.
- Saves currently go to the user's default private saved list instead of a full multi-list picker.
- Flippable list-detail cards intentionally do not show save/status controls.
- Non-map `PlaceCard` surfaces hide save/status controls by default unless explicitly opted in.
- The app must remain runnable without Supabase credentials.
- OneMap calls should stay server-side.
- Do not use paid Google Maps APIs or scrape Google Maps, TikTok, or Instagram.
- Do not add placeholder image files for list covers.

## Future Work

- Keep docs current as project context changes.
- Add draggable map place sheet snap states.
- Redesign place detail pages around canonical places and personal saved-place state.
- Add list status filters and edit-save flows in list contexts.
- Expand from default-list saves to a multi-list save model.
- Deepen friend/list browsing.
- Persist Add Place.
- Polish photos, comments, recommendations, tags, and source links.
