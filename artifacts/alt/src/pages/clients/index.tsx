import { useState } from "react";
import { Link } from "wouter";
import { useListClients } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, Building2, Mail, Phone, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useListClients();

  const filteredClients = clients?.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your agency's active clients and history.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> New Client
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
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
          ) : filteredClients?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No clients found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Your client roster is empty. Convert leads to clients to see them here.
              </p>
              <Button>Add Client</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients?.map((client) => (
                  <TableRow key={client.id} className="border-border border-b hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={client.avatarUrl || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white font-medium">{client.name}</div>
                          {client.company && <div className="text-xs text-muted-foreground">{client.company}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.status === 'active' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                      ) : client.status === 'inactive' ? (
                        <Badge className="bg-muted/10 text-muted-foreground border-muted/20">Inactive</Badge>
                      ) : (
                        <Badge variant="outline">{client.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Mail className="w-3 h-3" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-white">{formatCurrency(client.totalRevenue || 0)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/20 hover:text-primary">
                          View Profile
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
