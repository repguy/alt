import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProposal } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  totalValue: z.preprocess((val) => Number(val), z.number().min(0)),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
});

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProposalDialog({ open, onOpenChange }: CreateProposalDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProposal = useCreateProposal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      totalValue: 0,
      currency: "USD",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProposal.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          toast({ title: "Proposal created", description: "You can now add services and send it." });
          setLocation(`/proposals/${data.id}`);
          form.reset();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/5">
        <DialogHeader>
          <DialogTitle className="text-white">Create Proposal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set the basic details for your new client proposal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Proposal Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Website Optimization for Acme" className="bg-background/50 border-white/10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Total Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2500" className="bg-background/50 border-white/10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-white/5">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Internal Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Client wants to focus on SEO..." className="bg-background/50 border-white/10 resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={createProposal.isPending}
                className="bg-primary hover:bg-primary/90 text-white w-full"
              >
                {createProposal.isPending ? "Creating..." : "Create Proposal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
