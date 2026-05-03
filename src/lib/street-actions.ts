"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { getSessionUser } from "./auth";

function errRedirect(code: string) {
  redirect(`/?error=${encodeURIComponent(code)}`);
}

export async function reserveStreet(streetId: string) {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/");

  const updated = await db
    .update(assignments)
    .set({
      status: "reserved",
      userId: session.userId,
      reservedAt: new Date(),
      completedAt: null,
    })
    .where(and(eq(assignments.streetId, streetId), eq(assignments.status, "open")))
    .returning({ streetId: assignments.streetId });

  revalidatePath("/");
  revalidatePath("/me");

  if (updated.length === 0) {
    errRedirect("reserve_conflict");
  }
}

export async function completeStreet(streetId: string) {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/me");

  await db
    .update(assignments)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(
      and(
        eq(assignments.streetId, streetId),
        eq(assignments.userId, session.userId),
        eq(assignments.status, "reserved"),
      ),
    );

  revalidatePath("/");
  revalidatePath("/me");
}

export async function releaseStreet(streetId: string) {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/me");

  await db
    .update(assignments)
    .set({
      status: "open",
      userId: null,
      reservedAt: null,
      completedAt: null,
    })
    .where(
      and(
        eq(assignments.streetId, streetId),
        eq(assignments.userId, session.userId),
        eq(assignments.status, "reserved"),
      ),
    );

  revalidatePath("/");
  revalidatePath("/me");
}
