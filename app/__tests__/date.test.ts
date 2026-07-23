import { describe, expect, it } from "vitest";
import { hasEnded, toLocalInputValue } from "@/lib/date";

describe("toLocalInputValue", () => {
  it("returns an empty string for missing or unparseable input", () => {
    expect(toLocalInputValue(undefined)).toBe("");
    expect(toLocalInputValue("")).toBe("");
    expect(toLocalInputValue("not a date")).toBe("");
  });

  it("produces a datetime-local value the input element accepts", () => {
    expect(toLocalInputValue("2026-03-14T09:30:00Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });
});

describe("hasEnded", () => {
  const now = Date.parse("2026-03-14T12:00:00Z");

  it("treats a goal with no end date as still running", () => {
    expect(hasEnded(undefined, now)).toBe(false);
  });

  it("treats an unparseable end date as still running", () => {
    expect(hasEnded("garbage", now)).toBe(false);
  });

  it("is false before the end and true at or after it", () => {
    expect(hasEnded("2026-03-14T12:00:01Z", now)).toBe(false);
    expect(hasEnded("2026-03-14T12:00:00Z", now)).toBe(true);
    expect(hasEnded("2026-03-14T11:59:59Z", now)).toBe(true);
  });
});
