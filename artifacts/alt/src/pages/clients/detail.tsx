import { useParams, Link } from "wouter";
import { useGetClient, useListClientNotes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Globe, Building2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClientDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: client, isLoading } = useGetClient(id, {
    query: { enabled: !!id, queryKey: ['/api/clients', id] }
  });

  const { data: notes, isLoading: notesLoading } = useListClientNotes(id, {
    query: { enabled: !!id, queryKey: ['/api/clients', id, 'notes'] }
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full md:col-span-1" />
          <Skeleton className="h-96 w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!client) return <div className="p-8">Client not found</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/10 shadow-xl">
              <AvatarImage src={client.avatarUrl || ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {client.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">{client.name}</h1>
                {client.status === 'active' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active Client</Badge>
                ) : (
                  <Badge variant="outline">{client.status}</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                {client.company && <><Building2 className="w-3.5 h-3.5" /> {client.company}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border">Edit Profile</Button>
            <Button className="bg-primary hover:bg-primary/90">Create Proposal</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <a href={`mailto:${client.email}`} className="hover:text-white transition-colors">{client.email}</a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <a href={`tel:${client.phone}`} className="hover:text-white transition-colors">{client.phone}</a>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <a href={client.website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{client.website}</a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Lifetime Value</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(client.totalRevenue || 0)}</div>
              </div>
              <div className="h-px w-full bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Projects</div>
                  <div className="text-xl font-medium text-white">{client.completedProjects || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Active</div>
                  <div className="text-xl font-medium text-white">{client.activeProposals || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-white/5 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <CardTitle className="text-lg">Notes & Activity</CardTitle>
              <Button variant="ghost" size="sm" className="h-8">
                <Plus className="w-4 h-4 mr-2" /> Add Note
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {notesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-6">
                  {notes.map(note => (
                    <div key={note.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-white">{note.authorName || 'User'}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}</div>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No notes yet for this client.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
