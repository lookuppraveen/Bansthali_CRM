import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: (typeof schema.roleEnum.enumValues)[number];
      initials: string;
      title: string | null;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email.toLowerCase()))
          .limit(1);

        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          initials: user.initials,
          title: user.title,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.initials = (user as { initials: string }).initials;
        token.title = (user as { title: string | null }).title ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as (typeof schema.roleEnum.enumValues)[number];
        session.user.initials = token.initials as string;
        session.user.title = token.title as string | null;
      }
      return session;
    },
  },
});
