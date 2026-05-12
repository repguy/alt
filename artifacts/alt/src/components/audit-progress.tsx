import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Search, Zap, Eye, MonitorSmartphone, Gauge, FileText, CheckCircle2, Loader2
} from "lucide-react";

const STEPS = [
  { id: "crawl",         icon: Globe,            label: "Crawling website",          detail: "Fetching page structure and content" },
  { id: "seo",           icon: Search,           label: "Analyzing SEO",             detail: "Meta tags, keywords, structured data" },
  { id: "performance",   icon: Zap,              label: "Measuring performance",     detail: "Core Web Vitals, load times" },
  { id: "accessibility", icon: Eye,              label: "Accessibility audit",       detail: "WCAG compliance, contrast, ARIA" },
  { id: "ux",            icon: MonitorSmartphone,label: "Reviewing UX",              detail: "Navigation, CTAs, user flows" },
  { id: "mobile",        icon: Gauge,            label: "Mobile readiness",          detail: "Responsive layout, touch targets" },
  { id: "generate",      icon: FileText,         label: "Generating AI report",      detail: "Compiling insights and recommendations" },
];

// Each step takes ~850ms before advancing
const STEP_DURATION = 850;

interface AuditProgressProps {
  auditId: number;
  websiteName: string | null;
  onComplete: () => void;
}

export function AuditProgress({ auditId, websiteName, onComplete }: AuditProgressProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    // Advance through steps on a timer (visual only)
    timerRef.current = setInterval(() => {
      const next = stepRef.current + 1;
      if (next < STEPS.length) {
        setCompletedSteps(prev => new Set([...prev, STEPS[stepRef.current].id]));
        setCurrentStepIdx(next);
        stepRef.current = next;
      }
    }, STEP_DURATION);

    // SSE: poll for real completion from the API
    const sse = new EventSource(`/api/audits/${auditId}/progress`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.done) {
          // Mark all steps complete
          if (timerRef.current) clearInterval(timerRef.current);
          setCompletedSteps(new Set(STEPS.map(s => s.id)));
          setCurrentStepIdx(STEPS.length - 1);
          setTimeout(() => {
            setDone(true);
            setTimeout(onComplete, 600);
          }, 400);
          sse.close();
        }
      } catch {}
    };

    sse.onerror = () => sse.close();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sseRef.current?.close();
    };
  }, [auditId, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            {done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            )}
          </div>
          {!done && (
            <div className="absolute -inset-1 rounded-xl bg-primary/10 animate-ping opacity-30" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {done ? "Audit Complete" : `Analyzing ${websiteName || "website"}...`}
          </p>
          <p className="text-xs text-muted-foreground">
            {done ? "Your report is ready" : `Step ${Math.min(currentStepIdx + 1, STEPS.length)} of ${STEPS.length}`}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = i === currentStepIdx && !done;
          const isPending = i > currentStepIdx && !done;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                isCurrent
                  ? "bg-primary/8 border border-primary/15"
                  : isCompleted
                  ? "bg-emerald-500/5 border border-emerald-500/10"
                  : "bg-white/2 border border-transparent"
              }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all ${
                isCompleted ? "bg-emerald-500/15" : isCurrent ? "bg-primary/15" : "bg-white/4"
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <step.icon className="w-3.5 h-3.5 text-primary animate-pulse" />
                ) : (
                  <step.icon className="w-3.5 h-3.5 text-muted-foreground/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${
                  isCompleted ? "text-emerald-400" : isCurrent ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[10px] text-muted-foreground mt-0.5"
                  >
                    {step.detail}
                  </motion.p>
                )}
              </div>

              {isCurrent && (
                <div className="flex gap-0.5 shrink-0">
                  {[0,1,2].map(j => (
                    <motion.div
                      key={j}
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.9, delay: j * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="tabular-nums">
            {done ? "100" : Math.round((completedSteps.size / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: done ? "100%" : `${(completedSteps.size / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
