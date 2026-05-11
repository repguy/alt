import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAudit } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditProgress } from "@/components/audit-progress";
import { Zap, Globe, Bot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PROVIDERS = [
  { id: "openai", label: "OpenAI GPT-4o Mini", description: "Fast, accurate, cost-effective" },
  { id: "gemini", label: "Google Gemini Flash", description: "Great at structured analysis" },
  { id: "openrouter", label: "Meta Llama 4 Maverick", description: "Open source, via OpenRouter" },
];

const formSchema = z.object({
  url: z.string().min(3, "Enter a website URL"),
  websiteName: z.string().optional(),
  provider: z.enum(["openai", "gemini", "openrouter"]).default("openai"),
});

interface NewAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAuditDialog({ open, onOpenChange }: NewAuditDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAudit = useCreateAudit();
  const [runningAuditId, setRunningAuditId] = useState<number | null>(null);
  const [runningWebsiteName, setRunningWebsiteName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "", websiteName: "", provider: "openai" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const url = values.url.startsWith("http") ? values.url : `https://${values.url}`;
    let name = values.websiteName?.trim() || null;
    if (!name) {
      try { name = new URL(url).hostname.replace(/^www\./, ""); } catch {}
    }
    createAudit.mutate(
      { data: { url, websiteName: name || undefined, provider: values.provider } },
      {
        onSuccess: (data) => {
          setRunningAuditId(data.id);
          setRunningWebsiteName((data as any).websiteName || name);
        },
        onError: () => {
          toast({ title: "Failed to start audit", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  }

  const handleComplete = useCallback(() => {
    const id = runningAuditId;
    setRunningAuditId(null);
    onOpenChange(false);
    form.reset();
    if (id) setLocation(`/audits/${id}`);
  }, [runningAuditId, setLocation, onOpenChange, form]);

  function handleClose() {
    if (runningAuditId) return; // don't allow close mid-audit
    onOpenChange(false);
    form.reset();
    setRunningAuditId(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border-white/8 p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {runningAuditId ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="mb-5">
                <h2 className="text-base font-semibold text-foreground">Analyzing Website</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI is running a full audit — this takes about 20-30 seconds
                </p>
              </div>
              <AuditProgress
                auditId={runningAuditId}
                websiteName={runningWebsiteName}
                onComplete={handleComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6 pb-4">
                <DialogHeader>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <DialogTitle className="text-base font-semibold">New Website Audit</DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    AI analyzes SEO, performance, accessibility, UX, conversion, and mobile readiness.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Website URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="example.com"
                            className="h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="websiteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Business Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Acme Inc"
                            className="h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* AI Provider selector */}
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                          <Bot className="w-3 h-3 text-primary" /> AI Provider
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-white/8">
                            {PROVIDERS.map(p => (
                              <SelectItem key={p.id} value={p.id} className="text-sm">
                                <div>
                                  <span className="font-medium">{p.label}</span>
                                  <span className="text-muted-foreground ml-1.5 text-xs">— {p.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={createAudit.isPending}
                      className="w-full h-9 text-sm bg-primary hover:bg-primary/90 text-white"
                    >
                      {createAudit.isPending ? (
                        <><Zap className="mr-1.5 h-3.5 w-3.5 animate-pulse" /> Starting audit...</>
                      ) : (
                        <><Zap className="mr-1.5 h-3.5 w-3.5" /> Run AI Audit</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
