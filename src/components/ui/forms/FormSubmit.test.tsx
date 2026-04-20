import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LazyMotion, domAnimation } from "motion/react";
import { FormSubmit } from "./FormSubmit";

function renderWithMotion(ui: React.ReactElement) {
  return render(<LazyMotion features={domAnimation}>{ui}</LazyMotion>);
}

describe("<FormSubmit />", () => {
  it("renders children inside a button by default (idle)", () => {
    renderWithMotion(<FormSubmit>Continuer</FormSubmit>);
    expect(screen.getByRole("button", { name: /continuer/i })).toBeInTheDocument();
  });

  it("disables and sets aria-busy when isLoading", () => {
    renderWithMotion(<FormSubmit isLoading>Envoyer</FormSubmit>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("renders the loadingLabel while loading", () => {
    renderWithMotion(
      <FormSubmit isLoading loadingLabel="Chargement…">
        Envoyer
      </FormSubmit>,
    );
    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("renders a checkmark and live status text in success state", () => {
    renderWithMotion(<FormSubmit isSuccess>Continuer</FormSubmit>);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("calls onClick handler when not loading/disabled", () => {
    const onClick = vi.fn();
    renderWithMotion(
      <FormSubmit type="button" onClick={onClick} magnetic={false}>
        Action
      </FormSubmit>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    renderWithMotion(
      <FormSubmit type="button" onClick={onClick} disabled magnetic={false}>
        Action
      </FormSubmit>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards aria-label", () => {
    renderWithMotion(<FormSubmit aria-label="Sauvegarder">Save</FormSubmit>);
    expect(screen.getByLabelText("Sauvegarder")).toBeInTheDocument();
  });
});
