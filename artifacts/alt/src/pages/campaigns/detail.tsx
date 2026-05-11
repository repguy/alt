import { useParams, Link } from "wouter";
import { useGetCampaign, useLaunchCampaign } from "@workspace/api-client-react";
import { ArrowLeft, Play, Users, Mail, MousePointerClick, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CampaignDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  
  const { data: campaign, isLoading, refetch } = useGetCampaign(id, {
    query: { enabled: !!id, queryKey: ['/api/campaigns', id] }
  });

  const launch = useLaunchCampaign();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  if (!campaign) return <div className="p-8">Campaign not found</div>;

  const handleLaunch = () => {
    launch.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Campaign Launched", description: "Emails are now being sent." });
        refetch();
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <Link href="/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Campaigns
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{campaign.name}</h1>
              <Badge variant="outline" className="capitalize">{campaign.status}</Badge>
            </div>
          </div>
          {campaign.status === 'draft' && (
            <Button onClick={handleLaunch} disabled={launch.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Play className="w-4 h-4 mr-2" /> Launch Campaign
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-white">{campaign.sentCount || 0}</div>
            <div className="text-xs text-muted-foreground">Recipients</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <div className="text-2xl font-bold text-white">{campaign.openCount || 0}</div>
            <div className="text-xs text-muted-foreground">Opened</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <MousePointerClick className="w-5 h-5 text-purple-400" />
            <div className="text-2xl font-bold text-white">{campaign.openRate ? `${campaign.openRate}%` : '0%'}</div>
            <div className="text-xs text-muted-foreground">Open Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <MessageSquareReply className="w-5 h-5 text-emerald-400" />
            <div className="text-2xl font-bold text-white">{campaign.replyRate ? `${campaign.replyRate}%` : '0%'}</div>
            <div className="text-xs text-muted-foreground">Reply Rate</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
          <CardDescription>The content being sent to prospects.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background/50 border border-white/5 rounded-md p-3 text-sm font-mono text-white">
            <span className="text-muted-foreground mr-2">Subject:</span> {campaign.subject}
          </div>
          <div className="bg-background/50 border border-white/5 rounded-md p-4 text-sm font-mono whitespace-pre-wrap text-white">
            {campaign.body}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
