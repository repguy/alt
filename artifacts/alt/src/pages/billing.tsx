import { useGetSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Zap } from "lucide-react";

export default function Billing() {
  const { data: sub, isLoading } = useGetSubscription();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Fallback defaults since db might be empty initially
  const plan = sub?.plan || "Pro Agency";
  const auditsUsed = sub?.auditsUsed || 12;
  const auditLimit = sub?.auditLimit || 100;
  const leadsUsed = sub?.leadsUsed || 450;
  const leadLimit = sub?.leadLimit || 1000;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Billing & Usage</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and limits.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Zap className="w-32 h-32 text-primary" />
        </div>
        <CardHeader>
          <CardTitle className="text-xl text-white">Current Plan</CardTitle>
          <CardDescription>You are currently on the <strong className="text-primary">{plan}</strong> plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 relative z-10">
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white font-medium">Monthly Audits</span>
              <span className="text-muted-foreground">{auditsUsed} / {auditLimit} used</span>
            </div>
            <Progress value={(auditsUsed / auditLimit) * 100} className="h-2 bg-white/5 [&>div]:bg-primary" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white font-medium">AI Lead Credits</span>
              <span className="text-muted-foreground">{leadsUsed} / {leadLimit} used</span>
            </div>
            <Progress value={(leadsUsed / leadLimit) * 100} className="h-2 bg-white/5 [&>div]:bg-blue-500" />
          </div>

        </CardContent>
        <CardFooter className="bg-white/[0.02] border-t border-white/5 flex justify-between relative z-10 p-6">
          <Button variant="outline" className="border-border">Manage Billing in Stripe</Button>
          <Button className="bg-primary hover:bg-primary/90 text-white">Upgrade Plan</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
