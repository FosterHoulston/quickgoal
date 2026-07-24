import { describe, expect, it, vi } from "vitest";

// lib/tags also holds the Supabase-backed calls; the helpers under test are
// pure, so stub the client rather than warning about missing env vars.
vi.mock("@/lib/supabaseClient", () => ({ supabase: null }));

import {
  DEFAULT_CATEGORIES,
  DEFAULT_TAG_NAMES,
  DEFAULT_TAG_SEED,
  normalizeTag,
  toTagId,
} from "@/lib/tags";

describe("normalizeTag", () => {
  it("trims and lowercases", () => {
    expect(normalizeTag("  Health ")).toBe("health");
  });
});

describe("toTagId", () => {
  it("produces a slug safe for use as a DOM id", () => {
    expect(toTagId("Health")).toBe("health");
    expect(toTagId("Side Projects")).toBe("side-projects");
    expect(toTagId("  R&D!  ")).toBe("r-d");
  });
});

describe("default tags", () => {
  it("derives both shapes from one list", () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(DEFAULT_TAG_NAMES.length);
    expect(DEFAULT_TAG_SEED).toHaveLength(DEFAULT_TAG_NAMES.length);
    expect(DEFAULT_CATEGORIES.map((c) => c.name)).toEqual(DEFAULT_TAG_NAMES);
    expect(DEFAULT_TAG_SEED.map((t) => t.name)).toEqual(DEFAULT_TAG_NAMES);
  });

  it("keeps the ids the UI has always used", () => {
    expect(DEFAULT_CATEGORIES.map((c) => c.id)).toEqual([
      "health",
      "career",
      "learning",
      "finance",
      "relationships",
      "mindset",
      "creative",
    ]);
  });
});
