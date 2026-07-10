import { Suspense } from "react";
import AdminDashboard from "./AdminDashboard";
import { getAdminStats } from "@/actions/admin.actions";

async function AdminDashboardWrapper() {
  const stats = await getAdminStats();
  return <AdminDashboard stats={stats} />;
}

function AdminDashboardFallback() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Loading analytics...
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminDashboardFallback />}>
      <AdminDashboardWrapper />
    </Suspense>
  );
}
