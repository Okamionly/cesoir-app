import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "motion/react";
import { RackFocus } from "./RackFocus";

function renderWithMotion(ui: React.ReactElement) {
  return render(<LazyMotion features={domAnimation}>{ui}</LazyMotion>);
}

describe("<RackFocus />", () => {
  it("renders children", () => {
    renderWithMotion(
      <RackFocus>
        <h1>Hello world</h1>
      </RackFocus>,
    );
    expect(
      screen.getByRole("heading", { name: "Hello world" }),
    ).toBeInTheDocument();
  });

  it("forwards className to its motion wrapper", () => {
    const { container } = renderWithMotion(
      <RackFocus className="px-6 pt-7">
        <p>x</p>
      </RackFocus>,
    );
    expect(container.firstChild).toHaveClass("px-6");
    expect(container.firstChild).toHaveClass("pt-7");
  });

  it('accepts direction="out" without crashing', () => {
    renderWithMotion(
      <RackFocus direction="out">
        <p>out direction</p>
      </RackFocus>,
    );
    expect(screen.getByText("out direction")).toBeInTheDocument();
  });

  it("renders with custom delay/duration props", () => {
    renderWithMotion(
      <RackFocus delay={0.2} duration={0.5}>
        <p>props</p>
      </RackFocus>,
    );
    expect(screen.getByText("props")).toBeInTheDocument();
  });
});
