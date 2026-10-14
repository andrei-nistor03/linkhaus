import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";

// English is served unprefixed: `/` is rewritten to the `en` segment, and a
// direct `/en/...` request redirects back to the unprefixed URL so the same
// page never lives at two addresses. Other locales pass through untouched.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first] = pathname.split("/");

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  if ((LOCALES as readonly string[]).includes(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and anything with a file extension (public assets,
  // icons, robots.txt, sitemap.xml, manifest.webmanifest, ...).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
