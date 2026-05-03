import Link from "next/link";
import { login } from "@/lib/auth-actions";
import { decodeQueryError, firstQueryValue } from "@/lib/search-params";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const errRaw = decodeQueryError(sp.error);
  const err =
    errRaw === "notfound"
      ? "That username was not found. Register first."
      : errRaw;
  const nextRaw = firstQueryValue(sp.next);
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {err}
        </p>
      ) : null}
      <form action={login} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-amber-600 py-2 font-medium text-white hover:bg-amber-700"
        >
          Continue
        </button>
      </form>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No password — this is a lightweight volunteer board.{" "}
        <Link href="/register" className="underline">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
