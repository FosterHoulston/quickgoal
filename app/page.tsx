"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { useGoalData } from "@/components/GoalDataProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Category, Goal } from "@/lib/types";
import { Activity } from "lucide-react";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "health", name: "Health" },
  { id: "career", name: "Career" },
  { id: "learning", name: "Learning" },
  { id: "finance", name: "Finance" },
  { id: "relationships", name: "Relationships" },
  { id: "mindset", name: "Mindset" },
  { id: "creative", name: "Creative" },
];

const HOVER_CARD_DELAY = 800;
const getNow = () => Date.now();
let toastIdCounter = 0;
const nextToastId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
};

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

const getDefaultEndAtValue = () =>
  toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000).toISOString());

type HeatmapCell = {
  key: string;
  label: string;
  passCount: number;
  failCount: number;
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const buildDailyGrid = (goals: Goal[], year: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const start = new Date(yearStart);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(yearEnd);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const days: HeatmapCell[] = [];
  const map = new Map<string, HeatmapCell>();
  goals.forEach((goal) => {
    if (!goal.outcome) return;
    const date = new Date(goal.createdAt);
    if (Number.isNaN(date.getTime())) return;
    if (date.getFullYear() !== year) return;
    date.setHours(0, 0, 0, 0);
    const key = formatDateKey(date);
    const existing = map.get(key) ?? {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      passCount: 0,
      failCount: 0,
    };
    if (goal.outcome === "passed") {
      existing.passCount += 1;
    } else {
      existing.failCount += 1;
    }
    map.set(key, existing);
  });

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatDateKey(d);
    days.push(
      map.get(key) ?? {
        key,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        passCount: 0,
        failCount: 0,
      },
    );
  }

  const weeks: (HeatmapCell | null)[][] = [];
  const weekStartDates: Date[] = [];
  const monthFirstWeekIndex = new Map<number, number>();
  let maxTotal = 0;
  days.forEach((cell, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + weekIndex * 7);
      weekStartDates[weekIndex] = weekStart;
    }
    weeks[weekIndex].push(cell);
    const total = cell.passCount + cell.failCount;
    if (total > maxTotal) maxTotal = total;

    const date = new Date(cell.key);
    if (date >= yearStart && date <= yearEnd && !monthFirstWeekIndex.has(date.getMonth())) {
      monthFirstWeekIndex.set(date.getMonth(), weekIndex);
    }
  });

  weeks.forEach((week) => {
    week.forEach((cell, index) => {
      if (!cell) return;
      const date = new Date(cell.key);
      if (date < yearStart || date > yearEnd) {
        week[index] = null;
      }
    });
  });

  const monthLabels: { index: number; label: string }[] = [];
  for (let month = 0; month < 12; month += 1) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const weekIndex = weekStartDates.findIndex(
      (date) => date >= monthStart && date <= monthEnd,
    );
    if (weekIndex === -1) continue;
    monthLabels.push({
      index: weekIndex,
      label: monthStart.toLocaleDateString(undefined, { month: "short" }),
    });
  }

  return { weeks, monthLabels, maxTotal };
};

