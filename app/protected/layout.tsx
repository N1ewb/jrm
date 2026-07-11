import { Header } from "@/components/header";
import AppShell from "@/components/app-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <AppShell>{children}</AppShell>
    </div>
  );
}
