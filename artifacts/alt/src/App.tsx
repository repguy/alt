import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/marketing/landing";
import SignInPage from "@/pages/auth/sign-in";
import SignUpPage from "@/pages/auth/sign-up";
import AppLayout from "@/components/layout/app-layout";

// Page imports
import Dashboard from "@/pages/dashboard";
import AuditsList from "@/pages/audits";
import AuditDetail from "@/pages/audits/detail";
import LeadsList from "@/pages/leads";
import LeadFind from "@/pages/leads/find";
import ProposalsList from "@/pages/proposals";
import ProposalDetail from "@/pages/proposals/detail";
import ClientsList from "@/pages/clients";
import ClientDetail from "@/pages/clients/detail";
import CampaignsList from "@/pages/campaigns";
import CampaignNew from "@/pages/campaigns/new";
import CampaignDetail from "@/pages/campaigns/detail";
import Analytics from "@/pages/analytics";
import Whitelabel from "@/pages/whitelabel";
import Settings from "@/pages/settings";
import Billing from "@/pages/billing";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(250 89% 65%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(240 5% 64.9%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(240 10% 6%)",
    colorInput: "hsl(240 3.7% 15.9%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(240 3.7% 15.9%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive-foreground",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-8 object-contain",
    socialButtonsBlockButton: "border-border hover:bg-muted/50 bg-background text-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-md transition-colors",
    formFieldInput: "bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent rounded-md flex h-10 w-full px-3 py-2 text-sm",
    footerAction: "flex gap-2 justify-center mt-4",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-border text-foreground bg-background",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function AppShellRoutes() {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/audits" component={AuditsList} />
            <Route path="/audits/:id" component={AuditDetail} />
            <Route path="/leads" component={LeadsList} />
            <Route path="/leads/find" component={LeadFind} />
            <Route path="/proposals" component={ProposalsList} />
            <Route path="/proposals/:id" component={ProposalDetail} />
            <Route path="/clients" component={ClientsList} />
            <Route path="/clients/:id" component={ClientDetail} />
            <Route path="/campaigns" component={CampaignsList} />
            <Route path="/campaigns/new" component={CampaignNew} />
            <Route path="/campaigns/:id" component={CampaignDetail} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/whitelabel" component={Whitelabel} />
            <Route path="/settings" component={Settings} />
            <Route path="/billing" component={Billing} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          {/* All other routes wrapped in app shell */}
          <Route path="/:rest*" component={AppShellRoutes} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster />
      </TooltipProvider>
    </WouterRouter>
  );
}
