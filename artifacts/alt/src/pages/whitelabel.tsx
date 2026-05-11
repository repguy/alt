import { useGetWhitelabelConfig, useUpdateWhitelabelConfig } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Paintbrush, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const formSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  customDomain: z.string().optional(),
  primaryColor: z.string().optional(),
  hideAltBranding: z.boolean().default(false),
  customEmailFrom: z.string().email("Invalid email").optional().or(z.literal("")),
});

export default function Whitelabel() {
  const { toast } = useToast();
  const { data: config, isLoading } = useGetWhitelabelConfig();
  const updateConfig = useUpdateWhitelabelConfig();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      customDomain: "",
      primaryColor: "#6366f1",
      hideAltBranding: false,
      customEmailFrom: ""
    }
  });

  useEffect(() => {
    if (config) {
      form.reset({
        brandName: config.brandName,
        customDomain: config.customDomain || "",
        primaryColor: config.primaryColor || "#6366f1",
        hideAltBranding: config.hideAltBranding || false,
        customEmailFrom: config.customEmailFrom || ""
      });
    }
  }, [config, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateConfig.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Settings Saved", description: "Whitelabel configuration updated." });
        }
      }
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Whitelabel Settings</h1>
        <p className="text-muted-foreground mt-1">Customize the platform to match your agency's brand.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Paintbrush className="w-5 h-5 text-primary"/> Brand Identity</CardTitle>
          <CardDescription>These settings affect client-facing audit reports and proposals.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Agency / Brand Name</FormLabel>
                      <FormControl>
                        <Input className="bg-background/50 border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Primary Brand Color (Hex)</FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          <Input type="color" className="w-12 h-10 p-1 bg-background/50 border-white/10 rounded" {...field} />
                          <Input className="bg-background/50 border-white/10 font-mono" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-white/5 pt-6 mt-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-500" /> Custom Domain
                </h3>
                
                <FormField
                  control={form.control}
                  name="customDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Report Hosting Domain</FormLabel>
                      <FormDescription>Serve audit reports from your own domain (e.g., reports.youragency.com)</FormDescription>
                      <FormControl>
                        <Input placeholder="reports.youragency.com" className="bg-background/50 border-white/10 max-w-md" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-white/5 pt-6 mt-6">
                <FormField
                  control={form.control}
                  name="hideAltBranding"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-background/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">Hide "Powered by ALT"</FormLabel>
                        <FormDescription>
                          Remove the ALT platform badge from the footer of all client-facing pages.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateConfig.isPending} className="bg-primary hover:bg-primary/90 text-white">
                  {updateConfig.isPending ? <span className="animate-pulse flex items-center">Saving...</span> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
