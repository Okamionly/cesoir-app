import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Container from "./Container";

const meta = {
  title: "UI/Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg", "xl"],
    },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-border bg-card p-6 my-8">
    <p className="text-text font-display font-bold">{label}</p>
    <p className="text-text-muted text-sm mt-2">
      Container child content. Sized container is centered with px-4 padding.
    </p>
  </div>
);

export const Default: Story = {
  args: {
    children: <Demo label="Default — size lg (max-w-lg, ≈512px)" />,
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: <Demo label="Small — size sm (max-w-sm, ≈384px)" />,
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    children: <Demo label="Medium — size md (max-w-md, ≈448px)" />,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    children: <Demo label="Extra Large — size xl (max-w-xl, ≈576px)" />,
  },
};
