import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { FormChoice } from "./FormChoice";

const meta: Meta<typeof FormChoice> = {
  title: "UI/Forms/FormChoice",
  component: FormChoice,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormChoice>;

const genderOptions = [
  { value: "f", label: "Femme" },
  { value: "h", label: "Homme" },
  { value: "nb", label: "Non-binaire" },
] as const;

const modeOptions = [
  { value: "soiree", label: "Soirée" },
  { value: "verre", label: "Verre" },
  { value: "diner", label: "Dîner" },
  { value: "ciné", label: "Ciné" },
] as const;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string>("f");
    return (
      <FormChoice
        legend="Genre"
        options={genderOptions}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
};

export const FourColumns: Story = {
  render: () => {
    const [value, setValue] = useState<string>("verre");
    return (
      <FormChoice
        legend="Mode préféré"
        options={modeOptions}
        value={value}
        onChange={(v) => setValue(v)}
        columns={4}
      />
    );
  },
};

export const MultiSelect: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(["soiree", "diner"]);
    return (
      <FormChoice
        legend="J'aime (multi)"
        options={modeOptions}
        value={values}
        multi
        onChange={(v) =>
          setValues((prev) =>
            prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v],
          )
        }
        columns={4}
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");
    return (
      <FormChoice
        legend="Genre"
        options={genderOptions}
        value={value}
        onChange={(v) => setValue(v)}
        error="Choisis une option pour continuer"
      />
    );
  },
};

export const DarkVariant: Story = {
  parameters: { backgrounds: { default: "landing" } },
  render: () => {
    const [value, setValue] = useState<string>("h");
    return (
      <FormChoice
        legend="Genre"
        variant="dark"
        options={genderOptions}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
};
