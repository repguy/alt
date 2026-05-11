import { motion } from "framer-motion";
import { Link } from "wouter";
import { useJoinWaitlist } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Zap, Activity, Users, FileText, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      {/* Noise overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Navigation */}
      <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              A
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">ALT</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/sign-up">
              <Button className="bg-white text-black hover:bg-gray-200 font-medium rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-8"
              >
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                ALT Agency Platform 1.0 is live
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
              >
                The command center for <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  elite digital agencies
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
              >
                Analyze websites, generate AI audits, create proposals, find leads, and run outreach campaigns — all from one precise, fast, and powerful platform.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/sign-up">
                  <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] w-full sm:w-auto">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 rounded-full w-full sm:w-auto">
                  Book Demo
                </Button>
              </motion.div>
            </div>
            
            {/* Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 bottom-[-2px]" />
              <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden">
                <img 
                  src="/images/dashboard-preview.png" 
                  alt="ALT Dashboard" 
                  className="w-full rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 border-t border-white/5 bg-black/20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Superpowers for your agency</h2>
              <p className="text-muted-foreground text-lg">Replace your fragmented stack of tools with one cohesive, beautifully designed platform.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Feature 1 */}
              <div className="bg-card/40 border border-white/5 p-8 rounded-2xl backdrop-blur-sm hover:bg-card/60 transition-colors">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                  <Activity className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Audits</h3>
                <p className="text-muted-foreground">Instantly analyze any website for SEO, performance, and UX. Generate client-ready reports with actionable AI recommendations.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-card/40 border border-white/5 p-8 rounded-2xl backdrop-blur-sm hover:bg-card/60 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Users className="text-blue-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Smart Lead Finder</h3>
                <p className="text-muted-foreground">Discover highly qualified leads in any niche and location. Automatically pre-audit their websites before you even reach out.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-card/40 border border-white/5 p-8 rounded-2xl backdrop-blur-sm hover:bg-card/60 transition-colors">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="text-purple-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Beautiful Proposals</h3>
                <p className="text-muted-foreground">Create, send, and track high-converting proposals. Turn audit results directly into service offerings with one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Deep Dive */}
        <section className="py-24 border-t border-white/5 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16 max-w-6xl mx-auto">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400">
                  <Zap className="w-4 h-4" /> Automated Outreach
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  Stop writing cold emails. Let AI do the heavy lifting.
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our AI analyzes the prospect's website and generates hyper-personalized outreach emails referencing specific issues found in their audit. High open rates, zero manual work.
                </p>
                <ul className="space-y-3 pt-4">
                  {['Personalized subject lines', 'Contextual issue referencing', 'Automated follow-ups', 'Open & reply tracking'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <CheckCircle className="w-5 h-5 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="relative rounded-2xl border border-white/10 bg-card p-2 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 rounded-2xl pointer-events-none" />
                  <img src="/images/feature-pipeline.png" alt="Outreach Pipeline" className="w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Ready to scale your agency?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join hundreds of elite agencies using ALT to automate their growth engine and close more deals.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-10 text-lg bg-white text-black hover:bg-gray-200 rounded-full shadow-xl shadow-white/10">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              A
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">ALT</span>
          </div>
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} ALT Platform Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
