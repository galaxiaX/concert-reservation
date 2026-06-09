import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "./Toast";

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("renders nothing when there is no toast", () => {
    const { container } = render(<Toast toast={null} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the message with the success styling", () => {
    render(
      <Toast toast={{ message: "Reserved!", kind: "success" }} onDismiss={() => {}} />,
    );
    const alert = screen.getByRole("status");
    expect(alert).toHaveTextContent("Reserved!");
    expect(alert).toHaveClass("bg-success");
  });

  it("uses the error styling for error toasts", () => {
    render(
      <Toast toast={{ message: "Sold out", kind: "error" }} onDismiss={() => {}} />,
    );
    expect(screen.getByRole("status")).toHaveClass("bg-error");
  });

  it("auto-dismisses after the timeout", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <Toast toast={{ message: "Saved", kind: "success" }} onDismiss={onDismiss} />,
    );

    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3500);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
