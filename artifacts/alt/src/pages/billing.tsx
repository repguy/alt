import { useGetSubscription, useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, Star, Building2, ArrowRight, ExternalLink } from "lucide-react";

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  pro: Star,
  agency: Building2,
  enterprise: Star,
};

const PLAN_COLORS: Record<string, string> = {
  free: "text-muted-foreground",
  pro: "text-primary",
  agency: "text-violet-400",
  enterprise: "text-amber-400",
};

// Polar checkout links — replace these with your actual Polar product links
const POLAR_LINKS: Record<string, string> = {
  pro: "https://polar.sh",
  agency: "https://polar.sh",
  enterprise: "https://polar.sh",
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Billing() {
  const { data: sub, isLoading: subLoading } = useGetSubscription();
  const { data: plans, isLoading: plansLoading } = useListPlans();

  const isLoading = subLoading || plansLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-7 w-40 mb-2 shimmer" />
        <Skeleton className="h-48 w-full rounded-xl shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl shimmer" />)}
        </div>
      </div>
    );
  }

  const currentPlan = sub?.plan || "free";
  const auditsUsed = sub?.auditsUsed ?? 0;
  const auditLimit = sub?.auditLimit ?? 5;
  const leadsUsed = sub?.leadsUsed ?? 0;
  const leadLimit = sub?.leadLimit ?? 25;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your subscription and usage.</p>
      </motion.div>

      {/* Current plan + usage */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Current Plan</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  You're on the{" "}
                  <span className="font-semibold text-primary capitalize">{currentPlan}</span> plan
                  {sub?.status && sub.status !== "active" && (
                    <span className="ml-1 text-yellow-400">({sub.status})</span>
                  )}
                </CardDescription>
              </div>
              <Badge className={`capitalize text-xs px-2.5 py-1 ${
                currentPlan === "free" ? "bg-muted/20 text-muted-foreground border-white/10"
                : currentPlan === "pro" ? "bg-primary/10 text-primary border-primary/20"
                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
              }`}>
                {currentPlan}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Monthly Audits</span>
                <span className="text-muted-foreground tabular-nums">
                  {auditsUsed} / {auditLimit === -1 ? "∞" : auditLimit} used
                </span>
              </div>
              <Progress
                value={auditLimit === -1 ? 10 : Math.min((auditsUsed / auditLimit) * 100, 100)}
                className="h-1.5 bg-white/5 [&>div]:bg-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">AI Lead Credits</span>
                <span className="text-muted-foreground tabular-nums">
                  {leadsUsed} / {leadLimit === -1 ? "∞" : leadLimit} used
                </span>
              </div>
              <Progress
                value={leadLimit === -1 ? 10 : Math.min((leadsUsed / leadLimit) * 100, 100)}
                className="h-1.5 bg-white/5 [&>div]:bg-blue-500"
              />
            </div>
            {sub?.currentPeriodEnd && (
              <p className="text-[11px] text-muted-foreground">
                {sub.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Available Plans</h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {(plans || []).map((plan: any) => {
            const isCurrent = plan.id === currentPlan;
            const Icon = PLAN_ICONS[plan.id] || Zap;
            const color = PLAN_COLORS[plan.id] || "text-primary";
            const polarLink = POLAR_LINKS[plan.id];

            return (
              <motion.div key={plan.id} variants={itemVariant}>
                <Card className={`h-full flex flex-col relative overflow-hidden transition-all duration-200 ${
                  isCurrent
                    ? "bg-primary/8 border-primary/25 shadow-[0_0_0_1px_rgba(99,102,241,.2)]"
                    : plan.highlighted
                    ? "bg-card/60 border-white/10 hover:border-white/15"
                    : "bg-card/30 border-white/5 hover:border-white/10"
                }`}>
                  {plan.highlighted && !isCurrent && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-violet-500" />
                  )}
                  {isCurrent && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">Active</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${
                      isCurrent ? "bg-primary/15" : "bg-white/5"
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-primary" : color}`} />
                    </div>
                    <CardTitle className="text-sm font-bold">{plan.name}</CardTitle>
                    <div className="mt-1">
                      {plan.price === 0 ? (
                        <span className="text-xl font-bold text-foreground">Free</span>
                      ) : (
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xl font-bold text-foreground">${plan.price}</span>
                          <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 px-4 pb-4 space-y-3">
                    <ul className="space-y-1.5">
                      {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      {isCurrent ? (
                        <div className="h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                          Current Plan
                        </div>
                      ) : plan.price === 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs border-white/10 hover:border-white/20"
                          disabled
                        >
                          Downgrade
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-white group"
                          onClick={() => {
                            if (polarLink) window.open(polarLink, "_blank");
                          }}
                        >
                          Upgrade
                          <ExternalLink className="ml-1.5 w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Polar note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start gap-3"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">Payments powered by Polar</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            ALT uses Polar for secure subscription management. Clicking "Upgrade" will take you to Polar's checkout.
            All payments are processed by Polar — we never store card details.
            Configure your Polar product links in the billing route to enable live checkout.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
