import BottomNav from "@/components/app/BottomNav";
import SOSButton from "@/components/app/SOSButton";
import { DarkModeProvider } from "@/components/ui/DarkModeProvider";
import { AuthProvider } from "@/context/AuthContext";
import PageTransition from "@/components/ui/PageTransition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <div className="min-h-screen bg-bg">
          <main className="pb-safe">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomNav />
          <SOSButton />
        </div>
      </DarkModeProvider>
    </AuthProvider>
  );
}
