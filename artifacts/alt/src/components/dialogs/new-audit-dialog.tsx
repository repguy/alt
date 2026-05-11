import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAudit } from "@workspace/api-client-react";
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

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL (e.g., https://example.com)"),
  websiteName: z.string().optional(),
});

interface NewAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAuditDialog({ open, onOpenChange }: NewAuditDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAudit = useCreateAudit();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      websiteName: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createAudit.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          toast({ title: "Audit started", description: "AI is analyzing the website now." });
          setLocation(`/audits/${data.id}`);
          form.reset();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/5">
        <DialogHeader>
          <DialogTitle className="text-white">New Website Audit</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter a website URL to run an AI-powered conversion audit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" className="bg-background/50 border-white/10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Business Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc" className="bg-background/50 border-white/10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={createAudit.isPending}
                className="bg-primary hover:bg-primary/90 text-white w-full"
              >
                {createAudit.isPending ? "Starting..." : "Run Audit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
