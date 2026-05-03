import Link from "next/link";
import { asc } from "drizzle-orm";

/** Password hashing + large dashboard can exceed default hobby timeout on cold start. */
export const maxDuration = 60;
import { db } from "@/db";
import { users } from "@/db/schema";
import { loadBoardRows } from "@/lib/board";
import { decodeQueryError, firstQueryValue } from "@/lib/search-params";
import {
  coordinatorAddStreet,
  coordinatorClearStreet,
  coordinatorCreateVolunteer,
  coordinatorDeleteStreet,
  coordinatorDeleteUser,
  coordinatorLogout,
  coordinatorSetVolunteerPassword,
} from "@/lib/coordinator-actions";

function formatVolunteerError(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("user:")) return raw.slice(5);
  if (raw.startsWith("pass:")) return raw.slice(5);
  if (raw.startsWith("reset:")) return raw.slice(6);
  switch (raw) {
    case "volunteer_password_mismatch":
      return "Password and confirmation did not match.";
    case "volunteer_taken":
      return "That username is already taken.";
    case "volunteer_unknown":
      return "Could not create volunteer (database error).";
    case "volunteer_bad_id":
      return "Invalid user id.";
    case "volunteer_not_found":
      return "User not found.";
    default:
      return raw;
  }
}

export default async function CoordinatorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    volunteer_created?: string | string[];
    volunteer_password_reset?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const err = formatVolunteerError(decodeQueryError(sp.error));
  const volunteerCreated =
    firstQueryValue(sp.volunteer_created) === "1";
  const passwordReset =
    firstQueryValue(sp.volunteer_password_reset) === "1";

  const board = await loadBoardRows();
  if (board.dbError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Coordinator dashboard
        </h1>
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/50 dark:text-red-50"
        >
          <p className="font-medium">Database error</p>
          <p className="mt-2 whitespace-pre-wrap">{board.dbError}</p>
        </div>
        <form action={coordinatorLogout}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Log out coordinator
          </button>
        </form>
      </div>
    );
  }

  const { rows: streetRows, campaignName } = board;

  let userRows: {
    id: string;
    username: string;
    createdAt: Date;
    passwordHash: string | null;
  }[] = [];
  try {
    userRows = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .orderBy(asc(users.username));
  } catch (e) {
    console.error("[coordinator/users]", e);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Coordinator dashboard
          </h1>
          {campaignName ? (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Campaign: {campaignName}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/export/csv"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Download CSV
          </a>
          <form action={coordinatorLogout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Log out coordinator
            </button>
          </form>
        </div>
      </div>

      {err === "empty_street" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          Street name cannot be empty.
        </p>
      ) : null}
      {err === "no_campaign" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          No default campaign. Run seed first.
        </p>
      ) : null}
      {err && err !== "empty_street" && err !== "no_campaign" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {err}
        </p>
      ) : null}
      {volunteerCreated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
          Volunteer account created. Share their username and password with them so they can log in.
        </p>
      ) : null}
      {passwordReset ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
          Password updated. Their old sessions were signed out — they must log in again.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Create volunteer account</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Only people you add here can log in on the public site. Give them the username and password
          in person or over a trusted channel.
        </p>
        <form
          action={coordinatorCreateVolunteer}
          className="max-w-xl space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50"
        >
          <div>
            <label htmlFor="volunteer_username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="volunteer_username"
              name="volunteer_username"
              required
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Lowercase letters, digits, hyphen, underscore only (2–64 characters).
            </p>
          </div>
          <div>
            <label htmlFor="volunteer_password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="volunteer_password"
              name="volunteer_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">At least 8 characters.</p>
          </div>
          <div>
            <label
              htmlFor="volunteer_password_confirm"
              className="block text-sm font-medium"
            >
              Confirm password
            </label>
            <input
              id="volunteer_password_confirm"
              name="volunteer_password_confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Create account
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Add street</h2>
        <form action={coordinatorAddStreet} className="flex max-w-lg flex-wrap gap-2">
          <input
            name="name"
            placeholder="Street name"
            className="min-w-[12rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Add
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Volunteers</h2>
        {userRows.length === 0 ? (
          <p className="text-sm text-zinc-500">No registered volunteers.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <tr>
                  <th className="px-4 py-2 font-medium">Username</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2 font-medium">Can log in</th>
                  <th className="px-4 py-2 text-left font-medium">Password</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {userRows.map((u) => (
                  <tr key={u.id} className="align-top">
                    <td className="px-4 py-2 font-medium">{u.username}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {u.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {u.passwordHash ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2">
                      <form
                        action={coordinatorSetVolunteerPassword}
                        className="flex max-w-xs flex-col gap-2"
                      >
                        <input type="hidden" name="user_id" value={u.id} />
                        <input
                          name="new_password"
                          type="password"
                          placeholder="New password"
                          minLength={8}
                          autoComplete="new-password"
                          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                        />
                        <input
                          name="new_password_confirm"
                          type="password"
                          placeholder="Confirm"
                          minLength={8}
                          autoComplete="new-password"
                          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                        />
                        <button
                          type="submit"
                          className="text-left text-sm text-amber-800 underline hover:no-underline dark:text-amber-400"
                        >
                          {u.passwordHash ? "Change password" : "Set password"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form action={coordinatorDeleteUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="text-sm text-red-700 underline hover:no-underline dark:text-red-400"
                        >
                          Delete user and clear their streets
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Streets</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-4 py-2 font-medium">Street</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Volunteer</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {streetRows.map((s) => (
                <tr key={s.streetId}>
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2">{s.status}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {s.username ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={coordinatorClearStreet.bind(null, s.streetId)}>
                        <button
                          type="submit"
                          className="text-sm text-amber-800 underline hover:no-underline dark:text-amber-400"
                        >
                          Clear assignment
                        </button>
                      </form>
                      <form action={coordinatorDeleteStreet.bind(null, s.streetId)}>
                        <button
                          type="submit"
                          className="text-sm text-red-700 underline hover:no-underline dark:text-red-400"
                        >
                          Delete street
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline">
          Back to public board
        </Link>
      </p>
    </div>
  );
}
