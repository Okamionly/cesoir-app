import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToastProvider, useToast } from "./Toast";

const meta: Meta<typeof ToastProvider> = {
  title: "UI/Feedback/Toast",
  component: ToastProvider,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

function Trigger() {
  const { toast } = useToast();
  return (
    <div className="flex flex-col gap-3 p-10 max-w-sm mx-auto">
      <p className="text-sm text-text-muted">
        Click a button to fire a toast at the top of the viewport.
      </p>
      <button
        type="button"
        onClick={() => toast("Sauvegardé avec succès", "success")}
        className="rounded-full bg-text text-bg px-4 py-2 text-sm font-semibold"
      >
        Success toast
      </button>
      <button
        type="button"
        onClick={() => toast("Une erreur est survenue", "error")}
        className="rounded-full bg-danger text-white px-4 py-2 text-sm font-semibold"
      >
        Error toast
      </button>
      <button
        type="button"
        onClick={() => toast("Nouvelle notification", "info")}
        className="rounded-full bg-accent text-white px-4 py-2 text-sm font-semibold"
      >
        Info toast
      </button>
      <button
        type="button"
        onClick={() => toast("✨ Nouveau match !", "match", 5000)}
        className="rounded-full px-4 py-2 text-sm font-semibold text-white"
        style={{
          background: "linear-gradient(135deg,#8B5CF6,#EC4899)",
        }}
      >
        Match toast (5s)
      </button>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  ),
};
