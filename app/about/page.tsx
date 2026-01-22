import { AppShell } from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <section className="flex flex-1 flex-col rounded-3xl border border-[#e6e0d8] bg-white/90 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
          About
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">
          A calm space to capture and finish what matters.
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Quickgoal helps you record short and long-term goals quickly, timestamp
          the moment you start, and track outcomes over time. It’s intentionally
          minimal so the focus stays on momentum, not managing the tool.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-[#6b6b6b]">
          <li>• Fast entry with instant timestamping</li>
          <li>• End dates for time‑boxed goals</li>
          <li>• Outcome tracking with visual progress</li>
        </ul>
      </section>
    </AppShell>
  );
}
