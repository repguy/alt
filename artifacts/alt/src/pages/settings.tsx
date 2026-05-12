import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Bot, Zap, Globe, Brain, CheckCircle2, Key, Cpu, Info, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI GPT-4o Mini",
    provider: "OpenAI",
    badge: "Default",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: Zap,
    iconClass: "text-primary",
    activeClass: "bg-primary/8 border-primary/20",
    description: "Best all-round accuracy with reliable structured JSON output.",
    strengths: ["Fastest responses", "Best JSON reliability", "Cost effective"],
    supportsCustom: false,
  },
  {
    id: "gemini",
    name: "Gemini Flash",
    provider: "Google DeepMind",
    badge: "Fast",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Brain,
    iconClass: "text-blue-400",
    activeClass: "bg-blue-500/8 border-blue-500/20",
    description: "Google's flash model — strong at web content and structured analysis.",
    strengths: ["Web-native understanding", "High context window", "Structured analysis"],
    supportsCustom: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    provider: "Any model via OpenRouter",
    badge: "Custom",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Globe,
    iconClass: "text-emerald-400",
    activeClass: "bg-emerald-500/8 border-emerald-500/20",
    description: "Route to any model on OpenRouter — including free models. Bring your own key or use Replit's.",
    strengths: ["Free models available", "100+ models", "Bring your own key"],
    supportsCustom: true,
  },
];

const POPULAR_FREE_MODELS = [
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B (Free)" },
  { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout (Free)" },
  { id: "microsoft/phi-4-reasoning:free", name: "Phi-4 Reasoning (Free)" },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)" },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick (Paid)" },
  { id: "mistralai/mistral-medium-3-5", name: "Mistral Medium 3.5 (Paid)" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Settings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [customModel, setCustomModel] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelectedProvider(localStorage.getItem("ai_provider") || "openai");
    setCustomModel(localStorage.getItem("ai_openrouter_model") || "google/gemma-3-12b-it:free");
    setCustomApiKey(localStorage.getItem("ai_openrouter_key") || "");
  }, []);

  function savePreferences() {
    localStorage.setItem("ai_provider", selectedProvider);
    if (selectedProvider === "openrouter") {
      if (customModel) localStorage.setItem("ai_openrouter_model", customModel);
      if (customApiKey) localStorage.setItem("ai_openrouter_key", customApiKey);
    }
    setSaved(true);
    toast({ title: "Preferences saved", description: "Your AI provider settings have been saved." });
    setTimeout(() => setSaved(false), 2000);
  }

  const activeProviderConfig = PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and AI preferences.</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Profile</CardTitle>
            <CardDescription className="text-xs">Your account information is managed by Clerk Auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-white/10">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-base font-bold">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                <Badge className="mt-1 text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0.5">Free Plan</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name</Label>
                <Input value={user?.fullName || ""} className="h-8 text-sm bg-background/50 border-white/8" readOnly />
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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Provider</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Choose which AI model powers your audits, leads, and email copy. All providers are billed to your Replit credits.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {PROVIDERS.map(p => {
                const isActive = selectedProvider === p.id;
                return (
                  <motion.div key={p.id} variants={itemVariant}>
                    <button
                      onClick={() => setSelectedProvider(p.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                        isActive
                          ? `${p.activeClass} shadow-[0_0_0_1px_rgba(99,102,241,.25)]`
                          : "border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? p.activeClass : "bg-white/5"}`}>
                          <p.icon className={`w-4 h-4 ${isActive ? p.iconClass : "text-muted-foreground"}`} />
                        </div>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                      </div>
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{p.name}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${p.badgeClass}`}>{p.badge}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{p.provider}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{p.description}</p>
                      <div className="space-y-1">
                        {p.strengths.map(s => (
                          <div key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <div className={`w-1 h-1 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`} />
                            {s}
                          </div>
                        ))}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Custom OpenRouter config */}
            {selectedProvider === "openrouter" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">Custom Model Configuration</span>
                </div>

                {/* Model selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Bot className="w-3 h-3 text-emerald-400" /> Model Name
                  </Label>
                  <Input
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    placeholder="e.g. google/gemma-3-12b-it:free"
                    className="h-8 text-sm bg-background/50 border-white/10 focus:border-emerald-500/40 font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {POPULAR_FREE_MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setCustomModel(m.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          customModel === m.id
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-white/3 text-muted-foreground border-white/8 hover:border-white/15"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API key */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-emerald-400" /> OpenRouter API Key{" "}
                    <span className="text-muted-foreground font-normal">(optional — uses Replit's proxy if empty)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={customApiKey}
                      onChange={e => setCustomApiKey(e.target.value)}
                      placeholder="sk-or-v1-... (leave empty to use Replit AI credits)"
                      className="h-8 text-sm bg-background/50 border-white/10 focus:border-emerald-500/40 pr-9 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Models ending in <code className="text-emerald-400 bg-emerald-500/10 px-0.5 rounded">:free</code> are rate-limited but cost nothing.
                    Get your API key at{" "}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                      openrouter.ai/keys
                    </a>
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <p className="text-xs text-muted-foreground">
                Active:{" "}
                <span className="text-foreground font-medium">
                  {activeProviderConfig?.name}
                  {selectedProvider === "openrouter" && customModel && ` · ${customModel.split("/").pop()}`}
                </span>
              </p>
              <Button
                size="sm"
                className={`h-8 text-xs px-4 transition-all ${saved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90"} text-white`}
                onClick={savePreferences}
              >
                {saved ? <><CheckCircle2 className="mr-1.5 w-3 h-3" /> Saved</> : <><Save className="mr-1.5 w-3 h-3" /> Save Preferences</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <Card className="bg-card/40 backdrop-blur border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
            <CardDescription className="text-xs">Control when you get notified.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[
                { label: "Audit completed", description: "When an AI audit finishes running", on: true },
                { label: "New leads found", description: "When AI discovers new prospects", on: true },
                { label: "Email campaign sent", description: "Summary after a campaign is launched", on: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${item.on ? "bg-primary" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${item.on ? "left-4" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
