import { useState } from "react";
import { Link } from "wouter";
import { useListCampaigns } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, Megaphone, Play, Pause, CheckCircle2, Clock } from "lucide-react";
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

export default function CampaignsList() {
  const [search, setSearch] = useState("");
  const { data: campaigns, isLoading } = useListCampaigns();

  const filteredCampaigns = campaigns?.filter(
    (camp) =>
      camp.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">Draft</Badge>;
      case 'scheduled': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case 'running': return <Badge className="bg-primary/10 text-primary border-primary/20"><Play className="w-3 h-3 mr-1" /> Running</Badge>;
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Outreach Campaigns</h1>
          <p className="text-muted-foreground mt-1">Automate personalized outreach at scale.</p>
        </div>
        <Link href="/campaigns/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredCampaigns?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No campaigns found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Start your first automated outreach campaign to turn leads into clients.
              </p>
              <Link href="/campaigns/new">
                <Button>Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Reply Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns?.map((camp) => (
                  <TableRow key={camp.id} className="border-border border-b hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium text-white">
                      {camp.name}
                      <div className="text-xs text-muted-foreground font-normal mt-0.5 capitalize">{camp.type}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(camp.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{camp.sentCount || 0}</TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-400">{camp.openRate ? `${camp.openRate}%` : '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-emerald-400">{camp.replyRate ? `${camp.replyRate}%` : '—'}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/campaigns/${camp.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/20 hover:text-primary">
                          View Stats
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
