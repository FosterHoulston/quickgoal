"use client";

import { Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DailyGrid } from "@/lib/heatmap";

type GoalHeatmapProps = {
  grid: DailyGrid;
  open: boolean;
  onToggle: () => void;
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
};

const cellBackground = (
  passCount: number,
  failCount: number,
  maxTotal: number,
) => {
  const total = passCount + failCount;
  if (total === 0) return "var(--color-surface-subtle)";
  const passRatio = passCount / total;
  const intensity = Math.min(1, 0.35 + total / Math.max(1, maxTotal));
  const green = `rgb(var(--color-success-rgb) / ${intensity})`;
  const red = `rgb(var(--color-danger-rgb) / ${intensity})`;
  const split = Math.round(passRatio * 100);
  return `linear-gradient(90deg, ${green} ${split}%, ${red} ${split}%)`;
};

export function GoalHeatmap({
  grid,
  open,
  onToggle,
  availableYears,
  selectedYear,
  onYearChange,
}: GoalHeatmapProps) {
  return (
    <div
      className={`flex-shrink-0 px-6 ${
        open ? "border-t border-[color:var(--color-border)] py-3" : "pt-0 pb-3"
      }`}
    >
      {open ? (
        <div className="flex flex-wrap items-start justify-center gap-6 py-2">
          <div className="flex w-fit flex-wrap items-start gap-6">
            {grid.weeks.length === 0 ? (
              <div className="border border-dashed border-[color:var(--color-border)] p-6 text-sm text-[color:var(--color-text-muted)]">
                No completed goals yet. Mark a goal as passed or failed to see
                progress.
              </div>
            ) : (
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <div
                  className="grid grid-rows-7 gap-[6px] pt-[18px] text-xs text-[color:var(--color-text-muted)]"
                  style={{ gridTemplateRows: "repeat(7, 12px)" }}
                >
                  {["Mon", "Wed", "Fri"].map((day, index) => (
                    <span
                      key={day}
                      className="flex h-4.5 items-end pb-[0px] leading-none"
                      style={{ gridRowStart: 2 + index * 2 }}
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <div className="w-fit max-w-full">
                  <div className="mb-2 grid auto-cols-[12px] grid-flow-col gap-[6px] text-xs text-[color:var(--color-text-muted)]">
                    {grid.monthLabels.map((label) => (
                      <span
                        key={`${label.index}-${label.label}`}
                        style={{ gridColumnStart: label.index + 1 }}
                      >
                        {label.label}
                      </span>
                    ))}
                  </div>
                  <div className="grid auto-cols-[12px] grid-flow-col gap-[6px]">
                    {grid.weeks.map((week, weekIndex) => (
                      <div key={`week-${weekIndex}`} className="grid gap-[6px]">
                        {week.map((cell, dayIndex) => {
                          if (!cell) {
                            return (
                              <span
                                key={`empty-${weekIndex}-${dayIndex}`}
                                className="h-3 w-3 rounded-[4px]"
                              />
                            );
                          }
                          return (
                            <span
                              key={cell.key}
                              className="h-3 w-3 rounded-[4px] border border-[color:var(--color-border)]"
                              style={{
                                background: cellBackground(
                                  cell.passCount,
                                  cell.failCount,
                                  grid.maxTotal,
                                ),
                              }}
                              title={`${cell.label}: ${cell.passCount} passed, ${cell.failCount} failed`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[color:var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <span>Passed</span>
                      <div className="flex items-center gap-2">
                        {[1, 0.6, 0.5, 0.4, 0].map((passRatio, index) => {
                          const background =
                            passRatio === 1
                              ? "var(--color-success)"
                              : passRatio === 0
                                ? "var(--color-danger)"
                                : `linear-gradient(90deg, var(--color-success) ${Math.round(
                                    passRatio * 100,
                                  )}%, var(--color-danger) ${Math.round(
                                    passRatio * 100,
                                  )}%)`;
                          return (
                            <span
                              key={`pf-${index}`}
                              className="h-3 w-3 rounded-[4px] border border-[color:var(--color-border)]"
                              style={{ background }}
                            />
                          );
                        })}
                      </div>
                      <span>Failed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Less</span>
                      <div className="flex items-center gap-2">
                        {[0, 0.35, 0.55, 0.75, 1].map((step) => (
                          <span
                            key={`legend-${step}`}
                            className="h-3 w-3 rounded-[4px] border border-[color:var(--color-border)]"
                            style={{
                              background:
                                step === 0
                                  ? "var(--color-surface-subtle)"
                                  : `linear-gradient(90deg, rgb(var(--color-success-rgb) / ${step}) 50%, rgb(var(--color-danger-rgb) / ${step}) 50%)`,
                            }}
                          />
                        ))}
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-start justify-end">
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => onYearChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[88px] cursor-pointer justify-center rounded-full border-[color:var(--color-ink-20)] px-2 text-[10px] uppercase tracking-[0.2em]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-center border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] pt-3">
        <button
          type="button"
          onClick={onToggle}
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
            open
              ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
              : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-text)]"
          }`}
          aria-label={open ? "Collapse heatmap" : "Show heatmap"}
        >
          <Activity className="h-4 w-4" />
          <span>Heatmap</span>
        </button>
      </div>
    </div>
  );
}
