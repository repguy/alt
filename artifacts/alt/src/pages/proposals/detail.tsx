import { useParams, Link } from "wouter";
import { useGetProposal, useAcceptProposal, useSendProposal } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ArrowLeft, Send, CheckCircle2, Clock, Download, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProposalDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  
  const { data: proposal, isLoading, refetch } = useGetProposal(id, {
    query: { enabled: !!id, queryKey: ['/api/proposals', id] }
  });

  const sendProposal = useSendProposal();
  const acceptProposal = useAcceptProposal();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-96 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!proposal) {
    return <div className="p-8">Proposal not found</div>;
  }

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  };

  const handleSend = () => {
    sendProposal.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Proposal Sent", description: "The proposal has been marked as sent." });
        refetch();
      }
    });
  };

  const handleAccept = () => {
    acceptProposal.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Proposal Accepted", description: "The proposal has been accepted!" });
        refetch();
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <Link href="/proposals" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Proposals
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{proposal.title}</h1>
              {proposal.status === 'draft' && <Badge variant="outline">Draft</Badge>}
              {proposal.status === 'sent' && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sent</Badge>}
              {proposal.status === 'accepted' && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Accepted</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">Created {format(new Date(proposal.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border">
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            {proposal.status === 'draft' && (
              <Button onClick={handleSend} disabled={sendProposal.isPending} className="bg-primary hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Mark as Sent
              </Button>
            )}
            {proposal.status === 'sent' && (
              <Button onClick={handleAccept} disabled={acceptProposal.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Accepted
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-blue-500 w-full" />
        <CardHeader>
          <CardTitle>Services & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-border">
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right text-white">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposal.services && proposal.services.length > 0 ? (
                proposal.services.map((service) => (
                  <TableRow key={service.id} className="border-border">
                    <TableCell>
                      <div className="font-medium text-white">{service.name}</div>
                      {service.description && <div className="text-sm text-muted-foreground mt-1 max-w-md">{service.description}</div>}
                      {service.recurring && <Badge variant="secondary" className="mt-2 text-[10px]">Monthly Recurring</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{service.quantity || 1}</TableCell>
                    <TableCell className="text-right">{formatCurrency(service.price, proposal.currency)}</TableCell>
                    <TableCell className="text-right font-bold text-white">
                      {formatCurrency(service.price * (service.quantity || 1), proposal.currency)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No services added to this proposal yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-white/[0.02] border-t border-border flex justify-end p-6">
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Total Value</div>
            <div className="text-3xl font-bold text-primary">{formatCurrency(proposal.totalValue, proposal.currency)}</div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
