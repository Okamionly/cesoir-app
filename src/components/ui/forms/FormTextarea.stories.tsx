import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormTextarea } from "./FormTextarea";

const meta = {
  title: "UI/Forms/FormTextarea",
  component: FormTextarea,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["light", "dark"] },
    error: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof FormTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Tell us about your evening…", rows: 4 },
};

export const Filled: Story = {
  args: {
    defaultValue:
      "On cherche du monde pour finir la soirée à la Roof — viens nous rejoindre !",
    rows: 4,
  },
};

export const ErrorState: Story = {
  args: { error: true, defaultValue: "Trop court", rows: 4 },
};

export const DarkVariant: Story = {
  parameters: { backgrounds: { default: "landing" } },
  args: { variant: "dark", placeholder: "Dark surface textarea", rows: 4 },
};
