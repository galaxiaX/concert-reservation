import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthField } from "./AuthField";

describe("AuthField", () => {
  it("associates the label with the input", () => {
    render(
      <AuthField
        id="email"
        label="Email"
        type="email"
        icon="user"
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("toggles password visibility with the reveal button", async () => {
    render(
      <AuthField
        id="password"
        label="Password"
        type="password"
        icon="lock"
        value="secret"
        onChange={() => {}}
      />,
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
