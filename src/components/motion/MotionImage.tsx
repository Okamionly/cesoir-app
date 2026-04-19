"use client";

/**
 * MotionImage — `next/image` wrapped in a Motion proxy.
 *
 * Use this instead of `<motion.img>` everywhere an animated avatar / thumbnail
 * renders a URL we control. It preserves Next.js Image optimisation
 * (lazy-loading, srcset, blur placeholder) while exposing the full Motion
 * animation surface (initial / animate / exit / whileTap / transition / style / …).
 *
 * The `motion.create(Component)` API (Motion 12+) returns a fully typed
 * motion component for any React component — safer than the legacy
 * `motion(Image)` call signature.
 */

import Image, { type ImageProps } from "next/image";
import { motion } from "motion/react";

const MotionImage = motion.create(Image);

export default MotionImage;
export type MotionImageProps = ImageProps;
