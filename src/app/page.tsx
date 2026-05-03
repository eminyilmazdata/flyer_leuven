import Link from "next/link";
import { StreetTable } from "@/components/StreetTable";
import { FilterTabs, type StreetFilter } from "@/components/FilterTabs";
import { loadBoardRows } from "@/lib/board";

const ERROR_MAP: Record<string, string> = {
  reserve_conflict:
    "Someone else reserved that street first. Refresh the list or pick another street.",
};

function parseFilter(raw: string | undefined): StreetFilter {
  if (raw === "open" || raw === "reserved" || raw === "completed") return raw;
  return "all";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const active = parseFilter(sp.filter);
  const { campaignName, rows, dbError } = await loadBoardRows();
  const filtered =
    active === "all" ? rows : rows.filter((r) => r.status === active);
  const errMsg = sp.error ? ERROR_MAP[sp.error] ?? sp.error : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          City center streets
        </h1>
        {dbError ? (
          <div
            role="alert"
            className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/50 dark:text-red-50"
          >
            <p className="font-medium">Database connection failed</p>
            <p className="mt-2 whitespace-pre-wrap">{dbError}</p>
          </div>
        ) : campaignName ? (
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Campaign: {campaignName}
          </p>
        ) : (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
            No campaign found. Run{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              npm run db:migrate
            </code>{" "}
            then{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              npm run db:seed
            </code>{" "}
            (see README).
          </p>
        )}
      </div>

      {errMsg ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
        >
          {errMsg}
        </div>
      ) : null}

      <FilterTabs active={active} />
      <StreetTable rows={filtered} />

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Reserve a whole street, flyering it, then mark it done. Volunteers need an
        account from the{" "}
        <Link href="/coordinator/login" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          coordinator
        </Link>{" "}
        before they can log in; coordinators manage streets and volunteers there.
      </p>
    </div>
  );
}
