import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalTable } from "@/components/goals/GoalTable";
import type { Goal } from "@/lib/types";

const goal = (id: string): Goal => ({
  id,
  title: `Goal ${id}`,
  createdAt: "2026-01-01T00:00:00.000Z",
  categories: [],
});

const baseProps = {
  loading: false,
  signedIn: true,
  isAuthed: true,
  clockTick: 0,
  onOpenGoal: vi.fn(),
  onOutcome: vi.fn(),
  onTagNavigate: vi.fn(),
};

describe("GoalTable heatmap scroll", () => {
  let scrollTop = 0;

  beforeEach(() => {
    scrollTop = 0;
    // jsdom has no layout, so fake a scrollable container.
    Object.defineProperty(HTMLDivElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 500,
    });
    Object.defineProperty(HTMLDivElement.prototype, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    delete (HTMLDivElement.prototype as Partial<HTMLDivElement>).scrollHeight;
    delete (HTMLDivElement.prototype as Partial<HTMLDivElement>).scrollTop;
    vi.restoreAllMocks();
  });

  it("does not scroll on mount even though the heatmap starts open", () => {
    render(<GoalTable {...baseProps} goals={[goal("a"), goal("b")]} heatmapOpen />);

    expect(scrollTop).toBe(0);
  });

  it("does not scroll when goals load in with the heatmap already open", () => {
    const view = render(<GoalTable {...baseProps} goals={[]} heatmapOpen />);

    view.rerender(
      <GoalTable {...baseProps} goals={[goal("a"), goal("b")]} heatmapOpen />,
    );

    expect(scrollTop).toBe(0);
  });

  it("does not scroll when a goal is added while the heatmap stays open", () => {
    const view = render(
      <GoalTable {...baseProps} goals={[goal("a")]} heatmapOpen />,
    );

    view.rerender(
      <GoalTable {...baseProps} goals={[goal("a"), goal("b")]} heatmapOpen />,
    );

    expect(scrollTop).toBe(0);
  });

  it("scrolls to the latest row when the heatmap is opened", () => {
    const goals = [goal("a"), goal("b")];
    const view = render(
      <GoalTable {...baseProps} goals={goals} heatmapOpen={false} />,
    );

    view.rerender(<GoalTable {...baseProps} goals={goals} heatmapOpen />);

    expect(scrollTop).toBe(500);
  });

  it("does not scroll when the heatmap is closed", () => {
    const goals = [goal("a"), goal("b")];
    const view = render(<GoalTable {...baseProps} goals={goals} heatmapOpen />);

    view.rerender(
      <GoalTable {...baseProps} goals={goals} heatmapOpen={false} />,
    );

    expect(scrollTop).toBe(0);
  });
});
