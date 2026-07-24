# Implementation Notes

These notes capture the current Locco architecture and completed milestones at a high level. Keep them factual and concise; move contributor setup details to `README.md` and working rules to `AGENTS.md`.

## Current Architecture

Locco is a Next.js App Router app with TypeScript, Tailwind CSS, a Google-primary/MapLibre-fallback renderer boundary, Motion for React, Supabase Auth, `@supabase/ssr`, a provider-neutral server-side location-search route currently backed by OneMap, and mock/demo fallback data.

The app keeps the product model centered on trusted saved places:

- `places` is the canonical physical food location.
- `saved_places` is a user's personal relationship to a place.
- `food_lists` is a list/grouping of saved places.
- `profiles` provides minimal display identity for ownership and saved-by context.

Supabase-backed reads and writes are behind clear boundaries. When Supabase public env values, auth session, or reads are unavailable, the app stays runnable with mock/demo data.

## Completed Milestones

- Map MVP: `/app/map` uses MapLibre with Singapore-focused places, clustering, selected-list filtering, selected-list URL persistence, mobile bottom sheets, and compact floating navigation.
- Google map foundation: the map route now resolves one complete provider stack from sanitized server capabilities. Google is the preferred stack when its map capability, restricted public configuration, and health checks pass; MapLibre is selected otherwise. Defaults remain fully disabled, and production has no provider selector.
- Renderer-neutral map contract: both renderers consume canonical places, selected/highlighted/personal-save states, reference point, shared viewport, camera intent, sheet insets, canonical marker selection, readiness, and fatal-error callbacks. MapLibre no longer owns application state.
- Locco marker system: Google uses custom HTML/CSS Advanced Markers and custom clusters with priority `selected > highlighted > personal save > normal`. Want-to-try, visited, transient, reference, and cluster states have separate presentation; canonical and future transient Google identities use distinct key namespaces.
- Canonical pin-to-sheet flow: renderer taps return the exact Locco place, preserve unrelated URL parameters and explicit zero-list scope, update `place=`, and reuse the existing Motion sheet and save/status/social flows. Google InfoWindows are not used.
- Provider-aware place details: application types distinguish Locco identity/social data, personal status/note/rating, and Google-attributed details. Fixed cost-aware field profiles, selected-place-only deduplication, and stale-response generation guards are implemented without issuing live Places requests.
- Provider-reference boundary: a future record contract covers canonical `placeId`, namespaced provider/external ID, verification time, lifecycle state, and replacement ID. Reconciliation order is fixed as exact provider reference, canonical `place_key`, complete address/postal code, coordinate proximity as supporting evidence, then explicit confirmation; display name alone is never a merge signal.
- Location search boundary: normalized search contracts feed a provider-neutral server route; OneMap is the active adapter and known Singapore locations remain the local fallback.
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
- Map place sheet snap states: the selected-place map sheet uses Motion-based transform dragging with `minimized`, `mid`, and `expanded` snap states. Opening a place defaults to `mid`; switching selected places while minimized preserves minimized state; pulling down past minimized closes the sheet. The minimized card shows key place info and compact Directions, mid/expanded states show richer details and bottom actions, and minimized height is content-aware and clamped.
- Full-screen Directions overlay: `DirectionsAction` renders through a portal so the overlay is not clipped by the draggable map sheet.
- Snap-state map padding: map camera padding responds to the selected sheet state so selected pins remain more visible.
- Map top controls redesign: the map now uses text-first location search with native form submission, a conditional clear action, anchored results, a stable centered loading spinner, reference-marker clearing, a presentational profile placeholder, and a circular Map Filters trigger. The controls are visible with no selected place and at minimized/mid sheet snaps, then hidden and inert at expanded.
- Live Map Filters: the former persistent horizontal selected-list chips and `ListDrawer` were replaced by a controlled, viewport-safe filter dialog with Select all/Deselect all and compact collapsible owner groups. `Your lists` starts expanded, friend groups start collapsed, and selection changes update markers and URL state immediately without Apply, Cancel, or Reset.
- Explicit list-scope semantics: a missing `lists` parameter means all currently accessible lists, while `lists=` means explicit zero. Invalid and duplicate IDs are removed through one loaded-list-order canonicalization helper, unrelated query parameters survive replace-style URL updates, and stale `place=` state is removed when its place leaves scope.
- Zero-list recovery: explicit zero scope removes saved-place markers and stale place selection, keeps the filter badge active, and shows a visible `No lists selected` state whose `Choose lists` action reopens Map Filters.
- Shared Ask Locco scope: recommendations consume the same applied list IDs as the map. Zero scope disables submission; explicit empty arrays stay empty at the API boundary; absent scope retains the legacy fallback. Scope changes preserve the typed query while clearing old summary, results, highlights, and stale in-flight work.
- Coordinated bottom controls: Ask Locco/Add actions and map navigation now share a presentation component. CSS tokens centralize their vertical spacing with MapLibre attribution, attribution overrides are scoped to the map page, and short-landscape zero-state recovery avoids the control stack.
- Visual system refresh: Locco uses Butter, Berry Good, Usu Koubai Blossom, Meadow Mauve, Soldier Green/Forest, and Ink across the current light playful UI.
- Saved-place RLS/grants: `saved_places` is intended to support authenticated select/insert/delete/update under RLS. Delete and update are restricted to the current user's own saves from lists they own, and update uses both `USING` and `WITH CHECK` to prevent moving a save into another user's list or ownership. Manual remote SQL has previously been applied for the saved-place delete/update grants and policies; `supabase/schema.sql` should reflect the intended reference state.

