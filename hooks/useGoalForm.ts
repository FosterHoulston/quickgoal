"use client";

import { useState } from "react";
import { getDefaultEndAtValue, toLocalInputValue } from "@/lib/date";
import type { Goal } from "@/lib/types";

export type GoalFormValues = {
  title: string;
  hasEndAt: boolean;
  endAt: string;
  selectedCategories: string[];
};

const EMPTY: GoalFormValues = {
  title: "",
  hasEndAt: false,
  endAt: "",
  selectedCategories: [],
};

/**
 * Shared state for the goal create/edit forms: title, the optional end date
 * with its default-on-enable behaviour, and the toggled category set. Each
 * dialog layers its own extras on top (the new-goal timestamp, the edit
 * outcome) — this only owns what both forms have in common.
 */
export function useGoalForm(initial: GoalFormValues = EMPTY) {
  const [title, setTitle] = useState(initial.title);
  const [hasEndAt, setHasEndAt] = useState(initial.hasEndAt);
  const [endAt, setEndAt] = useState(initial.endAt);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial.selectedCategories,
  );

  // Enabling the end date seeds a sensible default; disabling clears it.
  const toggleEndAt = () => {
    setHasEndAt((value) => {
      const next = !value;
      setEndAt(next ? getDefaultEndAtValue() : "");
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  };

  const reset = (values: GoalFormValues = EMPTY) => {
    setTitle(values.title);
    setHasEndAt(values.hasEndAt);
    setEndAt(values.endAt);
    setSelectedCategories(values.selectedCategories);
  };

  /** ISO end date for persistence, or null when the toggle is off or empty. */
  const endAtISO = () =>
    hasEndAt && endAt ? new Date(endAt).toISOString() : null;

  return {
    title,
    setTitle,
    hasEndAt,
    endAt,
    setEndAt,
    toggleEndAt,
    selectedCategories,
    setSelectedCategories,
    toggleCategory,
    reset,
    endAtISO,
  };
}

/** Derive initial form values from an existing goal for the edit dialog. */
export function goalToFormValues(
  goal: Goal,
  categoriesFromDb: boolean,
  categories: { id: string; name: string }[],
): GoalFormValues {
  let selectedCategories: string[] = [];
  if (goal.categoryIds && goal.categoryIds.length > 0) {
    selectedCategories = goal.categoryIds;
  } else if (categoriesFromDb && goal.categories.length > 0) {
    selectedCategories = categories
      .filter((category) => goal.categories.includes(category.name))
      .map((category) => category.id);
  }

  return {
    title: goal.title,
    hasEndAt: !!goal.endAt,
    endAt: toLocalInputValue(goal.endAt),
    selectedCategories,
  };
}
