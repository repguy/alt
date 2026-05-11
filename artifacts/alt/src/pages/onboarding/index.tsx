import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useUpdateWhitelabelConfig } from "@workspace/api-client-react";
import { Activity, Users, FileText, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const [agencyName, setAgencyName] = useState("");
  const updateWhitelabel = useUpdateWhitelabelConfig();

  const handleFinish = () => {
    localStorage.setItem("onboarding_done", "true");
    setLocation("/dashboard");
  };

  const steps = [
    {
      id: 1,
      title: "Welcome to ALT",
      subtitle: "Let's start by naming your agency.",
      content: (
        <div className="space-y-4 w-full max-w-sm mx-auto">
          <Input
            placeholder="Agency Name"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            className="bg-background/50 border-white/10 h-12 text-lg"
          />
          <Button 
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
            disabled={!agencyName}
            onClick={() => {
              updateWhitelabel.mutate({ data: { brandName: agencyName } });
              setStep(2);
            }}
          >
            Continue
          </Button>
        </div>
      )
    },
    {
      id: 2,
      title: "What do you want to do first?",
      subtitle: "Choose a path to get started with your first project.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
          {[
            { 
              title: "Run a Website Audit", 
              icon: Activity, 
              desc: "Analyze a prospect's website and generate an AI report.",
              path: "/audits" 
            },
            { 
              title: "Find Leads", 
              icon: Users, 
              desc: "Discover new business prospects in any niche and location.",
              path: "/leads/find" 
            },
            { 
              title: "Create a Proposal", 
              icon: FileText, 
              desc: "Build a professional service proposal to close the deal.",
              path: "/proposals" 
            }
          ].map((item) => (
            <Card 
              key={item.title}
              className="bg-card/50 border-white/5 hover:border-primary/50 cursor-pointer transition-all group"
              onClick={() => {
                localStorage.setItem("onboarding_preference", item.path);
                setStep(3);
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 3,
      title: "You're all set!",
      subtitle: "Your agency workspace is ready. Let's start growing.",
      content: (
        <div className="flex flex-col items-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">{agencyName}</h3>
            <p className="text-muted-foreground">Is now active and ready for business.</p>
          </div>
          <Button 
            className="h-12 px-8 text-lg bg-primary hover:bg-primary/90"
            onClick={handleFinish}
          >
            Go to Dashboard
          </Button>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center space-y-12">
        {/* Step Indicators */}
        <div className="flex items-center gap-4">
          {steps.map((s) => (
            <div 
              key={s.id}
              className={`h-1.5 w-16 rounded-full transition-all duration-500 ${
                s.id <= step ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                {currentStep.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {currentStep.subtitle}
              </p>
            </div>

            {currentStep.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
