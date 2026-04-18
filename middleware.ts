import type { NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    // Exclude static assets, public files, the demo page, and the anonymous preview API
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|demo|api/upload/preview).*)"]
};
