import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseChangelog } from "@/lib/changelog";

const SAMPLE = `# Changelog

All notable changes to this project will be documented in this file.

## v1.0.2 - 2026-09-12
### Fixes
- Goal table no longer jumps to the bottom of the list on load,
  or when a goal is added.

## v1.0.1 - 2026-02-07
Keyboard and input handling in the goal-creation form. (#6)
### Fixes
- Tags can be navigated with the arrow keys.

## v1.0.0 - 2026-01-26
- Initial public release.
### FEATURES
- Google sign-in with Supabase authentication.

### Fixes
- Create-Tag form not closing. (#1)
`;

describe("parseChangelog", () => {
  it("reads releases newest-first and skips the file preamble", () => {
    const releases = parseChangelog(SAMPLE);

    expect(releases.map((release) => release.version)).toEqual([
      "v1.0.2",
      "v1.0.1",
      "v1.0.0",
    ]);
  });

  it("formats the release date", () => {
    const [latest] = parseChangelog(SAMPLE);

    expect(latest.date).toBe("Sep 12, 2026");
  });

  it("joins bullets that wrap across lines", () => {
    const [latest] = parseChangelog(SAMPLE);

    expect(latest.sections).toEqual([
      {
        title: "Fixes",
        items: [
          "Goal table no longer jumps to the bottom of the list on load, or when a goal is added.",
        ],
      },
    ]);
  });

  it("keeps a release's prose summary as an overview section", () => {
    const [, patch] = parseChangelog(SAMPLE);

    expect(patch.sections[0]).toEqual({
      title: "Overview",
      items: ["Keyboard and input handling in the goal-creation form. (#6)"],
    });
    expect(patch.sections[1].title).toBe("Fixes");
  });

  it("groups a leading bullet and normalizes section-title casing", () => {
    const release = parseChangelog(SAMPLE)[2];

    expect(release.sections.map((section) => section.title)).toEqual([
      "Overview",
      "Features",
      "Fixes",
    ]);
    expect(release.sections[0].items).toEqual(["Initial public release."]);
  });

  it("parses the project's real CHANGELOG.md", () => {
    const markdown = readFileSync(
      join(process.cwd(), "CHANGELOG.md"),
      "utf8",
    );
    const releases = parseChangelog(markdown);

    expect(releases.length).toBeGreaterThanOrEqual(3);
    for (const release of releases) {
      expect(release.version).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(release.date).not.toBe("");
      expect(release.sections.length).toBeGreaterThan(0);
      for (const section of release.sections) {
        expect(section.items.length).toBeGreaterThan(0);
      }
    }
  });
});
