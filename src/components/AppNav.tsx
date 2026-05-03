import Link from "next/link";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { COORDINATOR_COOKIE } from "@/lib/constants";
import { verifyCoordinatorToken } from "@/lib/coordinator-token";
import { logout } from "@/lib/auth-actions";

export async function AppNav() {
  const session = await getSessionUser();
  const jar = await cookies();
  const coordOk = await verifyCoordinatorToken(
    jar.get(COORDINATOR_COOKIE)?.value,
  );

  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Flyer Leuven
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Streets
          </Link>
          {session ? (
            <>
              <Link
                href="/me"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                My streets
              </Link>
              <span className="text-zinc-500 dark:text-zinc-500">
                {session.username}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
              >
                Register
              </Link>
            </>
          )}
          {coordOk ? (
            <Link
              href="/coordinator"
              className="text-amber-800 hover:underline dark:text-amber-400"
            >
              Coordinator
            </Link>
          ) : (
            <Link
              href="/coordinator/login"
              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Coordinator
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
