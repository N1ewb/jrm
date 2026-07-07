import { Header } from "@/components/header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <div className="flex flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
