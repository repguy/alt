import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAudit } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditProgress } from "@/components/audit-progress";
import { Zap, Globe, Bot, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PROVIDERS = [
  { id: "openai",     label: "GPT-4o Mini",     provider: "OpenAI",     color: "text-primary" },
  { id: "gemini",     label: "Gemini Flash",     provider: "Google",     color: "text-blue-400" },
  { id: "openrouter", label: "OpenRouter",       provider: "Custom",     color: "text-emerald-400" },
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
  const [savedProvider, setSavedProvider] = useState("openai");
  const [savedModel, setSavedModel] = useState("");

  useEffect(() => {
    const p = localStorage.getItem("ai_provider") || "openai";
    const m = localStorage.getItem("ai_openrouter_model") || "google/gemma-3-12b-it:free";
    setSavedProvider(p);
    setSavedModel(m);
  }, [open]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      websiteName: "",
      provider: (localStorage.getItem("ai_provider") as any) || "openai",
    },
  });

  const selectedProvider = form.watch("provider");

  function onSubmit(values: z.infer<typeof formSchema>) {
    const url = values.url.startsWith("http") ? values.url : `https://${values.url}`;
    let name = values.websiteName?.trim() || null;
    if (!name) {
      try { name = new URL(url).hostname.replace(/^www\./, ""); } catch {}
    }

    const provider = values.provider || savedProvider;
    const customModel = provider === "openrouter"
      ? (localStorage.getItem("ai_openrouter_model") || "google/gemma-3-12b-it:free")
      : undefined;
    const customApiKey = provider === "openrouter"
      ? (localStorage.getItem("ai_openrouter_key") || undefined)
      : undefined;

    createAudit.mutate(
      {
        data: {
          url,
          websiteName: name || undefined,
          provider,
          customModel,
          customApiKey,
        } as any,
      },
      {
        onSuccess: (data: any) => {
          setRunningAuditId(data.id);
          setRunningWebsiteName((data as any).websiteName || name);
        },
        onError: (err: any) => {
          toast({
            title: "Failed to start audit",
            description: err?.data?.error || "Please check the URL and try again.",
            variant: "destructive",
          });
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
    if (runningAuditId) return;
    onOpenChange(false);
    form.reset();
    setRunningAuditId(null);
  }

  const customModelName = savedModel.split("/").pop() ?? savedModel;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/8 p-0 overflow-hidden">
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
                        <FormLabel className="text-xs font-medium">
                          Business Name <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
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

                  {/* AI Provider picker */}
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                          <Bot className="w-3 h-3 text-primary" /> AI Provider
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {PROVIDERS.map(p => {
                            const isActive = field.value === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => field.onChange(p.id)}
                                className={`rounded-lg border px-3 py-2 text-left transition-all ${
                                  isActive
                                    ? "bg-primary/10 border-primary/30 shadow-[0_0_0_1px_rgba(99,102,241,.15)]"
                                    : "bg-background/30 border-white/8 hover:border-white/15"
                                }`}
                              >
                                <div className={`text-xs font-semibold ${isActive ? p.color : "text-foreground"}`}>
                                  {p.label}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{p.provider}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Show custom model info when openrouter selected */}
                        {selectedProvider === "openrouter" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 px-3 py-2.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] flex items-start gap-2"
                          >
                            <Info className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-[11px] text-emerald-400 font-medium truncate">
                                {customModelName || "No model set"}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {savedModel || "google/gemma-3-12b-it:free"} · Change in{" "}
                                <span
                                  className="text-emerald-400 hover:underline cursor-pointer"
                                  onClick={() => { handleClose(); setLocation("/settings"); }}
                                >
                                  Settings
                                </span>
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="pt-1">
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
