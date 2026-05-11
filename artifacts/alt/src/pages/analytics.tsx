import { useGetRevenueAnalytics, useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { TrendingUp, Users, FileText, DollarSign } from "lucide-react";

export default function Analytics() {
  const { data: revenue, isLoading: revLoading } = useGetRevenueAnalytics();
  const { data: dashboard, isLoading: dashLoading } = useGetDashboardAnalytics();

  if (revLoading || dashLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl mt-6" />
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your agency's performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(revenue?.mrr || 0)}</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> +15% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Annual Run Rate</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(revenue?.arr || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white">{dashboard?.proposalAcceptanceRate || 0}%</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-white">{dashboard?.activeDeals || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5 p-1">
        <CardHeader>
          <CardTitle>Revenue Growth</CardTitle>
          <CardDescription>Monthly revenue vs Proposals accepted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue?.monthlyData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250 89% 65%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(250 89% 65%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(240 10% 6%)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(250 89% 65%)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
