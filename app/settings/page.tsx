"use client";

import { AppShell } from "@/components/AppShell";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">Settings</h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Settings will live here. Future options can include account,
              notification, data, and appearance preferences.
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-text)]">Dark Mode</div>
                <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Toggle the app appearance.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
                  isDark
                    ? "bg-[color:var(--color-accent)] border-[color:var(--color-accent)]"
                    : "bg-[color:var(--color-surface-subtle)] border-[color:var(--color-border)]"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow transition ${
                    isDark ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
