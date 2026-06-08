"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { clearSession } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  key: string;
}

/** Per-role nav. Figma user sidebar has no History (still route-reachable). */
const NAV: Record<Role, NavItem[]> = {
  USER: [{ label: "Home", href: "/concerts", key: "home" }],
  ADMIN: [
    { label: "Home", href: "/admin", key: "home" },
    { label: "History", href: "/admin/reservations", key: "history" },
  ],
};

/**
 * App shell with the fixed 240px sidebar (DESIGN.md §App shell). Role title,
 * per-role nav with active highlight, a demo "Switch" link, and Logout pinned
 * to the bottom. Collapses to a top bar below `md`.
 */
export function AppShell({
  role,
  active,
  children,
}: {
  role: Role;
  active: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";
  const switchTo = isAdmin
    ? { label: "Switch to User", href: "/concerts" }
    : { label: "Switch to Admin", href: "/admin" };

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-neutral md:flex">
      <aside className="flex flex-col gap-1 border-b border-sidebar-border bg-surface px-4 py-5 md:h-screen md:w-[240px] md:shrink-0 md:border-b-0 md:border-r md:px-5 md:py-8">
        <div className="mb-2 flex items-center gap-3 px-3 md:mb-8">
          <span className="h-7 w-7 rounded-full bg-brand" aria-hidden />
          <span className="text-lg font-bold tracking-wide text-brand">
            {isAdmin ? "Admin" : "User"}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV[role].map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.key === active ? "page" : undefined}
              className={`rounded-sm px-3 py-2.5 text-base font-medium transition ${
                item.key === active
                  ? "bg-nav-active text-brand"
                  : "text-on-surface hover:bg-nav-active/60"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={switchTo.href}
            className="rounded-sm px-3 py-2.5 text-base font-medium text-muted transition hover:bg-nav-active/60"
          >
            {switchTo.label}
          </Link>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-sm px-3 py-2.5 text-left text-base font-medium text-muted transition hover:bg-nav-active/60"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 px-6 py-10 sm:px-10 md:px-12 md:py-14">
        <div className="mx-auto w-full max-w-[1120px]">{children}</div>
      </main>
    </div>
  );
}
