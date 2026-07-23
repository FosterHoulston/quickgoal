import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "@/components/ToastProvider";

function Trigger({ message, tone }: { message: string; tone?: "success" | "error" }) {
  const { pushToast } = useToast();
  return (
    <button type="button" onClick={() => pushToast(message, tone)}>
      push
    </button>
  );
}

const renderWithProvider = (ui: React.ReactNode) =>
  render(<ToastProvider>{ui}</ToastProvider>);

describe("ToastProvider", () => {
  it("shows a pushed toast and auto-dismisses it", () => {
    vi.useFakeTimers();
    renderWithProvider(<Trigger message="Goal created." />);

    act(() => {
      screen.getByRole("button", { name: "push" }).click();
    });
    expect(screen.getByText("Goal created.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText("Goal created.")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("stacks multiple toasts", () => {
    vi.useFakeTimers();
    renderWithProvider(
      <>
        <Trigger message="First" />
        <Trigger message="Second" tone="error" />
      </>,
    );

    const [first, second] = screen.getAllByRole("button", { name: "push" });
    act(() => {
      first.click();
      second.click();
    });

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("applies the tone styling", () => {
    vi.useFakeTimers();
    renderWithProvider(<Trigger message="Nope" tone="error" />);

    act(() => {
      screen.getByRole("button", { name: "push" }).click();
    });
    expect(screen.getByText("Nope").className).toContain("color-danger-strong");

    vi.useRealTimers();
  });

  it("throws when used outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger message="orphan" />)).toThrow(
      /useToast must be used within ToastProvider/,
    );
    consoleError.mockRestore();
  });
});
