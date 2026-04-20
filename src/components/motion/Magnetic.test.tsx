import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "motion/react";
import { Magnetic } from "./Magnetic";

function renderWithMotion(ui: React.ReactElement) {
  return render(<LazyMotion features={domAnimation}>{ui}</LazyMotion>);
}

describe("<Magnetic />", () => {
  it("renders children unchanged", () => {
    renderWithMotion(
      <Magnetic>
        <button type="button">Hover me</button>
      </Magnetic>,
    );
    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });

  it("uses span by default (inline-block)", () => {
    const { container } = renderWithMotion(
      <Magnetic>
        <a href="#">link</a>
      </Magnetic>,
    );
    const wrapper = container.querySelector("span");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.display).toBe("inline-block");
  });

  it("uses div with display:block when as=div", () => {
    const { container } = renderWithMotion(
      <Magnetic as="div">
        <button type="button">Full width</button>
      </Magnetic>,
    );
    const wrapper = container.querySelector("div");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.display).toBe("block");
  });

  it("forwards className", () => {
    const { container } = renderWithMotion(
      <Magnetic className="my-cls">
        <span>x</span>
      </Magnetic>,
    );
    expect(container.firstChild).toHaveClass("my-cls");
  });

  it("respects ariaHidden", () => {
    const { container } = renderWithMotion(
      <Magnetic ariaHidden>
        <span>decorative</span>
      </Magnetic>,
    );
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
