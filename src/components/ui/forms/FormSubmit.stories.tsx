import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { FormSubmit } from "./FormSubmit";

const meta: Meta<typeof FormSubmit> = {
  title: "UI/Forms/FormSubmit",
  component: FormSubmit,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    isLoading: { control: "boolean" },
    isSuccess: { control: "boolean" },
    hasError: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
    magnetic: { control: "boolean" },
    variant: { control: "inline-radio", options: ["light", "dark"] },
  },
};

export default meta;
type Story = StoryObj<typeof FormSubmit>;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 320 }}>{children}</div>
);

export const Default: Story = {
  args: { children: "Continuer" },
  render: (args) => (
    <Wrapper>
      <FormSubmit {...args} />
    </Wrapper>
  ),
};

export const Loading: Story = {
  args: { isLoading: true, children: "Continuer" },
  render: (args) => (
    <Wrapper>
      <FormSubmit {...args} />
    </Wrapper>
  ),
};

export const SuccessPop: Story = {
  args: { isSuccess: true, children: "Sauvegardé" },
  render: (args) => (
    <Wrapper>
      <FormSubmit {...args} />
    </Wrapper>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, children: "Continuer" },
  render: (args) => (
    <Wrapper>
      <FormSubmit {...args} />
    </Wrapper>
  ),
};

export const Inline: Story = {
  args: { fullWidth: false, children: "Envoyer" },
  render: (args) => (
    <Wrapper>
      <FormSubmit {...args} />
    </Wrapper>
  ),
};

export const DarkVariant: Story = {
  parameters: { backgrounds: { default: "landing" } },
  args: { variant: "dark", children: "Créer mon compte" },
  render: (args) => (
    <Wrapper>
      <FormSubmit {...args} />
    </Wrapper>
  ),
};

/** Interactive demo: click to simulate a submit cycle (idle → loading → success). */
export const Interactive: Story = {
  render: () => {
    const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
      "idle",
    );

    const submit = () => {
      setState("loading");
      setTimeout(() => {
        setState(Math.random() > 0.3 ? "success" : "error");
        setTimeout(() => setState("idle"), 1500);
      }, 1200);
    };

    return (
      <Wrapper>
        <FormSubmit
          isLoading={state === "loading"}
          isSuccess={state === "success"}
          hasError={state === "error"}
          onClick={submit}
          type="button"
        >
          Click me
        </FormSubmit>
      </Wrapper>
    );
  },
};
