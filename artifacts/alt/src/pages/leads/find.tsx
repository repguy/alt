import { Link, useLocation } from "wouter";
import { useFindLeads } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Search, Sparkles, MapPin, Tag, Loader2, CheckCircle2, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  niche: z.string().min(2, "Niche is required"),
  location: z.string().min(2, "Location is required"),
  count: z.coerce.number().min(1).max(20).default(5),
});

const steps = [
  { icon: Globe, label: "Searching directories", detail: "Google Maps, Yelp, LinkedIn..." },
  { icon: Users, label: "Extracting contacts", detail: "Decision-maker emails & phones" },
  { icon: CheckCircle2, label: "Scoring websites", detail: "Pre-auditing for quick wins" },
];

export default function LeadFind() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const findLeads = useFindLeads();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { niche: "", location: "", count: 5 },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    findLeads.mutate(
      { data: values },
      {
        onSuccess: (data: any) => {
          toast({
            title: "Leads Found",
            description: `AI discovered ${Array.isArray(data) ? data.length : 0} qualified prospects.`,
          });
          setLocation("/leads");
        },
        onError: () => {
          toast({ title: "Error", description: "AI lead search failed. Please try again.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Link href="/leads" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group">
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Leads
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Lead Finder</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-14">
          Describe your ideal prospect and AI will find real businesses with contact info.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Form */}
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="niche"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Business Niche</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="e.g. Dentists, Roofers, Gyms"
                              className="pl-8 h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
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
                        <FormLabel className="text-xs font-medium text-foreground">Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="e.g. Austin TX, London, 90210"
                              className="pl-8 h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
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
                        <FormLabel className="text-xs font-medium text-foreground">Number of Leads</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            className="h-9 text-sm bg-background/50 border-white/8 focus:border-primary/40"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">Max 20 per search</FormDescription>
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

        {/* How it works */}
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
                Powered by AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className={`flex items-start gap-3 ${findLeads.isPending ? "opacity-100" : "opacity-70"}`}
                  animate={findLeads.isPending ? {
                    opacity: [0.4, 1, 0.4],
                    transition: { duration: 1.5, delay: i * 0.5, repeat: Infinity }
                  } : {}}
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
        </motion.div>
      </div>
    </div>
  );
}
