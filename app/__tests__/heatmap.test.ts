import { describe, expect, it } from "vitest";
import { buildDailyGrid } from "@/lib/heatmap";
import type { Goal } from "@/lib/types";

const goal = (overrides: Partial<Goal>): Goal => ({
  id: crypto.randomUUID(),
  title: "Goal",
  createdAt: "2026-03-14T12:00:00",
  categories: [],
  ...overrides,
});

describe("buildDailyGrid", () => {
  it("lays the year out in full weeks of seven days", () => {
    const { weeks } = buildDailyGrid([], 2026);
    expect(weeks.length).toBeGreaterThanOrEqual(52);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it("labels every month that appears in the year", () => {
    const { monthLabels } = buildDailyGrid([], 2026);
    expect(monthLabels).toHaveLength(12);
    expect(monthLabels[0].label).toBe("Jan");
  });

  it("ignores goals with no outcome", () => {
    const { maxTotal } = buildDailyGrid([goal({})], 2026);
    expect(maxTotal).toBe(0);
  });

  it("ignores goals from other years", () => {
    const { maxTotal } = buildDailyGrid(
      [goal({ createdAt: "2025-03-14T12:00:00", outcome: "passed" })],
      2026,
    );
    expect(maxTotal).toBe(0);
  });

  it("ignores goals with an unparseable created date", () => {
    const { maxTotal } = buildDailyGrid(
      [goal({ createdAt: "garbage", outcome: "passed" })],
      2026,
    );
    expect(maxTotal).toBe(0);
  });

  it("tallies passes and failures that land on the same day", () => {
    const { weeks, maxTotal } = buildDailyGrid(
      [
        goal({ createdAt: "2026-03-14T09:00:00", outcome: "passed" }),
        goal({ createdAt: "2026-03-14T17:00:00", outcome: "passed" }),
        goal({ createdAt: "2026-03-14T21:00:00", outcome: "failed" }),
      ],
      2026,
    );

    expect(maxTotal).toBe(3);

    const cells = weeks.flat().filter((cell) => cell !== null);
    const marked = cells.filter(
      (cell) => cell.passCount + cell.failCount > 0,
    );
    expect(marked).toHaveLength(1);
    expect(marked[0]).toMatchObject({ passCount: 2, failCount: 1 });
  });

  it("blanks out padding days that belong to a neighbouring year", () => {
    const { weeks } = buildDailyGrid([], 2026);
    const dates = weeks
      .flat()
      .filter((cell) => cell !== null)
      .map((cell) => cell.key);
    dates.forEach((key) => expect(key.startsWith("2026-")).toBe(true));
  });
});
