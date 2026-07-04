"use client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  ),
});
function Dashboard() {
  return (
    <div className="w-full h-full relative">
      <Map />
    </div>
  );
}

export default Dashboard;
