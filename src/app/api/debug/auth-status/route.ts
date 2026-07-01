import { NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/auth/currentIdentity";

export const dynamic = "force-dynamic";

function isAuthDebugEnabled() {
  return process.env.AUTH_DEBUG_ENABLED === "true";
}

export async function GET() {
  // Local/Vercel Preview verification only. Do not enable AUTH_DEBUG_ENABLED in production.
  if (!isAuthDebugEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const identity = await getCurrentIdentity();
  const hasUser = Boolean(identity.user);
  const hasProfile = Boolean(identity.profile);

  // Keep this response boolean-only: no emails, tokens, cookies, user objects, or env values.
  return NextResponse.json({
    enabled: true,
    authConfigured: identity.authConfigured,
    hasSession: identity.isSignedIn,
    hasUser,
    hasProfile,
    usingDemoFallback: identity.source === "demo",
    profileIdMatchesUser: hasUser && hasProfile ? identity.profile?.id === identity.user?.id : null
  });
}
