import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
              Preferences
            </div>
            <h1 className="font-[var(--font-fraunces)] text-3xl">Settings</h1>
          </div>
          <div />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Account
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Manage your profile, authentication, and sign-in methods.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#e6e0d8] p-4 text-xs text-[#6b6b6b]">
            Account settings are coming soon.
          </div>
        </div>
        <div className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Notifications
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Choose how you want to be reminded about goals.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#e6e0d8] p-4 text-xs text-[#6b6b6b]">
            Notification preferences are coming soon.
          </div>
        </div>
        <div className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Data
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Export or clean up goal history when needed.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#e6e0d8] p-4 text-xs text-[#6b6b6b]">
            Data tools are coming soon.
          </div>
        </div>
        <div className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Appearance
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Fine-tune the dashboard look and density.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#e6e0d8] p-4 text-xs text-[#6b6b6b]">
            Appearance controls are coming soon.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
