# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor shell foundation

## Current Goal

- Wire Clerk authentication into the existing Next.js shell.

## Completed

- Cleaned up the default Next.js starter boilerplate in `app/` and `public/`.
- Installed and configured `shadcn/ui` with the `radix-nova` preset plus `lucide-react`.
- Generated protected foundation primitives in `components/ui/`: `Button`, `Card`, `Dialog`, `Input`, `Tabs`, `Textarea`, and `ScrollArea`.
- Added `lib/utils.ts` with the shared `cn()` helper.
- Rebuilt `app/globals.css` as a dark-only token system aligned with `context/ui-context.md`.
- Verified the required primitives and shared utilities with `npm run lint` and `npm run build`.
- Restored `app/page.tsx` to a minimal homepage after removing the temporary design-system smoke test.
- Updated `app/page.tsx` to use the generated `Button` component instead of a raw HTML `<button>`.
- Built the reusable editor chrome components from `context/feature-specs/feature-specs/02-editor-chrome.md`.
- Added `components/editor/editor-navbar.tsx` with a fixed-height top navbar and sidebar toggle state affordance.
- Added `components/editor/project-sidebar.tsx` as a floating, sliding project panel with tabs, empty states, and a bottom `New Project` action.
- Kept the editor chrome components available without mounting them from `app/layout.tsx`.
- Verified the editor chrome unit with `npm run lint` and `npm run build`.
- Installed and linked Clerk through the Clerk CLI for the `Ghost AI` application.
- Added `@clerk/nextjs` and `@clerk/ui` to the app and pulled the Clerk environment variables into `.env.local`.
- Wrapped the root layout with `ClerkProvider` inside `<body>` and applied the dark plus shadcn Clerk theme using existing CSS variables.
- Added `proxy.ts` route protection and included the `'/__clerk/(.*)'` matcher after the API/TRPC matcher.
- Created minimal Clerk-powered sign-in and sign-up pages with the project token system and two-panel desktop layout.
- Updated `/` to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`.
- Added visible auth controls to the editor navbar and created a minimal `/editor` page to expose the signed-in user menu.
- Updated `proxy.ts` to derive public auth routes from the existing Clerk sign-in and sign-up env vars instead of hardcoded paths.
- Refined the auth shell to match `03-auth.md` more closely with a compact logo, concise copy, and a text-only feature list on large screens.
- Reduced the editor navbar auth UI to Clerk's built-in `UserButton` only, keeping the default Clerk menu and profile flows intact.
- Removed the extra Clerk shadcn theme layer so auth UI now uses Clerk's `dark` base theme per `03-auth.md`.
- Added targeted Clerk `appearance.elements` overrides so the auth card, social buttons, inputs, and footer use the project tokens without the broken layout from the previous theme mix.
- Reworked the auth shell into a split-screen layout with a full-height left brand panel, 50/50 desktop balance, and a tinted surface that distinguishes it from the base background.
- Added explicit `font-sans` Clerk element bindings so auth forms consistently render with the Geist Sans typography required by `context/ui-context.md`.
- Rebalanced the split auth layout typography to better match the reference composition, reducing the left-side heading, body, and feature scales so they align more naturally with the right-side Clerk card.
- Tightened the left auth panel typography again so its heading, supporting copy, and feature list sit in the same visual size range as the right-side Clerk card.
- Simplified the auth left panel back to a text-only presentation without decorative gradients or icon cards so it stays aligned with `03-auth.md`.
- Added `/sign-in(.*)` and `/sign-up(.*)` fallback public routes in `proxy.ts` so auth pages remain reachable even if Clerk env URLs are unset.
- Verified the auth setup with `clerk doctor`, `npm run lint`, and `npm run build`.

## In Progress

- None currently.

## Next Up

- Build the next feature unit on top of the authenticated editor shell.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- UI primitives will be generated via the `shadcn` CLI into `components/ui/` and treated as protected foundation components.
- App-level styling should use project tokens in `app/globals.css` and compose the generated primitives instead of modifying `components/ui/*`.

## Session Notes

- Current feature unit is based on `context/feature-specs/feature-specs/01-design-system.md`.
- `app/layout.tsx` now applies the `dark` class at the root so shadcn dark variants remain active without a light mode.
- Active feature unit has moved to `context/feature-specs/feature-specs/02-editor-chrome.md`.
- Active auth work follows `context/feature-specs/feature-specs/03-auth.md`.
