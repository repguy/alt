import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useFindLeads } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Search, Sparkles, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  niche: z.string().min(2, "Niche is required"),
  location: z.string().min(2, "Location is required"),
  count: z.coerce.number().min(1).max(50).default(10)
});

export default function LeadFind() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const findLeads = useFindLeads();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      niche: "",
      location: "",
      count: 10
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    findLeads.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Leads Discovered",
            description: "AI successfully found leads matching your criteria.",
          });
          setLocation("/leads");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to find leads. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Leads
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" /> AI Lead Finder
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Enter a niche and location, and our AI will scrape the web to find highly qualified 
          businesses, their contact information, and automatically prep them for audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>Tell the AI who you're looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Business Niche</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="e.g. Dentists, Plumbers, Roofers" className="pl-9 bg-background/50 border-white/10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="e.g. Austin TX, London, Zip Code" className="pl-9 bg-background/50 border-white/10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Number of Leads (Max 50)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={50} className="bg-background/50 border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={findLeads.isPending}
                >
                  {findLeads.isPending ? (
                    <><Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Finding Leads...</>
                  ) : (
                    <><Search className="mr-2 h-4 w-4" /> Start Search</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 relative z-10">How it works</h3>
            <ul className="space-y-4 relative z-10">
              <li className="flex gap-3 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">1</div>
                <div>AI searches Google Places and directories for businesses matching your criteria.</div>
              </li>
              <li className="flex gap-3 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">2</div>
                <div>It scrapes their websites to extract decision-maker contact info (emails & phones).</div>
              </li>
              <li className="flex gap-3 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">3</div>
                <div>Leads are added to your pipeline, ready for one-click auditing and outreach.</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
