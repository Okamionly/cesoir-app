import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import FilterTabs, { type FilterTab } from "./FilterTabs";

const meta: Meta<typeof FilterTabs> = {
  title: "UI/Navigation/FilterTabs",
  component: FilterTabs,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FilterTabs>;

const baseTabs: ReadonlyArray<FilterTab> = [
  { id: "all", label: "Tous" },
  { id: "events", label: "Soirées" },
  { id: "dates", label: "Dates" },
  { id: "groups", label: "Groupes" },
];

const tabsWithIcons: ReadonlyArray<FilterTab> = [
  { id: "all", label: "Tous", icon: "✨" },
  { id: "fav", label: "Favoris", icon: "❤️" },
  { id: "near", label: "Proche", icon: "📍" },
];

const tabsWithCounts: ReadonlyArray<FilterTab> = [
  { id: "inbox", label: "Inbox", count: 12 },
  { id: "matches", label: "Matches", count: 4 },
  { id: "archive", label: "Archive", count: 0 },
];

function Wrapper({ tabs }: { tabs: ReadonlyArray<FilterTab> }) {
  const [active, setActive] = useState(tabs[0].id);
  return <FilterTabs tabs={tabs} active={active} onChange={setActive} />;
}

export const Default: Story = {
  render: () => <Wrapper tabs={baseTabs} />,
};

export const WithIcons: Story = {
  render: () => <Wrapper tabs={tabsWithIcons} />,
};

export const WithCounts: Story = {
  render: () => <Wrapper tabs={tabsWithCounts} />,
};
