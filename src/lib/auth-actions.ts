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
  validatePassword,
  validateUsername,
} from "./auth";
import { verifyPassword } from "./password";

export async function login(formData: FormData) {
  const usernameRaw = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const uErr = validateUsername(usernameRaw);
  if (uErr) redirect(`/login?error=${encodeURIComponent(uErr)}`);
  const pErr = validatePassword(password);
  if (pErr) redirect(`/login?error=${encodeURIComponent(pErr)}`);

  const username = normalizeUsername(usernameRaw);

  const row = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = row[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=auth");
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
