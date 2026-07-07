import { Heart, Coffee, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="max-w-lg mx-auto w-full">
      <div className="mb-6 text-center">
        <Heart size={40} className="mx-auto text-primary mb-3" />
        <h1 className="text-2xl font-bold text-foreground">Support Us</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Help keep JRM running and improving for the Iligan community.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coffee size={18} className="text-primary" />
            Buy Us a Coffee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your support helps cover server costs, map API usage, and
            development time. Every contribution matters.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <DollarSign size={14} />
            Support feature coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
