"use client";

import { useState } from "react";
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
import { goalToFormValues, useGoalForm } from "@/hooks/useGoalForm";
import type { Category, Goal } from "@/lib/types";

export type EditGoalValues = {
  title: string;
  outcome: "passed" | "failed" | null;
  endAt: string | null;
  categoryIds: string[];
};

type EditGoalDialogProps = {
  goal: Goal | null;
  categories: Category[];
  categoriesFromDb: boolean;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onSubmit: (values: EditGoalValues) => void;
  onDelete: () => void;
};

export function EditGoalDialog({
  goal,
  categories,
  categoriesFromDb,
  saving,
  deleting,
  onClose,
  onSubmit,
  onDelete,
}: EditGoalDialogProps) {
  return (
    <Dialog
      open={!!goal}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {goal ? (
        // Keyed on the goal so switching rows re-seeds the form from scratch.
        <EditGoalForm
          key={goal.id}
          goal={goal}
          categories={categories}
          categoriesFromDb={categoriesFromDb}
          saving={saving}
          deleting={deleting}
          onClose={onClose}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      ) : null}
    </Dialog>
  );
}

function EditGoalForm({
  goal,
  categories,
  categoriesFromDb,
  saving,
  deleting,
  onClose,
  onSubmit,
  onDelete,
}: EditGoalDialogProps & { goal: Goal }) {
  const form = useGoalForm(goalToFormValues(goal, categoriesFromDb, categories));
  const [outcome, setOutcome] = useState<"passed" | "failed" | null>(
    goal.outcome ?? null,
  );

  const handleSave = () => {
    onSubmit({
      title: form.title.trim(),
      outcome,
      endAt: form.endAtISO(),
      categoryIds: form.selectedCategories,
    });
  };

  return (
    <DialogContent
      showCloseButton={false}
      disableOutsidePointerEvents={false}
      className="w-full max-w-2xl rounded-3xl border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-modal)]"
    >
      <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <DialogTitle>Edit goal</DialogTitle>
          <DialogDescription className="text-xs text-[color:var(--color-text-muted)]">
            Started {formatTimestamp(goal.createdAt)}
          </DialogDescription>
        </div>
        <Button
          type="button"
          onClick={onClose}
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
            value={form.title}
            onChange={(event) => form.setTitle(event.target.value)}
            placeholder="Update your goal..."
            className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-base shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)]"
          />
        </label>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">
            Outcome
          </span>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setOutcome("passed")}
              aria-pressed={outcome === "passed"}
              variant="outline"
              className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.14em] transition ${
                outcome === "passed"
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                  : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-accent)]"
              }`}
            >
              Pass
            </Button>
            <Button
              type="button"
              onClick={() => setOutcome("failed")}
              aria-pressed={outcome === "failed"}
              variant="outline"
              className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.14em] transition ${
                outcome === "failed"
                  ? "border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-strong)]"
                  : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-danger-strong)]"
              }`}
            >
              Fail
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={form.toggleEndAt}
            aria-pressed={form.hasEndAt}
            variant="outline"
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              form.hasEndAt
                ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]"
            }`}
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
              className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)]"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-[color:var(--color-text-subtle)]">
            Categories
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = form.selectedCategories.includes(category.id);
              return (
                <Button
                  key={category.id}
                  type="button"
                  onClick={() => form.toggleCategory(category.id)}
                  aria-pressed={selected}
                  variant="outline"
                  className={`h-auto rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    selected
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                      : "border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)] hover:border-[color:var(--color-accent)]"
                  }`}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || form.title.trim().length === 0}
            className="rounded-full bg-[color:var(--color-button)] px-6 py-3 text-sm font-semibold text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-text-disabled)]"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            variant="outline"
            className="rounded-full border-[color:var(--color-border)] px-5 py-3 text-sm font-medium text-[color:var(--color-text-subtle)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </Button>
        </div>
        <Button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          variant="outline"
          className="rounded-full border-[color:var(--color-border)] px-5 py-3 text-sm font-medium text-[color:var(--color-danger-strong)] transition hover:border-[color:var(--color-danger-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete goal"}
        </Button>
      </div>
    </DialogContent>
  );
}
