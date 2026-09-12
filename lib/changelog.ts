export type ReleaseSection = {
  title: string;
  items: string[];
};

export type Release = {
  version: string;
  date: string;
  sections: ReleaseSection[];
};

/** Bullets or prose sitting under a release heading before any `###` section. */
const LEADING_SECTION_TITLE = "Overview";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * "2026-09-12" -> "Sep 12, 2026". Formatted from the parts rather than via Date,
 * so a timezone behind UTC can't shift the release back a day.
 */
const formatReleaseDate = (value: string) => {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;
  const [, year, month, day] = match;
  const name = MONTHS[Number(month) - 1];
  if (!name) return trimmed;
  return `${name} ${Number(day)}, ${year}`;
};

// The log mixes "### FEATURES" and "### Fixes"; normalize so the data is even.
const toTitleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/**
 * Parses CHANGELOG.md into the releases the UI renders. Kept deliberately small:
 * it understands the shape this repo actually writes (`## vX.Y.Z - YYYY-MM-DD`,
 * `### Section`, `-` bullets with wrapped continuation lines), not Markdown at
 * large. Releases come back in file order, newest first.
 */
export const parseChangelog = (markdown: string): Release[] => {
  const releases: Release[] = [];
  let current: Release | null = null;
  let section: ReleaseSection | null = null;

  const sectionFor = (title: string) => {
    if (!current) return null;
    const existing = current.sections.find((item) => item.title === title);
    if (existing) return existing;
    const created: ReleaseSection = { title, items: [] };
    current.sections.push(created);
    return created;
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();

    const sectionHeading = /^###\s+(.+)$/.exec(line);
    if (sectionHeading) {
      section = sectionFor(toTitleCase(sectionHeading[1].trim()));
      continue;
    }

    const releaseHeading = /^##\s+(.+)$/.exec(line);
    if (releaseHeading) {
      const [version, date] = releaseHeading[1].split(/\s+-\s+/);
      current = {
        version: version.trim(),
        date: date ? formatReleaseDate(date) : "",
        sections: [],
      };
      releases.push(current);
      section = null;
      continue;
    }

    // Anything above the first release heading is the file's preamble.
    if (!current) continue;
    if (!line) continue;

    const bullet = /^-\s+(.*)$/.exec(line);
    if (bullet) {
      section = section ?? sectionFor(LEADING_SECTION_TITLE);
      section?.items.push(bullet[1].trim());
      continue;
    }

    // Indented text continues the bullet above it.
    if (section && section.items.length > 0 && /^\s/.test(rawLine)) {
      section.items[section.items.length - 1] += ` ${line}`;
      continue;
    }

    // Unindented prose under a release heading: a one-line summary.
    const lead = sectionFor(LEADING_SECTION_TITLE);
    lead?.items.push(line);
    section = section ?? lead;
  }

  return releases;
};
