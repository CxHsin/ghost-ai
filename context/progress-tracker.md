# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Base collaborative canvas

## Current Goal

- Add a starter template library with import previews and wire template replacement into the collaborative canvas.

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
- Tightened create-project ID validation in `lib/project-api.ts` so client-provided IDs are trimmed and empty or whitespace-only values are rejected before persistence.
- Added duplicate project ID conflict handling so `POST /api/projects` maps Prisma unique constraint collisions to `409`, and the create project dialog now surfaces that conflict message inline instead of failing as a generic server error.
- Unified project mutation error handling in `hooks/use-project-actions.ts` so create, rename, and delete all surface API and network failures inline inside their dialogs instead of failing silently.
- Verified the wired editor home unit with `npm run lint` and `npm run build`.
- Added `lib/project-access.ts` with server-only helpers for reading the current Clerk identity (`userId` plus primary email) and resolving project access by owner or collaborator membership.
- Added `components/editor/access-denied.tsx` as the shared unauthorized or missing-project state with a centered layout, lock icon, and link back to `/editor`.
- Added `app/editor/[roomId]/page.tsx` as a server component that awaits the Next.js 16 `params` promise, redirects unauthenticated users to `/sign-in`, and uses `AccessDenied` for missing or unauthorized projects.
- Added `components/editor/editor-workspace-shell.tsx` to render the full-viewport workspace shell with the current project name, left project sidebar, central canvas placeholder, and right AI sidebar placeholder.
- Extended the existing editor navbar and project sidebar so the workspace shell can show project-specific navbar actions, highlight the active room, and link between accessible projects.
- Verified the editor workspace shell unit with `npm run lint` and `npm run build`.
- Refined the `/editor/[roomId]` shell UI to better match the approved workspace direction: left-aligned navbar title stack, stronger floating sidebars, a framed canvas placeholder with grid and radial lighting, and a more structured AI copilot placeholder panel.
- Adjusted the shell panel behavior so the AI copilot now slides over the workspace instead of shrinking the canvas, while the left project panel uses a narrower footprint and tighter spacing.
- Increased the vertical spacing between the `Project name` label and input in the create-project dialog so the form reads less cramped.
- Refined the create-project dialog spacing again by giving the `Project name` label its own bottom margin, specifically separating it from the input border instead of only increasing container spacing.
- Added `lib/project-collaborator-email.ts` to normalize and validate collaborator emails consistently across project access and sharing flows.
- Added `lib/project-collaborators.ts` with server-side collaborator listing, owner-only invite/remove helpers, and Clerk-backed display name/avatar enrichment without adding a local user table.
- Added `app/api/projects/[projectId]/collaborators/route.ts` plus `app/api/projects/[projectId]/collaborators/[email]/route.ts` for authenticated collaborator listing and owner-only invite/remove mutations.
- Updated project access and shared project queries to normalize collaborator emails before matching so project sharing remains case-insensitive.
- Added `components/editor/share-dialog.tsx` and wired the workspace `Share` button to open it from the editor navbar.
- Implemented owner sharing controls in the dialog for invite-by-email, collaborator removal, and project-link copy with temporary `Copied!` feedback.
- Implemented collaborator read-only dialog behavior so non-owners can open the share dialog and view the enriched collaborator list without changing access.
- Hardened `components/editor/share-dialog.tsx` collaborator loading with request cancellation so closing the dialog or switching projects cannot let stale responses overwrite the current collaborator state.
- Reduced the workspace shell center-panel typography so the placeholder heading and body copy align more closely with the approved reference scale.
- Reduced the workspace shell center-panel typography again to better match the smaller title and body proportions in the approved reference.
- Reduced the `/editor` home screen center-panel typography as well so its empty-state heading and body copy stay aligned with the smaller reference proportions.
- Fixed malformed validation error payloads in `lib/project-api.ts` by removing the accidental extra `error` nesting, so project API routes now return the expected response shape for invalid requests.
- Hardened `renameOwnedProject` and `deleteOwnedProject` in `lib/project-api.ts` so Prisma `P2025` races from concurrent deletion are mapped back to the existing `not_found` contract instead of surfacing as unexpected 500 errors.
- Documented the intentional client-specified project ID flow in `POST /api/projects` so reviewers can see it exists to keep project IDs aligned with future collaborative room IDs.
- Removed the obsolete mock project dialog state files after the live project action flow fully replaced them, eliminating the stale `slug`-based project shape.
- Updated `ProjectCollaborator` to use a composite primary key in the Prisma schema and added a follow-up migration to replace the old `(projectId, email)` unique index with a proper primary key constraint.
- Added `@liveblocks/node` to support the server-side auth flow required by `10-liveblocks-setup.md`.
- Replaced the default `liveblocks.config.ts` scaffold with typed Presence and UserMeta definitions for cursor state, AI thinking state, and user display metadata.
- Extended `lib/project-access.ts` for the Liveblocks setup phase so the protected room auth flow reuses the centralized Clerk identity lookup plus owner-or-collaborator project access checks.
- Added `lib/liveblocks.ts` with a cached Liveblocks node client, deterministic cursor color hashing, and room bootstrap logic that ensures authorized users have room write access.
- Added `app/api/liveblocks-auth/route.ts` as a protected Liveblocks auth endpoint that validates room access against the project data layer, creates the room when needed, and returns a session token with name, avatar, and cursor color metadata.
- Reconciled the Liveblocks auth route with the current `development` branch project access helpers so the route uses the latest identity/access API shape and the app builds cleanly again.
- Verified the Liveblocks setup unit with `npm run lint` and `npm run build`.
- Added `types/canvas.ts` with shared base canvas node and edge types plus the project-approved node color palette and shape definitions.
- Added `components/editor/editor-canvas-room.tsx` to set up `LiveblocksProvider`, `RoomProvider`, initial presence, `ClientSideSuspense`, a loading state, and a connection-error fallback around each editor room.
- Updated `components/editor/editor-canvas-room.tsx` so transient Liveblocks connection errors no longer permanently block the canvas: the error state now offers manual retry and clears itself after a successful reconnect.
- Added `components/editor/base-canvas.tsx` with the first Liveblocks-synced React Flow surface using `useLiveblocksFlow`, empty initial nodes and edges, loose connections, `fitView`, `MiniMap`, and a dot-pattern background.
- Replaced the workspace canvas placeholder in `components/editor/editor-workspace-shell.tsx` with the real collaborative canvas room bound to the current project room ID.
- Imported the React Flow base stylesheet in `app/globals.css` so the synced canvas renders with the required foundation styles.
- Hardened `app/api/liveblocks-auth/route.ts` so missing Liveblocks configuration and authorization failures now return explicit JSON API errors instead of opaque 500 responses.
- Added `hasLiveblocksSecret()` in `lib/liveblocks.ts` so the auth route can fail fast when `LIVEBLOCKS_SECRET_KEY` is missing from the server environment.
- Tightened `app/api/liveblocks-auth/route.ts` error responses so the client now gets stable, generic authorization failure messages while detailed Liveblocks and server exceptions stay in server logs only.
- Verified the base canvas unit with `npm run lint` and `npm run build`.
- Extended `types/canvas.ts` with default shape sizes, drag payload typing, default-color helpers, and shape-based node ID generation for canvas node creation.
- Added `components/editor/canvas-node.tsx` as the first custom `canvasNode` renderer so newly created nodes are visible even before shape-specific visuals land.
- Updated `components/editor/base-canvas.tsx` to render a floating bottom-center shape panel with draggable buttons for rectangle, diamond, circle, pill, cylinder, and hexagon.
- Added drag payload serialization plus canvas `dragover` and `drop` handling that converts screen coordinates to flow coordinates and inserts new Liveblocks-synced nodes with the custom node type, default color, empty label, dropped shape, and shape-specific default size.
- Added a click and keyboard-accessible insertion path for the shape panel so shape buttons can add nodes at the visible canvas center in addition to drag-and-drop.
- Fixed the active project card gradient in `components/editor/project-sidebar.tsx` by replacing the invalid `bg-linear-to-r` Tailwind class with `bg-gradient-to-r`, restoring the intended highlighted background for the selected project.
- Updated `components/editor/project-sidebar.tsx` so the closed sidebar uses `inert` alongside `aria-hidden`, preventing off-screen links and buttons from remaining keyboard-focusable while the slide-out panel is hidden.
- Clarified the create-project success path in `hooks/use-project-actions.ts` so the post-create editor navigation explicitly uses the created room ID variable, matching the existing project ID and room ID alignment across the workspace routes.
- Hardened collaborator invite input parsing in `lib/project-collaborators.ts` so blank or malformed email addresses are rejected at the API boundary before they can enter the project sharing flow.
- Switched canvas node ID generation in `types/canvas.ts` to `crypto.randomUUID()` so collaborative node insertion no longer relies on timestamp-plus-counter IDs that can collide across clients.
- Added `components/editor/canvas-shape.tsx` as the shared shape renderer for collaborative nodes and drag previews, with CSS-backed rectangle, pill, and circle variants plus SVG-backed diamond, cylinder, and hexagon variants that scale with node size.
- Replaced the placeholder node box in `components/editor/canvas-node.tsx` so each collaborative node now renders its actual configured shape with the existing canvas color palette and a brighter selected-state border.
- Extended `components/editor/base-canvas.tsx` with a cursor-following drag ghost preview for the bottom shape panel, using the same shape type and default size as the dropped node while keeping node creation logic unchanged.
- Verified the `13-node-shape.md` implementation with `npm run lint` and `npm run build`.
- Added shape-specific minimum canvas node sizes in `types/canvas.ts` so resize interactions stay within stable visual bounds across all supported node shapes.
- Extended `components/editor/canvas-shape.tsx` to accept custom label content while preserving the existing shape visuals, allowing node display and editing states to share the same centered label slot.
- Updated `components/editor/canvas-node.tsx` to show subtle resize handles on selected nodes via React Flow's `NodeResizer`, keeping size changes on the existing collaborative node sync path.
- Added inline node label editing in `components/editor/canvas-node.tsx` with centered placeholder text, double-click-to-edit, live collaborative updates as users type, and blur/Escape exit behavior.
- Prevented inline text editing interactions from dragging or panning the canvas by isolating textarea pointer and wheel events inside the node editor overlay.
- Verified the `14-node-editing.md` implementation with `npm run lint` and `npm run build`.
- Restored four-sided canvas connection handles in `components/editor/canvas-node.tsx` so custom nodes remain connectable after the node editing UI changes, while keeping handles hidden until hover or selection and disabled during inline text editing.
- Refined canvas connection feedback in `app/globals.css` and `components/editor/base-canvas.tsx` so handles also reveal during active connection targeting, the connection hit radius is more forgiving, and new edges render with the approved bright smooth-step arrow styling.
- Replaced the visible outer connection dots with inset dual-purpose source/target handles in `components/editor/canvas-node.tsx`, keeping nodes visually clean while making edge creation more reliable across all four sides.
- Updated the selected-node connection anchors in `app/globals.css` so connectable points are visibly rendered only after a node is selected, while active connections still highlight with the accent color.
- Removed edge arrowheads in `components/editor/base-canvas.tsx` so newly created connections render as undirected smooth-step lines.
- Refined the selected-node anchor styling in `app/globals.css` to match the approved compact white-dot visual direction, while keeping handles hidden until the user selects a node.
- Updated `components/editor/base-canvas.tsx` so connections now render as thin white bezier curves instead of boxier stepped paths, aligning the canvas edge feel more closely with the approved reference.
- Nudged the selected-node connection anchors outward in `components/editor/canvas-node.tsx` and reduced their visual weight in `app/globals.css` so they sit just outside the node boundary as smaller white dots.
- Added `components/editor/canvas-edge.tsx` plus typed edge registration in `components/editor/base-canvas.tsx` so canvas lines terminate at the connection-dot edge instead of running through the dot center.
- Tightened the shared connection spacing in `components/editor/canvas-node.tsx` so the visible anchor dots sit closer to each node edge while preserving consistent line termination against the dot boundary.
- Centralized the canvas connection dot size and spacing constants in `types/canvas.ts` so node anchor placement and edge termination now share one consistent gap model across all shapes.
- Reduced the shared connection dot size and gap constants in `types/canvas.ts` again so every shape now sits closer to its connected lines, matching the tighter visual spacing direction from the approved reference.
- Tightened the shared connection dot constants once more in `types/canvas.ts` so every shape and line now uses the same near-flush spacing target aligned with the latest reference.
- Added a shared outer-bounds padding constant in `types/canvas.ts` and inset shape rendering in `components/editor/canvas-shape.tsx` so all node shapes now sit inside a consistent axis-aligned editing box instead of mixing tight-fit and outer-rect behavior.
- Normalized the SVG shape paths in `components/editor/canvas-shape.tsx` so diamond, hexagon, and cylinder now fill the same inner box model as rectangle, pill, and circle, making the visible gap to the shared outer bounding box consistent across all shapes.
- Tightened `components/editor/canvas-edge.tsx` endpoint trimming so lines now terminate at the connection dot boundary itself instead of stopping short of the visible endpoint.
- Kept the empty-state `Add label` copy visible during inline label editing in `components/editor/canvas-node.tsx` by rendering a centered editing overlay placeholder instead of relying on the textarea placeholder alone.
- Removed the editing-state `Add label` overlay in `components/editor/canvas-node.tsx` so the placeholder disappears immediately after double-clicking into inline label editing, matching the requested node-editing behavior.
- Added a floating selected-node color toolbar in `components/editor/canvas-node.tsx` that renders one swatch per predefined canvas color pair and stays isolated from node dragging and canvas panning interactions.
- Wired color swatch selection through the existing collaborative `reactFlow.updateNodeData()` path so node background and text colors update together immediately without any server calls.
- Verified the `15-node-color-toolbar.md` implementation with `npm run lint` and `npm run build`.
- Brightened the predefined node color palette in `types/canvas.ts` and synchronized the updated values in `context/ui-context.md` so canvas themes feel closer to the brighter reference direction.
- Refined `components/editor/canvas-shape.tsx` so selected node outlines now inherit the active node text color, and cylinder nodes render with a more dimensional top cap, inner rim, and lower ellipse treatment.
- Updated `components/editor/canvas-node.tsx` empty-label styling so text color changes now visibly affect both labeled and unlabeled nodes.
- Verified the node visual refinement pass with `npm run lint` and `npm run build`.
- Unified the cylinder default shading in `components/editor/canvas-shape.tsx` so its top and body highlights stay closer to the same subdued tone as the other default shapes.
- Filled the cylinder bottom ellipse in `components/editor/canvas-shape.tsx` so database nodes no longer look hollow at the base.
- Re-verified the cylinder visual correction with `npm run lint` and `npm run build`.
- Adjusted the default node color pair in `types/canvas.ts` and `context/ui-context.md` so all unthemed nodes now share the darker neutral gray look from the approved database reference.
- Tuned the cylinder default rendering in `components/editor/canvas-shape.tsx` to use neutral gray top and body shading instead of a brighter text-tinted highlight, aligning the default database node with the rest of the default shape set.
- Re-verified the unified default node styling with `npm run lint` and `npm run build`.
- Added typed edge label data in `types/canvas.ts` so collaborative canvas edges now store inline label text through the existing Liveblocks React Flow sync path.
- Updated `components/editor/base-canvas.tsx` so new connections use the custom canvas edge type by default, render dimmed rounded strokes, and attach closed arrowheads at creation time.
- Reworked `components/editor/canvas-node.tsx` handle rendering so every node side exposes both source and target handles, enabling connections from any side to any side without changing node creation behavior.
- Replaced `components/editor/canvas-edge.tsx` with a custom routed edge renderer that uses `getSmoothStepPath`, brightens on hover and selection, adds a wide invisible hit path for easier clicking, and renders inline labels through `EdgeLabelRenderer`.
- Added inline edge label editing in `components/editor/canvas-edge.tsx` with double-click-to-edit, auto-sizing input width, blur/Enter/Escape exit behavior, empty-label hinting on active edges, and collaborative updates through `reactFlow.updateEdgeData()`.
- Refined edge and handle presentation in `app/globals.css` so handles fade in on node hover or selection, keep the requested subtle white-dot look with a dark border, and edge arrowheads inherit the approved bright finish.
- Verified the `16-edge-behavior.md` implementation with `npm run lint` and `npm run build`.
- Tightened `app/globals.css` handle visibility so node endpoints now appear only after selecting a shape, while active connection feedback still stays visible during linking.
- Moved endpoint visibility control into `components/editor/canvas-node.tsx` so each handle now derives its hidden vs visible state directly from the node's `selected` prop, avoiding React Flow class-state leakage that kept unselected endpoints visible.
- Restricted `isConnectableStart` in `components/editor/canvas-node.tsx` to selected nodes only, preventing React Flow's built-in `connectionindicator` state from lighting up every unselected node as a potential connection start point.
- Updated the `MiniMap` node fill in `components/editor/base-canvas.tsx` to a light blue tone so the lower-right overview window matches the requested brighter visual treatment.
- Added `components/editor/canvas-controls.tsx` with a bottom-left pill control bar for zoom out, fit view, zoom in, undo, and redo, including the requested divider and dimmed disabled history states.
- Wired `components/editor/base-canvas.tsx` to React Flow viewport helpers with short animations and to Liveblocks `useUndo`, `useRedo`, `useCanUndo`, and `useCanRedo` for collaborative history controls.
- Added `hooks/useKeyboardShortcuts.ts` so the canvas now supports `+` / `=`, `-`, `Cmd/Ctrl + Z`, `Cmd/Ctrl + Shift + Z`, and `Cmd/Ctrl + Y`, while ignoring shortcuts inside editable fields.
- Verified the `17-canvas-ergonomics.md.md` implementation with `npm run build`.
- Added `components/editor/starter-templates.ts` with shared typed starter canvas data for microservices, CI/CD, and event-driven system diagrams.
- Added `components/editor/starter-templates-modal.tsx` with a scrollable template grid, lightweight SVG previews, and import actions for each predefined template.
- Updated `components/editor/base-canvas.tsx` to open the starter template picker from the canvas chrome, replace the current collaborative canvas with the selected template through Liveblocks storage, and fit the viewport after import.
- Updated `components/editor/editor-navbar.tsx`, `components/editor/editor-workspace-shell.tsx`, and `components/editor/editor-canvas-room.tsx` so the workspace navbar exposes the template import entry point and can open the modal from the active room.
- Verified the `18-starter-templates.md` implementation with `npm run build`.
- Removed the bottom floating `Templates` button from `components/editor/base-canvas.tsx` so template import stays available from the top workspace navbar only.
- Refined the workspace AI toggle in `components/editor/editor-workspace-shell.tsx` with a lighter `Sparkles` icon and stateful styling so it matches the other outline actions when closed and only uses the accent button treatment while open.
- Hardened template import history handling in `components/editor/base-canvas.tsx` by wrapping the Liveblocks storage replacement in `try/finally`, ensuring undo/redo always resumes even if a storage write throws.
- Hardened collaborative edge creation in `components/editor/base-canvas.tsx` by assigning a UUID-backed edge ID before calling `addEdge`, preventing repeated connections on the same handles from reusing a deterministic React Flow ID and overwriting existing edge labels in Liveblocks storage.
- Added keyboard-triggered edge label editing in `components/editor/canvas-edge.tsx` so focused edge labels can enter inline edit mode with `Enter`, `Space`, or `F2` in addition to mouse double-click.
- Added keyboard-accessible node label editing in `components/editor/canvas-node.tsx` so focused node labels can enter inline edit mode with `Enter`, `Space`, or `F2` in addition to mouse double-click.

