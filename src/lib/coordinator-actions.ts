"use server";

import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { assignments, sessions, streets, users } from "@/db/schema";
import {
  COORDINATOR_COOKIE,
} from "./constants";
import {
  coordinatorCookieOptions,
  createCoordinatorToken,
  verifyCoordinatorToken,
} from "./coordinator-token";
import { getDefaultCampaign } from "./campaign";

async function assertCoordinator() {
  const jar = await cookies();
  const t = jar.get(COORDINATOR_COOKIE)?.value;
  if (!(await verifyCoordinatorToken(t))) {
    redirect("/coordinator/login");
  }
}

function passwordsEqual(a: string, b: string) {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function coordinatorLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.COORDINATOR_PASSWORD;
  if (!expected || !passwordsEqual(password, expected)) {
    redirect("/coordinator/login?error=1");
  }
  const token = await createCoordinatorToken();
  const jar = await cookies();
  jar.set(COORDINATOR_COOKIE, token, coordinatorCookieOptions());
  redirect("/coordinator");
}

export async function coordinatorLogout() {
  const jar = await cookies();
  jar.delete(COORDINATOR_COOKIE);
  redirect("/coordinator/login");
}

export async function coordinatorClearStreet(streetId: string) {
  await assertCoordinator();
  await db
    .update(assignments)
    .set({
      status: "open",
      userId: null,
      reservedAt: null,
      completedAt: null,
    })
    .where(eq(assignments.streetId, streetId));
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/coordinator");
}

export async function coordinatorDeleteUser(userId: string) {
  await assertCoordinator();
  await db.transaction(async (tx) => {
    await tx
      .update(assignments)
      .set({
        status: "open",
        userId: null,
        reservedAt: null,
        completedAt: null,
      })
      .where(eq(assignments.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/coordinator");
}

export async function coordinatorAddStreet(formData: FormData) {
  await assertCoordinator();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/coordinator?error=empty_street");
  }
  const campaign = await getDefaultCampaign();
  if (!campaign) {
    redirect("/coordinator?error=no_campaign");
  }
  const maxRow = await db
    .select({ m: max(streets.sortOrder) })
    .from(streets)
    .where(eq(streets.campaignId, campaign.id));
  const nextOrder = Number(maxRow[0]?.m ?? -1) + 1;

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(streets)
      .values({ campaignId: campaign.id, name, sortOrder: nextOrder })
      .returning({ id: streets.id });
    const id = inserted[0]?.id;
    if (!id) return;
    await tx.insert(assignments).values({ streetId: id, status: "open" });
  });
  revalidatePath("/");
  revalidatePath("/coordinator");
}

export async function coordinatorDeleteStreet(streetId: string) {
  await assertCoordinator();
  await db.delete(streets).where(eq(streets.id, streetId));
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/coordinator");
}
