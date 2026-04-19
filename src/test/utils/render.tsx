/**
 * Custom render helper — wrap here if we ever need providers
 * (ThemeProvider, I18nProvider, etc.). For now, passthrough.
 *
 * Usage:
 *   import { render } from "@/test/utils/render";
 *   render(<MyComponent />);
 */
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: ProvidersProps) {
  // Add context providers here when needed (ToastProvider, DarkModeProvider, etc.)
  return <>{children}</>;
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
