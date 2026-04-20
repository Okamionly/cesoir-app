import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MotionImage from "./MotionImage";

const meta = {
  title: "Motion/MotionImage",
  component: MotionImage,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof MotionImage>;

export default meta;
type Story = StoryObj<typeof meta>;

const PLACEHOLDER =
  "https://api.dicebear.com/9.x/personas/png?seed=Storybook&size=200";

export const Default: Story = {
  render: () => (
    <MotionImage
      src={PLACEHOLDER}
      alt="Avatar"
      width={200}
      height={200}
      style={{ borderRadius: 24 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    />
  ),
};

export const HoverScale: Story = {
  render: () => (
    <MotionImage
      src={PLACEHOLDER}
      alt="Hover me"
      width={200}
      height={200}
      style={{ borderRadius: 24, cursor: "pointer" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    />
  ),
};
