import BottomNav from "@/components/app/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <main className="pb-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
