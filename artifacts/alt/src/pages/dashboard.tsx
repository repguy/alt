import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { NewAuditDialog } from "@/components/dialogs/new-audit-dialog";
import {
  TrendingUp, Users, FileText, Activity, ArrowRight,
  Clock, Plus, Sparkles, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-card/40 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-28 shimmer" />
        <Skeleton className="h-8 w-8 rounded-lg shimmer" />
      </div>
      <Skeleton className="h-8 w-24 shimmer" />
      <Skeleton className="h-3 w-20 shimmer" />
    </div>
  );
}

function containerVariants(stagger = 0.08) {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };
}

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetDashboardAnalytics();
  const [newAuditOpen, setNewAuditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-8 w-40 shimmer" />
          <Skeleton className="h-9 w-28 rounded-lg shimmer" />
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants(0.06)}
          initial="hidden"
          animate="show"
        >
          {[0,1,2,3].map(i => (
            <motion.div key={i} variants={itemVariant}>
              <StatCardSkeleton />
            </motion.div>
          ))}
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
          <Skeleton className="h-80 col-span-2 rounded-xl shimmer" />
          <Skeleton className="h-80 rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  const data = analytics || {
    totalLeads: 0, totalAudits: 0, totalProposals: 0, totalClients: 0,
    totalRevenue: 0, activeDeals: 0, proposalAcceptanceRate: 0, recentActivity: [], avgAuditScore: null,
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(data.totalRevenue),
      icon: TrendingUp,
      change: "+12.5%",
      trend: "up",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Active Leads",
      value: data.totalLeads.toString(),
      icon: Users,
      change: "+4 this week",
      trend: "up",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Proposals Sent",
      value: data.totalProposals.toString(),
      icon: FileText,
      change: `${data.proposalAcceptanceRate || 0}% win rate`,
      trend: "neutral",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Avg Audit Score",
      value: data.avgAuditScore ? `${Math.round(data.avgAuditScore)}` : "—",
      icon: Activity,
      change: "out of 100",
      trend: "neutral",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <NewAuditDialog open={newAuditOpen} onOpenChange={setNewAuditOpen} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your agency.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leads/find">
            <Button variant="outline" size="sm" className="border-white/10 hover:border-white/20 text-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> Find Leads
            </Button>
          </Link>
          <Button size="sm" onClick={() => setNewAuditOpen(true)} className="bg-primary hover:bg-primary/90 text-white text-sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Audit
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants(0.07)}
        initial="hidden"
        animate="show"
      >
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={itemVariant}>
            <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-white/10 transition-all duration-200 hover:bg-card/60 group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</div>
                <p className={`text-xs mt-1.5 flex items-center gap-0.5 ${stat.trend === "up" ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {stat.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main content row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {/* Pipeline */}
        <Card className="col-span-1 lg:col-span-2 bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Pipeline Overview</CardTitle>
                <CardDescription className="text-xs mt-0.5">Conversion funnel from lead to client</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" asChild>
                <Link href="/analytics">View analytics <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pb-6">
            {[
              { label: "Leads Identified", value: data.totalLeads, max: Math.max(data.totalLeads, 1), color: "[&>div]:bg-blue-500", dot: "bg-blue-500" },
              { label: "Audits Run", value: data.totalAudits, max: Math.max(data.totalLeads, 1), color: "[&>div]:bg-violet-500", dot: "bg-violet-500" },
              { label: "Proposals Sent", value: data.totalProposals, max: Math.max(data.totalAudits, 1), color: "[&>div]:bg-primary", dot: "bg-primary" },
              { label: "Clients Won", value: data.totalClients, max: Math.max(data.totalProposals, 1), color: "[&>div]:bg-emerald-500", dot: "bg-emerald-500" },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                  </div>
                  <span className="font-semibold text-foreground tabular-nums">{item.value}</span>
                </div>
                <Progress
                  value={(item.value / item.max) * 100}
                  className={`h-1.5 bg-white/5 ${item.color}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            <CardDescription className="text-xs">What's happening right now</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {data.recentActivity.slice(0, 6).map((activity: any) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 group"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-background mt-1.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-relaxed">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No activity yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Run an audit to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
