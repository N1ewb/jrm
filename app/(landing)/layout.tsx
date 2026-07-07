import LandingHeader from "./LandingHeader";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex bg-[#250057] px-5 py-2">
        <LandingHeader />
      </div>

      <div className="flex flex-col flex-1">{children}</div>
    </div>
  );
}
