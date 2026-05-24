# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor home API wiring

## Current Goal

- Wire the `/editor` home screen and project dialogs to the real project API.

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
- Added `/` to the public route list in `proxy.ts` so the home page redirect logic can run before auth protection redirects unauthenticated users.
- Verified the auth setup with `clerk doctor`, `npm run lint`, and `npm run build`.
- Replaced the temporary `/editor` center panel with the minimal home screen from `04-project-dialogs.md`, including the heading, description, and `New Project` CTA.
- Added a dedicated `useProjectDialogState` hook to manage project dialog mode, form state, and loading state with mock owned/shared project data only.
- Added wired Create, Rename, and Delete project dialogs, including live slug preview, rename autofocus, Enter-to-submit forms, and destructive delete confirmation styling.
- Updated the project sidebar to render mock project lists, show rename/delete actions only for owned projects, wire all dialog entry points, and add a mobile backdrop scrim that closes the sidebar on outside tap.
- Verified the project dialogs and editor home unit with `npm run lint` and `npm run build`.
- Switched Prisma config to use the `prisma/` schema directory so the data layer can be split into multiple schema files.
- Added `prisma/models/project.prisma` with the `ProjectStatus` enum plus `Project` and `ProjectCollaborator` models, including the required relation, indexes, unique constraint, and cascade delete behavior from `05-prisma.md`.
- Added `lib/prisma.ts` as a cached Prisma singleton that uses Prisma Accelerate for `prisma+postgres://` URLs and `@prisma/adapter-pg` for direct PostgreSQL URLs.
- Created and applied the first Prisma migration at `prisma/migrations/20260524141620_init_project_data_layer/migration.sql`.
- Generated the Prisma client into `app/generated/prisma` and verified the Prisma data layer with `npx prisma validate`, `npx prisma migrate dev`, `npx prisma generate`, and `npm run build`.
- Added `app/api/projects/route.ts` with authenticated `GET /api/projects` and `POST /api/projects` handlers.
- Added `app/api/projects/[projectId]/route.ts` with authenticated owner-only `PATCH /api/projects/[projectId]` and `DELETE /api/projects/[projectId]` handlers.
- Added `lib/project-api.ts` to centralize JSON parsing, response shapes, authenticated user lookup, Prisma project selection, and owner checks for the project routes.
- Enforced the `06-project-apis.md` rules: unauthenticated requests return `401`, non-owner rename/delete requests return `403`, and missing create names default to `Untitled Project`.
- Verified the backend project API unit with `npm run build`.
- Updated `app/editor/page.tsx` to stay a server component, fetch owned projects plus shared collaborator projects server-side, and pass both lists into the editor home shell without client-side initial fetching.
- Added `hooks/use-project-actions.ts` to replace the mock dialog state with real create, rename, and delete project mutations backed by the existing project API routes.
- Wired create project to generate a short room ID suffix, preview the final room ID in the dialog, send the aligned project ID to `POST /api/projects`, and navigate to `/editor/[projectId]` after success.
- Wired rename and delete dialogs to the real `PATCH` and `DELETE` project routes, using `router.refresh()` after mutation and redirect support for deleting the active workspace.
- Updated the sidebar and dialogs to use real project data, show room IDs instead of mock slugs, keep rename prefilled from the selected project, and show the selected project name in delete confirmation.
- Extended `lib/project-api.ts` and `app/api/projects/route.ts` so project creation can accept an explicit project ID, keeping the project ID aligned with the future Liveblocks room ID required by `07-wire-editor-home.md`.
- Tightened project name validation in `lib/project-api.ts` so create and rename both trim whitespace, reject empty names, and persist the trimmed value only.
- Added duplicate project ID conflict handling so `POST /api/projects` maps Prisma unique constraint collisions to `409`, and the create project dialog now surfaces that conflict message inline instead of failing as a generic server error.
- Unified project mutation error handling in `hooks/use-project-actions.ts` so create, rename, and delete all surface API and network failures inline inside their dialogs instead of failing silently.
- Verified the wired editor home unit with `npm run lint` and `npm run build`.

## In Progress

- None currently.

## Next Up

- Build the next feature unit on top of the wired editor home and real project mutations.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- UI primitives will be generated via the `shadcn` CLI into `components/ui/` and treated as protected foundation components.
- App-level styling should use project tokens in `app/globals.css` and compose the generated primitives instead of modifying `components/ui/*`.

## Session Notes

- Current feature unit is based on `context/feature-specs/feature-specs/01-design-system.md`.
- `app/layout.tsx` now applies the `dark` class at the root so shadcn dark variants remain active without a light mode.
- Active feature unit has moved to `context/feature-specs/feature-specs/02-editor-chrome.md`.
- Active project dialog work follows `context/feature-specs/feature-specs/04-project-dialogs.md`.
- Active data layer work follows `context/feature-specs/feature-specs/05-prisma.md`.
- Active backend API work follows `context/feature-specs/feature-specs/06-project-apis.md`.
- Active editor home API wiring follows `context/feature-specs/feature-specs/07-wire-editor-home.md`.
