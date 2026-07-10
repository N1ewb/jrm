import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Route, UserPlus, MessageSquare, Vote } from "lucide-react";
import type { AdminStats } from "@/actions/admin.actions";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of platform analytics and community activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Routes"
          value={String(stats.totalRoutes)}
          subtitle={`${stats.routesAccepted} accepted, ${stats.routesRejected} rejected`}
          icon={Route}
          color="bg-primary"
        />
        <StatCard
          title="Community Members"
          value={String(stats.communityMembers)}
          icon={Users}
          color="bg-secondary"
        />
        <StatCard
          title="Pending Reviews"
          value={String(stats.pendingReviews)}
          subtitle="Awaiting admin decision"
          icon={UserPlus}
          color="bg-yellow-600"
        />
        <StatCard
          title="Total Comments"
          value={String(stats.totalComments)}
          icon={MessageSquare}
          color="bg-blue-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Route size={16} className="text-primary" />
              Route Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Total Submitted
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {stats.totalRoutes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Accepted
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {stats.routesAccepted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Pending
                </span>
                <span className="text-sm font-semibold text-yellow-600">
                  {stats.routesPending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Rejected
                </span>
                <span className="text-sm font-semibold text-destructive">
                  {stats.routesRejected}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Vote size={16} className="text-primary" />
              Community Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Community Members
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {stats.communityMembers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Total Comments
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {stats.totalComments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Total Votes
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {stats.totalVotes}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
