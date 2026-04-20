import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormBanner } from "./FormBanner";

const meta = {
  title: "UI/Forms/FormBanner",
  component: FormBanner,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "inline-radio", options: ["error", "success", "info"] },
    variant: { control: "inline-radio", options: ["light", "dark"] },
  },
} satisfies Meta<typeof FormBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 380 }}>{children}</div>
);

export const Error: Story = {
  args: {
    tone: "error",
    children: "Email ou mot de passe incorrect.",
  },
  render: (args) => (
    <Wrapper>
      <FormBanner {...args} />
    </Wrapper>
  ),
};

export const Success: Story = {
  args: {
    tone: "success",
    children: "Profil mis à jour ✨",
  },
  render: (args) => (
    <Wrapper>
      <FormBanner {...args} />
    </Wrapper>
  ),
};

export const Info: Story = {
  args: {
    tone: "info",
    children: "Vérifie ton email pour valider ton compte.",
  },
  render: (args) => (
    <Wrapper>
      <FormBanner {...args} />
    </Wrapper>
  ),
};

export const DarkErrorVariant: Story = {
  parameters: { backgrounds: { default: "landing" } },
  args: {
    tone: "error",
    variant: "dark",
    children: "Trop de tentatives — réessaie dans 5 minutes.",
  },
  render: (args) => (
    <Wrapper>
      <FormBanner {...args} />
    </Wrapper>
  ),
};