## Map Controls Redesign Decisions

The map-controls branch changes presentation and list-scope coordination without replacing the existing place-sheet, save, or data architecture.

- Persistent horizontal chips did not scale comfortably across list counts or narrow map widths, so `SelectedListChips` and `ListDrawer` were deleted. `MapTopControls`, `MapFiltersSheet`, and `MapBottomControls` were added with narrower presentation responsibilities.
- `FoodMapApp` remains the sole owner of applied list scope. `MapFiltersSheet` receives the applied IDs and emits candidate selections; it does not keep durable applied state. `ChatRecommendationPanel` consumes that same scope rather than owning a second filter source of truth.
- Live filtering was chosen because each checkbox action is immediately reversible and should update both markers and URL state. A staged Apply/Cancel model would add duplicate state and ambiguous cancellation semantics.
- Explicit zero selection exposed two fallback bugs: route parsing previously could not distinguish a missing `lists` parameter from `lists=`, and the recommendation API broadened an empty array to `list_my`. Both boundaries now preserve explicit empty scope while retaining the legacy fallback only when scope is absent.
- List scope is canonicalized by filtering the loaded list collection in its existing order. This simultaneously removes invalid IDs, duplicates, and caller-dependent ordering.
- Bottom-control spacing is centralized in map-specific CSS tokens so Ask Locco/Add, attribution, and navigation share one vertical system instead of independent offsets. MapLibre attribution stays visible, clickable, and scoped to the Locco map page.
- The profile icon remains a presentational placeholder because authentication actions and profile readiness belong in a real profile surface. That decision is coupled to the later immersive map-shell work, not this PR-sized control branch.
- The search UI refinement preserved OneMap behavior while leaving provider choice separate from the component contracts. Provider choice affects identity, billing, storage, caching, attribution, map rendering, and the path from an external result to a canonical Locco place.
- The immersive header remains separate because it requires route-specific shell, `100dvh`, safe-area, and document-scroll decisions. The current `AppShell` header and map-height calculation have a known roughly 24px mismatch.
- Owner groups currently use `ownerName` only for presentation. Stable owner IDs are still required so duplicate friend display names do not collapse into one group.

Preserved architecture:

- Motion transform dragging and minimized/mid/expanded place-sheet snap states;
- content-aware dynamic minimized height and snap-state map padding;
- the full-screen Directions portal;
- Save Status and save/edit/remove behavior;
- canonical place identity and personal saved-place ownership;
- signed-in saved-state behavior and mock/no-Supabase fallback;
- Add Place remaining local-only.

## Google-Primary Provider Foundation Decisions

- `LocationSearchResult` normalizes provider metadata, result kind, optional namespaced external reference, display fields, postal code, and validated coordinates. Raw OneMap response fields exist only inside the OneMap adapter.
- The browser calls `/api/location-search`; `src/lib/location-search/providers/onemap.ts` is the active adapter. Known Locco locations retain their existing first-result ordering, the server still caps merged results at 8, and the client still renders at most 4.
- Search results are transient reference data, not a universal persisted place model. Locco UUIDs and the server-computed `place_key` remain canonical, and no schema or canonical save-reconciliation change was introduced.
- Search and rendering stay separate. The foundation stack pairs the Google renderer with existing OneMap discovery until the later Google discovery stage; MapLibre never receives Google transient results. This avoids half-switched renderer/search combinations while independent capabilities remain off.
- Google is the intended primary production map platform. MapLibre plus OneMap/Locco is an operational fallback for disabled/unconfigured state, kill switch, fatal script/map initialization, and future sustained outage or quota shutdown. It is not a production user preference.
- The server resolves capability requests against build support and required configuration, then sends only sanitized booleans plus the public browser map key/map ID when map use is actually enabled. The server API key is never included in client configuration.
- Every capability defaults false and is independently named: map, autocomplete, text, nearby, Details Essentials/Pro/Enterprise, ratings, opening hours, photos, geocoding, routes, and reconciliation/save. Only map is supported in this build; unsupported flags remain false even when requested.
- `GoogleMapView` uses a lazy singleton loader, a project map ID, Advanced Markers, custom clustering, shared viewport/camera state, `ResizeObserver`, listener disposal, marker/cluster cleanup, and remount-safe initialization. When Google is disabled the component is not mounted and the loader makes no Google request.
- Canonical Locco marker selection uses Locco place identity and calls the same selection handler as MapLibre/list cards. When persistence returns a different authoritative database UUID, the client atomically adopts that UUID across application state and the replace-style `place=` URL while preserving list scope and unrelated parameters.
- Provider detail absence and non-fatal detail errors do not trigger renderer fallback. No detail request starts without a selected reconciled place and enabled fixed profile; in-flight work is deduplicated and stale generations are discarded.
- Opening hours is an independent detail capability and can be operationally blocked at a conservative usage threshold without changing the map capability. When blocked or unavailable, the view model omits the hours row while Google Maps, the Locco Motion sheet, and the shared Directions sheet's `Open in Google Maps` action remain active.
- No Google Places search, reconciliation, persistence, provider-reference schema, save migration, photo storage, key creation, billing change, production activation, usage counter, or cloud resource is part of this branch.
- Fixed detail profiles can describe expected SKU classes for guardrail telemetry, but application telemetry is not evidence of provider billing. Actual cost and quota data must come from provider-side controls.
- OneMap authentication is deliberately deferred until after the controlled Google prototype, but authenticated requests, multi-page fetching, retry policy, timeout/backoff, and richer error classification are required before OneMap is considered a dependable production fallback.

