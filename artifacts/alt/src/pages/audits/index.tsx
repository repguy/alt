import { useState } from "react";
import { Link } from "wouter";
import { useListAudits } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, ExternalLink, RefreshCw, AlertCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NewAuditDialog } from "@/components/dialogs/new-audit-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AuditsList() {
  const [search, setSearch] = useState("");
  const [newAuditOpen, setNewAuditOpen] = useState(false);
  const { data: audits, isLoading } = useListAudits();

  const filteredAudits = audits?.filter(
    (audit) =>
      audit.url.toLowerCase().includes(search.toLowerCase()) ||
      (audit.websiteName && audit.websiteName.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
      case 'pending':
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Running</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 90) return "text-emerald-500";
    if (score >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <NewAuditDialog open={newAuditOpen} onOpenChange={setNewAuditOpen} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Website Audits</h1>
          <p className="text-muted-foreground mt-1">Run AI-powered analysis on prospect websites.</p>
        </div>
        <Button onClick={() => setNewAuditOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> New Audit
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredAudits?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No audits found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                You haven't run any website audits yet, or none match your search.
              </p>
              <Button>Run First Audit</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits?.map((audit) => (
                  <TableRow key={audit.id} className="border-border border-b hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted/20 border border-white/5 flex items-center justify-center overflow-hidden">
                          {audit.screenshotUrl ? (
                            <img src={audit.screenshotUrl} alt={audit.url} className="w-full h-full object-cover" />
                          ) : (
                            <Activity className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="text-white flex items-center gap-1.5">
                            {audit.websiteName || audit.url.replace(/^https?:\/\//, '')}
                            <a href={audit.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {audit.websiteName && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{audit.url}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className={`font-bold text-lg ${getScoreColor(audit.overallScore)}`}>
                        {audit.overallScore || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(audit.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/audits/${audit.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/20 hover:text-primary">
                          View Report
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
