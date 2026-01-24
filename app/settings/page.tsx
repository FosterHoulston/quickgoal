"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useUserSettings } from "@/components/UserSettingsProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { session } = useAuth();
  const { adsEnabled, settingsLoaded, setAdsEnabled } = useUserSettings();
  const [adsNotice, setAdsNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!adsNotice) return;
    const timeout = window.setTimeout(() => setAdsNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [adsNotice]);

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
          <div className="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-text)]">
                  Support with ads
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Show ads at the bottom of each page to support Quickgoal.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={adsEnabled}
                disabled={!session || !settingsLoaded}
                onClick={async () => {
                  const nextValue = !adsEnabled;
                  await setAdsEnabled(nextValue);
                  setAdsNotice(nextValue ? "Ads enabled." : "Ads disabled.");
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
                  adsEnabled
                    ? "bg-[color:var(--color-accent)] border-[color:var(--color-accent)]"
                    : "bg-[color:var(--color-surface-subtle)] border-[color:var(--color-border)]"
                } ${!session || !settingsLoaded ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow transition ${
                    adsEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {!session ? (
              <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
                Sign in to enable support ads.
              </p>
            ) : null}
            {adsNotice ? (
              <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
                {adsNotice}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
