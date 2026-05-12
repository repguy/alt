import { useState } from "react";
import { Link } from "wouter";
import { useListClients } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Search, Building2, Mail, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";
import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-muted/10 text-muted-foreground border-muted/20",
  prospect: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const [addClientOpen, setAddClientOpen] = useState(false);
  const { data: clients, isLoading } = useListClients();

  const filtered = clients?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <AddClientDialog open={addClientOpen} onOpenChange={setAddClientOpen} />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your active clients and revenue.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddClientOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Client
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
                placeholder="Search by name, company, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 border-white/8 focus:border-primary/40 transition-colors"
              />
            </div>
            {clients && (
              <span className="text-xs text-muted-foreground tabular-nums">{filtered?.length ?? 0} clients</span>
            )}
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-white/5">
                {[0,1,2,3].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="px-4 py-3.5 flex items-center gap-4"
                  >
                    <Skeleton className="h-9 w-9 rounded-full shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32 shimmer" />
                      <Skeleton className="h-2.5 w-40 shimmer" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full shimmer" />
                    <Skeleton className="h-3 w-28 shimmer" />
                    <Skeleton className="h-7 w-20 rounded-lg shimmer" />
                  </motion.div>
                ))}
              </div>
            ) : !filtered?.length ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-primary/50" />
                </div>
                <h3 className="text-sm font-semibold mb-1">No clients yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
                  Add your first client manually, or convert a lead once a proposal is accepted.
                </p>
                <Button size="sm" onClick={() => setAddClientOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Client
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs text-right">Revenue</TableHead>
                    <TableHead className="text-xs">Added</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((client, i) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.22 }}
                      className="border-white/5 border-b hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-1 ring-white/10 shrink-0">
                            <AvatarImage src={(client as any).avatarUrl || ""} />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-foreground">{client.name}</div>
                            {client.company && (
                              <div className="text-[11px] text-muted-foreground">{client.company}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`text-[10px] px-2 py-0.5 capitalize ${statusStyles[client.status] ?? "bg-muted/10 text-muted-foreground border-white/8"}`}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          {client.email && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Mail className="w-2.5 h-2.5 shrink-0" /> {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Phone className="w-2.5 h-2.5 shrink-0" /> {client.phone}
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-[11px] text-muted-foreground/40 italic">No contact</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((client as any).totalRevenue || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {format(new Date(client.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-primary/10 hover:text-primary">
                            View
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
