import { useState } from "react";
import { Link } from "wouter";
import { useListProposals } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, FileText, CheckCircle2, Send, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProposalsList() {
  const [search, setSearch] = useState("");
  const { data: proposals, isLoading } = useListProposals();

  const filteredProposals = proposals?.filter(
    (prop) =>
      prop.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge className="bg-muted/10 text-muted-foreground border-muted/20"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'sent': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Send className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'accepted': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'declined': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Declined</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Proposals</h1>
          <p className="text-muted-foreground mt-1">Create and track service proposals for clients.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Create Proposal
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredProposals?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No proposals found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                You haven't created any proposals yet. Send your first proposal to close a deal.
              </p>
              <Button>Create Proposal</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals?.map((prop) => (
                  <TableRow key={prop.id} className="border-border border-b hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium text-white">
                      {prop.title}
                    </TableCell>
                    <TableCell>{getStatusBadge(prop.status)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(prop.totalValue, prop.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(prop.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/proposals/${prop.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/20 hover:text-primary">
                          View
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
