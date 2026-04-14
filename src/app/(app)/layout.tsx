import BottomNav from "@/components/app/BottomNav";
import SOSButton from "@/components/app/SOSButton";
import { DarkModeProvider } from "@/components/ui/DarkModeProvider";
import { AuthProvider } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <div className="min-h-screen bg-bg">
          <main className="pb-safe">{children}</main>
          <BottomNav />
          <SOSButton />
        </div>
      </DarkModeProvider>
    </AuthProvider>
  );
}
