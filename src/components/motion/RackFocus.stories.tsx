import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RackFocus } from "./RackFocus";

const meta: Meta<typeof RackFocus> = {
  title: "Motion/RackFocus",
  component: RackFocus,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    direction: { control: "inline-radio", options: ["in", "out"] },
    duration: { control: { type: "range", min: 0.2, max: 2, step: 0.1 } },
    delay: { control: { type: "range", min: 0, max: 2, step: 0.1 } },
  },
};

export default meta;
type Story = StoryObj<typeof RackFocus>;

const Hero = ({ label }: { label: string }) => (
  <div className="rounded-3xl border border-border bg-card p-10 text-center max-w-md">
    <p className="text-3xl font-display font-bold text-text">{label}</p>
    <p className="text-sm text-text-muted mt-2">
      Refresh the story to replay the rack-focus animation.
    </p>
  </div>
);

export const Default: Story = {
  args: { direction: "in", duration: 0.8 },
  render: (args) => (
    <RackFocus {...args}>
      <Hero label="Rack focus IN" />
    </RackFocus>
  ),
};

export const FocusOut: Story = {
  args: { direction: "out", duration: 0.8 },
  render: (args) => (
    <RackFocus {...args}>
      <Hero label="Rack focus OUT" />
    </RackFocus>
  ),
};

export const Slow: Story = {
  args: { direction: "in", duration: 1.6, delay: 0.2 },
  render: (args) => (
    <RackFocus {...args}>
      <Hero label="Slow + delayed" />
    </RackFocus>
  ),
};
