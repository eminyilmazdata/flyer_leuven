import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COORDINATOR_COOKIE } from "@/lib/constants";
import { verifyCoordinatorToken } from "@/lib/coordinator-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/coordinator/login")) {
    return NextResponse.next();
  }
  if (!pathname.startsWith("/coordinator")) {
    return NextResponse.next();
  }
  const token = request.cookies.get(COORDINATOR_COOKIE)?.value;
  if (!(await verifyCoordinatorToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/coordinator/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/coordinator/:path*"],
};
