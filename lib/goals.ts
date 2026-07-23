import { supabase } from "@/lib/supabaseClient";
import type { DataResult, Goal } from "@/lib/types";

/**
 * Goals and their tag links are two writes with no transaction around them.
 * When the goal lands but the links do not, the goal is real and kept, and
 * `categoriesLinked: false` tells the caller not to claim the tags stuck —
 * so local state can match what is actually in the database.
 */
export type CategorySyncResult = {
  categoriesLinked: boolean;
  categoryError: string | null;
};

const GOAL_SELECT =
  "id, title, outcome, created_at, end_at, goal_categories(category_id, categories(name))";

const NO_CLIENT = "Supabase is not configured.";

type GoalCategoryRow = {
  category_id?: string | null;
  categories?: { name?: string } | { name?: string }[] | null;
};

type GoalRow = {
  id: string;
  title: string;
  outcome?: "passed" | "failed" | null;
  created_at: string;
  end_at?: string | null;
  goal_categories?: GoalCategoryRow[] | null;
};

const categoryNameOf = (row: GoalCategoryRow): string | null => {
  const categories = row.categories;
  if (!categories) return null;
  if (Array.isArray(categories)) return categories[0]?.name ?? null;
  return categories.name ?? null;
};

export const mapGoalRow = (row: GoalRow): Goal => ({
  id: row.id,
  title: row.title,
  outcome: row.outcome ?? undefined,
  createdAt: row.created_at,
  endAt: row.end_at ?? undefined,
  categoryIds: (row.goal_categories ?? [])
    .map((item) => item.category_id)
    .filter((id): id is string => typeof id === "string"),
  categories: (row.goal_categories ?? [])
    .map(categoryNameOf)
    .filter((name): name is string => typeof name === "string"),
});

export async function fetchGoals(): Promise<DataResult<Goal[]>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { data: null, error: error?.message ?? "Unable to load goals." };
  }

  return { data: (data as GoalRow[]).map(mapGoalRow), error: null };
}

async function linkCategories(goalId: string, categoryIds: string[]) {
  if (!supabase || categoryIds.length === 0) return null;
  const { error } = await supabase.from("goal_categories").insert(
    categoryIds.map((categoryId) => ({
      goal_id: goalId,
      category_id: categoryId,
    })),
  );
  return error?.message ?? null;
}

export async function createGoal(params: {
  userId: string;
  title: string;
  createdAt: string;
  endAt: string | null;
  categoryIds: string[];
  categoryNames: string[];
  linkCategories: boolean;
}): Promise<DataResult<CategorySyncResult & { goal: Goal }>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { data: savedGoal, error } = await supabase
    .from("goals")
    .insert({
      user_id: params.userId,
      title: params.title,
      created_at: params.createdAt,
      end_at: params.endAt,
    })
    .select("id, title, outcome, created_at, end_at")
    .single();

  if (error || !savedGoal) {
    return { data: null, error: error?.message ?? "Unable to save goal." };
  }

  const categoryError = params.linkCategories
    ? await linkCategories(savedGoal.id, params.categoryIds)
    : null;
  const categoriesLinked = categoryError === null;

  return {
    data: {
      goal: {
        id: savedGoal.id,
        title: savedGoal.title,
        createdAt: savedGoal.created_at,
        endAt: savedGoal.end_at ?? undefined,
        // Only claim the tags if they actually landed.
        categories: categoriesLinked ? params.categoryNames : [],
        categoryIds: categoriesLinked ? params.categoryIds : [],
      },
      categoriesLinked,
      categoryError,
    },
    error: null,
  };
}

export async function updateGoal(params: {
  goalId: string;
  title: string;
  outcome: "passed" | "failed" | null;
  endAt: string | null;
  categoryIds: string[];
  syncCategories: boolean;
}): Promise<DataResult<CategorySyncResult>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { error } = await supabase
    .from("goals")
    .update({
      title: params.title,
      outcome: params.outcome,
      end_at: params.endAt,
    })
    .eq("id", params.goalId);

  if (error) return { data: null, error: error.message };

  let categoryError: string | null = null;
  if (params.syncCategories) {
    const { error: deleteError } = await supabase
      .from("goal_categories")
      .delete()
      .eq("goal_id", params.goalId);

    // The old links are gone at this point, so any failure from here on means
    // the goal really does have no tags — report that rather than leaving the
    // caller showing the previous ones.
    categoryError =
      deleteError?.message ??
      (await linkCategories(params.goalId, params.categoryIds));
  }

  return {
    data: { categoriesLinked: categoryError === null, categoryError },
    error: null,
  };
}

export async function setGoalOutcome(
  goalId: string,
  outcome: "passed" | "failed",
): Promise<DataResult<true>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { error } = await supabase
    .from("goals")
    .update({ outcome })
    .eq("id", goalId);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}

export async function deleteGoal(goalId: string): Promise<DataResult<true>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}
