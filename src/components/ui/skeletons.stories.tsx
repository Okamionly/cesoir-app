import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  SkeletonBlock,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonProfileCard,
  SkeletonChatRow,
  SkeletonPage,
} from "./skeletons";

const meta = {
  title: "UI/Skeletons",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Primitives ----------------------------------------------------------

export const Block: Story = {
  render: () => <SkeletonBlock className="h-8 w-48" />,
};

export const TextSingle: Story = {
  render: () => <SkeletonText width="240px" />,
};

export const TextMultiLine: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <SkeletonText lines={4} />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <SkeletonAvatar size={32} />
      <SkeletonAvatar size={48} />
      <SkeletonAvatar size={64} />
      <SkeletonAvatar size={96} />
    </div>
  ),
};

// --- Composite cards -----------------------------------------------------

export const Card: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <SkeletonCard />
    </div>
  ),
};

export const ChatRow: Story = {
  render: () => (
    <div style={{ width: 380 }}>
      <SkeletonChatRow />
      <SkeletonChatRow />
      <SkeletonChatRow />
    </div>
  ),
};

export const ListVariant: Story = {
  render: () => (
    <div style={{ width: 380 }}>
      <SkeletonList count={5} />
    </div>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <SkeletonProfileCard />
    </div>
  ),
};

// --- Full page kinds -----------------------------------------------------

export const PageList: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <SkeletonPage kind="list" />,
};

export const PageGrid: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <SkeletonPage kind="grid" />,
};

export const PageDetail: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <SkeletonPage kind="detail" />,
};
