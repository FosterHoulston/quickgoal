"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Goal = {
  id: string;
  title: string;
  term: "short" | "long";
  createdAt: string;
  endAt?: string;
  outcome?: "passed" | "failed";
  categoryIds?: string[];
  categories: string[];
};

type Category = {
  id: string;
  name: string;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "health", name: "Health" },
  { id: "career", name: "Career" },
  { id: "learning", name: "Learning" },
  { id: "finance", name: "Finance" },
  { id: "relationships", name: "Relationships" },
  { id: "mindset", name: "Mindset" },
  { id: "creative", name: "Creative" },
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

const toLocalInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const hasEnded = (endAt?: string, now = Date.now()) => {
  if (!endAt) return false;
  const endTime = new Date(endAt).getTime();
  if (Number.isNaN(endTime)) return false;
  return now >= endTime;
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [categoriesFromDb, setCategoriesFromDb] = useState(false);
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState<"short" | "long">("short");
  const [draftStartedAt, setDraftStartedAt] = useState<Date | null>(null);
  const [hasEndAt, setHasEndAt] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTerm, setEditTerm] = useState<"short" | "long">("short");
  const [editHasEndAt, setEditHasEndAt] = useState(false);
  const [editEndAt, setEditEndAt] = useState("");
  const [editSelectedCategories, setEditSelectedCategories] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editDeleting, setEditDeleting] = useState(false);
  const [clockTick, setClockTick] = useState(Date.now());

  const isAuthed = !!session;
  const canSave = title.trim().length > 0 && isAuthed;

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setCategories(DEFAULT_CATEGORIES);
      setCategoriesFromDb(false);
      return;
    }

    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error || !data) {
        setCategories(DEFAULT_CATEGORIES);
        setCategoriesFromDb(false);
        return;
      }
      setCategories(data);
      setCategoriesFromDb(true);
    };

    loadCategories();
  }, [session]);

  useEffect(() => {
    if (!supabase || !session) {
      setGoals([]);
      return;
    }

    const loadGoals = async () => {
      setGoalsLoading(true);
      setGoalsError(null);
      const { data, error } = await supabase
        .from("goals")
        .select(
          "id, title, term, outcome, created_at, end_at, goal_categories(category_id, categories(name))",
        )
        .order("created_at", { ascending: false });
      if (error || !data) {
        setGoalsError(error?.message ?? "Unable to load goals.");
        setGoalsLoading(false);
        return;
      }
      const mapped: Goal[] = data.map((goal) => ({
        id: goal.id,
        title: goal.title,
        term: goal.term,
        outcome: goal.outcome ?? undefined,
        createdAt: goal.created_at,
        endAt: goal.end_at ?? undefined,
        categoryIds: goal.goal_categories?.map((item) => item.category_id).filter(Boolean) ?? [],
        categories:
          goal.goal_categories?.map((item) => item.categories?.name).filter(Boolean) ??
          [],
      }));
      setGoals(mapped);
      setGoalsLoading(false);
    };

    loadGoals();
  }, [session]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleTitleChange = (value: string) => {
    if (!draftStartedAt && value.trim().length > 0) {
      setDraftStartedAt(new Date());
    }
    setTitle(value);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  };

  const resetForm = () => {
    setTitle("");
    setTerm("short");
    setDraftStartedAt(null);
    setHasEndAt(false);
    setEndAt("");
    setSelectedCategories([]);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setGoalsError(null);
    setSaveNotice(null);
    const createdAt = (draftStartedAt ?? new Date()).toISOString();
    if (!supabase || !session) {
      setGoalsError("Sign in to save goals.");
      return;
    }

    const endAtValue = hasEndAt && endAt ? new Date(endAt).toISOString() : null;
    const { data: savedGoal, error } = await supabase
      .from("goals")
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        term,
        created_at: createdAt,
        end_at: endAtValue,
      })
      .select("id, title, term, outcome, created_at, end_at")
      .single();

    if (error || !savedGoal) {
      setGoalsError(error?.message ?? "Unable to save goal.");
      return;
    }

    if (categoriesFromDb && selectedCategories.length > 0) {
      const { error: categoryError } = await supabase
        .from("goal_categories")
        .insert(
          selectedCategories.map((categoryId) => ({
            goal_id: savedGoal.id,
            category_id: categoryId,
          })),
        );
      if (categoryError) {
        setGoalsError(categoryError.message);
      }
    }

    const categoryNames = categories
      .filter((category) => selectedCategories.includes(category.id))
      .map((category) => category.name);

    const newGoal: Goal = {
      id: savedGoal.id,
      title: savedGoal.title,
      term: savedGoal.term,
      createdAt: savedGoal.created_at,
      endAt: savedGoal.end_at ?? undefined,
      categories: categoryNames,
    };

    setGoals((current) => [newGoal, ...current]);
    resetForm();
    setSaveNotice("Goal saved.");
  };

  const orderedGoals = useMemo(() => goals, [goals]);

  const handleOutcome = async (goalId: string, nextOutcome: "passed" | "failed") => {
    setGoalsError(null);
    if (!supabase || !session) {
      setGoalsError("Sign in to update goals.");
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({ outcome: nextOutcome })
      .eq("id", goalId);

    if (error) {
      setGoalsError(error.message);
      return;
    }

    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId ? { ...goal, outcome: nextOutcome } : goal,
      ),
    );
  };

  const openEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setEditTitle(goal.title);
    setEditTerm(goal.term);
    setEditHasEndAt(!!goal.endAt);
    setEditEndAt(toLocalInputValue(goal.endAt));
    if (goal.categoryIds && goal.categoryIds.length > 0) {
      setEditSelectedCategories(goal.categoryIds);
    } else if (categoriesFromDb && goal.categories.length > 0) {
      const ids = categories
        .filter((category) => goal.categories.includes(category.name))
        .map((category) => category.id);
      setEditSelectedCategories(ids);
    } else {
      setEditSelectedCategories([]);
    }
  };

  const closeEditGoal = () => {
    if (editSaving || editDeleting) return;
    setEditGoal(null);
    setEditTitle("");
    setEditTerm("short");
    setEditHasEndAt(false);
    setEditEndAt("");
    setEditSelectedCategories([]);
  };

  const toggleEditCategory = (categoryId: string) => {
    setEditSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  };

  const handleUpdateGoal = async () => {
    if (!editGoal || !supabase || !session) return;
    setEditSaving(true);
    setGoalsError(null);

    const endAtValue = editHasEndAt && editEndAt ? new Date(editEndAt).toISOString() : null;

    const { error } = await supabase
      .from("goals")
      .update({
        title: editTitle.trim(),
        term: editTerm,
        end_at: endAtValue,
      })
      .eq("id", editGoal.id);

    if (error) {
      setGoalsError(error.message);
      setEditSaving(false);
      return;
    }

    if (categoriesFromDb) {
      const { error: deleteError } = await supabase
        .from("goal_categories")
        .delete()
        .eq("goal_id", editGoal.id);
      if (deleteError) {
        setGoalsError(deleteError.message);
        setEditSaving(false);
        return;
      }

      if (editSelectedCategories.length > 0) {
        const { error: insertError } = await supabase
          .from("goal_categories")
          .insert(
            editSelectedCategories.map((categoryId) => ({
              goal_id: editGoal.id,
              category_id: categoryId,
            })),
          );
        if (insertError) {
          setGoalsError(insertError.message);
          setEditSaving(false);
          return;
        }
      }
    }

    const updatedCategoryNames = categories
      .filter((category) => editSelectedCategories.includes(category.id))
      .map((category) => category.name);

    setGoals((current) =>
      current.map((goal) =>
        goal.id === editGoal.id
          ? {
              ...goal,
              title: editTitle.trim(),
              term: editTerm,
              endAt: endAtValue ?? undefined,
              categories: updatedCategoryNames,
              categoryIds: editSelectedCategories,
            }
          : goal,
      ),
    );

    setEditSaving(false);
    closeEditGoal();
  };

  const handleDeleteGoal = async () => {
    if (!editGoal || !supabase || !session) return;
    if (!window.confirm("Delete this goal? This cannot be undone.")) {
      return;
    }
    setEditDeleting(true);
    setGoalsError(null);
    const { error } = await supabase.from("goals").delete().eq("id", editGoal.id);
    if (error) {
      setGoalsError(error.message);
      setEditDeleting(false);
      return;
    }
    setGoals((current) => current.filter((goal) => goal.id !== editGoal.id));
    setEditDeleting(false);
    closeEditGoal();
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError("Missing Supabase environment variables.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleEmailSignIn = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError("Missing Supabase environment variables.");
      return;
    }
    if (!email.trim()) {
      setAuthError("Enter an email address to continue.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthNotice("Check your email for a sign-in link.");
    setEmail("");
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
  };

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
          <section className="rounded-3xl border border-[#e6e0d8] bg-white/90 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                {session ? "Active" : "Required"}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-4 text-sm text-[#3a3a3a]">
              {!authReady ? (
                <span className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                  Checking session...
                </span>
              ) : session ? (
                <div className="flex flex-col gap-3">
                  <span className="text-sm">
                    Signed in as <strong>{session.user.email}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-full border border-[#e6e0d8] px-5 py-3 text-sm font-medium text-[#3a3a3a] transition hover:border-[#2f6f6a]"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f6f6a]"
                  >
                    Continue with Google
                  </button>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2f6f6a]"
                    />
                    <button
                      type="button"
                      onClick={handleEmailSignIn}
                      className="rounded-full border border-[#e6e0d8] px-5 py-3 text-sm font-medium text-[#3a3a3a] transition hover:border-[#2f6f6a]"
                    >
                      Email me a sign-in link
                    </button>
                  </div>
                </>
              )}
              {authError ? (
                <span className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {authError}
                </span>
              ) : null}
              {authNotice ? (
                <span className="rounded-2xl border border-[#e6e0d8] bg-white px-4 py-2 text-xs text-[#6b6b6b]">
                  {authNotice}
                </span>
              ) : null}
              {!supabase ? (
                <span className="text-xs text-[#6b6b6b]">
                  Add your Supabase env vars to enable auth.
                </span>
              ) : null}
            </div>
          </section>

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
                  disabled={!isAuthed}
                  className="w-full rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-[#2f6f6a] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
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
                      disabled={!isAuthed}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        term === value
                          ? "border-[#2f6f6a] bg-[#2f6f6a] text-white"
                          : "border-[#e6e0d8] bg-white text-[#3a3a3a] hover:border-[#2f6f6a]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {value === "short" ? "Short term" : "Long term"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setHasEndAt((value) => !value)}
                    aria-pressed={hasEndAt}
                    disabled={!isAuthed}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      hasEndAt
                        ? "border-[#2f6f6a] bg-[#e7f1ef] text-[#2f6f6a]"
                        : "border-[#e6e0d8] bg-white text-[#3a3a3a]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
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
                      disabled={!isAuthed}
                      className="rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2f6f6a] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
                    />
                  ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[#3a3a3a]">
                  Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        aria-pressed={selected}
                        disabled={!isAuthed}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                          selected
                            ? "border-[#2f6f6a] bg-[#2f6f6a] text-white"
                            : "border-[#e6e0d8] bg-white text-[#3a3a3a] hover:border-[#2f6f6a]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {category.name}
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
                  {session
                    ? "Goals are timestamped on first input."
                    : "Sign in to save goals."}
                </span>
                {saveNotice ? (
                  <span className="text-xs text-[#2f6f6a]">{saveNotice}</span>
                ) : null}
                {goalsError ? (
                  <span className="text-xs text-red-600">{goalsError}</span>
                ) : null}
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
              {goalsLoading ? (
                <div className="rounded-2xl border border-dashed border-[#e6e0d8] p-6 text-sm text-[#6b6b6b]">
                  Loading goals...
                </div>
              ) : orderedGoals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e6e0d8] p-6 text-sm text-[#6b6b6b]">
                  {session
                    ? "No goals yet. Add one on the left to see it here."
                    : "Sign in to view your goals."}
                </div>
              ) : (
                orderedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    role="button"
                    tabIndex={isAuthed ? 0 : -1}
                    onClick={() => {
                      if (!isAuthed) return;
                      openEditGoal(goal);
                    }}
                    onKeyDown={(event) => {
                      if (!isAuthed) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEditGoal(goal);
                      }
                    }}
                    aria-disabled={!isAuthed}
                    className="text-left rounded-2xl border border-[#e6e0d8] bg-white p-4 shadow-sm transition hover:border-[#2f6f6a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6f6a] disabled:cursor-not-allowed disabled:opacity-70"
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
                    {!goal.outcome ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="text-[#6b6b6b]">Mark outcome:</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOutcome(goal.id, "passed");
                          }}
                          disabled={!isAuthed}
                          className="rounded-full border border-[#2f6f6a] bg-[#e7f1ef] px-3 py-1 uppercase tracking-[0.14em] text-[#2f6f6a] transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOutcome(goal.id, "failed");
                          }}
                          disabled={!isAuthed}
                          className="rounded-full border border-[#8b4a3a] bg-[#f3e6e2] px-3 py-1 uppercase tracking-[0.14em] text-[#8b4a3a] transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Failed
                        </button>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {goal.outcome ? (
                        <span
                          className={`rounded-full border px-3 py-1 uppercase tracking-[0.14em] ${
                            goal.outcome === "passed"
                              ? "border-[#2f6f6a] bg-[#e7f1ef] text-[#2f6f6a]"
                              : "border-[#8b4a3a] bg-[#f3e6e2] text-[#8b4a3a]"
                          }`}
                        >
                          {goal.outcome === "passed" ? "Passed" : "Failed"}
                        </span>
                      ) : null}
                      {goal.endAt ? (
                        <span
                          className={`rounded-full border px-3 py-1 ${
                            hasEnded(goal.endAt, clockTick)
                              ? "border-[#1a1a1a] bg-[#1a1a1a] uppercase tracking-[0.14em] text-white"
                              : "border-[#e6e0d8]"
                          }`}
                        >
                          {hasEnded(goal.endAt, clockTick)
                            ? `Ended ${formatTimestamp(goal.endAt)}`
                            : `Ends ${formatTimestamp(goal.endAt)}`}
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

      {editGoal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-3xl border border-[#e6e0d8] bg-white p-6 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.7)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Edit goal</h3>
                <p className="text-xs text-[#6b6b6b]">
                  Started {formatTimestamp(editGoal.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditGoal}
                className="rounded-full border border-[#e6e0d8] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6b6b6b]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3a3a3a]">Goal</span>
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="Update your goal..."
                  className="w-full rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-[#2f6f6a]"
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[#3a3a3a]">Term</span>
                <div className="flex gap-3">
                  {(["short", "long"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditTerm(value)}
                      aria-pressed={editTerm === value}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        editTerm === value
                          ? "border-[#2f6f6a] bg-[#2f6f6a] text-white"
                          : "border-[#e6e0d8] bg-white text-[#3a3a3a] hover:border-[#2f6f6a]"
                      }`}
                    >
                      {value === "short" ? "Short term" : "Long term"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setEditHasEndAt((value) => !value)}
                    aria-pressed={editHasEndAt}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      editHasEndAt
                        ? "border-[#2f6f6a] bg-[#e7f1ef] text-[#2f6f6a]"
                        : "border-[#e6e0d8] bg-white text-[#3a3a3a]"
                    }`}
                  >
                    <span>End date/time</span>
                    <span className="text-xs uppercase tracking-[0.2em]">
                      {editHasEndAt ? "On" : "Off"}
                    </span>
                  </button>
                  {editHasEndAt ? (
                    <input
                      type="datetime-local"
                      value={editEndAt}
                      onChange={(event) => setEditEndAt(event.target.value)}
                      className="rounded-2xl border border-[#e6e0d8] bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2f6f6a]"
                    />
                  ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[#3a3a3a]">
                  Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = editSelectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleEditCategory(category.id)}
                        aria-pressed={selected}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                          selected
                            ? "border-[#2f6f6a] bg-[#2f6f6a] text-white"
                            : "border-[#e6e0d8] bg-white text-[#3a3a3a] hover:border-[#2f6f6a]"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUpdateGoal}
                  disabled={editSaving || editTitle.trim().length === 0}
                  className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f6f6a] disabled:cursor-not-allowed disabled:bg-[#b7b1a9]"
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={closeEditGoal}
                  disabled={editSaving || editDeleting}
                  className="rounded-full border border-[#e6e0d8] px-5 py-3 text-sm font-medium text-[#3a3a3a] transition hover:border-[#2f6f6a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
              <button
                type="button"
                onClick={handleDeleteGoal}
                disabled={editDeleting}
                className="rounded-full border border-[#e6e0d8] px-5 py-3 text-sm font-medium text-[#8b4a3a] transition hover:border-[#8b4a3a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editDeleting ? "Deleting..." : "Delete goal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
