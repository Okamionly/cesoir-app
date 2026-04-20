import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Magnetic } from "./Magnetic";

const meta: Meta<typeof Magnetic> = {
  title: "Motion/Magnetic",
  component: Magnetic,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Magnetic>;

const Demo = ({ label = "Hover near me" }: { label?: string }) => (
  <button
    type="button"
    className="rounded-full px-6 py-3 text-sm font-semibold text-white"
    style={{
      background: "linear-gradient(135deg,#8B5CF6,#EC4899,#00FF88)",
      boxShadow: "0 0 24px rgba(139,92,246,0.35)",
    }}
  >
    {label}
  </button>
);

export const Default: Story = {
  render: () => (
    <div style={{ padding: 80 }}>
      <p className="text-xs text-text-muted mb-6">
        Hover within ~80px of the button — it subtly follows the cursor.
      </p>
      <Magnetic>
        <Demo />
      </Magnetic>
    </div>
  ),
};

export const Subtle: Story = {
  render: () => (
    <div style={{ padding: 80 }}>
      <Magnetic strength={0.05} radius={60}>
        <Demo label="Subtle (strength 0.05)" />
      </Magnetic>
    </div>
  ),
};

export const Punchy: Story = {
  render: () => (
    <div style={{ padding: 80 }}>
      <Magnetic strength={0.25} radius={140}>
        <Demo label="Punchy (strength 0.25)" />
      </Magnetic>
    </div>
  ),
};

export const FullWidthBlock: Story = {
  render: () => (
    <div style={{ padding: 80, width: 320 }}>
      <Magnetic as="div" strength={0.1} radius={120}>
        <button
          type="button"
          className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(135deg,#8B5CF6,#EC4899)",
          }}
        >
          Full-width CTA
        </button>
      </Magnetic>
    </div>
  ),
};
