"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, LayoutDashboard, Settings, Tag, User } from "lucide-react";
import QuickgoalIcon from "@/app/quickgoal-icon";

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
  const router = useRouter();

  useEffect(() => {
    if (embedded) return;

    const shouldIgnore = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (target.isContentEditable) return true;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (shouldIgnore(event.target)) return;

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        router.push("/tags?create=1");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [embedded, router]);

  const content = (
    <div className="flex min-h-0 flex-1 overflow-visible border border-[color:var(--color-border)] bg-[color:rgba(var(--color-surface-rgb),0.9)]">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[88px_1fr]">
        <aside className="flex flex-col items-center gap-4 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-4 text-[color:var(--color-text-subtle)]">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            aria-label="Dashboard"
          >
            <QuickgoalIcon size={44} />
          </Link>
          <div className="mt-2 flex flex-col gap-3 text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-text-muted)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.href ? pathname === item.href : false;
              const className = `flex h-10 w-10 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                  : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-subtle)]"
              }`;

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={className}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
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
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          <div className="mt-auto">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--color-text-muted)] transition hover:bg-[color:var(--color-surface-subtle)]"
                  aria-label="Profile"
                >
                  <User className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-xs text-[color:var(--color-text-subtle)]"
                align="start"
                side="right"
              >
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  Profile
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {sessionEmail ?? "Not signed in"}
                </div>
                <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {sessionEmail ? "Signed in" : "Sign in to manage account"}
                </div>
                {onSignOut ? (
                  <Button
                    type="button"
                    onClick={onSignOut}
                    variant="outline"
                    className="mt-4 w-full rounded-full border-[color:var(--color-ink)] text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]"
                  >
                    Sign out
                  </Button>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col gap-4 px-6 py-5">{children}</div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="h-screen overflow-hidden text-[15px] text-[color:var(--color-text)]">
      <main className="mx-auto flex h-full w-full max-w-none flex-col">
        {content}
      </main>
    </div>
  );
}
