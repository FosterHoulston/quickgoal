import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewGoalDialog } from "@/components/goals/NewGoalDialog";
import { EditGoalDialog } from "@/components/goals/EditGoalDialog";
import type { Category, Goal } from "@/lib/types";

const categories: Category[] = [
  { id: "health", name: "Health" },
  { id: "career", name: "Career" },
];

describe("NewGoalDialog", () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    categories,
    isAuthed: true,
    signedIn: true,
    saveNotice: null,
    goalsError: null,
  };

  it("keeps Save disabled until a title is entered", async () => {
    const user = userEvent.setup();
    render(<NewGoalDialog {...baseProps} onCreate={vi.fn()} />);

    const save = screen.getByRole("button", { name: /save goal/i });
    expect(save).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/write a clear, short goal/i),
      "Ship it",
    );
    expect(save).toBeEnabled();
  });

  it("submits the trimmed title and selected categories, then resets on success", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<NewGoalDialog {...baseProps} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/write a clear, short goal/i);
    await user.type(input, "  Ship it  ");
    await user.click(screen.getByRole("button", { name: /health/i }));
    await user.click(screen.getByRole("button", { name: /save goal/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const values = onCreate.mock.calls[0][0];
    expect(values.title).toBe("Ship it");
    expect(values.categoryIds).toEqual(["health"]);
    expect(values.endAt).toBeNull();

    // onCreate resolved true, so the form clears itself.
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("does not reset when creation fails", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(false);
    render(<NewGoalDialog {...baseProps} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/write a clear, short goal/i);
    await user.type(input, "Ship it");
    await user.click(screen.getByRole("button", { name: /save goal/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(input).toHaveValue("Ship it");
  });

  it("reveals the end-date input when the toggle is on", async () => {
    const user = userEvent.setup();
    render(<NewGoalDialog {...baseProps} onCreate={vi.fn()} />);

    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
    await user.click(screen.getByRole("button", { name: /end date\/time/i }));
    expect(document.querySelector('input[type="datetime-local"]')).toBeTruthy();
  });
});

describe("EditGoalDialog", () => {
  const goal: Goal = {
    id: "g1",
    title: "First goal",
    createdAt: "2026-03-14T12:00:00Z",
    outcome: "passed",
    categories: ["Health"],
    categoryIds: ["health"],
  };

  const baseProps = {
    categories,
    categoriesFromDb: true,
    saving: false,
    deleting: false,
    onClose: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders nothing when there is no goal", () => {
    render(<EditGoalDialog {...baseProps} goal={null} onSubmit={vi.fn()} />);
    expect(screen.queryByText(/edit goal/i)).not.toBeInTheDocument();
  });

  it("seeds the form from the goal and submits the collected values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EditGoalDialog {...baseProps} goal={goal} onSubmit={onSubmit} />);

    expect(screen.getByDisplayValue("First goal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: "First goal",
      outcome: "passed",
      categoryIds: ["health"],
    });
  });

  it("lets the outcome be changed before saving", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EditGoalDialog {...baseProps} goal={goal} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /^fail$/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onSubmit.mock.calls[0][0].outcome).toBe("failed");
  });
});
