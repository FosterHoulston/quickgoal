"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTimestamp } from "@/lib/date";
import { useGoalForm } from "@/hooks/useGoalForm";
import type { Category } from "@/lib/types";

export type NewGoalValues = {
  title: string;
  createdAt: string;
  endAt: string | null;
  categoryIds: string[];
};

type NewGoalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  isAuthed: boolean;
  signedIn: boolean;
  saveNotice: string | null;
  goalsError: string | null;
  /** Persists the goal; resolves true on success so the form can reset. */
  onCreate: (values: NewGoalValues) => Promise<boolean>;
};

export function NewGoalDialog({
  open,
  onOpenChange,
  categories,
  isAuthed,
  signedIn,
  saveNotice,
  goalsError,
  onCreate,
}: NewGoalDialogProps) {
  const form = useGoalForm();
  const [draftStartedAt, setDraftStartedAt] = useState<Date | null>(null);
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);
  const newGoalInputRef = useRef<HTMLInputElement | null>(null);
  const tagButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const saveGoalButtonRef = useRef<HTMLButtonElement | null>(null);

  const canSave = form.title.trim().length > 0 && isAuthed;

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      newGoalInputRef.current?.focus();
    });
  }, [open]);

  const handleTitleChange = (value: string) => {
    if (!draftStartedAt && value.trim().length > 0) {
      setDraftStartedAt(new Date());
    }
    form.setTitle(value);
  };

  const resetForm = () => {
    form.reset();
    setDraftStartedAt(null);
  };

  const focusTagAt = (index: number) => {
    const clamped = Math.max(0, Math.min(categories.length - 1, index));
    setFocusedTagIndex(clamped);
    tagButtonRefs.current[clamped]?.focus();
  };

  const focusNearestTag = (direction: "left" | "right" | "up" | "down") => {
    const elements = tagButtonRefs.current
      .map((element, index) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          top: rect.top,
          centerX: rect.left + rect.width / 2,
        };
      })
      .filter(
        (item): item is { index: number; left: number; top: number; centerX: number } =>
          item !== null,
      );

    if (!elements.length) return;

    const rows: Array<{ top: number; items: typeof elements }> = [];
    const rowTolerance = 4;

    elements.forEach((item) => {
      const row = rows.find((candidate) => Math.abs(candidate.top - item.top) <= rowTolerance);
      if (row) {
        row.items.push(item);
      } else {
        rows.push({ top: item.top, items: [item] });
      }
    });

    rows.sort((a, b) => a.top - b.top);
    rows.forEach((row) => row.items.sort((a, b) => a.left - b.left));

    const currentRowIndex = rows.findIndex((row) =>
      row.items.some((item) => item.index === focusedTagIndex),
    );
    if (currentRowIndex === -1) return;

    const currentRow = rows[currentRowIndex];
    const currentColIndex = currentRow.items.findIndex(
      (item) => item.index === focusedTagIndex,
    );
    if (currentColIndex === -1) return;

    if (direction === "left") {
      if (currentColIndex > 0) focusTagAt(currentRow.items[currentColIndex - 1].index);
      return;
    }
    if (direction === "right") {
      if (currentColIndex < currentRow.items.length - 1) {
        focusTagAt(currentRow.items[currentColIndex + 1].index);
      }
      return;
    }

    const targetRowIndex =
      direction === "up" ? currentRowIndex - 1 : currentRowIndex + 1;
    const targetRow = rows[targetRowIndex];
    if (!targetRow) return;

    const currentCenterX = currentRow.items[currentColIndex].centerX;
    let best = targetRow.items[0];
    let bestDistance = Math.abs(best.centerX - currentCenterX);
    targetRow.items.forEach((item) => {
      const distance = Math.abs(item.centerX - currentCenterX);
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    });

    focusTagAt(best.index);
  };

  const handleSave = async () => {
    if (!canSave) return;
    const created = await onCreate({
      title: form.title.trim(),
      createdAt: (draftStartedAt ?? new Date()).toISOString(),
      endAt: form.endAtISO(),
      categoryIds: form.selectedCategories,
    });
    if (created) resetForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setFocusedTagIndex(0);
      }}
    >
      <DialogContent
        showCloseButton={false}
        disableOutsidePointerEvents={false}
        className="w-full max-w-2xl rounded-3xl border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-modal)]"
      >
        <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-3 text-left">
          <div>
            <DialogTitle>New goal</DialogTitle>
            {draftStartedAt ? (
              <DialogDescription className="text-xs text-[color:var(--color-text-muted)]">
                Started {formatTimestamp(draftStartedAt)}
              </DialogDescription>
            ) : (
              <DialogDescription className="text-xs text-[color:var(--color-text-muted)]">
                Start typing to timestamp
              </DialogDescription>
            )}
          </div>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="rounded-full border-[color:var(--color-border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]"
          >
            Close
          </Button>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">Goal</span>
            <Input
              ref={newGoalInputRef}
              value={form.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Write a clear, short goal..."
              disabled={!isAuthed}
              className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-base shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)] disabled:bg-[color:var(--color-surface-subtle)]"
            />
          </label>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={form.toggleEndAt}
              aria-pressed={form.hasEndAt}
              disabled={!isAuthed}
              tabIndex={0}
              variant="outline"
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                form.hasEndAt
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                  : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span>End date/time</span>
              <span className="text-xs uppercase tracking-[0.2em]">
                {form.hasEndAt ? "On" : "Off"}
              </span>
            </Button>
            {form.hasEndAt ? (
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => form.setEndAt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Tab" && !event.shiftKey) {
                    event.preventDefault();
                    focusTagAt(0);
                  }
                }}
                disabled={!isAuthed}
                className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)] disabled:bg-[color:var(--color-surface-subtle)]"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">
              Categories
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="listbox"
              aria-multiselectable="true"
              aria-label="Goal categories"
              onKeyDown={(event) => {
                if (!categories.length) return;
                if (event.key === "Tab" && !event.shiftKey) {
                  event.preventDefault();
                  saveGoalButtonRef.current?.focus();
                  return;
                }
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  focusNearestTag(event.key === "ArrowRight" ? "right" : "down");
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  focusNearestTag(event.key === "ArrowLeft" ? "left" : "up");
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  focusTagAt(0);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  focusTagAt(categories.length - 1);
                }
              }}
            >
              {categories.map((category, index) => {
                const selected = form.selectedCategories.includes(category.id);
                const clampedIndex = Math.min(
                  focusedTagIndex,
                  Math.max(categories.length - 1, 0),
                );
                return (
                  <Button
                    key={category.id}
                    type="button"
                    onClick={() => form.toggleCategory(category.id)}
                    onFocus={() => setFocusedTagIndex(index)}
                    aria-pressed={selected}
                    disabled={!isAuthed}
                    tabIndex={index === clampedIndex ? 0 : -1}
                    ref={(element) => {
                      tagButtonRefs.current[index] = element;
                    }}
                    variant="outline"
                    className={`h-auto rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      selected
                        ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                        : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-accent)]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              ref={saveGoalButtonRef}
              className="rounded-full bg-[color:var(--color-button)] px-6 py-3 text-sm font-semibold text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-text-disabled)]"
            >
              Save goal
            </Button>
            <Button
              type="button"
              onClick={resetForm}
              variant="outline"
              className="rounded-full border-[color:var(--color-ink)] px-5 py-3 text-sm font-medium text-[color:var(--color-text)] transition hover:border-[color:var(--color-accent)]"
            >
              Clear
            </Button>
            <span className="text-xs text-[color:var(--color-text-muted)]">
              {signedIn
                ? "Goals are timestamped on first input."
                : "Sign in to save goals."}
            </span>
            {saveNotice ? (
              <span className="text-xs text-[color:var(--color-accent)]">{saveNotice}</span>
            ) : null}
            {goalsError ? (
              <span className="text-xs text-[color:var(--color-danger-strong)]">{goalsError}</span>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
