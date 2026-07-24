"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { useGoalData } from "@/components/GoalDataProvider";
import { useToast } from "@/components/ToastProvider";
import { SignInScreen } from "@/components/auth/SignInScreen";
import { GoalHeatmap } from "@/components/goals/GoalHeatmap";
import { GoalTable } from "@/components/goals/GoalTable";
import {
  EditGoalDialog,
  type EditGoalValues,
} from "@/components/goals/EditGoalDialog";
import {
  NewGoalDialog,
  type NewGoalValues,
} from "@/components/goals/NewGoalDialog";
import { supabase } from "@/lib/supabaseClient";
import type { Goal } from "@/lib/types";
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
  const [heatmapOpen, setHeatmapOpen] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(!goalsLoaded);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editDeleting, setEditDeleting] = useState(false);
  const [clockTick, setClockTick] = useState(getNow);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const isAuthed = !!session;

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

  const handleCreateGoal = async (values: NewGoalValues): Promise<boolean> => {
    setNewGoalOpen(false);
    setGoalsError(null);
    setSaveNotice(null);
    if (!supabase || !session) {
      setGoalsError("Sign in to save goals.");
      pushToast("Sign in to save goals.", "error");
      return false;
    }

    const { data: result, error } = await createGoal({
      userId: session.user.id,
      title: values.title,
      createdAt: values.createdAt,
      endAt: values.endAt,
      categoryIds: values.categoryIds,
      categoryNames: categories
        .filter((category) => values.categoryIds.includes(category.id))
        .map((category) => category.name),
      linkCategories: categoriesFromDb,
    });

    if (error || !result) {
      setGoalsError(error ?? "Unable to save goal.");
      pushToast(error ?? "Unable to save goal.", "error");
      return false;
    }

    setGoals((current) => [result.goal, ...current]);
    setSaveNotice("Goal saved.");

    if (result.categoriesLinked) {
      pushToast("Goal created.", "success");
    } else {
      setGoalsError(result.categoryError);
      pushToast("Goal created, but its tags could not be saved.", "error");
    }
    return true;
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

  const closeEditGoal = (force = false) => {
    if (!force && (editSaving || editDeleting)) return;
    setEditGoal(null);
  };

  const handleUpdateGoal = async (values: EditGoalValues) => {
    if (!editGoal || !supabase || !session) return;
    const target = editGoal;
    setEditSaving(true);
    setGoalsError(null);
    closeEditGoal(true);

    const { data: result, error } = await updateGoal({
      goalId: target.id,
      title: values.title,
      outcome: values.outcome,
      endAt: values.endAt,
      categoryIds: values.categoryIds,
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
          .filter((category) => values.categoryIds.includes(category.id))
          .map((category) => category.name)
      : [];

    setGoals((current) =>
      current.map((goal) =>
        goal.id === target.id
          ? {
              ...goal,
              title: values.title,
              outcome: values.outcome ?? undefined,
              endAt: values.endAt ?? undefined,
              categories: updatedCategoryNames,
              categoryIds: result.categoriesLinked ? values.categoryIds : [],
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

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
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
        <SignInScreen authReady={authReady} />
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
                  onOpenGoal={setEditGoal}
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

      <EditGoalDialog
        goal={editGoal}
        categories={categories}
        categoriesFromDb={categoriesFromDb}
        saving={editSaving}
        deleting={editDeleting}
        onClose={() => closeEditGoal()}
        onSubmit={handleUpdateGoal}
        onDelete={handleDeleteGoal}
      />

      <NewGoalDialog
        open={newGoalOpen}
        onOpenChange={setNewGoalOpen}
        categories={categories}
        isAuthed={isAuthed}
        signedIn={!!session}
        saveNotice={saveNotice}
        goalsError={goalsError}
        onCreate={handleCreateGoal}
      />
    </>
  );
}
