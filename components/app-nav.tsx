"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/items", label: "Items" },
];

export function AppNav({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin" }]
    : LINKS;

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-4">
        <Link href="/dashboard" className="mr-4 text-sm font-semibold">
          Backlog
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
