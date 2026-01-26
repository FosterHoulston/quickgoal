"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { useUserSettings } from "@/components/UserSettingsProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GitBranch, Github, Info, LayoutDashboard, Settings, Tag, User } from "lucide-react";
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

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "v1.0.0";
const APP_REPO_URL = process.env.NEXT_PUBLIC_APP_REPO_URL ?? "";
const RELEASE_NOTES = [
  {
    version: "v1.0.0",
    date: "Jan 26, 2026",
    sections: [
      {
        title: "Features",
        items: [
          "Google sign-in with Supabase authentication.",
          "Instant goal timestamps on first keystroke.",
          "Optional end date toggle with datetime input.",
          "Tag (category) multi-select and tags management.",
          "Save goals to Supabase with recent-first sorting.",
          "Editable goals with delete support.",
          "Pass/fail outcomes with heatmap progress view.",
          "Keyboard shortcuts for creating goals and tags.",
        ],
      },
    ],
  },
];

export function AppShell({
  children,
  sessionEmail,
  onSignOut,
  embedded = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { adsEnabled, settingsLoaded } = useUserSettings();
  const hasAdSense =
    !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT && !!process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);

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
            onClick={(event) => {
              event.preventDefault();
              window.location.assign("/");
            }}
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
                    title={item.label}
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
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setReleaseNotesOpen(true)}
              className="flex cursor-pointer flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-text)]"
              aria-label="Release notes"
            >
              <GitBranch className="h-4 w-4" />
              <span>{APP_VERSION}</span>
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[color:var(--color-text-muted)] transition hover:bg-[color:var(--color-surface-subtle)]"
                  aria-label="Profile"
                  title="Profile"
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
                    className="mt-4 w-full cursor-pointer rounded-full border-[color:var(--color-ink)] text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink)]"
                  >
                    Sign out
                  </Button>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col gap-4 px-6 py-5">
          {children}
          {settingsLoaded && adsEnabled && hasAdSense ? (
            <div className="mt-auto rounded-2xl border border-[#e6e0d8] bg-white/70 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#6b6b6b]">
                Sponsored
              </div>
              <AdSenseSlot className="mt-3" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#6b6b6b]">
                Ads may be hidden by blockers.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <div className="h-screen overflow-hidden text-[15px] text-[color:var(--color-text)]">
        <main className="mx-auto flex h-full w-full max-w-none flex-col">
          {content}
        </main>
      </div>
      <Dialog open={releaseNotesOpen} onOpenChange={setReleaseNotesOpen}>
        <DialogContent
          showCloseButton={false}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setReleaseNotesOpen(false);
            }
          }}
          className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !p-0 !w-screen !max-w-none !h-screen !rounded-none !border-0 !bg-transparent !shadow-none flex items-center justify-center"
        >
          <DialogTitle asChild>
            <VisuallyHidden>Release notes</VisuallyHidden>
          </DialogTitle>
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-modal)]">
            <div className="flex items-center justify-start">
              {APP_REPO_URL ? (
                <a
                  href={APP_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub repository"
                  className="inline-flex items-center gap-0.5 rounded-full text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-text)]"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full">
                    <Github className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em]">GitHub</span>
                </a>
              ) : null}
            </div>
            <div className="mt-3 space-y-6 text-sm text-[color:var(--color-text-muted)]">
              {RELEASE_NOTES.map((release) => (
                <section
                  key={release.version}
                  className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-2xl font-semibold text-[color:var(--color-text)]">
                      {release.version}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                      {release.date}
                    </div>
                  </div>
                  <div className="mt-3 space-y-4">
                    {release.sections.map((section) => (
                      <div key={`${release.version}-${section.title}`}>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                          {section.title}
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-[color:var(--color-text-subtle)]">
                          {section.items.map((item) => (
                            <li key={`${release.version}-${item}`} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
