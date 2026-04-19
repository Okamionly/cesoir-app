"use client";

import type { ReactNode } from "react";

interface SectionProps {
  /**
   * Section heading. Rendered as <h2> so the page can keep a single <h1>
   * in <PageHeader>.
   */
  title: string;
  /**
   * Optional subtitle displayed under the title in muted text.
   */
  description?: string;
  /**
   * Optional slot aligned to the right of the title — usually a "See all"
   * link or a filter control.
   */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Titled content section with a consistent title / description / actions
 * row and a single rhythm unit of bottom margin. Replaces the ad-hoc
 * `<div><h2 class="..."><div>...</div></div>` tree duplicated across pages.
 */
export default function Section({
  title,
  description,
  actions,
  children,
  className = "",
}: SectionProps) {
  return (
    <section className={`mb-6 ${className}`.trim()}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base font-display font-bold text-text truncate">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-text-muted mt-1 truncate">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
