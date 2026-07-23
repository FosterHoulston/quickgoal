import { supabase } from "@/lib/supabaseClient";
import type { Category, DataResult } from "@/lib/types";

const NO_CLIENT = "Supabase is not configured.";
const TAG_SELECT = "id, name, description, user_id";

export const normalizeTag = (value: string) => value.trim().toLowerCase();

export const toTagId = (value: string) =>
  normalizeTag(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** The single source of truth for the tags a brand-new account starts with. */
export const DEFAULT_TAG_NAMES = [
  "Health",
  "Career",
  "Learning",
  "Finance",
  "Relationships",
  "Mindset",
  "Creative",
];

/** Offline fallback shape: what the UI renders before/without a database row. */
export const DEFAULT_CATEGORIES: Category[] = DEFAULT_TAG_NAMES.map((name) => ({
  id: toTagId(name),
  name,
}));

/** Insert shape: what gets seeded into `public.categories` for a new user. */
export const DEFAULT_TAG_SEED = DEFAULT_TAG_NAMES.map((name) => ({
  name,
  description: null,
}));

const selectTagsFor = async (userId: string) => {
  if (!supabase) return null;
  const { data } = await supabase
    .from("categories")
    .select(TAG_SELECT)
    .eq("user_id", userId)
    .order("name");
  return (data ?? null) as Category[] | null;
};

/**
 * Loads a user's tags, seeding them on first use. A brand-new account has no
 * rows, so we copy the shared defaults (`user_id is null`) into their own set,
 * falling back to the built-in list when the database has no defaults either.
 */
export async function fetchTagsForUser(
  userId: string,
): Promise<DataResult<Category[]>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { data, error } = await supabase
    .from("categories")
    .select(TAG_SELECT)
    .eq("user_id", userId)
    .order("name");

  if (error) return { data: null, error: error.message };
  if (data && data.length > 0) {
    return { data: data as Category[], error: null };
  }

  const { data: defaults } = await supabase
    .from("categories")
    .select("name, description")
    .is("user_id", null)
    .order("name");

  const seed = defaults && defaults.length > 0 ? defaults : DEFAULT_TAG_SEED;

  if (seed.length > 0) {
    await supabase.from("categories").insert(
      seed.map((item) => ({
        user_id: userId,
        name: item.name,
        description: item.description ?? null,
      })),
    );
  }

  return { data: (await selectTagsFor(userId)) ?? [], error: null };
}

export async function createTag(params: {
  userId: string;
  name: string;
  description: string | null;
}): Promise<DataResult<Category>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: params.userId,
      name: params.name,
      description: params.description,
    })
    .select("id, name, description")
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "Unable to create tag." };
  }
  return { data: data as Category, error: null };
}

export async function updateTag(tag: Category): Promise<DataResult<true>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { error } = await supabase
    .from("categories")
    .update({
      name: tag.name.trim(),
      description: tag.description?.trim() || null,
    })
    .eq("id", tag.id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}

export async function deleteTag(tagId: string): Promise<DataResult<true>> {
  if (!supabase) return { data: null, error: NO_CLIENT };

  const { error } = await supabase.from("categories").delete().eq("id", tagId);
  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}
