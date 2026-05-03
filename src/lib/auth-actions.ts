"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSessionForUser,
  destroyCurrentSession,
  normalizeUsername,
  setSessionCookie,
  validateUsername,
} from "./auth";

export async function register(formData: FormData) {
  const usernameRaw = String(formData.get("username") ?? "");
  const err = validateUsername(usernameRaw);
  if (err) redirect(`/register?error=${encodeURIComponent(err)}`);
  const username = normalizeUsername(usernameRaw);

  // Single atomic check: INSERT … ON CONFLICT DO NOTHING (avoids race + stale SELECT).
  let inserted: { id: string }[];
  try {
    inserted = await db
      .insert(users)
      .values({ username })
      .onConflictDoNothing({ target: users.username })
      .returning({ id: users.id });
  } catch {
    redirect("/register?error=unknown");
  }

  const id = inserted[0]?.id;
  if (!id) {
    redirect("/register?error=taken");
  }

  const { raw } = await createSessionForUser(id);
  await setSessionCookie(raw);
  redirect("/");
}

export async function login(formData: FormData) {
  const usernameRaw = String(formData.get("username") ?? "");
  const err = validateUsername(usernameRaw);
  if (err) redirect(`/login?error=${encodeURIComponent(err)}`);
  const username = normalizeUsername(usernameRaw);

  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = row[0];
  if (!user) {
    redirect("/login?error=notfound");
  }

  const { raw } = await createSessionForUser(user.id);
  await setSessionCookie(raw);
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/");
}

export async function logout() {
  await destroyCurrentSession();
  redirect("/");
}
