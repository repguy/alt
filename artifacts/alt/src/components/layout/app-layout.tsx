import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Activity,
  Users,
  FileText,
  Briefcase,
  Megaphone,
  BarChart3,
  Settings,
  CreditCard,
  Paintbrush,
  LogOut,
  Search,
  Bell,
  Menu,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClerk } from "@clerk/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/command-palette";
import { motion, AnimatePresence } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Audits", href: "/audits", icon: Activity },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Clients", href: "/clients", icon: Briefcase },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomNavItems = [
  { name: "Whitelabel", href: "/whitelabel", icon: Paintbrush },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

function NavLink({ item, isActive }: { item: (typeof navItems)[0]; isActive: boolean }) {
  return (
    <Link href={item.href}>
      <div
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active-pill"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <item.icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        <span className={`text-sm font-medium flex-1 ${isActive ? "text-primary" : ""}`}>{item.name}</span>
        {isActive && <ChevronRight className="w-3 h-3 text-primary/50" />}
      </div>
    </Link>
  );
}

function SidebarContent({ location }: { location: string }) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.45)] group-hover:shadow-[0_0_26px_rgba(99,102,241,0.65)] transition-all duration-300">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">ALT</span>
          <span className="text-[10px] text-muted-foreground/60 font-medium px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 hidden sm:block">Agency</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 py-3">
        <div className="px-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-3 mb-2.5">Workspace</p>
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return <NavLink key={item.href} item={item} isActive={isActive} />;
          })}
        </div>

        <div className="px-3 mt-5 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-3 mb-2.5">Preferences</p>
          {bottomNavItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return <NavLink key={item.href} item={item} isActive={isActive} />;
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/5 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-all group text-left">
              <Avatar className="h-7 w-7 shrink-0 ring-2 ring-white/10">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <LogOut className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-1" side="top" align="start">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <CommandPalette open={commandPaletteOpen} setOpen={setCommandPaletteOpen} />

      <aside className="w-56 border-r border-white/5 bg-card/20 backdrop-blur-xl hidden md:flex flex-col shrink-0">
        <SidebarContent location={location} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center justify-between px-5 z-10 shrink-0">
          <div className="flex items-center flex-1 gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted-foreground">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-56 bg-card border-r border-white/5">
                <SidebarContent location={location} />
              </SheetContent>
            </Sheet>

            <button
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6 hover:bg-white/7 hover:border-white/10 transition-all text-sm text-muted-foreground w-52"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left text-xs">Search anything...</span>
              <kbd className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <Avatar className="h-7 w-7 ring-2 ring-white/10">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {user?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative">
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute -top-40 right-0 w-[700px] h-[500px] bg-primary/4 blur-[130px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-violet-600/3 blur-[110px] rounded-full" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
