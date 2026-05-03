import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loadBoardRows } from "@/lib/board";
import {
  coordinatorAddStreet,
  coordinatorClearStreet,
  coordinatorDeleteStreet,
  coordinatorDeleteUser,
  coordinatorLogout,
} from "@/lib/coordinator-actions";

export default async function CoordinatorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const err = sp.error;

  const userRows = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.username));

  const { rows: streetRows, campaignName } = await loadBoardRows();

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
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {userRows.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 font-medium">{u.username}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {u.createdAt.toISOString().slice(0, 10)}
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
