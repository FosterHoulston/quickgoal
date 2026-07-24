"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { useGoalData } from "@/components/GoalDataProvider";
import { useToast } from "@/components/ToastProvider";
import { GoalHeatmap } from "@/components/goals/GoalHeatmap";
import { GoalTable } from "@/components/goals/GoalTable";
import { supabase } from "@/lib/supabaseClient";
import type { Goal } from "@/lib/types";
import {
  formatTimestamp,
  getDefaultEndAtValue,
  toLocalInputValue,
} from "@/lib/date";
import { buildDailyGrid } from "@/lib/heatmap";
import {
  createGoal,
  deleteGoal,
  fetchGoals,
  setGoalOutcome,
  updateGoal,
} from "@/lib/goals";
import { DEFAULT_CATEGORIES, fetchTagsForUser } from "@/lib/tags";

const getNow = () => Date.now();

export default function Home() {
  const { session, authReady } = useAuth();
  const { pushToast } = useToast();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const {
    categories,
    setCategories,
    categoriesLoaded,
    setCategoriesLoaded,
    categoriesFromDb,
    setCategoriesFromDb,
    categoriesUserId,
    setCategoriesUserId,
    goals,
    setGoals,
    goalsLoaded,
    setGoalsLoaded,
    goalsUserId,
    setGoalsUserId,
  } = useGoalData();
  const [title, setTitle] = useState("");
  const [draftStartedAt, setDraftStartedAt] = useState<Date | null>(null);
  const [hasEndAt, setHasEndAt] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [heatmapOpen, setHeatmapOpen] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(!goalsLoaded);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOutcome, setEditOutcome] = useState<"passed" | "failed" | null>(
    null,
  );
  const [editHasEndAt, setEditHasEndAt] = useState(false);
  const [editEndAt, setEditEndAt] = useState("");
  const [editSelectedCategories, setEditSelectedCategories] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editDeleting, setEditDeleting] = useState(false);
  const [clockTick, setClockTick] = useState(getNow);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const newGoalInputRef = useRef<HTMLInputElement | null>(null);
  const tagButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const saveGoalButtonRef = useRef<HTMLButtonElement | null>(null);
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);

  const isAuthed = !!session;
  const canSave = title.trim().length > 0 && isAuthed;

  useEffect(() => {
    if (!supabase) {
      setCategories(DEFAULT_CATEGORIES);
      setCategoriesFromDb(false);
      setCategoriesUserId(null);
      setCategoriesLoaded(true);
      return;
    }

    if (!session) {
      if (!authReady) return;
      setCategories(DEFAULT_CATEGORIES);
      setCategoriesFromDb(false);
      setCategoriesUserId(null);
      setCategoriesLoaded(true);
      return;
    }

    if (categoriesLoaded && categoriesUserId === session.user.id) {
      return;
    }

    const loadCategories = async () => {
      if (!session) return;
      setCategoriesLoaded(false);
      const { data, error } = await fetchTagsForUser(session.user.id);

      // No usable tags from the database — fall back to the built-in list so
      // the picker still works, and flag it so we never write tag links.
      if (error || !data || data.length === 0) {
        setCategories(DEFAULT_CATEGORIES);
        setCategoriesFromDb(false);
        setCategoriesUserId(null);
        setCategoriesLoaded(true);
        return;
      }

      setCategories(data);
      setCategoriesFromDb(true);
      setCategoriesUserId(session.user.id);
      setCategoriesLoaded(true);
    };

    loadCategories();
  }, [
    authReady,
    session,
    categoriesLoaded,
    categoriesUserId,
    setCategories,
    setCategoriesFromDb,
    setCategoriesLoaded,
    setCategoriesUserId,
  ]);

  const goalsAvailable = !!supabase && !!session;

  useEffect(() => {
    if (!supabase) {
      setGoals([]);
      setGoalsUserId(null);
      setGoalsLoaded(true);
      return;
    }

    if (!session) {
      if (!authReady) return;
      setGoals([]);
      setGoalsUserId(null);
      setGoalsLoaded(true);
      return;
    }

    if (goalsLoaded && goalsUserId === session.user.id) {
      return;
    }

    const loadGoals = async () => {
      if (!session) return;
      setGoalsLoading(true);
      setGoalsLoaded(false);
      setGoalsError(null);
      const { data, error } = await fetchGoals();
      if (error || !data) {
        setGoalsError(error ?? "Unable to load goals.");
        setGoalsLoading(false);
        setGoalsLoaded(true);
        return;
      }
      setGoals(data);
      setGoalsLoading(false);
      setGoalsLoaded(true);
      setGoalsUserId(session.user.id);
    };

    loadGoals();
  }, [
    authReady,
    session,
    goalsLoaded,
    goalsUserId,
    setGoals,
    setGoalsLoaded,
    setGoalsUserId,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const shouldIgnore = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (target.isContentEditable) return true;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (shouldIgnore(event.target)) return;
      if (editGoal || newGoalOpen) return;

      if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        setNewGoalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editGoal, newGoalOpen]);

  useEffect(() => {
    if (!newGoalOpen) return;
    window.requestAnimationFrame(() => {
      newGoalInputRef.current?.focus();
    });
  }, [newGoalOpen]);

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

  const focusTagAt = (index: number) => {
    const clamped = Math.max(0, Math.min(categories.length - 1, index));
    setFocusedTagIndex(clamped);
    tagButtonRefs.current[clamped]?.focus();
  };

  const focusNearestTag = (direction: "left" | "right" | "up" | "down") => {
    const elements = tagButtonRefs.current
      .map((element, index) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          top: rect.top,
          centerX: rect.left + rect.width / 2,
        };
      })
      .filter(
        (item): item is { index: number; left: number; top: number; centerX: number } =>
          item !== null,
      );

    if (!elements.length) return;

    const rows: Array<{ top: number; items: typeof elements }> = [];
    const rowTolerance = 4;

    elements.forEach((item) => {
      const row = rows.find((candidate) => Math.abs(candidate.top - item.top) <= rowTolerance);
      if (row) {
        row.items.push(item);
      } else {
        rows.push({ top: item.top, items: [item] });
      }
    });

    rows.sort((a, b) => a.top - b.top);
    rows.forEach((row) => row.items.sort((a, b) => a.left - b.left));

    const currentRowIndex = rows.findIndex((row) =>
      row.items.some((item) => item.index === focusedTagIndex),
    );
    if (currentRowIndex === -1) return;

    const currentRow = rows[currentRowIndex];
    const currentColIndex = currentRow.items.findIndex(
      (item) => item.index === focusedTagIndex,
    );
    if (currentColIndex === -1) return;

    if (direction === "left") {
      if (currentColIndex > 0) focusTagAt(currentRow.items[currentColIndex - 1].index);
      return;
    }
    if (direction === "right") {
      if (currentColIndex < currentRow.items.length - 1) {
        focusTagAt(currentRow.items[currentColIndex + 1].index);
      }
      return;
    }

    const targetRowIndex =
      direction === "up" ? currentRowIndex - 1 : currentRowIndex + 1;
    const targetRow = rows[targetRowIndex];
    if (!targetRow) return;

    const currentCenterX = currentRow.items[currentColIndex].centerX;
    let best = targetRow.items[0];
    let bestDistance = Math.abs(best.centerX - currentCenterX);
    targetRow.items.forEach((item) => {
      const distance = Math.abs(item.centerX - currentCenterX);
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    });

    focusTagAt(best.index);
  };

  const resetForm = () => {
    setTitle("");
    setDraftStartedAt(null);
    setHasEndAt(false);
    setEndAt("");
    setSelectedCategories([]);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setNewGoalOpen(false);
    setGoalsError(null);
    setSaveNotice(null);
    const createdAt = (draftStartedAt ?? new Date()).toISOString();
    if (!supabase || !session) {
      setGoalsError("Sign in to save goals.");
      pushToast("Sign in to save goals.", "error");
      return;
    }

    const endAtValue = hasEndAt && endAt ? new Date(endAt).toISOString() : null;
    const { data: result, error } = await createGoal({
      userId: session.user.id,
      title: title.trim(),
      createdAt,
      endAt: endAtValue,
      categoryIds: selectedCategories,
      categoryNames: categories
        .filter((category) => selectedCategories.includes(category.id))
        .map((category) => category.name),
      linkCategories: categoriesFromDb,
    });

    if (error || !result) {
      setGoalsError(error ?? "Unable to save goal.");
      pushToast(error ?? "Unable to save goal.", "error");
      return;
    }

    setGoals((current) => [result.goal, ...current]);
    resetForm();
    setSaveNotice("Goal saved.");

    if (result.categoriesLinked) {
      pushToast("Goal created.", "success");
    } else {
      setGoalsError(result.categoryError);
      pushToast("Goal created, but its tags could not be saved.", "error");
    }
  };

  const orderedGoals = useMemo(() => goals, [goals]);
  const resolvedGoalsLoading = goalsAvailable ? goalsLoading : false;
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    orderedGoals.forEach((goal) => {
      const date = new Date(goal.createdAt);
      if (!Number.isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [orderedGoals]);

  const dailyGrid = useMemo(
    () => buildDailyGrid(orderedGoals, selectedYear),
    [orderedGoals, selectedYear],
  );

  const handleOutcome = async (goalId: string, nextOutcome: "passed" | "failed") => {
    setGoalsError(null);
    if (!supabase || !session) {
      setGoalsError("Sign in to update goals.");
      return;
    }

    const { error } = await setGoalOutcome(goalId, nextOutcome);

    if (error) {
      setGoalsError(error);
      return;
    }

    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId ? { ...goal, outcome: nextOutcome } : goal,
      ),
    );
    pushToast(
      nextOutcome === "passed" ? "Marked as passed." : "Marked as failed.",
      "success",
    );
  };

  const openEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setEditTitle(goal.title);
    setEditOutcome(goal.outcome ?? null);
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

  const closeEditGoal = (force = false) => {
    if (!force && (editSaving || editDeleting)) return;
    setEditGoal(null);
    setEditTitle("");
    setEditOutcome(null);
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
    closeEditGoal(true);

    const endAtValue = editHasEndAt && editEndAt ? new Date(editEndAt).toISOString() : null;

    const { data: result, error } = await updateGoal({
      goalId: editGoal.id,
      title: editTitle.trim(),
      outcome: editOutcome,
      endAt: endAtValue,
      categoryIds: editSelectedCategories,
      syncCategories: categoriesFromDb,
    });

    if (error || !result) {
      setGoalsError(error ?? "Unable to update goal.");
      pushToast(error ?? "Unable to update goal.", "error");
      setEditSaving(false);
      return;
    }

    const updatedCategoryNames = result.categoriesLinked
      ? categories
          .filter((category) => editSelectedCategories.includes(category.id))
          .map((category) => category.name)
      : [];

    setGoals((current) =>
      current.map((goal) =>
        goal.id === editGoal.id
          ? {
              ...goal,
              title: editTitle.trim(),
              outcome: editOutcome ?? undefined,
              endAt: endAtValue ?? undefined,
              categories: updatedCategoryNames,
              categoryIds: result.categoriesLinked ? editSelectedCategories : [],
            }
          : goal,
      ),
    );

    setEditSaving(false);

    if (result.categoriesLinked) {
      pushToast("Goal updated.", "success");
    } else {
      setGoalsError(result.categoryError);
      pushToast("Goal updated, but its tags could not be saved.", "error");
    }
  };

  const handleDeleteGoal = async () => {
    if (!editGoal || !supabase || !session) return;
    if (!window.confirm("Delete this goal? This cannot be undone.")) {
      return;
    }
    setEditDeleting(true);
    setGoalsError(null);
    const { error } = await deleteGoal(editGoal.id);
    if (error) {
      setGoalsError(error);
      pushToast(error, "error");
      setEditDeleting(false);
      return;
    }
    setGoals((current) => current.filter((goal) => goal.id !== editGoal.id));
    setEditDeleting(false);
    closeEditGoal();
    pushToast("Goal deleted.", "success");
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
      pushToast(error.message, "error");
    } else {
      pushToast("Redirecting to Google sign-in.", "default");
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
      pushToast("Enter an email address to continue.", "error");
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
      pushToast(error.message, "error");
      return;
    }
    setAuthNotice("Check your email for a sign-in link.");
    pushToast("Check your email for a sign-in link.", "success");
    setEmail("");
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      pushToast(error.message, "error");
    } else {
      pushToast("Signed out.", "success");
    }
  };

  const handleTagNavigate = (tag: string) => {
    const encoded = encodeURIComponent(tag);
    router.push(`/tags?highlight=${encoded}`);
  };

  return (
    <>
      {!session ? (
        <div className="min-h-screen px-6 py-8 text-[15px] text-[color:var(--color-text)]">
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
            <header className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1">
                  Quickgoal
                </span>
                <span>Capture the moment, build momentum.</span>
              </div>
              <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl leading-tight text-[color:var(--color-text)] md:text-4xl">
                A calm space for goals — with timestamps that start the instant you
                begin.
              </h1>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:rgba(var(--color-surface-rgb),0.9)] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Sign in</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                    Required
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  Sign in to access your goals dashboard and keep your progress synced.
                </p>
                <div className="mt-6 flex flex-col gap-4 text-sm text-[color:var(--color-text-subtle)]">
                  {!authReady ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                      Checking session...
                    </span>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="rounded-full bg-[color:var(--color-button)] px-6 py-3 text-sm font-semibold text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)]"
                      >
                        Continue with Google
                      </Button>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)]"
                        />
                        <Button
                          type="button"
                          onClick={handleEmailSignIn}
                          variant="outline"
                          className="rounded-full border-[color:var(--color-ink)] px-5 py-3 text-sm font-medium text-[color:var(--color-text)] transition hover:border-[color:var(--color-accent)]"
                        >
                          Email me a sign-in link
                        </Button>
                      </div>
                    </>
                  )}
                  {authError ? (
                    <span className="rounded-2xl border border-[color:var(--color-danger-soft)] bg-[color:var(--color-danger-soft-2)] px-4 py-2 text-xs text-[color:var(--color-danger-strong)]">
                      {authError}
                    </span>
                  ) : null}
                  {authNotice ? (
                    <span className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-xs text-[color:var(--color-text-muted)]">
                      {authNotice}
                    </span>
                  ) : null}
                  {!supabase ? (
                    <span className="text-xs text-[color:var(--color-text-muted)]">
                      Add your Supabase env vars to enable auth.
                    </span>
                  ) : null}
                </div>
              </section>
              <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:rgba(var(--color-surface-rgb),0.7)] p-6">
                <h2 className="text-lg font-semibold">Why Quickgoal?</h2>
                <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-text-muted)]">
                  <li>Capture goals fast with instant timestamps.</li>
                  <li>Optional end dates keep you time-aware.</li>
                  <li>Track wins and misses in one calm space.</li>
                </ul>
              </section>
            </div>
          </main>
        </div>
      ) : (
        <AppShell sessionEmail={session.user.email} onSignOut={handleSignOut}>
          <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-6 py-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
                    Dashboard
                  </h2>
                  <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                    {orderedGoals.length} total
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setNewGoalOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text)] transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-muted)]"
                >
                  Create goal
                  <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-surface)] font-mono text-[11px] leading-none text-[color:var(--color-text)] shadow-sm normal-case tracking-normal">
                    G
                  </span>
                </Button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <GoalTable
                  goals={orderedGoals}
                  loading={resolvedGoalsLoading}
                  signedIn={!!session}
                  isAuthed={isAuthed}
                  clockTick={clockTick}
                  scrollToBottomKey={heatmapOpen}
                  onOpenGoal={openEditGoal}
                  onOutcome={handleOutcome}
                  onTagNavigate={handleTagNavigate}
                />

                <GoalHeatmap
                  grid={dailyGrid}
                  open={heatmapOpen}
                  onToggle={() => setHeatmapOpen((open) => !open)}
                  availableYears={availableYears}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
              </div>
          </section>
        </AppShell>
      )}

      <Dialog
        open={!!editGoal}
        onOpenChange={(open) => {
          if (!open) closeEditGoal();
        }}
      >
        {editGoal ? (
          <DialogContent
            showCloseButton={false}
            disableOutsidePointerEvents={false}
            className="w-full max-w-2xl rounded-3xl border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-modal)]"
          >
            <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-3 text-left">
              <div>
                <DialogTitle>Edit goal</DialogTitle>
                <DialogDescription className="text-xs text-[color:var(--color-text-muted)]">
                  Started {formatTimestamp(editGoal.createdAt)}
                </DialogDescription>
              </div>
              <Button
                type="button"
                onClick={() => closeEditGoal()}
                variant="outline"
                className="rounded-full border-[color:var(--color-border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]"
              >
                Close
              </Button>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">Goal</span>
                <Input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="Update your goal..."
                  className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-base shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)]"
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">
                  Outcome
                </span>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setEditOutcome("passed")}
                    aria-pressed={editOutcome === "passed"}
                    variant="outline"
                    className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.14em] transition ${
                      editOutcome === "passed"
                        ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                        : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-accent)]"
                    }`}
                  >
                    Pass
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditOutcome("failed")}
                    aria-pressed={editOutcome === "failed"}
                    variant="outline"
                    className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.14em] transition ${
                      editOutcome === "failed"
                        ? "border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-strong)]"
                        : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-danger-strong)]"
                    }`}
                  >
                    Fail
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() =>
                      setEditHasEndAt((value) => {
                        const next = !value;
                        if (next) {
                          setEditEndAt(getDefaultEndAtValue());
                        } else {
                          setEditEndAt("");
                        }
                        return next;
                      })
                    }
                    aria-pressed={editHasEndAt}
                    variant="outline"
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      editHasEndAt
                        ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                        : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]"
                    }`}
                  >
                    <span>End date/time</span>
                    <span className="text-xs uppercase tracking-[0.2em]">
                      {editHasEndAt ? "On" : "Off"}
                    </span>
                  </Button>
                  {editHasEndAt ? (
                    <Input
                      type="datetime-local"
                      value={editEndAt}
                      onChange={(event) => setEditEndAt(event.target.value)}
                      className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)]"
                    />
                  ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">
                  Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = editSelectedCategories.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        type="button"
                        onClick={() => toggleEditCategory(category.id)}
                        aria-pressed={selected}
                        variant="outline"
                        className={`h-auto rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                          selected
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                            : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-accent)]"
                        }`}
                      >
                        {category.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleUpdateGoal}
                  disabled={editSaving || editTitle.trim().length === 0}
                  className="rounded-full bg-[color:var(--color-button)] px-6 py-3 text-sm font-semibold text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-text-disabled)]"
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  onClick={() => closeEditGoal()}
                  disabled={editSaving || editDeleting}
                  variant="outline"
                  className="rounded-full border-[color:var(--color-border)] px-5 py-3 text-sm font-medium text-[color:var(--color-text-subtle)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </Button>
              </div>
              <Button
                type="button"
                onClick={handleDeleteGoal}
                disabled={editDeleting}
                variant="outline"
                className="rounded-full border-[color:var(--color-border)] px-5 py-3 text-sm font-medium text-[color:var(--color-danger-strong)] transition hover:border-[color:var(--color-danger-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editDeleting ? "Deleting..." : "Delete goal"}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog
        open={newGoalOpen}
        onOpenChange={(open) => {
          setNewGoalOpen(open);
          if (open) setFocusedTagIndex(0);
        }}
      >
        <DialogContent
          showCloseButton={false}
          disableOutsidePointerEvents={false}
          className="w-full max-w-2xl rounded-3xl border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-modal)]"
        >
          <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-3 text-left">
            <div>
              <DialogTitle>New goal</DialogTitle>
              {draftStartedAt ? (
                <DialogDescription className="text-xs text-[color:var(--color-text-muted)]">
                  Started {formatTimestamp(draftStartedAt)}
                </DialogDescription>
              ) : (
                <DialogDescription className="text-xs text-[color:var(--color-text-muted)]">
                  Start typing to timestamp
                </DialogDescription>
              )}
            </div>
            <Button
              type="button"
              onClick={() => setNewGoalOpen(false)}
              variant="outline"
              className="rounded-full border-[color:var(--color-border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]"
            >
              Close
            </Button>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">Goal</span>
              <Input
                ref={newGoalInputRef}
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Write a clear, short goal..."
                disabled={!isAuthed}
                className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-base shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)] disabled:bg-[color:var(--color-surface-subtle)]"
              />
            </label>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() =>
                  setHasEndAt((value) => {
                    const next = !value;
                    if (next) {
                      setEndAt(getDefaultEndAtValue());
                    } else {
                      setEndAt("");
                    }
                    return next;
                  })
                }
                aria-pressed={hasEndAt}
                disabled={!isAuthed}
                tabIndex={0}
                variant="outline"
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  hasEndAt
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                    : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span>End date/time</span>
                <span className="text-xs uppercase tracking-[0.2em]">
                  {hasEndAt ? "On" : "Off"}
                </span>
              </Button>
              {hasEndAt ? (
                <Input
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Tab" && !event.shiftKey) {
                      event.preventDefault();
                      focusTagAt(0);
                    }
                  }}
                  disabled={!isAuthed}
                  className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)] disabled:bg-[color:var(--color-surface-subtle)]"
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">
                Categories
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Goal categories"
                onKeyDown={(event) => {
                  if (!categories.length) return;
                  if (event.key === "Tab" && !event.shiftKey) {
                    event.preventDefault();
                    saveGoalButtonRef.current?.focus();
                    return;
                  }
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    focusNearestTag(event.key === "ArrowRight" ? "right" : "down");
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    focusNearestTag(event.key === "ArrowLeft" ? "left" : "up");
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    focusTagAt(0);
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    focusTagAt(categories.length - 1);
                  }
                }}
              >
                {categories.map((category, index) => {
                  const selected = selectedCategories.includes(category.id);
                  const clampedIndex = Math.min(
                    focusedTagIndex,
                    Math.max(categories.length - 1, 0),
                  );
                  return (
                    <Button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      onFocus={() => setFocusedTagIndex(index)}
                      aria-pressed={selected}
                      disabled={!isAuthed}
                      tabIndex={index === clampedIndex ? 0 : -1}
                      ref={(element) => {
                        tagButtonRefs.current[index] = element;
                      }}
                      variant="outline"
                      className={`h-auto rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        selected
                          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                          : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-accent)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                ref={saveGoalButtonRef}
                className="rounded-full bg-[color:var(--color-button)] px-6 py-3 text-sm font-semibold text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-text-disabled)]"
              >
                Save goal
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="rounded-full border-[color:var(--color-ink)] px-5 py-3 text-sm font-medium text-[color:var(--color-text)] transition hover:border-[color:var(--color-accent)]"
              >
                Clear
              </Button>
              <span className="text-xs text-[color:var(--color-text-muted)]">
                {session
                  ? "Goals are timestamped on first input."
                  : "Sign in to save goals."}
              </span>
              {saveNotice ? (
                <span className="text-xs text-[color:var(--color-accent)]">{saveNotice}</span>
              ) : null}
              {goalsError ? (
                <span className="text-xs text-[color:var(--color-danger-strong)]">{goalsError}</span>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
