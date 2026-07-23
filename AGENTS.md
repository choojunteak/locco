# AGENTS.md

## Project

Locco is a Singapore social food map MVP. Build around the product promise: food near where the user is going, filtered by people whose taste they trust.

Locco's current product direction is warm, social, and playful rather than dashboard-like. The app should feel like browsing trusted friends' saved places, then choosing where to go from a map or a saved-place stack.

## Safety Rules

- Never read, print, modify, expose, or commit `.env.local`.
- Never expose secrets, tokens, cookies, Supabase service role keys, private Supabase keys, `sb_secret_*` values, or full user/profile objects.
- Only reference public Supabase env variable names when needed:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - optional legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do not run `supabase/seed.sql` or remote Supabase SQL unless the user explicitly asks for that exact work.
- Do not touch Vercel or deployment unless requested.
- Do not scrape Google Maps, TikTok, or Instagram.
- Do not enable paid provider APIs, keys, billing, or scripts unless the user explicitly requests that exact work.
- Keep OneMap calls server-side.
- Do not commit or push without explicit user approval.

## Working Rules

- Keep the app runnable without Supabase credentials.
- Use mock data first, then add Supabase persistence behind clear boundaries.
- Keep branches PR-sized and narrowly implemented, while remaining aware of foreseeable follow-up architecture.
- Scope limits what may be implemented in a branch, not what may be investigated or reported. Surface architectural conflicts instead of silently patching around them.
- Prefer small typed utilities over giant components.
- Use Tailwind and the existing light, friendly design direction.
- Keep mobile map interactions comfortable: bottom sheets, compact panels, floating controls, and touch-friendly targets.
- Use a proper motion/gesture architecture for core mobile drag interactions early; avoid fragile patched height/pointer dragging for sheet-like surfaces.
- Keep applied filter state in one source of truth. Presentation components may emit candidate changes but should not own a second durable applied scope.
- Preserve explicit empty arrays as explicit empty scope; do not silently broaden them into defaults.
- Preserve unrelated query parameters when updating route-owned URL state, and prefer replace-style navigation for live controls that should not spam history.
- Canonicalize list IDs through one helper that removes invalid/duplicate values and restores loaded-list order.
- Do not treat display names as stable owner identity.
- Do not add a provider, schema, auth, RLS, or persistence change inside an unrelated UI branch.
- Keep provider-specific search and rendering details behind explicit capability adapters. Locco UUIDs and the server-computed `place_key` remain canonical identity; external provider IDs are namespaced references, and provider-derived display data stays separate from Locco-owned data. Respect provider storage and attribution terms, make paid capabilities independently disableable, keep OneMap and mock fallback paths intentional, and build for confirmed provider directions without silently adding adjacent or speculative features.
- Distinguish browser-automation limitations from genuine product regressions in verification reports.
- Do not add placeholder image files for list covers. Wait for live database-backed place images or source thumbnails.
- Keep saved-list and saved-place UI interactions mobile-first, swipe-friendly, and touch-friendly.
- Avoid full-width fixed bottom bars unless intentionally needed. Prefer floating rounded navigation pills.
- Use `Lists` for saved-place groupings.
- Use `Want to try` and `Visited` as saved-place lifecycle statuses.
- Treat `Favourite` as a rating label, not as a lifecycle status.
- Keep place directions behind the shared `Directions` action/sheet. External maps queries should prefer place name plus full address over raw latitude/longitude text.

## Design Direction

Use the Locco palette consistently:

- Butter: `#FFF1B5`
- Berry Good: `#ECC4C3`
- Usu Koubai Blossom: `#B97D7B`
- Meadow Mauve: `#928E5E`
- Soldier Green / Forest: `#575527`
- Ink: `#231F20`

Current UI direction:

- `/app/lists` should feel like browsing friends' saved-place collections.
- Friend/list-owner pills should use the Locco palette, not blue browser-default styling.
- List cards should be large, desktop-responsive, and swipeable horizontally.
- Saved-place detail views should feel like an Apple Wallet-style card stack: clean vertical alignment, animated stack compression, swipe/scroll navigation, and tap-to-flip details.
- On mobile list-detail screens, avoid extra side summaries; let the card stack and card flip carry the interaction.
- Map save/status controls belong in the place bottom sheet and related save sheet, not on the flippable list-detail cards.
- Non-map `PlaceCard` surfaces should keep save/status controls hidden unless a specific surface opts in.
- The map place bottom sheet uses Motion-based transform dragging with minimized, mid, and expanded snap states.
- The map sheet opens selected places at mid, preserves minimized state when switching selected places, and closes when pulled below minimized.
- Minimized map sheet content should stay compact: key place info plus compact `Directions`, with content-aware clamped height.
- Directions overlays must render full-screen and must not be clipped by the map sheet.
- The current map has text-first search, a presentational profile placeholder, a circular Map Filters trigger, live list filtering, and coordinated Ask Locco/Add/navigation controls.
- `FoodMapApp` owns the applied map list scope. Map Filters and Ask Locco must not introduce competing filter state.
- Top controls stay available with no selection, minimized, and mid; they are hidden and inert while the map place sheet is expanded.
- MapLibre attribution must remain visible and clickable, with map-page-only overrides.
- The current profile control is intentionally presentational until a dedicated profile/immersive-map task makes it functional.
- The approved controlled-prototype direction is a Google renderer with ordinary Google Places APIs, while MapLibre remains the OneMap/Locco fallback renderer. This direction is not production activation: provider code, keys, billing, persistence, storage, and attribution work require their own explicitly scoped tasks.
- Treat route-specific immersive map shell, safe areas, AppShell removal/replacement, document scrolling, and final profile placement as a separate architecture task.
- Expanded place detail spacing and internal scroll handoff can be polished later.

## Useful Commands

Windows PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Generic shell equivalents:

```bash
npm install
npm run dev
npm run lint
npm run build
```
