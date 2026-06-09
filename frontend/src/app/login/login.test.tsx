import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Hoisted holders so the vi.mock factories (which are hoisted above imports)
// can reference them safely.
const h = vi.hoisted(() => ({ push: vi.fn(), searchParams: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push }),
  useSearchParams: () => new URLSearchParams(h.searchParams),
}));

vi.mock("@/lib/api", () => {
  class ApiError extends Error {}
  return { ApiError, authApi: { login: vi.fn() } };
});

vi.mock("@/lib/auth", () => ({
  saveSession: vi.fn(),
  pathForRole: (role: string) => (role === "ADMIN" ? "/admin" : "/concerts"),
}));

import LoginPage from "./page";
import { ApiError, authApi } from "@/lib/api";
import { saveSession } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
  h.searchParams = "";
});

describe("LoginPage", () => {
  it("labels the submit button for users by default", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: "Login as User" }),
    ).toBeInTheDocument();
  });

  it("labels the submit button for admins when ?as=admin", () => {
    h.searchParams = "as=admin";
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: "Login as Administrator" }),
    ).toBeInTheDocument();
  });

  it("saves the session and routes by role on success", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: "tok-123",
      user: { id: "1", name: "User", email: "user@example.com", role: "USER" },
    });

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: "Login as User" }));

    expect(authApi.login).toHaveBeenCalledWith("user@example.com", "password");
    expect(saveSession).toHaveBeenCalledWith("tok-123", expect.objectContaining({ role: "USER" }));
    expect(h.push).toHaveBeenCalledWith("/concerts");
  });

  it("surfaces a backend error message via an alert", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError("Invalid email or password"),
    );

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Login as User" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
    expect(saveSession).not.toHaveBeenCalled();
    expect(h.push).not.toHaveBeenCalled();
  });
});
