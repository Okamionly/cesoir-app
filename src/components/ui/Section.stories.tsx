import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Section from "./Section";

const meta = {
  title: "UI/Layout/Section",
  component: Section,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleChildren = (
  <div className="rounded-2xl border border-border bg-card p-4 text-text">
    Body content rendered inside the section.
  </div>
);

export const Default: Story = {
  args: {
    title: "Recommandations",
    children: sampleChildren,
  },
};

export const WithDescription: Story = {
  args: {
    title: "Tendances ce soir",
    description: "Sélection mise à jour toutes les heures.",
    children: sampleChildren,
  },
};

export const WithActions: Story = {
  args: {
    title: "Notifications",
    description: "Gardez un œil sur l'activité récente.",
    actions: (
      <button className="text-xs font-semibold text-accent">Voir tout</button>
    ),
    children: sampleChildren,
  },
};
