import { auth } from "@/auth";

export default auth((req) => {
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  const isApi = req.nextUrl.pathname.startsWith("/api");
  const authed = !!req.auth;

  if (!authed && !isLogin && !isApi) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return Response.redirect(url);
  }
  if (authed && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("from");
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
