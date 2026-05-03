import Link from "next/link";
import { register } from "@/lib/auth-actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const err = sp.error
    ? decodeURIComponent(sp.error)
    : null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Register</h1>
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {err === "taken"
            ? "That username is already taken. Pick another or log in."
            : err}
        </p>
      ) : null}
      <form action={register} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            minLength={2}
            maxLength={64}
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Lowercase letters, digits, hyphen, underscore. 2–64 characters.
          </p>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-amber-600 py-2 font-medium text-white hover:bg-amber-700"
        >
          Start
        </button>
      </form>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Already have a name?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}