## Current Boundaries

- Add Place remains local-only for now; `local-` entries are not persisted by `/api/places/save`.
- `AddPlaceModal` does not yet provide complete dialog semantics, focus trapping/restoration, or keyboard dismissal. Treat this as an accessibility gap rather than completed behavior.
- Saves currently go to the user's default private saved list instead of a full multi-list picker.
- Map Filters groups friend lists by display name for presentation; stable owner identity and duplicate-name handling remain unimplemented.
- Flippable list-detail cards intentionally do not show save/status controls.
- Non-map `PlaceCard` surfaces hide save/status controls by default unless explicitly opted in.
- The map place sheet preserves save/status controls, SaveStatusSheet, remove saved place, mock fallback, signed-in saved state, and `/app/map?place=...` focus behavior.
- The app must remain runnable without Supabase credentials.
- OneMap calls stay behind the server-side location-search adapter.
- Paid provider APIs and scripts remain fail-closed behind exact capabilities and required configuration. Keys, billing, live provider activation, and cloud resources require explicit manual setup; do not scrape Google Maps, TikTok, or Instagram.
- Do not add placeholder image files for list covers.
- Core mobile gestures should be built with a proper motion/gesture architecture early instead of patched height/pointer dragging.
- OneMap currently acts primarily as a location/address source, requests only its first result page, and is capped again by the server and client. Autocomplete, comprehensive chain/outlet coverage, ratings, photos, opening hours, categories, and robust external place identity are not implemented.
- Provider-derived search fields remain transient and separate from Locco-owned place data; no provider reference is persisted yet.
- The current map still uses the beige `AppShell` header and has a known roughly 24px AppShell/map height mismatch that can cause document-level scrolling.

## Future Work

- Keep docs current as project context changes.
- Follow the provider rollout in order: `google-maps-places-foundation`, `google-places-discovery-flow`, `place-provider-reference-model`, `google-place-rich-details`, then `onemap-search-auth-hardening`.
- The discovery stage must keep external results transient and separately identifiable. The provider-reference stage owns schema/reconciliation/duplicate-prevention decisions. The rich-details stage owns fixed field masks, selected-place lifecycle, cost/quota controls, attribution, moved/closed handling, and live provider QA. OneMap hardening owns authentication, paging, timeout/backoff, retries, and error classification.
- Native Google POI interaction belongs after the provider-reference model: an exact stored Google Place ID lets the overlapping Locco marker take visual priority and either target select the canonical Locco UUID, `place=` state, and Motion sheet. Unmatched POIs remain attributed transient previews without canonical `place=`, clear on fallback, and fetch rich details only after one POI is selected; durable Want to try or Visited saving must first reconcile exact provider reference, canonical `place_key`, complete address/postal code, and coordinate proximity on the server.
- Keep `map-immersive-header-layout` as a separate branch covering a route-specific full-height map shell, removal or replacement of the beige map header, correct `100dvh`, iOS/Android safe areas, document-scroll removal, the AppShell/map mismatch, final top/bottom control placement, a functional profile surface for Profile ready and Sign out, and whether a small Locco logo mark remains.
- Polish expanded place detail spacing and section hierarchy.
- Revisit fully native nested scroll-to-drag handoff for expanded sheet content if needed.
- Redesign place detail pages around canonical places and personal saved-place state.
- Add status filtering and define tag taxonomy/filtering.
- Expand from default-list saves to a multi-list save model.
- Deepen friend/list browsing.
- Persist Add Place.
- Add photo support and define personal notes versus social comments.
- Tune deterministic recommendations without presenting them as full AI.
- Continue performance and mobile polish, including real-device keyboard and touch-drag testing.
