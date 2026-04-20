import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Card from "./Card";

const meta = {
  title: "UI/Layout/Card",
  component: Card,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg"] },
    radius: { control: "inline-radio", options: ["md", "lg", "xl", "2xl"] },
    borderless: { control: "boolean" },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = (
  <div className="text-text">
    <p className="font-display font-bold text-base">Card heading</p>
    <p className="text-sm text-text-muted mt-1">
      Base card primitive — bg-card + border-border + radius preset.
    </p>
  </div>
);

export const Default: Story = {
  args: { children: sample },
};

export const PaddingSmall: Story = {
  args: { padding: "sm", children: sample },
};

export const PaddingLarge: Story = {
  args: { padding: "lg", children: sample },
};

export const Borderless: Story = {
  args: { borderless: true, children: sample },
};

export const RadiusXl: Story = {
  args: { radius: "xl", children: sample },
};

export const NoPadding: Story = {
  args: {
    padding: "none",
    children: (
      <div>
        <div className="aspect-video bg-accent/20 rounded-t-2xl" />
        <div className="p-4 text-text">Edge-to-edge media + padded body.</div>
      </div>
    ),
  },
};
