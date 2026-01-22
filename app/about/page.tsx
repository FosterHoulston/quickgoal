import { AppShell } from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <section className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
          Quickgoal
        </div>
        <h1 className="mt-2 font-[var(--font-fraunces)] text-3xl">
          About
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#6b6b6b]">
          Quickgoal is a calm workspace for capturing goals the moment they start.
          The dashboard keeps the focus on clarity, timing, and outcomes without
          extra noise.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Why it works
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[#6b6b6b]">
            <li>Timestamp goals right when you commit.</li>
            <li>Track pass/fail outcomes without extra steps.</li>
            <li>Use end dates to stay time-aware.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
            Built for focus
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            The visual system stays lightweight and neutral so the goals stay the
            center of attention.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#e6e0d8] p-4 text-xs text-[#6b6b6b]">
            More story and changelog coming soon.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
