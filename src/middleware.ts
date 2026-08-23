import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: NextAuth here is constructed with just the config
// (no Credentials provider = no bcryptjs = works in Edge Runtime).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isSplash = path === "/";
  const isLogin = path.startsWith("/login");
  const isApp = path.startsWith("/app");
  const isApi = path.startsWith("/api");
  const authed = !!req.auth;

  // Unauthenticated users can see splash + login. Anything else (including /app)
  // requires auth.
  if (!authed && !isSplash && !isLogin && !isApi) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path);
    return Response.redirect(url);
  }
  // Signed-in users on /login → send to app.
  if (authed && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.searchParams.delete("from");
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
