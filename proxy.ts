import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

function createAuthRoutePattern(route: string | undefined) {
  if (!route) {
    return null;
  }

  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;

  return `${normalizedRoute}(.*)`;
}

const publicRoutes = [
  createAuthRoutePattern(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL),
  createAuthRoutePattern(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL),
].filter((route): route is string => Boolean(route));

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
