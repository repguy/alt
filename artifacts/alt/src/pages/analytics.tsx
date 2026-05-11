import { useGetRevenueAnalytics, useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { TrendingUp, Users, FileText, DollarSign, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("revenue")
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { data: revenue, isLoading: revLoading } = useGetRevenueAnalytics();
  const { data: dashboard, isLoading: dashLoading } = useGetDashboardAnalytics();
  const isLoading = revLoading || dashLoading;

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const statCards = [
    { title: "Monthly Revenue", value: fmt(revenue?.mrr || 0), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", change: "+15%" },
    { title: "Annual Run Rate", value: fmt(revenue?.arr || 0), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", change: "ARR" },
    { title: "Proposal Win Rate", value: `${dashboard?.proposalAcceptanceRate || 0}%`, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", change: "acceptance" },
    { title: "Active Deals", value: String(dashboard?.activeDeals || 0), icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", change: "in pipeline" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance metrics for your agency.</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="rounded-xl border border-white/5 bg-card/40 p-5 space-y-3">
                <Skeleton className="h-3.5 w-28 shimmer" />
                <Skeleton className="h-7 w-24 shimmer" />
                <Skeleton className="h-2.5 w-16 shimmer" />
              </div>
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl shimmer" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-56 rounded-xl shimmer" />
            <Skeleton className="h-56 rounded-xl shimmer" />
          </div>
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {statCards.map((s, i) => (
              <motion.div key={i} variants={item}>
                <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-white/10 transition-all hover:bg-card/60">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground">{s.title}</p>
                      <div className={`p-1.5 rounded-lg ${s.bg}`}>
                        <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">{s.value}</div>
                    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {s.change}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
            <Card className="bg-card/40 backdrop-blur border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenue Growth</CardTitle>
                <CardDescription className="text-xs">Monthly revenue vs proposals accepted</CardDescription>
              </CardHeader>
              <CardContent>
                {revenue?.monthlyRevenue?.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenue.monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(250 89% 65%)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(250 89% 65%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="propGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 45%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 45%)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(250 89% 65%)" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="proposals" name="Proposals" stroke="hsl(142 71% 45%)" fill="url(#propGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                    No revenue data yet — close proposals to start tracking.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            <Card className="bg-card/40 backdrop-blur border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Leads by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.leadsByStatus?.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dashboard.leadsByStatus} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="status" tick={{ fontSize: 10, fill: "hsl(220 10% 45%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 45%)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" name="Leads" fill="hsl(250 89% 65%)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">No lead data yet</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Pipeline Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {[
                  { label: "Total Leads", value: dashboard?.totalLeads || 0, color: "bg-blue-500" },
                  { label: "Audits Run", value: dashboard?.totalAudits || 0, color: "bg-violet-500" },
                  { label: "Proposals", value: dashboard?.totalProposals || 0, color: "bg-primary" },
                  { label: "Clients Won", value: dashboard?.totalClients || 0, color: "bg-emerald-500" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${row.color}`} />
                    <span className="text-xs text-muted-foreground flex-1">{row.label}</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
