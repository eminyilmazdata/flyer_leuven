import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from "./constants";

export function hashSessionToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSessionForUser(userId: string) {
  const raw = newSessionToken();
  const tokenHash = hashSessionToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });
  return { raw, expiresAt };
}

export async function setSessionCookie(raw: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<{
  userId: string;
  username: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const tokenHash = hashSessionToken(raw);
  try {
    const row = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    const s = row[0];
    if (!s || s.expiresAt.getTime() < Date.now()) return null;
    const u = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, s.userId))
      .limit(1);
    const user = u[0];
    if (!user) return null;
    return { userId: user.id, username: user.username };
  } catch (e) {
    console.error("[getSessionUser]", e);
    return null;
  }
}

export async function destroyCurrentSession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    const tokenHash = hashSessionToken(raw);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * Canonical username for storage and uniqueness: NFKC (folds compatibility
 * variants), trim ASCII/Unicode whitespace, lowercase ASCII.
 */
export function normalizeUsername(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const n = normalizeUsername(username);
  if (n.length < 2 || n.length > 64) {
    return "Username must be between 2 and 64 characters.";
  }
  if (!/^[a-z0-9_-]+$/.test(n)) {
    return "Only lowercase letters, digits, hyphen, and underscore are allowed.";
  }
  return null;
}
