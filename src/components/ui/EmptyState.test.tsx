import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

describe("<EmptyState />", () => {
  it("renders emoji + title", () => {
    render(<EmptyState emoji="✨" title="Rien ici" />);
    expect(screen.getByText("Rien ici")).toBeInTheDocument();
    expect(screen.getByText("✨")).toBeInTheDocument();
  });

  it("exposes the container as status region for assistive tech", () => {
    const { container } = render(<EmptyState emoji="✨" title="Rien" />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it("renders subtitle when provided", () => {
    render(<EmptyState emoji="✨" title="T" subtitle="Détails utiles" />);
    expect(screen.getByText("Détails utiles")).toBeInTheDocument();
  });

  it("omits the CTA link when actionLabel or actionHref is missing", () => {
    const { container } = render(<EmptyState emoji="✨" title="T" actionLabel="Go" />);
    expect(container.querySelector("a")).toBeNull();
  });

  it("renders the CTA link with correct href + label when both are provided", () => {
    render(
      <EmptyState emoji="✨" title="T" actionLabel="Explorer" actionHref="/explore" />,
    );
    const link = screen.getByRole("link", { name: "Explorer" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/explore");
  });
});
