import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormInput } from "./FormInput";

const meta = {
  title: "UI/Forms/FormInput",
  component: FormInput,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["light", "dark"] },
    error: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof FormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Type something…" },
};

export const Small: Story = {
  args: { size: "sm", placeholder: "Small input" },
};

export const Large: Story = {
  args: { size: "lg", placeholder: "Large input" },
};

export const ErrorState: Story = {
  args: {
    error: true,
    defaultValue: "invalid",
    placeholder: "Has an error",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Locked" },
};

export const DarkVariant: Story = {
  parameters: { backgrounds: { default: "landing" } },
  args: { variant: "dark", placeholder: "Dark surface input" },
};
