import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ErrorState from "./ErrorState";

const meta = {
  title: "UI/Feedback/ErrorState",
  component: ErrorState,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Une erreur est survenue",
    description: "Impossible de charger les données pour le moment.",
  },
};

export const WithRetry: Story = {
  args: {
    title: "Connexion perdue",
    description: "Vérifie ta connexion internet et réessaie.",
    onRetry: () => alert("Retry clicked"),
  },
};

export const ServerError: Story = {
  args: {
    emoji: "🛠️",
    title: "Serveur indisponible",
    description: "Nos serveurs font une pause. On revient très vite.",
    onRetry: () => alert("Retry clicked"),
    retryLabel: "Réessayer maintenant",
  },
};

export const Offline: Story = {
  args: {
    emoji: "📡",
    title: "Tu es hors ligne",
    description: "Reconnecte-toi pour charger les nouveaux profils.",
  },
};
