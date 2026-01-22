"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, LayoutDashboard, Settings, Tag, User } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  sessionEmail?: string;
  onSignOut?: () => void;
  embedded?: boolean;
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Tags", icon: Tag, href: "/tags" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "About", icon: Info, href: "/about" },
];

export function AppShell({
  children,
  sessionEmail,
  onSignOut,
  embedded = false,
}: AppShellProps) {
  const pathname = usePathname();

  const content = (
    <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[88px_1fr]">
      <aside className="flex flex-col items-center gap-4 rounded-3xl border border-[#e6e0d8] bg-white/90 px-3 py-4 text-[#3a3a3a]">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl">
          <img
            src="/quickgoal-icon-transparent-bg.png"
            alt="Quickgoal"
            className="h-11 w-11 object-contain"
          />
        </div>
            <div className="mt-2 flex flex-col gap-3 text-[11px] uppercase tracking-[0.24em] text-[#6b6b6b]">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.href ? pathname === item.href : false;
                const className = `flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  active
                    ? "bg-[#e7f1ef] text-[#2f6f6a]"
                    : "text-[#6b6b6b] hover:bg-[#f1f0ec]"
                }`;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={className}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className={className}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <div className="mt-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6b6b6b] transition hover:bg-[#f1f0ec]"
                    aria-label="Profile"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
            <PopoverContent
              className="w-56 rounded-2xl border border-[#e6e0d8] bg-white p-4 text-xs text-[#3a3a3a]"
              align="start"
              side="right"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b]">
                Profile
              </div>
              <div className="mt-2 text-sm font-semibold">
                {sessionEmail ?? "Not signed in"}
              </div>
              <div className="mt-1 text-xs text-[#6b6b6b]">
                {sessionEmail ? "Signed in" : "Sign in to manage account"}
              </div>
              {onSignOut ? (
                <Button
                  type="button"
                  onClick={onSignOut}
                  variant="outline"
                  className="mt-4 w-full rounded-full border-[#1a1a1a] text-xs uppercase tracking-[0.18em] text-[#1a1a1a]"
                >
                  Sign out
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col gap-4">{children}</div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="h-screen overflow-hidden px-6 py-8 text-[15px] text-[#1a1a1a]">
      <main className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5">
        {content}
      </main>
    </div>
  );
}
