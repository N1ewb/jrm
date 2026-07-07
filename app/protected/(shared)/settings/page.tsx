import { User, Settings, Bell, Shield, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={18} className="text-primary" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium">
              Signed in via Supabase
            </span>
          </div>
          <hr className="border-border" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Password</span>
            <span className="text-foreground font-medium">••••••••</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Route updates</span>
            <span className="text-foreground font-medium">Enabled</span>
          </div>
          <hr className="border-border" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Community activity</span>
            <span className="text-foreground font-medium">Enabled</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart size={18} className="text-primary" />
            Support
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            JRM is community-powered. If you find this useful, consider
            supporting the project.
          </p>
          <a
            href="/protected/support"
            className="inline-flex items-center gap-1.5 mt-3 text-primary font-medium hover:underline"
          >
            <Heart size={14} />
            Support Us
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
