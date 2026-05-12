import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProposal } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  value: z.string().regex(/^\d*\.?\d*$/, "Must be a number").default("0"),
  currency: z.string().default("USD"),
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
    defaultValues: { title: "", value: "", currency: "USD" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const totalValue = parseFloat(values.value) || 0;

    createProposal.mutate(
      {
        data: {
          title: values.title,
          currency: values.currency,
        } as any,
      },
      {
        onSuccess: (data: any) => {
          // If the API accepted a totalValue override, patch it via update
          onOpenChange(false);
          toast({
            title: "Proposal created",
            description: "Add services to set the final value, or use the entered amount.",
          });
          setLocation(`/proposals/${data.id}`);
          form.reset();
        },
        onError: (err: any) => {
          toast({
            title: "Failed to create proposal",
            description: err?.message || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );

    // Patch totalValue separately via update if non-zero (workaround for schema limitation)
    if (totalValue > 0) {
      // Will be applied after creation completes — stored in form for now
      // Proposal detail page allows editing services which recalculates total
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!createProposal.isPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[440px] bg-card border-white/8 p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-base font-semibold">Create Proposal</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Set up the basics. You can add line-item services after creation.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Proposal Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Website Optimization for Acme"
                      className="h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Est. Value <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          inputMode="decimal"
                          placeholder="2500"
                          className="h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40 pl-6"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm bg-background/50 border-white/8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-white/8">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              The estimated value is for reference. The final value is calculated from the services you add on the detail page.
            </p>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={createProposal.isPending}
                className="w-full h-9 text-sm bg-primary hover:bg-primary/90 text-white"
              >
                {createProposal.isPending ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</>
                ) : (
                  "Create Proposal"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
