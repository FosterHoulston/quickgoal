import { beforeEach, describe, expect, it, vi } from "vitest";

const from = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({ supabase: { from: (...args: unknown[]) => from(...args) } }));

const { createGoal, mapGoalRow, updateGoal } = await import("@/lib/goals");

/** Minimal stand-in for the chained query builder, resolving to `result`. */
const builder = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  ["insert", "update", "delete", "select", "eq", "order", "is"].forEach((key) => {
    chain[key] = vi.fn(() => chain);
  });
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return chain;
};

beforeEach(() => {
  from.mockReset();
});

describe("mapGoalRow", () => {
  it("flattens the nested tag join into names and ids", () => {
    const goal = mapGoalRow({
      id: "g1",
      title: "Ship it",
      created_at: "2026-03-14T12:00:00Z",
      end_at: null,
      outcome: "passed",
      goal_categories: [
        { category_id: "c1", categories: { name: "Health" } },
        { category_id: "c2", categories: [{ name: "Career" }] },
      ],
    });

    expect(goal).toMatchObject({
      id: "g1",
      title: "Ship it",
      outcome: "passed",
      endAt: undefined,
      categoryIds: ["c1", "c2"],
      categories: ["Health", "Career"],
    });
  });

  it("tolerates a goal with no tag rows", () => {
    const goal = mapGoalRow({
      id: "g2",
      title: "Bare",
      created_at: "2026-03-14T12:00:00Z",
    });
    expect(goal.categories).toEqual([]);
    expect(goal.categoryIds).toEqual([]);
  });

  it("drops join rows whose category went missing", () => {
    const goal = mapGoalRow({
      id: "g3",
      title: "Partial",
      created_at: "2026-03-14T12:00:00Z",
      goal_categories: [
        { category_id: "c1", categories: null },
        { category_id: null, categories: { name: "Health" } },
      ],
    });
    expect(goal.categories).toEqual(["Health"]);
    expect(goal.categoryIds).toEqual(["c1"]);
  });
});

describe("createGoal", () => {
  const savedGoal = {
    data: {
      id: "g1",
      title: "Ship it",
      outcome: null,
      created_at: "2026-03-14T12:00:00Z",
      end_at: null,
    },
    error: null,
  };

  const params = {
    userId: "u1",
    title: "Ship it",
    createdAt: "2026-03-14T12:00:00Z",
    endAt: null,
    categoryIds: ["c1"],
    categoryNames: ["Health"],
    linkCategories: true,
  };

  it("reports the tags when the links are written", async () => {
    from
      .mockReturnValueOnce(builder(savedGoal))
      .mockReturnValueOnce(builder({ error: null }));

    const { data, error } = await createGoal(params);

    expect(error).toBeNull();
    expect(data?.categoriesLinked).toBe(true);
    expect(data?.goal.categories).toEqual(["Health"]);
    expect(data?.goal.categoryIds).toEqual(["c1"]);
  });

  it("keeps the goal but reports no tags when the links fail", async () => {
    from
      .mockReturnValueOnce(builder(savedGoal))
      .mockReturnValueOnce(builder({ error: { message: "rls denied" } }));

    const { data, error } = await createGoal(params);

    // The goal really was written, so it is still returned...
    expect(error).toBeNull();
    expect(data?.goal.id).toBe("g1");
    // ...but the tags never landed, so local state must not claim them.
    expect(data?.categoriesLinked).toBe(false);
    expect(data?.categoryError).toBe("rls denied");
    expect(data?.goal.categories).toEqual([]);
    expect(data?.goal.categoryIds).toEqual([]);
  });

  it("surfaces a failed goal insert as an error", async () => {
    from.mockReturnValueOnce(builder({ data: null, error: { message: "nope" } }));

    const { data, error } = await createGoal(params);

    expect(data).toBeNull();
    expect(error).toBe("nope");
  });
});

describe("updateGoal", () => {
  const params = {
    goalId: "g1",
    title: "Ship it",
    outcome: null,
    endAt: null,
    categoryIds: ["c1"],
    syncCategories: true,
  };

  it("reports linked when the tag rows are replaced cleanly", async () => {
    from
      .mockReturnValueOnce(builder({ error: null })) // goals update
      .mockReturnValueOnce(builder({ error: null })) // delete old links
      .mockReturnValueOnce(builder({ error: null })); // insert new links

    const { data } = await updateGoal(params);
    expect(data?.categoriesLinked).toBe(true);
  });

  it("reports unlinked when the old links were cleared but the new ones failed", async () => {
    from
      .mockReturnValueOnce(builder({ error: null }))
      .mockReturnValueOnce(builder({ error: null }))
      .mockReturnValueOnce(builder({ error: { message: "insert failed" } }));

    const { data } = await updateGoal(params);

    // The delete already happened, so the goal genuinely has no tags now.
    expect(data?.categoriesLinked).toBe(false);
    expect(data?.categoryError).toBe("insert failed");
  });

  it("skips tag work entirely when syncing is off", async () => {
    from.mockReturnValueOnce(builder({ error: null }));

    const { data } = await updateGoal({ ...params, syncCategories: false });

    expect(from).toHaveBeenCalledTimes(1);
    expect(data?.categoriesLinked).toBe(true);
  });
});
