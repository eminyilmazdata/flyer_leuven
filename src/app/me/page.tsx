import Link from "next/link";
import { redirect } from "next/navigation";
import { StreetTable } from "@/components/StreetTable";
import { getSessionUser } from "@/lib/auth";
import { loadUserStreetRows } from "@/lib/board";

export default async function MePage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login?next=/me");
  }

  const rows = await loadUserStreetRows(session.userId);
  const reserved = rows.filter((r) => r.status === "reserved");
  const done = rows.filter((r) => r.status === "completed");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My streets</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Logged in as <strong>{session.username}</strong>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Reserved (in progress)</h2>
        {reserved.length ? (
          <StreetTable rows={reserved} />
        ) : (
          <p className="text-sm text-zinc-500">
            None yet.{" "}
            <Link href="/" className="underline">
              Reserve streets on the board
            </Link>
            .
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Completed</h2>
        {done.length ? (
          <StreetTable rows={done} />
        ) : (
          <p className="text-sm text-zinc-500">No completed streets yet.</p>
        )}
      </section>
    </div>
  );
}
