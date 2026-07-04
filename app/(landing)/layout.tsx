import LandingHeader from "./LandingHeader";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <LandingHeader />
      <div className="flex flex-col">{children}</div>
    </>
  );
}
