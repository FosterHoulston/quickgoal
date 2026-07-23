import type { Category } from "@/lib/types";

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
