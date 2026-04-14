import BottomNav from "@/components/app/BottomNav";
import { AuthProvider } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg">
        <main className="pb-safe">{children}</main>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
