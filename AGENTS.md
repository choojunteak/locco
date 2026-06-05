# AGENTS.md

## Project

Locco is a Singapore social food map MVP. Build around the product promise: food near where the user is going, filtered by people whose taste they trust.

Locco's current product direction is warm, social, and playful rather than dashboard-like. The app should feel like browsing trusted friends' saved places, then choosing where to go from a map or a saved-place stack.

## Working Rules

- Keep the app runnable without Supabase credentials.
- Use mock data first, then add Supabase persistence behind clear boundaries.
- Do not use paid Google Maps APIs.
- Do not scrape Google Maps, TikTok, or Instagram.
- Keep OneMap calls server-side.
- Prefer small typed utilities over giant components.
- Use Tailwind and the existing light, friendly design direction.
- Keep mobile map interactions comfortable: bottom sheets, chips, and compact panels.
- Do not add placeholder image files for list covers. Wait for live database-backed place images or source thumbnails.
- Keep saved-list and saved-place UI interactions mobile-first, swipe-friendly, and touch-friendly.
- Avoid full-width fixed bottom bars unless intentionally needed. Prefer floating rounded navigation pills.

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

## Useful Commands

```bash
npm install
npm run dev
npm run lint
npm run build