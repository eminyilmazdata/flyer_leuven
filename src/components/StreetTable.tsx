import { getSessionUser } from "@/lib/auth";
import type { BoardRow } from "@/lib/board";
import {
  completeStreet,
  releaseStreet,
  reserveStreet,
} from "@/lib/street-actions";

function statusBadge(status: BoardRow["status"]) {
  const base =
    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums";
  if (status === "open")
    return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100`;
  if (status === "reserved")
    return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100`;
  return `${base} bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100`;
}

export async function StreetTable({ rows }: { rows: BoardRow[] }) {
  const session = await getSessionUser();

  if (rows.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">No streets to show.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <tr>
            <th className="px-4 py-3 font-medium">Street</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Volunteer</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => {
            const mine =
              session && row.assigneeId && row.assigneeId === session.userId;
            const canReserve =
              session && row.status === "open" && row.assigneeId == null;
            const canComplete = mine && row.status === "reserved";
            const canRelease = mine && row.status === "reserved";

            return (
              <tr key={row.streetId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {row.name}
                </td>
                <td className="px-4 py-3">
                  <span className={statusBadge(row.status)}>{row.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {row.username ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {canReserve ? (
                      <form action={reserveStreet.bind(null, row.streetId)}>
                        <button
                          type="submit"
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                        >
                          Reserve
                        </button>
                      </form>
                    ) : null}
                    {canComplete ? (
                      <form action={completeStreet.bind(null, row.streetId)}>
                        <button
                          type="submit"
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Mark done
                        </button>
                      </form>
                    ) : null}
                    {canRelease ? (
                      <form action={releaseStreet.bind(null, row.streetId)}>
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Release
                        </button>
                      </form>
                    ) : null}
                    {!session && row.status === "open" ? (
                      <span className="text-xs text-zinc-500">
                        <a href="/login" className="underline">
                          Log in
                        </a>{" "}
                        to reserve
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
