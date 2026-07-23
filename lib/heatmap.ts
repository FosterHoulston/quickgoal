import type { Goal } from "@/lib/types";

export type HeatmapCell = {
  key: string;
  label: string;
  passCount: number;
  failCount: number;
};

export const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const buildDailyGrid = (goals: Goal[], year: number) => {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const start = new Date(yearStart);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(yearEnd);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const days: HeatmapCell[] = [];
  const map = new Map<string, HeatmapCell>();
  goals.forEach((goal) => {
    if (!goal.outcome) return;
    const date = new Date(goal.createdAt);
    if (Number.isNaN(date.getTime())) return;
    if (date.getFullYear() !== year) return;
    date.setHours(0, 0, 0, 0);
    const key = formatDateKey(date);
    const existing = map.get(key) ?? {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      passCount: 0,
      failCount: 0,
    };
    if (goal.outcome === "passed") {
      existing.passCount += 1;
    } else {
      existing.failCount += 1;
    }
    map.set(key, existing);
  });

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatDateKey(d);
    days.push(
      map.get(key) ?? {
        key,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        passCount: 0,
        failCount: 0,
      },
    );
  }

  const weeks: (HeatmapCell | null)[][] = [];
  const weekStartDates: Date[] = [];
  const monthFirstWeekIndex = new Map<number, number>();
  let maxTotal = 0;
  days.forEach((cell, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + weekIndex * 7);
      weekStartDates[weekIndex] = weekStart;
    }
    weeks[weekIndex].push(cell);
    const total = cell.passCount + cell.failCount;
    if (total > maxTotal) maxTotal = total;

    const date = new Date(cell.key);
    if (date >= yearStart && date <= yearEnd && !monthFirstWeekIndex.has(date.getMonth())) {
      monthFirstWeekIndex.set(date.getMonth(), weekIndex);
    }
  });

  weeks.forEach((week) => {
    week.forEach((cell, index) => {
      if (!cell) return;
      const date = new Date(cell.key);
      if (date < yearStart || date > yearEnd) {
        week[index] = null;
      }
    });
  });

  const monthLabels: { index: number; label: string }[] = [];
  for (let month = 0; month < 12; month += 1) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const weekIndex = weekStartDates.findIndex(
      (date) => date >= monthStart && date <= monthEnd,
    );
    if (weekIndex === -1) continue;
    monthLabels.push({
      index: weekIndex,
      label: monthStart.toLocaleDateString(undefined, { month: "short" }),
    });
  }

  return { weeks, monthLabels, maxTotal };
};
