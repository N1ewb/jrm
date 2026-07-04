import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, TrendingUp, Route, UserPlus, Calendar } from "lucide-react";

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
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
        <p className="text-xs text-muted-foreground mt-1">{change}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
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
          value="24"
          change="+3 this week"
          icon={Route}
          color="bg-primary"
        />
        <StatCard
          title="Active Users"
          value="156"
          change="+12 this week"
          icon={Users}
          color="bg-secondary"
        />
        <StatCard
          title="Pending Reviews"
          value="8"
          change="4 need attention"
          icon={UserPlus}
          color="bg-yellow-600"
        />
        <StatCard
          title="User Participation"
          value="73%"
          change="+5% this month"
          icon={TrendingUp}
          color="bg-green-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Site Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-foreground">Daily</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">
                    142
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    visits today
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: "45%" }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-sm text-foreground">Weekly</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">
                    847
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    this week
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: "68%" }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm text-foreground">Monthly</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">
                    3,421
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    this month
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: "82%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={16} className="text-primary" />
              User Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Routes Submitted
                </span>
                <span className="text-sm font-semibold text-foreground">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Routes Accepted
                </span>
                <span className="text-sm font-semibold text-foreground">16</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Routes Pending
                </span>
                <span className="text-sm font-semibold text-foreground">8</span>
              </div>
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Community Members</span>
                <span className="text-sm font-semibold text-foreground">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Active Contributors
                </span>
                <span className="text-sm font-semibold text-foreground">34</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Reviews Made
                </span>
                <span className="text-sm font-semibold text-foreground">127</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Analytics data is placeholder and will be replaced with real metrics
        once tracking is implemented.
      </div>
    </div>
  );
}
