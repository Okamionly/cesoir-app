import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PageHeader from "./PageHeader";

describe("<PageHeader />", () => {
  it("renders an <h1> with the title inside a <header> landmark", () => {
    const { container } = render(<PageHeader title="Mon onglet" />);
    expect(container.querySelector("header")).not.toBeNull();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Mon onglet");
  });

  it("renders subtitle below title", () => {
    render(<PageHeader title="Titre" subtitle="Sous-titre" />);
    expect(screen.getByText("Sous-titre")).toBeInTheDocument();
  });

  it("renders a back link when backHref is provided", () => {
    render(<PageHeader title="T" backHref="/home" backLabel="Retour" />);
    const link = screen.getByRole("link", { name: "Retour" });
    expect(link).toHaveAttribute("href", "/home");
  });

  it("fires onBack when the back button is clicked (no href mode)", () => {
    const onBack = vi.fn();
    render(<PageHeader title="T" onBack={onBack} backLabel="Retour" />);
    const btn = screen.getByRole("button", { name: "Retour" });
    fireEvent.click(btn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders actions slot content on the right", () => {
    render(
      <PageHeader title="T" actions={<button type="button">Edit</button>} />,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("exposes a Skeleton subcomponent for loading states", () => {
    expect(PageHeader.Skeleton).toBeDefined();
    const { container } = render(<PageHeader.Skeleton />);
    expect(container.querySelector("header")).not.toBeNull();
  });

  it("respects hideTitle flag", () => {
    render(<PageHeader title="Secret" hideTitle />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
});
