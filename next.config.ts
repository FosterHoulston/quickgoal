import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";
import { parseChangelog } from "./lib/changelog";
import { version } from "./package.json";

// Both values are read at build time so the UI can't drift from the real
// release: the version comes from package.json, the notes from CHANGELOG.md.
const changelog = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${version}`,
    NEXT_PUBLIC_RELEASE_NOTES: JSON.stringify(parseChangelog(changelog)),
  },
};

export default nextConfig;
