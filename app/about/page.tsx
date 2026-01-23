import { AppShell } from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e6e0d8] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">About</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">
              A calm space to capture and finish what matters.
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4 text-sm text-[#6b6b6b]">
            <p>
              Quickgoal was built as a daily reminder that discipline compounds.
              By setting small, time‑boxed goals and marking them complete, you
              create visible proof of progress — a steady signal that you can keep
              going and finish what you start.
            </p>
            <p>
              The app keeps the workflow lightweight: capture a goal, set a window
              if you need it, then close the loop with a pass or fail. Over time,
              the table and heatmap become a quiet form of affirmation and
              accountability.
            </p>
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold text-[#1a1a1a]">
              How to use
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#6b6b6b]">
              <li>• Create a short, clear goal as soon as you decide to do it.</li>
              <li>• Optionally add an end date to keep the goal time‑boxed.</li>
              <li>• Mark the outcome when you finish — pass or fail.</li>
              <li>• Review the table and heatmap to spot consistency over time.</li>
              <li>• Press “g” to open a new goal from the dashboard.</li>
              <li>• Press “t” to open a new tag from the tags page.</li>
            </ul>
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold text-[#1a1a1a]">
              Why it works
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#6b6b6b]">
              <li>• Fast entry with instant timestamping</li>
              <li>• End dates for time‑boxed goals</li>
              <li>• Outcome tracking with visual progress</li>
              <li>• Daily proof that discipline is a habit, not a mood</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
