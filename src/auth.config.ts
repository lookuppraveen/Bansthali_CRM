import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config. Middleware imports ONLY from here
 * because Edge Runtime doesn't support bcryptjs / node crypto used by the
 * Credentials provider's `authorize`. The full config in ./auth.ts adds
 * providers on top of this and runs in the Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // populated in ./auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.id;
        token.role = (user as { role?: string }).role ?? token.role;
        token.initials = (user as { initials?: string }).initials ?? token.initials;
        token.title = (user as { title?: string | null }).title ?? token.title ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { initials?: string }).initials = token.initials as string;
        (session.user as { title?: string | null }).title = (token.title as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
