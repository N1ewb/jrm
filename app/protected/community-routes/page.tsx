import { Suspense } from "react";
import { getRoutes } from "@/actions/map.actions";
import { AllRoutesClient } from "../all-routes/client";

async function CommunityContent() {
  const result = await getRoutes();

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive font-medium">{result.error}</p>
      </div>
    );
  }

  const communityRoutes = result.routes?.filter(
    (r) => r.status === "pending",
  ) ?? [];

  if (communityRoutes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          No Community Routes
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          No pending community submissions at this time.
        </p>
      </div>
    );
  }

  return <AllRoutesClient routes={communityRoutes} />;
}

export default function CommunityRoutesPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Community Routes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Routes submitted by the community that are pending review
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        }
      >
        <CommunityContent />
      </Suspense>
    </div>
  );
}