export default function Home() {
  const { session, authReady } = useAuth();
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
  const [toasts, setToasts] = useState<
    { id: string; message: string; tone?: "default" | "success" | "error" }[]
  >([]);
  const [hoverCard, setHoverCard] = useState<{ id: string; top: number } | null>(
    null,
  );
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoverHideTimeoutRef = useRef<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
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
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);

  const isAuthed = !!session;
  const canSave = title.trim().length > 0 && isAuthed;

  const pushToast = (
    message: string,
    tone: "default" | "success" | "error" = "default",
  ) => {
    const id = nextToastId();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  };

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
      if (!supabase || !session) return;
      setCategoriesLoaded(false);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, user_id")
        .eq("user_id", session.user.id)
        .order("name");
      if (error) {
        setCategories(DEFAULT_CATEGORIES);
        setCategoriesFromDb(false);
        setCategoriesUserId(null);
        setCategoriesLoaded(true);
        return;
      }

      if (!data || data.length === 0) {
        const { data: defaults } = await supabase
          .from("categories")
          .select("name, description")
          .is("user_id", null)
          .order("name");

        const seed = (defaults && defaults.length > 0
          ? defaults
          : DEFAULT_CATEGORIES.map((category) => ({
              name: category.name,
              description: category.description ?? null,
            })));

        if (seed.length > 0) {
          await supabase.from("categories").insert(
            seed.map((item) => ({
              user_id: session.user.id,
              name: item.name,
              description: item.description ?? null,
            })),
          );
        }

        const { data: reloaded } = await supabase
          .from("categories")
          .select("id, name, description, user_id")
          .eq("user_id", session.user.id)
          .order("name");
        if (!reloaded || reloaded.length === 0) {
          setCategories(DEFAULT_CATEGORIES);
          setCategoriesFromDb(false);
          setCategoriesUserId(null);
          setCategoriesLoaded(true);
          return;
        }
        setCategories(reloaded);
        setCategoriesFromDb(true);
        setCategoriesUserId(session.user.id);
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
      if (!supabase || !session) return;
      setGoalsLoading(true);
      setGoalsLoaded(false);
      setGoalsError(null);
      const { data, error } = await supabase
        .from("goals")
        .select(
          "id, title, outcome, created_at, end_at, goal_categories(category_id, categories(name))",
        )
        .order("created_at", { ascending: false });
      if (error || !data) {
        setGoalsError(error?.message ?? "Unable to load goals.");
        setGoalsLoading(false);
        setGoalsLoaded(true);
        return;
      }
      const mapped: Goal[] = data.map((goal) => ({
        id: goal.id,
        title: goal.title,
        outcome: goal.outcome ?? undefined,
        createdAt: goal.created_at,
        endAt: goal.end_at ?? undefined,
        categoryIds: (goal.goal_categories ?? [])
          .map((item) => item.category_id)
          .filter((id): id is string => typeof id === "string"),
        categories: (goal.goal_categories ?? [])
          .map((item) => {
            const categories = item.categories as
              | { name?: string }
              | { name?: string }[]
              | null
              | undefined;
            if (!categories) return null;
            if (Array.isArray(categories)) {
              return categories[0]?.name ?? null;
            }
            return categories.name ?? null;
          })
          .filter((name): name is string => typeof name === "string"),
      }));
      setGoals(mapped);
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

  useEffect(() => {
    if (!newGoalOpen) return;
    setFocusedTagIndex(0);
  }, [newGoalOpen]);

  useEffect(() => {
    if (!categories.length) return;
    if (focusedTagIndex > categories.length - 1) {
      setFocusedTagIndex(categories.length - 1);
    }
  }, [categories.length, focusedTagIndex]);

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
    const { data: savedGoal, error } = await supabase
      .from("goals")
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        created_at: createdAt,
        end_at: endAtValue,
      })
      .select("id, title, outcome, created_at, end_at")
      .single();

    if (error || !savedGoal) {
      setGoalsError(error?.message ?? "Unable to save goal.");
      pushToast(error?.message ?? "Unable to save goal.", "error");
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
        pushToast(categoryError.message, "error");
      }
    }

    const categoryNames = categories
      .filter((category) => selectedCategories.includes(category.id))
      .map((category) => category.name);

    const newGoal: Goal = {
      id: savedGoal.id,
      title: savedGoal.title,
      createdAt: savedGoal.created_at,
      endAt: savedGoal.end_at ?? undefined,
      categories: categoryNames,
    };

    setGoals((current) => [newGoal, ...current]);
    resetForm();
    setSaveNotice("Goal saved.");
    pushToast("Goal created.", "success");
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

  useEffect(() => {
    if (!heatmapOpen) return;
    const container = tableContainerRef.current;
    if (!container) return;
    window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [heatmapOpen, orderedGoals.length]);

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

    const { error } = await supabase
      .from("goals")
      .update({
        title: editTitle.trim(),
        outcome: editOutcome,
        end_at: endAtValue,
      })
      .eq("id", editGoal.id);

    if (error) {
      setGoalsError(error.message);
      pushToast(error.message, "error");
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
        pushToast(deleteError.message, "error");
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
          pushToast(insertError.message, "error");
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
              outcome: editOutcome ?? undefined,
              endAt: endAtValue ?? undefined,
              categories: updatedCategoryNames,
              categoryIds: editSelectedCategories,
            }
          : goal,
      ),
    );

    setEditSaving(false);
    pushToast("Goal updated.", "success");
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
      pushToast(error.message, "error");
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

  const handleRowEnter = (goalId: string, target: HTMLTableRowElement) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      const container = tableContainerRef.current;
      if (container) {
        const rowRect = target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = rowRect.top - containerRect.top;
        setHoverCard({ id: goalId, top });
      } else {
        setHoverCard({ id: goalId, top: 0 });
      }
    }, HOVER_CARD_DELAY);
  };

  const handleRowLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (hoverHideTimeoutRef.current) {
      window.clearTimeout(hoverHideTimeoutRef.current);
    }
    hoverHideTimeoutRef.current = window.setTimeout(() => {
      setHoverCard(null);
    }, 150);
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
                <div className="flex min-h-0 flex-1 flex-col">
                    {resolvedGoalsLoading ? (
                      <div className="px-6 py-4 text-sm text-[color:var(--color-text-muted)]">
                        Loading goals...
                      </div>
                    ) : orderedGoals.length === 0 ? (
                      <div className="px-6 py-4 text-sm text-[color:var(--color-text-muted)]">
                        {session
                          ? "No goals yet. Use Create goal to add one."
                          : "Sign in to view your goals."}
                      </div>
                    ) : (
                    <div className="relative flex min-h-0 flex-1 flex-col">
                      <div
                        ref={tableContainerRef}
                        className="min-h-0 flex-1 overflow-y-auto"
                      >
                        <table className="w-full table-fixed text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-[color:var(--color-surface-alt)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                          <tr>
                            <th className="w-[40%] px-4 py-2.5 font-medium">Goal</th>
                            <th className="w-[20%] px-4 py-2.5 font-medium">Start</th>
                            <th className="w-[20%] px-4 py-2.5 font-medium">End</th>
                            <th className="w-[20%] px-4 py-2.5 font-medium">
                              Tags
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderedGoals.map((goal) => (
                            <tr
                              key={goal.id}
                              role="button"
                              tabIndex={isAuthed ? 0 : -1}
                              onClick={() => {
                                if (!isAuthed) return;
                                openEditGoal(goal);
                              }}
                              onMouseEnter={(event) =>
                                handleRowEnter(goal.id, event.currentTarget)
                              }
                              onMouseLeave={handleRowLeave}
                              onKeyDown={(event) => {
                                if (!isAuthed) return;
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openEditGoal(goal);
                                }
                              }}
                              aria-disabled={!isAuthed}
                              className={`h-11 cursor-pointer border-t border-[color:var(--color-surface-subtle)] align-middle transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring-40)] ${
                                goal.outcome === "passed"
                                  ? "shadow-[inset_4px_0_0_0_var(--color-accent)] hover:bg-[color:var(--color-success-soft)]"
                                  : goal.outcome === "failed"
                                    ? "shadow-[inset_4px_0_0_0_var(--color-danger-strong)] hover:bg-[color:var(--color-danger-soft-2)]"
                                    : "hover:bg-[color:var(--color-surface-muted)]"
                              }`}
                            >
                              <td className="px-4 py-2 text-[color:var(--color-text)]">
                                <div className="flex items-center gap-2 truncate font-semibold">
                                  {goal.outcome === "passed" ? (
                                    <span
                                      className="text-[color:var(--color-accent)]"
                                      aria-hidden="true"
                                    >
                                      ✓
                                    </span>
                                  ) : goal.outcome === "failed" ? (
                                    <span
                                      className="text-[color:var(--color-danger-strong)]"
                                      aria-hidden="true"
                                    >
                                      x
                                    </span>
                                  ) : null}
                                  <span className="truncate">{goal.title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-xs text-[color:var(--color-text-muted)]">
                                {formatTimestamp(goal.createdAt)}
                              </td>
                              <td className="px-4 py-2 text-xs text-[color:var(--color-text-muted)]">
                                {goal.endAt ? (
                                  <span className="truncate">
                                    {formatTimestamp(goal.endAt)}
                                  </span>
                                ) : (
                                  <span className="text-[color:var(--color-text-disabled)]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-[10px] text-[color:var(--color-text-muted)]">
                                {goal.categories.length > 0 ? (
                                  <div className="flex items-center gap-1.5 truncate uppercase tracking-[0.16em]">
                                    {goal.categories.slice(0, 2).map((category, index) => (
                                      <span
                                        key={`${goal.id}-${category}-${index}`}
                                        className="truncate"
                                      >
                                        {category}
                                      </span>
                                    ))}
                                    {goal.categories.length > 2 ? (
                                      <span className="shrink-0">
                                        +{goal.categories.length - 2}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="uppercase tracking-[0.16em]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                      {hoverCard ? (
                        <div
                          className="pointer-events-auto absolute left-4 right-4 z-20"
                          style={{ top: hoverCard.top + 6 }}
                          onMouseEnter={() => {
                            if (hoverHideTimeoutRef.current) {
                              window.clearTimeout(hoverHideTimeoutRef.current);
                              hoverHideTimeoutRef.current = null;
                            }
                          }}
                          onMouseLeave={handleRowLeave}
                        >
                          {(() => {
                            const goal = orderedGoals.find(
                              (item) => item.id === hoverCard.id,
                            );
                            if (!goal) return null;
                            return (
                              <div
                                role="presentation"
                                onClick={() => {
                                  if (!isAuthed) return;
                                  openEditGoal(goal);
                                }}
                                className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-xl"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="text-sm font-semibold text-[color:var(--color-text)]">
                                    {goal.title}
                                  </div>
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                                    {goal.outcome
                                      ? goal.outcome === "passed"
                                        ? "Passed"
                                        : "Failed"
                                      : "Unscored"}
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[color:var(--color-text-muted)]">
                                  <span>Started {formatTimestamp(goal.createdAt)}</span>
                                  {goal.endAt ? (
                                    <span>
                                      {hasEnded(goal.endAt, clockTick)
                                        ? `Ended ${formatTimestamp(goal.endAt)}`
                                        : `Ends ${formatTimestamp(goal.endAt)}`}
                                    </span>
                                  ) : (
                                    <span>No end date</span>
                                  )}
                                </div>
                                {goal.categories.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                                    {goal.categories.map((category, index) => (
                                      <button
                                        key={`${goal.id}-${category}-${index}`}
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleTagNavigate(category);
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Badge
                                          variant="outline"
                                          className="rounded-full border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-0.5 uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)] transition hover:border-[color:var(--color-accent)]"
                                        >
                                          {category}
                                        </Badge>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                                {!goal.outcome ? (
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <Button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleOutcome(goal.id, "passed");
                                      }}
                                      disabled={!isAuthed}
                                      variant="outline"
                                      className="h-auto rounded-full border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-1 uppercase tracking-[0.14em] text-[color:var(--color-accent)] transition disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      Pass
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleOutcome(goal.id, "failed");
                                      }}
                                      disabled={!isAuthed}
                                      variant="outline"
                                      className="h-auto rounded-full border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] px-3 py-1 uppercase tracking-[0.14em] text-[color:var(--color-danger-strong)] transition disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      Fail
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div
                  className={`flex-shrink-0 px-6 ${
                    heatmapOpen ? "border-t border-[color:var(--color-border)] py-3" : "pt-0 pb-3"
                  }`}
                >
                  {heatmapOpen ? (
                    <>
                      <div className="flex flex-wrap items-start justify-center gap-6 py-2">
                        <div className="flex w-fit flex-wrap items-start gap-6">
                          {dailyGrid.weeks.length === 0 ? (
                            <div className="border border-dashed border-[color:var(--color-border)] p-6 text-sm text-[color:var(--color-text-muted)]">
                              No completed goals yet. Mark a goal as passed or failed to see
                              progress.
                            </div>
                          ) : (
                            <div className="grid grid-cols-[auto_1fr] gap-3">
                              <div
                                className="grid grid-rows-7 gap-[6px] pt-[18px] text-xs text-[color:var(--color-text-muted)]"
                                style={{ gridTemplateRows: "repeat(7, 12px)" }}
                              >
                                {["Mon", "Wed", "Fri"].map((day, index) => (
                                  <span
                                    key={day}
                                    className="flex h-4.5 items-end pb-[0px] leading-none"
                                    style={{ gridRowStart: 2 + index * 2 }}
                                  >
                                    {day}
                                  </span>
                                ))}
                              </div>
                              <div className="w-fit max-w-full">
                                <div className="mb-2 grid auto-cols-[12px] grid-flow-col gap-[6px] text-xs text-[color:var(--color-text-muted)]">
                                  {dailyGrid.monthLabels.map((label) => (
                                    <span
                                      key={`${label.index}-${label.label}`}
                                      style={{ gridColumnStart: label.index + 1 }}
                                    >
                                      {label.label}
                                    </span>
                                  ))}
                                </div>
                                <div className="grid auto-cols-[12px] grid-flow-col gap-[6px]">
                                  {dailyGrid.weeks.map((week, weekIndex) => (
                                    <div key={`week-${weekIndex}`} className="grid gap-[6px]">
                                      {week.map((cell, dayIndex) => {
                                        if (!cell) {
                                          return (
                                            <span
                                              key={`empty-${weekIndex}-${dayIndex}`}
                                              className="h-3 w-3 rounded-[4px]"
                                            />
                                          );
                                        }
                                        const total = cell.passCount + cell.failCount;
                                        const passRatio = total > 0 ? cell.passCount / total : 0;
                                        const intensity =
                                          total === 0
                                            ? 0
                                            : Math.min(
                                                1,
                                                0.35 +
                                                  total / Math.max(1, dailyGrid.maxTotal),
                                              );
                                        const green = `rgb(var(--color-success-rgb) / ${intensity})`;
                                        const red = `rgb(var(--color-danger-rgb) / ${intensity})`;
                                        const background =
                                            total === 0
                                              ? "var(--color-surface-subtle)"
                                              : `linear-gradient(90deg, ${green} ${Math.round(
                                                  passRatio * 100,
                                                )}%, ${red} ${Math.round(
                                                  passRatio * 100,
                                                )}%)`;
                                        return (
                                          <span
                                            key={cell.key}
                                            className="h-3 w-3 rounded-[4px] border border-[color:var(--color-border)]"
                                            style={{ background }}
                                            title={`${cell.label}: ${cell.passCount} passed, ${cell.failCount} failed`}
                                          />
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[color:var(--color-text-muted)]">
                                  <div className="flex items-center gap-2">
                                    <span>Passed</span>
                                    <div className="flex items-center gap-2">
                                      {[1, 0.6, 0.5, 0.4, 0].map((passRatio, index) => {
                                        const background =
                                          passRatio === 1
                                            ? "var(--color-success)"
                                            : passRatio === 0
                                              ? "var(--color-danger)"
                                              : `linear-gradient(90deg, var(--color-success) ${Math.round(
                                                  passRatio * 100,
                                                )}%, var(--color-danger) ${Math.round(
                                                  passRatio * 100,
                                                )}%)`;
                                        return (
                                          <span
                                            key={`pf-${index}`}
                                            className="h-3 w-3 rounded-[4px] border border-[color:var(--color-border)]"
                                            style={{ background }}
                                          />
                                        );
                                      })}
                                    </div>
                                    <span>Failed</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>Less</span>
                                    <div className="flex items-center gap-2">
                                      {[0, 0.35, 0.55, 0.75, 1].map((step) => (
                                        <span
                                          key={`legend-${step}`}
                                          className="h-3 w-3 rounded-[4px] border border-[color:var(--color-border)]"
                                          style={{
                                            background:
                                              step === 0
                                                ? "var(--color-surface-subtle)"
                                                : `linear-gradient(90deg, rgb(var(--color-success-rgb) / ${step}) 50%, rgb(var(--color-danger-rgb) / ${step}) 50%)`,
                                        }}
                                      />
                                      ))}
                                    </div>
                                    <span>More</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-end">
                          <Select
                            value={String(selectedYear)}
                            onValueChange={(value) => setSelectedYear(Number(value))}
                          >
                            <SelectTrigger className="h-8 w-[88px] cursor-pointer justify-center rounded-full border-[color:var(--color-ink-20)] px-2 text-[10px] uppercase tracking-[0.2em]">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableYears.map((year) => (
                                <SelectItem key={year} value={String(year)}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className="flex items-center justify-center border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] pt-3">
                    <button
                      type="button"
                      onClick={() => setHeatmapOpen((open) => !open)}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                        heatmapOpen
                          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                          : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-text)]"
                      }`}
                      aria-label={heatmapOpen ? "Collapse heatmap" : "Show heatmap"}
                    >
                      <Activity className="h-4 w-4" />
                      <span>Heatmap</span>
                    </button>
                  </div>
                </div>
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
        onOpenChange={(open) => setNewGoalOpen(open)}
      >
        <DialogContent
          showCloseButton={false}
          disableOutsidePointerEvents={false}
          className="w-full max-w-2xl rounded-3xl border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-modal)]"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            handleSave();
          }}
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
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    focusTagAt(focusedTagIndex + 1);
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    focusTagAt(focusedTagIndex - 1);
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
                  return (
                    <Button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      onFocus={() => setFocusedTagIndex(index)}
                      aria-pressed={selected}
                      disabled={!isAuthed}
                      tabIndex={index === focusedTagIndex ? 0 : -1}
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

      <div className="fixed bottom-6 right-6 z-50 flex w-[280px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-fade rounded-2xl border px-4 py-3 text-xs shadow-lg ${
              toast.tone === "success"
                ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                : toast.tone === "error"
                  ? "border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-strong)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
