import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateClient } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
});

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createClient = useCreateClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", company: "", email: "", phone: "", website: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createClient.mutate(
      { data: values },
      {
        onSuccess: () => {
          onOpenChange(false);
          queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
          toast({ title: "Client added", description: "The client has been added to your roster." });
          form.reset();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add client. Please try again.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-white/8 p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-base font-semibold">Add New Client</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a client to your roster. You can attach proposals and track revenue.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" className="h-8 text-sm bg-background/50 border-white/8" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Company <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc" className="h-8 text-sm bg-background/50 border-white/8" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jane@acme.com" className="h-8 text-sm bg-background/50 border-white/8" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 0100" className="h-8 text-sm bg-background/50 border-white/8" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Website <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com" className="h-8 text-sm bg-background/50 border-white/8" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={createClient.isPending}
                className="w-full h-9 text-sm bg-primary hover:bg-primary/90 text-white"
              >
                {createClient.isPending ? "Adding client..." : "Add Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
