import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteConcertModal } from "./DeleteConcertModal";

describe("DeleteConcertModal", () => {
  it("shows the concert name in the confirmation", () => {
    render(
      <DeleteConcertModal
        concertName="Rock Night"
        pending={false}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("“Rock Night”")).toBeInTheDocument();
  });

  it("calls onConfirm when 'Yes, Delete' is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConcertModal
        concertName="Rock Night"
        pending={false}
        onCancel={() => {}}
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <DeleteConcertModal
        concertName="Rock Night"
        pending={false}
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on Escape", async () => {
    const onCancel = vi.fn();
    render(
      <DeleteConcertModal
        concertName="Rock Night"
        pending={false}
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm button while pending", () => {
    render(
      <DeleteConcertModal
        concertName="Rock Night"
        pending
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
  });
});
