import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import TagsPage from "@/app/tags/page";

const mockSearchParams = {
  get: (key: string) => (key === "highlight" ? "Health" : null),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

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
      { id: "health", name: "Health", description: "Fitness" },
      { id: "career", name: "Career", description: "Work" },
    ],
    setCategories: vi.fn(),
    categoriesLoaded: true,
    setCategoriesLoaded: vi.fn(),
    setCategoriesUserId: vi.fn(),
    setCategoriesFromDb: vi.fn(),
    categoriesUserId: null,
    categoriesFromDb: false,
  }),
}));

vi.mock("@/lib/supabaseClient", () => ({ supabase: null }));

describe("Tags page", () => {
  it("opens create dialog when create tag is clicked", async () => {
    const user = userEvent.setup();
    render(<TagsPage />);

    await user.click(screen.getByRole("button", { name: /create tag/i }));
    expect(await screen.findByPlaceholderText(/tag name/i)).toBeInTheDocument();
  });

  it("opens edit dialog when a tag card is clicked", async () => {
    const user = userEvent.setup();
    render(<TagsPage />);

    await user.click(screen.getByRole("button", { name: /health/i }));
    expect(await screen.findByDisplayValue(/health/i)).toBeInTheDocument();
  });

  it("applies highlight class when navigated with highlight param", () => {
    render(<TagsPage />);
    const highlighted = screen.getByRole("button", { name: /health/i });
    expect(highlighted.className).toContain("tag-highlight");
  });
});
