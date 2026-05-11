import { useParams, Link } from "wouter";
import { useGetAudit, useRegenerateAuditReport } from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  MonitorSmartphone,
  Zap,
  Accessibility,
  LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuditDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: audit, isLoading } = useGetAudit(id, {
    query: { enabled: !!id, queryKey: ['/api/audits', id] } // Fallback key format
  });
  
  const regenerateReport = useRegenerateAuditReport();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full md:col-span-1" />
          <Skeleton className="h-64 w-full md:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full mt-6" />
      </div>
    );
  }

  if (!audit) {
    return <div className="p-8">Audit not found</div>;
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 90) return "text-emerald-500";
    if (score >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  const ScoreRing = ({ score, label, icon: Icon }: { score: number | null | undefined, label: string, icon: any }) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = score ? circumference - (score / 100) * circumference : circumference;
    const colorClass = score && score >= 90 ? "text-emerald-500" : score && score >= 50 ? "text-yellow-500" : score ? "text-destructive" : "text-muted";

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="transform -rotate-90 w-24 h-24 absolute inset-0">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted/20"
            />
            {score && (
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${colorClass} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${colorClass}`}>{score || '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Icon className="w-4 h-4" /> {label}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <Link href="/audits" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Audits
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {audit.websiteName || audit.url.replace(/^https?:\/\//, '')}
              {audit.status === 'completed' && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs py-0.5">Completed</Badge>}
            </h1>
            <a href={audit.url} target="_blank" rel="noreferrer" className="text-muted-foreground mt-1 flex items-center hover:text-primary transition-colors">
              {audit.url} <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border">
              Download PDF
            </Button>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => regenerateReport.mutate({ id, data: {} })}
              disabled={regenerateReport.isPending}
            >
              {regenerateReport.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerate
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5 lg:col-span-1 flex flex-col items-center justify-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground mb-6">Overall Score</h3>
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <svg className="transform -rotate-90 w-48 h-48 absolute inset-0">
              <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
              {audit.overallScore && (
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={(2 * Math.PI * 80) - ((audit.overallScore / 100) * (2 * Math.PI * 80))}
                  className={`${getScoreColor(audit.overallScore)} transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-6xl font-black tracking-tighter ${getScoreColor(audit.overallScore)}`}>{audit.overallScore || '—'}</span>
              <span className="text-sm text-muted-foreground mt-1">out of 100</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Audit generated {format(new Date(audit.createdAt), 'MMM d, yyyy')}
          </div>
        </Card>

        {/* Categories */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
              <ScoreRing score={audit.seoScore} label="SEO" icon={LineChart} />
              <ScoreRing score={audit.performanceScore} label="Performance" icon={Zap} />
              <ScoreRing score={audit.accessibilityScore} label="Accessibility" icon={Accessibility} />
              <ScoreRing score={audit.uxScore} label="UX / Mobile" icon={MonitorSmartphone} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ai-summary" className="w-full">
        <TabsList className="bg-card/50 border-white/5 w-full justify-start border-b rounded-none px-0 pb-px mb-6">
          <TabsTrigger value="ai-summary" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary px-6">AI Executive Summary</TabsTrigger>
          <TabsTrigger value="issues" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary px-6">
            Issues Found 
            {audit.issueCount && <Badge className="ml-2 bg-primary/20 text-primary">{audit.issueCount}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai-summary" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardContent className="p-6 md:p-8">
              <div className="prose prose-invert max-w-none">
                {audit.aiSummary ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{audit.aiSummary}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">AI Summary Not Available</p>
                      <p className="text-muted-foreground mt-1">Regenerate the report to generate an AI summary.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues">
          <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardContent className="p-0 divide-y divide-border">
              {audit.issues?.length ? (
                audit.issues.map((issue) => (
                  <div key={issue.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            issue.severity === 'critical' ? 'text-destructive border-destructive/30 bg-destructive/10' :
                            issue.severity === 'high' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                            issue.severity === 'medium' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                            'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                          }>
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="bg-muted/30">{issue.category}</Badge>
                        </div>
                        <h4 className="text-lg font-medium text-white">{issue.title}</h4>
                        <p className="text-muted-foreground text-sm max-w-3xl">{issue.description}</p>
                      </div>
                    </div>
                    {issue.recommendation && (
                      <div className="mt-4 bg-muted/20 border border-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-white">AI Recommendation</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No issues found or recorded for this audit.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
