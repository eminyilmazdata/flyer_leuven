import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COORDINATOR_COOKIE } from "@/lib/constants";
import { verifyCoordinatorToken } from "@/lib/coordinator-token";
import { coordinatorLogin } from "@/lib/coordinator-actions";

export default async function CoordinatorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const jar = await cookies();
  if (await verifyCoordinatorToken(jar.get(COORDINATOR_COOKIE)?.value)) {
    redirect("/coordinator");
  }
  const sp = await searchParams;
  const wrong = sp.error === "1";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Coordinator login</h1>
      {wrong ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          Wrong password.
        </p>
      ) : null}
      <form action={coordinatorLogin} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Coordinator password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Enter dashboard
        </button>
      </form>
    </div>
  );
}