## In Progress

- Waiting for the next canvas editing feature unit.

## Next Up

- Return to the next selected canvas editing feature after the starter template implementation.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- UI primitives will be generated via the `shadcn` CLI into `components/ui/` and treated as protected foundation components.
- App-level styling should use project tokens in `app/globals.css` and compose the generated primitives instead of modifying `components/ui/*`.
- Project membership checks for room access now live in `lib/project-access.ts` so route handlers and future workspace surfaces share a single owner-or-collaborator permission boundary.

## Session Notes

- Current feature unit is based on `context/feature-specs/feature-specs/01-design-system.md`.
- `app/layout.tsx` now applies the `dark` class at the root so shadcn dark variants remain active without a light mode.
- Active feature unit has moved to `context/feature-specs/feature-specs/02-editor-chrome.md`.
- Active project dialog work follows `context/feature-specs/feature-specs/04-project-dialogs.md`.
- Active data layer work follows `context/feature-specs/feature-specs/05-prisma.md`.
- Active backend API work follows `context/feature-specs/feature-specs/06-project-apis.md`.
- Active editor home API wiring follows `context/feature-specs/feature-specs/07-wire-editor-home.md`.
- Active workspace shell work follows `context/feature-specs/feature-specs/08-editor-workspace-shell.md`.
- Active realtime collaboration setup follows `context/feature-specs/feature-specs/10-liveblocks-setup.md`.
- Active base canvas work followed `context/feature-specs/feature-specs/11-base-canvas.md`.
- Active shape panel work follows `context/feature-specs/feature-specs/12-shape-panel.md`.
- Active node shape rendering work follows `context/feature-specs/feature-specs/13-node-shape.md`.
- Active node editing work follows `context/feature-specs/feature-specs/14-node-editing.md`.
- Active node color toolbar work follows `context/feature-specs/feature-specs/15-node-color-toolbar.md`.
- Active edge behavior work follows `context/feature-specs/feature-specs/16-edge-behavior.md`.
- Active canvas ergonomics work follows `context/feature-specs/feature-specs/17-canvas-ergonomics.md`.
- Active starter template work follows `context/feature-specs/feature-specs/18-starter-templates.md`.
