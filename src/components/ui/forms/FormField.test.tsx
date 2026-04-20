import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "./FormField";

describe("<FormField />", () => {
  it("renders label and wires htmlFor with the auto-generated id", () => {
    render(
      <FormField label="Pseudo">
        <input type="text" placeholder="ton pseudo" />
      </FormField>,
    );
    const input = screen.getByPlaceholderText("ton pseudo") as HTMLInputElement;
    const label = screen.getByText("Pseudo").closest("label")!;
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.id).toBeTruthy();
  });

  it("appends a red asterisk and sets required when `required`", () => {
    render(
      <FormField label="Email" required>
        <input type="email" placeholder="email" />
      </FormField>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("email") as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-required")).toBe("true");
  });

  it("renders the hint with id linked via aria-describedby", () => {
    render(
      <FormField label="Bio" hint="Une phrase max">
        <textarea placeholder="bio" />
      </FormField>,
    );
    const ta = screen.getByPlaceholderText("bio");
    const hint = screen.getByText("Une phrase max");
    expect(ta.getAttribute("aria-describedby")).toContain(hint.id);
  });

  it("shows error with role=alert and sets aria-invalid on input", () => {
    render(
      <FormField label="Email" error="Email invalide">
        <input type="email" placeholder="email" />
      </FormField>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Email invalide");
    const input = screen.getByPlaceholderText("email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("does not crash when wrapped non-control children are passed (passthrough)", () => {
    render(
      <FormField label="Custom">
        <div data-testid="custom-control">non-control</div>
      </FormField>,
    );
    expect(screen.getByTestId("custom-control")).toBeInTheDocument();
  });

  it("respects an explicit id override", () => {
    render(
      <FormField label="X" id="my-field">
        <input type="text" />
      </FormField>,
    );
    const label = screen.getByText("X").closest("label")!;
    expect(label.getAttribute("for")).toBe("my-field");
  });
});
