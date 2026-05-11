import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
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
  Plus
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Audits", href: "/audits", icon: Activity },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Proposals", href: "/proposals", icon: FileText },
    { name: "Clients", href: "/clients", icon: Briefcase },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Whitelabel", href: "/whitelabel", icon: Paintbrush },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => setLocation("/audits"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Audit</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/leads/find"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Find Leads</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/proposals"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Proposal</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/campaigns/new"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Campaign</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem 
              key={item.href} 
              onSelect={() => runCommand(() => setLocation(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
