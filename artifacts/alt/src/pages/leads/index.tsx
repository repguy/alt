import { useState } from "react";
import { Link } from "wouter";
import { useListLeads } from "@workspace/api-client-react";
import { Plus, Search, ExternalLink, MapPin, Mail, Phone, Tag, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLeadDialog } from "@/components/dialogs/add-lead-dialog";
import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusStyles: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  qualified: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  converted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function LeadsList() {
  const [search, setSearch] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const { data: leads, isLoading } = useListLeads();

  const filtered = leads?.filter(l =>
    l.businessName.toLowerCase().includes(search.toLowerCase()) ||
    (l.website && l.website.toLowerCase().includes(search.toLowerCase())) ||
    (l.niche && l.niche.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage your prospect pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leads/find">
            <Button variant="outline" size="sm" className="border-white/10 hover:border-primary/30 text-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> AI Finder
            </Button>
          </Link>
          <Button size="sm" onClick={() => setAddLeadOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Lead
          </Button>
        </div>
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
                placeholder="Search by business, domain, or niche..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 border-white/8 focus:border-primary/40 transition-colors"
              />
            </div>
            {leads && (
              <span className="text-xs text-muted-foreground tabular-nums">{filtered?.length ?? 0} leads</span>
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
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-36 shimmer" />
                      <Skeleton className="h-2.5 w-48 shimmer" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full shimmer" />
                    <Skeleton className="h-3 w-28 shimmer" />
                    <Skeleton className="h-8 w-8 rounded-full shimmer" />
                  </motion.div>
                ))}
              </div>
            ) : !filtered?.length ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-primary/50" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Pipeline is empty</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
                  Use the AI Lead Finder to discover prospects in your niche, or add leads manually.
                </p>
                <Link href="/leads/find">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Find Leads with AI
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs">Business</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                    <TableHead className="text-xs text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.22 }}
                      className="border-white/5 border-b hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="font-semibold text-sm text-foreground">{lead.businessName}</div>
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                            {lead.website.replace(/^https?:\/\//, "").slice(0, 30)} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`text-[10px] px-2 py-0.5 capitalize ${statusStyles[lead.status] ?? "bg-muted/30 text-muted-foreground border-white/8"}`}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          {lead.contactName && <div className="text-xs font-medium text-foreground">{lead.contactName}</div>}
                          {lead.contactEmail && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Mail className="w-2.5 h-2.5 shrink-0" /> {lead.contactEmail}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Phone className="w-2.5 h-2.5 shrink-0" /> {lead.phone}
                            </div>
                          )}
                          {!lead.contactName && !lead.contactEmail && !lead.phone && (
                            <span className="text-[11px] text-muted-foreground/40 italic">No contact</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          {lead.location && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="w-2.5 h-2.5 text-primary/50 shrink-0" /> {lead.location}
                            </div>
                          )}
                          {lead.niche && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Tag className="w-2.5 h-2.5 text-primary/50 shrink-0" /> {lead.niche}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {lead.auditScore ? (
                          <span className={`inline-flex items-center justify-center w-8 h-7 rounded-md border text-xs font-bold tabular-nums ${
                            lead.auditScore >= 60 ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/15"
                            : lead.auditScore >= 40 ? "text-yellow-400 bg-yellow-500/8 border-yellow-500/15"
                            : "text-red-400 bg-red-500/8 border-red-500/15"
                          }`}>
                            {lead.auditScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
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
