"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/items", label: "Items" },
];

export function AppNav({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin" }]
    : LINKS;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
        <Link
          href="/dashboard"
          className="mr-4 flex items-center gap-2 text-[15px] font-bold tracking-tight"
        >
          <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
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
                  "rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-secondary font-semibold text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/profile"
            title={email}
            className={cn(
              "hidden max-w-[12rem] truncate rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-block",
              (pathname === "/profile" || pathname.startsWith("/profile/")) &&
                "bg-secondary font-semibold text-foreground",
            )}
          >
            {name}
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
