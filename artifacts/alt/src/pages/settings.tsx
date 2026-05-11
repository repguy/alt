import { useState } from "react";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Bot, Zap, CheckCircle2, Globe, Brain } from "lucide-react";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI GPT-4o Mini",
    provider: "OpenAI",
    badge: "Default",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: Zap,
    iconClass: "text-primary",
    bgClass: "bg-primary/8 border-primary/20",
    description: "Best all-round for audits, leads, and email copy. Fast, cost-effective, and highly accurate.",
    strengths: ["Fastest responses", "Best JSON reliability", "Cost effective"],
  },
  {
    id: "gemini",
    name: "Gemini Flash",
    provider: "Google DeepMind",
    badge: "Fast",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Brain,
    iconClass: "text-blue-400",
    bgClass: "bg-blue-500/8 border-blue-500/20",
    description: "Google's latest flash model — excellent at structured data analysis and web content understanding.",
    strengths: ["Web-native understanding", "Structured analysis", "High context window"],
  },
  {
    id: "openrouter",
    name: "Llama 4 Maverick",
    provider: "Meta · via OpenRouter",
    badge: "Open Source",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Globe,
    iconClass: "text-emerald-400",
    bgClass: "bg-emerald-500/8 border-emerald-500/20",
    description: "Meta's open-source Llama 4 model routed through OpenRouter. Full transparency, no vendor lock-in.",
    strengths: ["Open source", "No vendor lock-in", "Privacy focused"],
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function Settings() {
  const { user } = useUser();
  const [selectedProvider, setSelectedProvider] = useState("openai");

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and AI preferences.</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Profile</CardTitle>
            <CardDescription className="text-xs">Your account information from Clerk Auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-white/10">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                <Badge className="mt-1 text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0.5">Pro Plan</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name</Label>
                <Input value={user?.fullName || ""} className="h-8 text-sm bg-background/50 border-white/8" readOnly />
                <p className="text-[10px] text-muted-foreground">Managed via your auth provider</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email Address</Label>
                <Input value={user?.primaryEmailAddress?.emailAddress || ""} className="h-8 text-sm bg-background/50 border-white/8" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Provider */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Provider</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Choose which AI model powers your audits, leads, and email generation.
                  All providers are billed to your Replit credits — no separate API keys needed.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {PROVIDERS.map((p) => {
                const isActive = selectedProvider === p.id;
                return (
                  <motion.div key={p.id} variants={itemVariant}>
                    <button
                      onClick={() => setSelectedProvider(p.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 group ${
                        isActive
                          ? `${p.bgClass} shadow-[0_0_0_1px_rgba(99,102,241,.3)]`
                          : "border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? p.bgClass : "bg-white/5"}`}>
                          <p.icon className={`w-4 h-4 ${isActive ? p.iconClass : "text-muted-foreground"}`} />
                        </div>
                        {isActive && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{p.name}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${p.badgeClass}`}>{p.badge}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{p.provider}</p>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{p.description}</p>

                      <div className="space-y-1">
                        {p.strengths.map((s) => (
                          <div key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <div className={`w-1 h-1 rounded-full ${isActive ? p.iconClass.replace("text-", "bg-") : "bg-muted-foreground/30"}`} />
                            {s}
                          </div>
                        ))}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-start gap-2.5">
              <Bot className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">How it works:</span> Your selected provider is used for all new audits,
                lead generation, and email copy. You can switch at any time — existing audits are not affected.
                All providers use Replit's AI proxy, so no separate API keys or billing accounts are required.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Active: <span className="text-foreground font-medium">{PROVIDERS.find(p => p.id === selectedProvider)?.name}</span>
              </p>
              <Button
                size="sm"
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-white px-4"
                onClick={() => {
                  // Persist to localStorage for now; in production stored per workspace
                  localStorage.setItem("ai_provider", selectedProvider);
                }}
              >
                Save Preference
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
            <CardDescription className="text-xs">Control when you get notified.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Audit completed", description: "When an AI audit finishes running" },
                { label: "New leads found", description: "When AI discovers new prospects" },
                { label: "Email campaign sent", description: "Summary after a campaign is launched" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <button className="w-9 h-5 rounded-full bg-primary relative transition-all">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
