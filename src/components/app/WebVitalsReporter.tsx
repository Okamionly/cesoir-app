"use client";

/**
 * WebVitalsReporter — emits CLS / LCP / FID / INP / FCP / TTFB through
 * the structured logger. Runs once per page via Next.js
 * `useReportWebVitals`. No-op in dev unless you bump the logger level.
 */
import { useReportWebVitals } from "next/web-vitals";
import { logger } from "@/lib/logger";

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    logger.info("web_vital", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });
  return null;
}
