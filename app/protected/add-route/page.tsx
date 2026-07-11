import { Suspense } from "react";
import AddRouteClient from "./client";

export default function AddRoutePage() {
  return (
    <div className="w-full mx-auto flex-1 flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Add Route</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Draw a route on the map by clicking along the roads.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="w-full flex-1 rounded-xl bg-muted animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              Loading map...
            </span>
          </div>
        }
      >
        <AddRouteClient />
      </Suspense>
    </div>
  );
}
