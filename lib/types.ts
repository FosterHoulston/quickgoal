export type Goal = {
  id: string;
  title: string;
  createdAt: string;
  endAt?: string;
  outcome?: "passed" | "failed";
  categoryIds?: string[];
  categories: string[];
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
};

/** Outcome of a data-layer call: either data, or a message safe to surface. */
export type DataResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };
