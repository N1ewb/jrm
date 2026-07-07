"use client";

import dynamic from "next/dynamic";

const TripPageInner = dynamic(() => import("./inner"), { ssr: false });

export default function TripPage() {
  return <TripPageInner />;
}
