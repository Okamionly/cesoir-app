import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PageHeader from "./PageHeader";

const meta = {
  title: "UI/Navigation/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  argTypes: {
    iconAnimation: {
      control: "inline-radio",
      options: ["none", "pulse", "rotate", "float", "glow", "glow-green", "glow-violet"],
    },
    hairlineVariant: {
      control: "inline-radio",
      options: [
        "default",
        "gold-violet",
        "pink-violet",
        "red-glow",
        "vert-violet",
        "green-violet",
      ],
    },
    tone: { control: "inline-radio", options: ["default", "white"] },
    backIconVariant: { control: "inline-radio", options: ["chevron", "close"] },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const PageBody = ({ label = "Page content goes here." }: { label?: string }) => (
  <div className="p-6">
    <p className="text-sm text-text-muted">{label}</p>
  </div>
);

export const Default: Story = {
  args: { title: "Discover", sticky: false },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const WithBack: Story = {
  args: { title: "Profil", backHref: "#", sticky: false },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const WithSubtitle: Story = {
  args: {
    title: "Notifications",
    subtitle: "12 nouvelles depuis hier",
    backHref: "#",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const WithIconPulse: Story = {
  args: {
    title: "Live",
    icon: <span className="inline-block w-2.5 h-2.5 rounded-full bg-danger" />,
    iconAnimation: "pulse",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const WithIconGlow: Story = {
  args: {
    title: "Premium",
    icon: <span className="text-lg">✨</span>,
    iconAnimation: "glow-violet",
    hairlineVariant: "gold-violet",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const HairlineRedGlow: Story = {
  args: {
    title: "Alerte",
    hairlineVariant: "red-glow",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const HairlinePinkViolet: Story = {
  args: {
    title: "Match",
    hairlineVariant: "pink-violet",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const ToneWhite: Story = {
  args: {
    title: "Réglages",
    backHref: "#",
    tone: "white",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const WithActions: Story = {
  args: {
    title: "Chat",
    backHref: "#",
    actions: (
      <button className="text-xs font-semibold rounded-full px-3 py-1 border border-border text-text-muted">
        Filtrer
      </button>
    ),
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const CloseIconVariant: Story = {
  args: {
    title: "Modifier le profil",
    backHref: "#",
    backIconVariant: "close",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const WithLeftSlot: Story = {
  args: {
    backHref: "#",
    leftSlot: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/20" />
        <div>
          <p className="text-sm font-bold text-text">Camille</p>
          <p className="text-[10px] text-text-muted">en ligne</p>
        </div>
      </div>
    ),
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody label="Chat-style header with avatar in left slot." />
    </>
  ),
};

export const Borderless: Story = {
  args: {
    title: "Plein écran",
    backHref: "#",
    borderless: true,
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody label="Borderless header — no bottom border / hairline." />
    </>
  ),
};

export const WithRackFocus: Story = {
  args: {
    title: "Bienvenue",
    rackFocus: true,
    icon: <span>🌙</span>,
    iconAnimation: "float",
    sticky: false,
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody label="RackFocus animates the title on mount." />
    </>
  ),
};

export const WithBottomSlot: Story = {
  args: {
    title: "Discover",
    sticky: false,
    bottomSlot: (
      <div className="flex gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full bg-card border border-border text-text-muted">
          Tous
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-text text-bg">
          Soirées
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-card border border-border text-text-muted">
          Dates
        </span>
      </div>
    ),
  },
  render: (args) => (
    <>
      <PageHeader {...args} />
      <PageBody />
    </>
  ),
};

export const Skeleton: Story = {
  render: () => (
    <>
      <PageHeader.Skeleton sticky={false} />
      <PageBody label="Skeleton loading state." />
    </>
  ),
};
