import { useState } from "react";
import { Link } from "wouter";
import { useListLeads } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, ExternalLink, Filter, MapPin, Mail, Phone, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLeadDialog } from "@/components/dialogs/add-lead-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LeadsList() {
  const [search, setSearch] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const { data: leads, isLoading } = useListLeads();

  const filteredLeads = leads?.filter(
    (lead) =>
      lead.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.website && lead.website.toLowerCase().includes(search.toLowerCase())) ||
      (lead.niche && lead.niche.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>;
      case 'contacted': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Contacted</Badge>;
      case 'qualified': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Qualified</Badge>;
      case 'converted': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Converted</Badge>;
      case 'lost': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Lost</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Leads Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage and track your prospect pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/leads/find">
            <Button variant="outline" className="border-border">
              <Search className="mr-2 h-4 w-4" /> AI Lead Finder
            </Button>
          </Link>
          <Button onClick={() => setAddLeadOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, domain, or niche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>
          <Button variant="outline" size="icon" className="border-border">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredLeads?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Your pipeline is empty. Use the AI Lead Finder to discover prospects in your niche.
              </p>
              <Link href="/leads/find">
                <Button>Find Leads</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location & Niche</TableHead>
                  <TableHead className="text-right">Audit Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.map((lead) => (
                  <TableRow key={lead.id} className="border-border border-b hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium">
                      <div className="text-white font-semibold">{lead.businessName}</div>
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                          {lead.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {lead.contactName && <div className="text-white">{lead.contactName}</div>}
                        {lead.contactEmail && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Mail className="w-3 h-3" /> {lead.contactEmail}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </div>
                        )}
                        {!lead.contactName && !lead.contactEmail && !lead.phone && <span className="text-muted-foreground italic">No contact info</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        {lead.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 text-primary/70" /> {lead.location}
                          </div>
                        )}
                        {lead.niche && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="w-3 h-3 text-primary/70" /> {lead.niche}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {lead.auditScore ? (
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 text-primary font-bold">
                          {lead.auditScore}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="hover:bg-white/5">
                        Edit
                      </Button>
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
