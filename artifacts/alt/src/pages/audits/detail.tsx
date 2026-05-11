import { useParams, Link } from "wouter";
import { useGetAudit, useRegenerateAuditReport } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  ArrowLeft, ExternalLink, RefreshCw, AlertCircle, CheckCircle2,
  Zap, MonitorSmartphone, Accessibility, LineChart, Target, Gauge, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

function ScoreRing({ score, label, icon: Icon, color }: { score: number | null | undefined; label: string; icon: any; color: string }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = score ? circ - (score / 100) * circ : circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="transform -rotate-90 w-20 h-20 absolute inset-0">
          <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
          {score && (
            <motion.circle
              cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="6" fill="transparent"
              strokeDasharray={circ} strokeDashoffset={circ}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className={color}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-lg font-bold ${color}`}>{score || "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Icon className="w-3 h-3" />
        {label}
      </div>
    </div>
  );
}

const scoreColor = (s: number | null | undefined) =>
  !s ? "text-muted-foreground" : s >= 75 ? "text-emerald-400" : s >= 50 ? "text-yellow-400" : "text-red-400";

export default function AuditDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: audit, isLoading } = useGetAudit(id, { query: { enabled: !!id, refetchInterval: (q) => q.state.data?.status === "running" ? 3000 : false } });
  const regenerate = useRegenerateAuditReport();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
        <Skeleton className="h-4 w-24 shimmer" />
        <Skeleton className="h-8 w-72 shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <Skeleton className="h-64 shimmer rounded-xl" />
          <Skeleton className="h-64 col-span-2 shimmer rounded-xl" />
        </div>
        <Skeleton className="h-80 shimmer rounded-xl" />
      </div>
    );
  }

  if (!audit) return <div className="p-8 text-muted-foreground text-sm">Audit not found</div>;

  const isRunning = audit.status === "running";

  const categories = [
    { score: audit.seoScore, label: "SEO", icon: LineChart, color: scoreColor(audit.seoScore) },
    { score: audit.performanceScore, label: "Performance", icon: Zap, color: scoreColor(audit.performanceScore) },
    { score: audit.accessibilityScore, label: "Accessibility", icon: Accessibility, color: scoreColor(audit.accessibilityScore) },
    { score: audit.uxScore, label: "UX", icon: MonitorSmartphone, color: scoreColor(audit.uxScore) },
    { score: (audit as any).conversionScore, label: "Conversion", icon: Target, color: scoreColor((audit as any).conversionScore) },
    { score: (audit as any).mobileScore, label: "Mobile", icon: Gauge, color: scoreColor((audit as any).mobileScore) },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Link href="/audits" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 group">
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Audits
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">
                {audit.websiteName || audit.url.replace(/^https?:\/\//, "")}
              </h1>
              {isRunning ? (
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Analyzing...
                </Badge>
              ) : audit.status === "completed" ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Completed</Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Failed</Badge>
              )}
            </div>
            <a href={audit.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1">
              {audit.url} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 hover:border-primary/40 hover:bg-primary/5 text-sm"
            onClick={() => regenerate.mutate({ id, data: {} })}
            disabled={regenerate.isPending || isRunning}
          >
            {regenerate.isPending ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Regenerating</>
            ) : (
              <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate</>
            )}
          </Button>
        </div>
      </motion.div>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 flex items-center gap-3"
        >
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">AI is analyzing this website</p>
            <p className="text-xs text-blue-400/70 mt-0.5">This usually takes 15-30 seconds. Results will appear automatically.</p>
          </div>
        </motion.div>
      )}

      {/* Scores */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        {/* Overall */}
        <Card className="bg-card/40 backdrop-blur border-white/5 flex flex-col items-center justify-center py-8">
          <p className="text-xs font-medium text-muted-foreground mb-5">Overall Score</p>
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <svg className="transform -rotate-90 w-40 h-40 absolute inset-0">
              <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
              {audit.overallScore && (
                <motion.circle
                  cx="80" cy="80" r="68"
                  stroke="currentColor" strokeWidth="10" fill="transparent"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68}
                  animate={{ strokeDashoffset: (2 * Math.PI * 68) - (audit.overallScore / 100) * (2 * Math.PI * 68) }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                  className={scoreColor(audit.overallScore)}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute text-center">
              <span className={`text-5xl font-black tracking-tighter ${scoreColor(audit.overallScore)}`}>
                {audit.overallScore || (isRunning ? "…" : "—")}
              </span>
              {audit.overallScore && <p className="text-[11px] text-muted-foreground mt-0.5">out of 100</p>}
            </div>
          </div>
          {audit.completedAt && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {format(new Date(audit.completedAt), "MMM d, yyyy")}
            </p>
          )}
        </Card>

        {/* Category scores */}
        <Card className="lg:col-span-2 bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 py-2">
              {categories.map((cat) => (
                <ScoreRing key={cat.label} {...cat} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
        <Tabs defaultValue="summary">
          <TabsList className="bg-card/40 border border-white/5 w-auto mb-4 h-9">
            <TabsTrigger value="summary" className="text-xs h-7 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              AI Summary
            </TabsTrigger>
            <TabsTrigger value="issues" className="text-xs h-7 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              Issues
              {(audit.issueCount ?? 0) > 0 && (
                <span className="ml-1.5 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{audit.issueCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="bg-card/40 backdrop-blur border-white/5">
              <CardContent className="p-6">
                {isRunning ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className={`h-4 shimmer ${i === 3 ? "w-2/3" : "w-full"}`} />)}
                    <div className="mt-4 space-y-2">
                      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-3.5 shimmer" />)}
                    </div>
                  </div>
                ) : audit.aiSummary ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-sm text-muted-foreground leading-relaxed">{audit.aiSummary}</p>
                    {(audit as any).aiRecommendations && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" /> AI Recommendations
                        </h4>
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{(audit as any).aiRecommendations}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="w-8 h-8 text-primary/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">AI summary not available. Regenerate to create one.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card className="bg-card/40 backdrop-blur border-white/5">
              <CardContent className="p-0 divide-y divide-white/5">
                {isRunning ? (
                  <div className="p-6 space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-48 shimmer" />
                        <Skeleton className="h-3 w-full shimmer" />
                        <Skeleton className="h-3 w-3/4 shimmer" />
                      </div>
                    ))}
                  </div>
                ) : audit.issues?.length ? (
                  audit.issues.map((issue, i) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                          issue.severity === "critical" ? "text-red-400" :
                          issue.severity === "high" ? "text-orange-400" :
                          issue.severity === "medium" ? "text-yellow-400" : "text-emerald-400"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              issue.severity === "critical" ? "text-red-400 border-red-500/20 bg-red-500/8" :
                              issue.severity === "high" ? "text-orange-400 border-orange-500/20 bg-orange-500/8" :
                              issue.severity === "medium" ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/8" :
                              "text-emerald-400 border-emerald-500/20 bg-emerald-500/8"
                            }`}>
                              {issue.severity?.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-white/5 border border-white/8 px-1.5 py-0.5 rounded capitalize">{issue.category}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">{issue.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{issue.description}</p>
                          {issue.recommendation && (
                            <div className="mt-3 bg-primary/5 border border-primary/10 rounded-lg p-3">
                              <p className="text-[11px] font-medium text-primary mb-0.5 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Fix
                              </p>
                              <p className="text-xs text-muted-foreground">{issue.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-sm text-muted-foreground">No issues recorded for this audit.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
