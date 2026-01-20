"use client";

import { useMemo, useState } from "react";

type Goal = {
  id: string;
  title: string;
  term: "short" | "long";
  createdAt: string;
  durationMinutes?: number;
  endAt?: string;
  categories: string[];
};

const CATEGORY_OPTIONS = [
  "Health",
  "Career",
  "Learning",
  "Finance",
  "Relationships",
  "Mindset",
  "Creative",
];

const formatTimestamp = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState<"short" | "long">("short");
  const [draftStartedAt, setDraftStartedAt] = useState<Date | null>(null);
  const [hasDuration, setHasDuration] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [hasEndAt, setHasEndAt] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const canSave = title.trim().length > 0;

  const handleTitleChange = (value: string) => {
    if (!draftStartedAt && value.trim().length > 0) {
      setDraftStartedAt(new Date());
    }
    setTitle(value);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const resetForm = () => {
    setTitle("");
    setTerm("short");
    setDraftStartedAt(null);
    setHasDuration(false);
    setDurationMinutes("");
    setHasEndAt(false);
    setEndAt("");
    setSelectedCategories([]);
  };

  const handleSave = () => {
    if (!canSave) return;
    const createdAt = (draftStartedAt ?? new Date()).toISOString();
    const newGoal: Goal = {
      id: `${Date.now()}`,
      title: title.trim(),
      term,
      createdAt,
      durationMinutes: hasDuration ? Number(durationMinutes || 0) : undefined,
      endAt: hasEndAt && endAt ? new Date(endAt).toISOString() : undefined,
      categories: selectedCategories,
    };

    setGoals((current) => [newGoal, ...current]);
    resetForm();
  };

  const orderedGoals = useMemo(() => goals, [goals]);

  return (
    <div className="min-h-screen px-6 py-12 text-[15px] text-[#1a1a1a]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-[#6b6b6b]">
            <span className="rounded-full border border-[#e6e0d8] px-3 py-1">
              Quickgoal
            </span>
            <span>Capture the moment, build momentum.</span>
          </div>
          <h1 className="max-w-3xl font-[var(--font-fraunces)] text-4xl leading-tight text-[#1a1a1a] md:text-5xl">
            A calm space for short and long-term goals — with timestamps that
            start the instant you begin.
          </h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[#e6e0d8] bg-white/80 p-6 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.4)] backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New goal</h2>
              {draftStartedAt ? (
                <span className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                  Started {formatTimestamp(draftStartedAt)}
                </span>
              ) : (
                <span className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                  Start typing to timestamp
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3a3a3a]">
                  Goal
                </span>
                <input
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Write a clear, short goal..."
                  className="w-full rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-[#2f6f6a]"
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[#3a3a3a]">
                  Term
                </span>
                <div className="flex gap-3">
                  {(["short", "long"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTerm(value)}
                      aria-pressed={term === value}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        term === value
                          ? "border-[#2f6f6a] bg-[#2f6f6a] text-white"
                          : "border-[#e6e0d8] bg-white text-[#3a3a3a] hover:border-[#2f6f6a]"
                      }`}
                    >
                      {value === "short" ? "Short term" : "Long term"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setHasDuration((value) => !value)}
                    aria-pressed={hasDuration}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      hasDuration
                        ? "border-[#2f6f6a] bg-[#e7f1ef] text-[#2f6f6a]"
                        : "border-[#e6e0d8] bg-white text-[#3a3a3a]"
                    }`}
                  >
                    <span>Duration</span>
                    <span className="text-xs uppercase tracking-[0.2em]">
                      {hasDuration ? "On" : "Off"}
                    </span>
                  </button>
                  {hasDuration ? (
                    <input
                      type="number"
                      min="0"
                      value={durationMinutes}
                      onChange={(event) => setDurationMinutes(event.target.value)}
                      placeholder="Minutes"
                      className="rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2f6f6a]"
                    />
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setHasEndAt((value) => !value)}
                    aria-pressed={hasEndAt}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      hasEndAt
                        ? "border-[#2f6f6a] bg-[#e7f1ef] text-[#2f6f6a]"
                        : "border-[#e6e0d8] bg-white text-[#3a3a3a]"
                    }`}
                  >
                    <span>End date/time</span>
                    <span className="text-xs uppercase tracking-[0.2em]">
                      {hasEndAt ? "On" : "Off"}
                    </span>
                  </button>
                  {hasEndAt ? (
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={(event) => setEndAt(event.target.value)}
                      className="rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2f6f6a]"
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[#3a3a3a]">
                  Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        aria-pressed={selected}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                          selected
                            ? "border-[#2f6f6a] bg-[#2f6f6a] text-white"
                            : "border-[#e6e0d8] bg-white text-[#3a3a3a] hover:border-[#2f6f6a]"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f6f6a] disabled:cursor-not-allowed disabled:bg-[#b7b1a9]"
                >
                  Save goal
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#e6e0d8] px-5 py-3 text-sm font-medium text-[#3a3a3a] transition hover:border-[#2f6f6a]"
                >
                  Clear
                </button>
                <span className="text-xs text-[#6b6b6b]">
                  Goals are timestamped on first input.
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e6e0d8] bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent goals</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                {orderedGoals.length} total
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-4">
              {orderedGoals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e6e0d8] p-6 text-sm text-[#6b6b6b]">
                  No goals yet. Add one on the left to see it here.
                </div>
              ) : (
                orderedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-[#e6e0d8] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">{goal.title}</h3>
                      <span className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                        {goal.term} term
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[#6b6b6b]">
                      Started {formatTimestamp(goal.createdAt)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {goal.durationMinutes ? (
                        <span className="rounded-full border border-[#e6e0d8] px-3 py-1">
                          {goal.durationMinutes} min
                        </span>
                      ) : null}
                      {goal.endAt ? (
                        <span className="rounded-full border border-[#e6e0d8] px-3 py-1">
                          Ends {formatTimestamp(goal.endAt)}
                        </span>
                      ) : null}
                      {goal.categories.map((category) => (
                        <span
                          key={`${goal.id}-${category}`}
                          className="rounded-full bg-[#f1f0ec] px-3 py-1 uppercase tracking-[0.14em] text-[#3a3a3a]"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
