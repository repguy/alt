import { 
  Activity, 
  Users, 
  FileText, 
  Briefcase, 
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Clock
} from "lucide-react";
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

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetDashboardAnalytics();
  const [newAuditOpen, setNewAuditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Skeleton className="h-32 w-full rounded-xl" />
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <Skeleton className="h-96 w-full col-span-2 rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Fallback data if API returns null but we want to show the structure
  const data = analytics || {
    totalLeads: 0,
    totalAudits: 0,
    totalProposals: 0,
    totalClients: 0,
    totalRevenue: 0,
    activeDeals: 0,
    proposalAcceptanceRate: 0,
    recentActivity: []
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalRevenue),
      icon: TrendingUp,
      change: "+12.5%",
      trend: "up"
    },
    {
      title: "Active Leads",
      value: data.totalLeads.toString(),
      icon: Users,
      change: "+4.2%",
      trend: "up"
    },
    {
      title: "Proposals Sent",
      value: data.totalProposals.toString(),
      icon: FileText,
      change: "24 this month",
      trend: "neutral"
    },
    {
      title: "Avg Audit Score",
      value: data.avgAuditScore ? `${data.avgAuditScore}/100` : "N/A",
      icon: Activity,
      change: "+2 pts",
      trend: "up"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <NewAuditDialog open={newAuditOpen} onOpenChange={setNewAuditOpen} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your agency today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/leads/find">
            <Button variant="outline" className="border-border">Find Leads</Button>
          </Link>
          <Button onClick={() => setNewAuditOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            New Audit <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-white/5 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-white/5 rounded-md">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className={`text-xs mt-1 ${stat.trend === 'up' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pipeline Overview</CardTitle>
                <CardDescription>Conversion metrics from lead to client</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/analytics">View Full Report</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-white">Leads Identified</span>
                </div>
                <span className="text-muted-foreground">{data.totalLeads}</span>
              </div>
              <Progress value={100} className="h-2 bg-white/5 [&>div]:bg-blue-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="font-medium text-white">Audits Run</span>
                </div>
                <span className="text-muted-foreground">{data.totalAudits}</span>
              </div>
              <Progress value={(data.totalAudits / Math.max(1, data.totalLeads)) * 100} className="h-2 bg-white/5 [&>div]:bg-purple-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium text-white">Proposals Sent</span>
                </div>
                <span className="text-muted-foreground">{data.totalProposals}</span>
              </div>
              <Progress value={(data.totalProposals / Math.max(1, data.totalAudits)) * 100} className="h-2 bg-white/5 [&>div]:bg-primary" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-white">Clients Won</span>
                </div>
                <span className="text-muted-foreground">{data.totalClients}</span>
              </div>
              <Progress value={(data.totalClients / Math.max(1, data.totalProposals)) * 100} className="h-2 bg-white/5 [&>div]:bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What's happening right now</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-6">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-0.5 relative">
                      <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                      <div className="absolute top-2 left-1 w-px h-12 bg-border -translate-x-1/2 last:hidden" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
            
            <Button variant="ghost" className="w-full mt-6 text-sm text-muted-foreground hover:text-white">
              View all activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
