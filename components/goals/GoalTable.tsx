"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimestamp, hasEnded } from "@/lib/date";
import type { Goal } from "@/lib/types";

const HOVER_CARD_DELAY = 800;

type GoalTableProps = {
  goals: Goal[];
  loading: boolean;
  signedIn: boolean;
  isAuthed: boolean;
  clockTick: number;
  /** Toggled by the heatmap; opening it scrolls the table to the latest row. */
  scrollToBottomKey: boolean;
  onOpenGoal: (goal: Goal) => void;
  onOutcome: (goalId: string, outcome: "passed" | "failed") => void;
  onTagNavigate: (tag: string) => void;
};

export function GoalTable({
  goals,
  loading,
  signedIn,
  isAuthed,
  clockTick,
  scrollToBottomKey,
  onOpenGoal,
  onOutcome,
  onTagNavigate,
}: GoalTableProps) {
  const [hoverCard, setHoverCard] = useState<{ id: string; top: number } | null>(
    null,
  );
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoverHideTimeoutRef = useRef<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollToBottomKey) return;
    const container = tableContainerRef.current;
    if (!container) return;
    window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [scrollToBottomKey, goals.length]);

  // Clear any pending hover timers when the table unmounts.
  useEffect(
    () => () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
      if (hoverHideTimeoutRef.current)
        window.clearTimeout(hoverHideTimeoutRef.current);
    },
    [],
  );

  const handleRowEnter = (goalId: string, target: HTMLTableRowElement) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      const container = tableContainerRef.current;
      if (container) {
        const rowRect = target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = rowRect.top - containerRect.top;
        setHoverCard({ id: goalId, top });
      } else {
        setHoverCard({ id: goalId, top: 0 });
      }
    }, HOVER_CARD_DELAY);
  };

  const handleRowLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (hoverHideTimeoutRef.current) {
      window.clearTimeout(hoverHideTimeoutRef.current);
    }
    hoverHideTimeoutRef.current = window.setTimeout(() => {
      setHoverCard(null);
    }, 150);
  };

  if (loading) {
    return (
      <div className="px-6 py-4 text-sm text-[color:var(--color-text-muted)]">
        Loading goals...
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="px-6 py-4 text-sm text-[color:var(--color-text-muted)]">
        {signedIn
          ? "No goals yet. Use Create goal to add one."
          : "Sign in to view your goals."}
      </div>
    );
  }

  const hoveredGoal = hoverCard
    ? goals.find((item) => item.id === hoverCard.id)
    : undefined;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={tableContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[color:var(--color-surface-alt)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
            <tr>
              <th className="w-[40%] px-4 py-2.5 font-medium">Goal</th>
              <th className="w-[20%] px-4 py-2.5 font-medium">Start</th>
              <th className="w-[20%] px-4 py-2.5 font-medium">End</th>
              <th className="w-[20%] px-4 py-2.5 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr
                key={goal.id}
                role="button"
                tabIndex={isAuthed ? 0 : -1}
                onClick={() => {
                  if (!isAuthed) return;
                  onOpenGoal(goal);
                }}
                onMouseEnter={(event) =>
                  handleRowEnter(goal.id, event.currentTarget)
                }
                onMouseLeave={handleRowLeave}
                onKeyDown={(event) => {
                  if (!isAuthed) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenGoal(goal);
                  }
                }}
                aria-disabled={!isAuthed}
                className={`h-11 cursor-pointer border-t border-[color:var(--color-surface-subtle)] align-middle transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring-40)] ${
                  goal.outcome === "passed"
                    ? "shadow-[inset_4px_0_0_0_var(--color-accent)] hover:bg-[color:var(--color-success-soft)]"
                    : goal.outcome === "failed"
                      ? "shadow-[inset_4px_0_0_0_var(--color-danger-strong)] hover:bg-[color:var(--color-danger-soft-2)]"
                      : "hover:bg-[color:var(--color-surface-muted)]"
                }`}
              >
                <td className="px-4 py-2 text-[color:var(--color-text)]">
                  <div className="flex items-center gap-2 truncate font-semibold">
                    {goal.outcome === "passed" ? (
                      <span
                        className="text-[color:var(--color-accent)]"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    ) : goal.outcome === "failed" ? (
                      <span
                        className="text-[color:var(--color-danger-strong)]"
                        aria-hidden="true"
                      >
                        x
                      </span>
                    ) : null}
                    <span className="truncate">{goal.title}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-[color:var(--color-text-muted)]">
                  {formatTimestamp(goal.createdAt)}
                </td>
                <td className="px-4 py-2 text-xs text-[color:var(--color-text-muted)]">
                  {goal.endAt ? (
                    <span className="truncate">{formatTimestamp(goal.endAt)}</span>
                  ) : (
                    <span className="text-[color:var(--color-text-disabled)]">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-[10px] text-[color:var(--color-text-muted)]">
                  {goal.categories.length > 0 ? (
                    <div className="flex items-center gap-1.5 truncate uppercase tracking-[0.16em]">
                      {goal.categories.slice(0, 2).map((category, index) => (
                        <span
                          key={`${goal.id}-${category}-${index}`}
                          className="truncate"
                        >
                          {category}
                        </span>
                      ))}
                      {goal.categories.length > 2 ? (
                        <span className="shrink-0">
                          +{goal.categories.length - 2}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="uppercase tracking-[0.16em]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hoverCard && hoveredGoal ? (
        <div
          className="pointer-events-auto absolute left-4 right-4 z-20"
          style={{ top: hoverCard.top + 6 }}
          onMouseEnter={() => {
            if (hoverHideTimeoutRef.current) {
              window.clearTimeout(hoverHideTimeoutRef.current);
              hoverHideTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleRowLeave}
        >
          <div
            role="presentation"
            onClick={() => {
              if (!isAuthed) return;
              onOpenGoal(hoveredGoal);
            }}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">
                {hoveredGoal.title}
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                {hoveredGoal.outcome
                  ? hoveredGoal.outcome === "passed"
                    ? "Passed"
                    : "Failed"
                  : "Unscored"}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[color:var(--color-text-muted)]">
              <span>Started {formatTimestamp(hoveredGoal.createdAt)}</span>
              {hoveredGoal.endAt ? (
                <span>
                  {hasEnded(hoveredGoal.endAt, clockTick)
                    ? `Ended ${formatTimestamp(hoveredGoal.endAt)}`
                    : `Ends ${formatTimestamp(hoveredGoal.endAt)}`}
                </span>
              ) : (
                <span>No end date</span>
              )}
            </div>
            {hoveredGoal.categories.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                {hoveredGoal.categories.map((category, index) => (
                  <button
                    key={`${hoveredGoal.id}-${category}-${index}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onTagNavigate(category);
                    }}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant="outline"
                      className="rounded-full border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-0.5 uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)] transition hover:border-[color:var(--color-accent)]"
                    >
                      {category}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : null}
            {!hoveredGoal.outcome ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOutcome(hoveredGoal.id, "passed");
                  }}
                  disabled={!isAuthed}
                  variant="outline"
                  className="h-auto rounded-full border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-1 uppercase tracking-[0.14em] text-[color:var(--color-accent)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pass
                </Button>
                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOutcome(hoveredGoal.id, "failed");
                  }}
                  disabled={!isAuthed}
                  variant="outline"
                  className="h-auto rounded-full border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] px-3 py-1 uppercase tracking-[0.14em] text-[color:var(--color-danger-strong)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fail
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
