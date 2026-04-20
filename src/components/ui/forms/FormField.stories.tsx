import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormField } from "./FormField";
import { FormInput } from "./FormInput";

const meta = {
  title: "UI/Forms/FormField",
  component: FormField,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["light", "dark"] },
    required: { control: "boolean" },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email",
    children: <FormInput type="email" placeholder="you@cesoir.app" />,
  },
};

export const Required: Story = {
  args: {
    label: "Mot de passe",
    required: true,
    children: <FormInput type="password" placeholder="••••••••" />,
  },
};

export const WithHint: Story = {
  args: {
    label: "Pseudo",
    hint: "3 à 20 caractères, lettres et chiffres uniquement.",
    children: <FormInput placeholder="camille_22" />,
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    error: "Cet email est déjà utilisé.",
    children: <FormInput type="email" defaultValue="taken@cesoir.app" />,
  },
};

export const DarkVariant: Story = {
  parameters: { backgrounds: { default: "landing" } },
  args: {
    label: "Email",
    variant: "dark",
    children: <FormInput type="email" placeholder="you@cesoir.app" variant="dark" />,
  },
};
