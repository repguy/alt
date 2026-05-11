import { useState } from "react";
import { Link } from "wouter";
import { useListAudits } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, ExternalLink, RefreshCw, AlertCircle, Activity, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NewAuditDialog } from "@/components/dialogs/new-audit-dialog";
import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function ScorePill({ score }: { score: number | null | undefined }) {
  if (!score) return <span className="text-muted-foreground/50 text-sm">—</span>;
  const color = score >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 50 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center justify-center w-9 h-7 rounded-md border text-xs font-bold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

export default function AuditsList() {
  const [search, setSearch] = useState("");
  const [newAuditOpen, setNewAuditOpen] = useState(false);
  const { data: audits, isLoading } = useListAudits();

  const filtered = audits?.filter(a =>
    a.url.toLowerCase().includes(search.toLowerCase()) ||
    (a.websiteName && a.websiteName.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5">Completed</Badge>;
      case "pending":
      case "running":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Running
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit">
            <AlertCircle className="w-2.5 h-2.5" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <NewAuditDialog open={newAuditOpen} onOpenChange={setNewAuditOpen} />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Audits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-powered analysis across 6 dimensions.</p>
        </div>
        <Button size="sm" onClick={() => setNewAuditOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Audit
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 border-white/8 focus:border-primary/40 transition-colors"
              />
            </div>
            {audits && (
              <span className="text-xs text-muted-foreground tabular-nums">{filtered?.length ?? 0} audits</span>
            )}
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-white/5">
                {[0,1,2,3,4].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="px-4 py-3.5 flex items-center gap-4"
                  >
                    <Skeleton className="h-9 w-9 rounded-lg shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40 shimmer" />
                      <Skeleton className="h-2.5 w-56 shimmer" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full shimmer" />
                    <Skeleton className="h-7 w-9 rounded-md shimmer" />
                    <Skeleton className="h-3 w-20 shimmer" />
                    <Skeleton className="h-7 w-20 rounded-lg shimmer" />
                  </motion.div>
                ))}
              </div>
            ) : !filtered?.length ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-7 h-7 text-primary/60" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">No audits yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
                  Enter any website URL and AI will analyze it across SEO, Performance, UX and more.
                </p>
                <Button size="sm" onClick={() => setNewAuditOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Run First Audit
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs">Website</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Score</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((audit, i) => (
                    <motion.tr
                      key={audit.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="border-white/5 border-b hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 border border-white/5 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4 text-primary/60" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                              {audit.websiteName || audit.url.replace(/^https?:\/\//, "")}
                              <a href={audit.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {audit.websiteName && (
                              <div className="text-[11px] text-muted-foreground/60 truncate max-w-[220px]">{audit.url}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">{getStatusBadge(audit.status)}</TableCell>
                      <TableCell className="py-3 text-right">
                        <ScorePill score={audit.overallScore} />
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {format(new Date(audit.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Link href={`/audits/${audit.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-primary/10 hover:text-primary">
                            View Report
                          </Button>
                        </Link>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
