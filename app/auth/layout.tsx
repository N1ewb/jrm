import LandingHeader from "../(landing)/LandingHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div className="bg-[#250057] px-5 py-2">
        <div className="max-w-6xl mx-auto">
          <LandingHeader />
        </div>
      </div>
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
