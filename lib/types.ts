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
