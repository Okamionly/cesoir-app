import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmptyState from "./EmptyState";

const meta = {
  title: "UI/Feedback/EmptyState",
  component: EmptyState,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    emoji: "🔍",
    title: "Aucun résultat",
    subtitle: "Essaie d'élargir ta recherche ou tes filtres.",
  },
};

export const NoMatches: Story = {
  args: {
    emoji: "💔",
    title: "Pas encore de matches",
    subtitle: "Continue à explorer — tu vas trouver quelqu'un ce soir.",
    actionLabel: "Explorer maintenant",
    actionHref: "/discover",
  },
};

export const EmptyChat: Story = {
  args: {
    emoji: "💬",
    title: "Commence la conversation",
    subtitle: "Brise la glace avec un message personnel.",
  },
};

export const EmptyEvents: Story = {
  args: {
    emoji: "🎉",
    title: "Aucun événement ce soir",
    subtitle: "Crée le tien pour rassembler tes proches.",
    actionLabel: "Créer un événement",
    actionHref: "/events/new",
  },
};
