import Link from "next/link";
import { login } from "@/lib/auth-actions";
import { decodeQueryError, firstQueryValue } from "@/lib/search-params";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
    info?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const errRaw = decodeQueryError(sp.error);
  const err =
    errRaw === "notfound"
      ? "That username was not found."
      : errRaw === "auth"
        ? "Invalid username or password."
        : errRaw === "server"
          ? "Something went wrong while signing you in. Try again in a moment."
          : errRaw;
  const nextRaw = firstQueryValue(sp.next);
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "";
  const infoRaw = firstQueryValue(sp.info);
  const info =
    infoRaw === "coordinator_accounts"
      ? "Volunteer accounts are created by the coordinator. Use the username and password they gave you."
      : null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Volunteer log in</h1>
      {info ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
          {info}
        </p>
      ) : null}
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
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            minLength={8}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-amber-600 py-2 font-medium text-white hover:bg-amber-700"
        >
          Log in
        </button>
      </form>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Need an account? Ask your{" "}
        <Link href="/coordinator/login" className="underline">
          coordinator
        </Link>
        .
      </p>
    </div>
  );
}
