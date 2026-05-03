import Link from "next/link";

export type StreetFilter = "all" | "open" | "reserved" | "completed";

const tabs: { key: StreetFilter; href: string; label: string }[] = [
  { key: "all", href: "/", label: "All" },
  { key: "open", href: "/?filter=open", label: "Open" },
  { key: "reserved", href: "/?filter=reserved", label: "Reserved" },
  { key: "completed", href: "/?filter=completed", label: "Done" },
];

export function FilterTabs({ active }: { active: StreetFilter }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={
              isActive
                ? "rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
