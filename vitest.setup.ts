import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}
