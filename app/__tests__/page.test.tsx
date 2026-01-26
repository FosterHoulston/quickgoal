import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/lib/supabaseClient", () => ({ supabase: null }));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    session: { user: { id: "user-1", email: "test@example.com" } },
    authReady: true,
  }),
}));

vi.mock("@/components/GoalDataProvider", () => ({
  useGoalData: () => ({
    categories: [
      { id: "health", name: "Health" },
      { id: "career", name: "Career" },
    ],
    setCategories: vi.fn(),
    categoriesLoaded: true,
    setCategoriesLoaded: vi.fn(),
    categoriesFromDb: false,
    setCategoriesFromDb: vi.fn(),
    categoriesUserId: null,
    setCategoriesUserId: vi.fn(),
    goals: [
      {
        id: "goal-1",
        title: "First goal",
        createdAt: new Date().toISOString(),
        categories: ["Health"],
      },
    ],
    setGoals: vi.fn(),
    goalsLoaded: true,
    setGoalsLoaded: vi.fn(),
    goalsUserId: null,
    setGoalsUserId: vi.fn(),
  }),
}));

describe("Dashboard page", () => {
  it("disables save until a goal title is entered", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /create goal/i }));
    const saveButton = screen.getByRole("button", { name: /save goal/i });
    expect(saveButton).toBeDisabled();

    const input = screen.getByPlaceholderText(/write a clear, short goal/i);
    await user.type(input, "Ship tests");
    expect(saveButton).toBeEnabled();
  });

  it("toggles heatmap visibility", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(screen.getByText(/passed/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /heatmap/i }));
    expect(screen.queryByText(/passed/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /heatmap/i }));
    expect(screen.getByText(/passed/i)).toBeInTheDocument();
  });

  it("shows end date input when toggled on", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /create goal/i }));
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();

    await user.click(screen.getByRole("button", { name: /end date\/time/i }));
    expect(document.querySelector('input[type="datetime-local"]')).toBeTruthy();
  });

  it("opens edit dialog when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /first goal/i }));
    expect(screen.getByText(/edit goal/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/first goal/i)).toBeInTheDocument();
  });

  it("shows hover actions after delay", async () => {
    vi.useFakeTimers();
    render(<Home />);

    const row = screen.getByRole("button", { name: /first goal/i });

    await act(async () => {
      fireEvent.mouseEnter(row);
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByRole("button", { name: /^pass$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^fail$/i })).toBeInTheDocument();
    vi.useRealTimers();
  });
});
