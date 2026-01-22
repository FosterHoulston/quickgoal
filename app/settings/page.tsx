import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="flex flex-1 flex-col rounded-3xl border border-[#e6e0d8] bg-white/90 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
          Preferences
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Settings</h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Settings will live here. Future options can include account, notification,
          data, and appearance preferences.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-[#e6e0d8] p-4 text-xs text-[#6b6b6b]">
          Settings controls are coming soon.
        </div>
      </section>
    </AppShell>
  );
}
