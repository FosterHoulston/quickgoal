"use client";

import { AppShell } from "@/components/AppShell";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e6e0d8] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">Settings</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">
              Settings will live here. Future options can include account,
              notification, data, and appearance preferences.
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="rounded-2xl border border-[#e6e0d8] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#1a1a1a]">Dark Mode</div>
                <p className="mt-1 text-xs text-[#6b6b6b]">
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
                    ? "bg-[#2f6f6a] border-[#2f6f6a] dark:border-[#2f6f6a]"
                    : "bg-[#f1f0ec] border-[#e6e0d8] dark:bg-[#1c2027] dark:border-[#2f6f6a]/60"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full border border-[#e6e0d8] bg-white shadow transition ${
                    isDark ? "translate-x-7" : "translate-x-1"
                  } dark:border-[#2a2f39]`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
