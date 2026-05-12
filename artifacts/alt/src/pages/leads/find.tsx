import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useFindLeads } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Search, Sparkles, MapPin, Tag, Loader2, CheckCircle2, Users, Globe, Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const formSchema = z.object({
  niche: z.string().min(2, "Niche is required"),
  location: z.string().min(2, "Location is required"),
  count: z.coerce.number().min(1).max(20).default(5),
});

const steps = [
  { icon: Globe, label: "Searching directories", detail: "Simulating Google Maps, Yelp, LinkedIn..." },
  { icon: Users, label: "Extracting contacts", detail: "Decision-maker emails & phones" },
  { icon: CheckCircle2, label: "Scoring websites", detail: "Pre-auditing for quick wins" },
];

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI GPT-4o Mini",
  gemini: "Google Gemini Flash",
  openrouter: "OpenRouter",
};

function getActiveModelLabel(): string {
  const provider = localStorage.getItem("ai_provider") || "openai";
  if (provider === "openrouter") {
    const model = localStorage.getItem("ai_openrouter_model") || "google/gemma-3-12b-it:free";
    return `${model.split("/").pop() ?? model}`;
  }
  return PROVIDER_LABELS[provider] || "OpenAI GPT-4o Mini";
}

function getAIOptions() {
  const provider = (localStorage.getItem("ai_provider") || "openai") as string;
  const customModel = provider === "openrouter"
    ? (localStorage.getItem("ai_openrouter_model") || undefined)
    : undefined;
  const customApiKey = provider === "openrouter"
    ? (localStorage.getItem("ai_openrouter_key") || undefined)
    : undefined;
  return { provider, customModel, customApiKey };
}

export default function LeadFind() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const findLeads = useFindLeads();
  const [modelLabel, setModelLabel] = useState("OpenAI GPT-4o Mini");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setModelLabel(getActiveModelLabel());
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { niche: "", location: "", count: 5 },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const aiOptions = getAIOptions();

    findLeads.mutate(
      {
        data: {
          niche: values.niche,
          location: values.location,
          count: values.count,
          ...aiOptions,
        } as any,
      },
      {
        onSuccess: (data: any) => {
          const count = Array.isArray(data) ? data.length : 0;
          toast({
            title: `${count} leads found`,
            description: `AI discovered ${count} qualified prospects in ${values.location}.`,
          });
          setLocation("/leads");
        },
        onError: (err: any) => {
          toast({
            title: "Lead search failed",
            description: err?.data?.error || err?.message || "The AI couldn't complete the search. Try a different provider in Settings.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Link href="/leads" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group">
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Leads
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Lead Finder</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Bot className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">Using <span className="text-primary font-medium">{modelLabel}</span></span>
              <Link href="/settings">
                <span className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 cursor-pointer">Change</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <motion.div
          className="md:col-span-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-card/40 backdrop-blur border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Search Criteria</CardTitle>
              <CardDescription className="text-xs">Tell the AI who you're targeting</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="niche"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Business Niche</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="e.g. Dentists, Roofers, Gyms"
                              className="pl-8 h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
                              disabled={findLeads.isPending}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-[11px]">Any industry or service type</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="e.g. Austin TX, London, 90210"
                              className="pl-8 h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
                              disabled={findLeads.isPending}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-[11px]">City, state, country or zip code</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Number of Leads</FormLabel>
                        <div className="flex items-center gap-2">
                          {[3, 5, 10, 15, 20].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => field.onChange(n)}
                              disabled={findLeads.isPending}
                              className={`flex-1 h-8 rounded-lg border text-xs font-medium transition-all ${
                                field.value === n
                                  ? "bg-primary text-white border-primary"
                                  : "bg-background/50 border-white/8 text-muted-foreground hover:border-white/20"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white h-9 text-sm"
                    disabled={findLeads.isPending}
                  >
                    {findLeads.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        AI is searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-3.5 w-3.5" /> Find Leads with AI
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="md:col-span-2 space-y-4"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-primary/8 to-violet-600/5 border-primary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {findLeads.isPending ? "Searching now..." : "Powered by AI"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  animate={findLeads.isPending ? {
                    opacity: [0.4, 1, 0.4],
                    transition: { duration: 1.5, delay: i * 0.5, repeat: Infinity }
                  } : { opacity: 0.65 }}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    findLeads.isPending ? "bg-primary/20 border border-primary/30" : "bg-white/5 border border-white/8"
                  }`}>
                    <step.icon className={`w-3.5 h-3.5 ${findLeads.isPending ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{step.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-white/5 bg-card/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">What you'll get</p>
            {["Business name & website", "Decision-maker email", "Phone number", "Pre-scored audit readiness"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/5 bg-card/30 p-3 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Active model</p>
              <p className="text-xs font-medium text-foreground truncate">{modelLabel}</p>
            </div>
            <Link href="/settings" className="ml-auto shrink-0">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:text-primary">
                Change
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
