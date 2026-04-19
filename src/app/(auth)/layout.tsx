import { AuthProvider } from "@/context/AuthContext";
import LazyMotionProvider from "@/components/ui/LazyMotionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LazyMotionProvider>{children}</LazyMotionProvider>
    </AuthProvider>
  );
}
