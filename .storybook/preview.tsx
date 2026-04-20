import type { Preview, Decorator } from "@storybook/nextjs-vite";
import React, { useEffect } from "react";
import { LazyMotion, domMax, MotionConfig } from "motion/react";
import "../src/app/globals.css";

/**
 * AppProviders — replicates the runtime tree (Motion + dark-mode class) so
 * primitives that read CSS tokens or rely on motion contexts render the same
 * way they do in the live app.
 *
 * We use `domMax` to cover every primitive (Magnetic uses springs/drag,
 * Toast uses drag, RackFocus uses layout). Stories never need separate
 * splits the way the prod app does.
 */
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict={false}>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-bg text-text font-sans antialiased">
          {children}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

/**
 * Toggles the `dark` class on <html> so Tailwind v4's `.dark { … }` overrides
 * (in globals.css) flip the entire palette like the runtime DarkModeProvider.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as "light" | "dark") ?? "light";
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);
  return (
    <AppProviders>
      <Story />
    </AppProviders>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' shows violations in the test UI without failing the run.
      test: "todo",
    },
    backgrounds: {
      default: "app",
      values: [
        { name: "app", value: "#FFFFFF" },
        { name: "landing", value: "#0A0A0D" },
        { name: "card", value: "#FAFAFA" },
      ],
    },
    layout: "centered",
  },
  globalTypes: {
    theme: {
      description: "Light/Dark theme — flips the .dark class on <html>.",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
