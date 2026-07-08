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
- Do not use paid Google Maps APIs.
- Keep OneMap calls server-side.

## Working Rules

- Keep the app runnable without Supabase credentials.
- Use mock data first, then add Supabase persistence behind clear boundaries.
- Prefer small typed utilities over giant components.
- Use Tailwind and the existing light, friendly design direction.
- Keep mobile map interactions comfortable: bottom sheets, chips, compact panels, and touch-friendly targets.
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
