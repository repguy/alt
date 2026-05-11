import { ArrowLeft, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCampaign } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.string().default("email"),
  subject: z.string().min(5, "Subject is required"),
  body: z.string().min(10, "Email body is required"),
});

export default function CampaignNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCampaign = useCreateCampaign();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "email",
      subject: "Audit Results for {{companyName}}",
      body: "Hi {{firstName}},\n\nI ran an audit on your website and noticed a few critical issues impacting your conversion rate.\n\nLet's chat about how we can fix this.\n\nBest,\n",
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createCampaign.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          toast({ title: "Campaign Created", description: "Your outreach campaign has been saved." });
          setLocation(`/campaigns/${data.id}`);
        }
      }
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create Campaign</h1>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Setup an automated email outreach sequence.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Internal Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q4 Dentists Cold Outreach" className="bg-background/50 border-white/10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t border-white/5 pt-6 mt-6 space-y-6">
                <h3 className="text-lg font-medium text-white">Email Template</h3>
                <p className="text-sm text-muted-foreground">Use {'{{variable}}'} syntax to personalize emails for each lead.</p>
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Subject Line</FormLabel>
                      <FormControl>
                        <Input className="bg-background/50 border-white/10 font-mono text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email Body</FormLabel>
                      <FormControl>
                        <Textarea rows={10} className="bg-background/50 border-white/10 font-mono text-sm resize-y" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button type="submit" disabled={createCampaign.isPending} className="bg-primary hover:bg-primary/90 text-white">
                  {createCampaign.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Draft</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
