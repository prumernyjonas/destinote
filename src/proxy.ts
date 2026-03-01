import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";

const AUTH_RATE_LIMIT_PATHS = [
  "/api/auth/logout",
  "/api/users/check-email",
  "/api/users/check-nickname",
];

function pathMatches(request: NextRequest): boolean {
  const path = request.nextUrl.pathname;
  return AUTH_RATE_LIMIT_PATHS.some((p) => path === p);
}

export function proxy(request: NextRequest) {
  if (pathMatches(request) && isRateLimited(request)) {
    return NextResponse.json(
      { error: "Příliš mnoho požadavků. Zkuste to prosím za chvíli." },
      { status: 429 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/users/check-email",
    "/api/users/check-nickname",
  ],
};
