import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user } = useUser();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal profile and preferences.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how you appear to others on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-white/10">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {user?.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" className="border-white/10 text-white">Change Avatar</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input defaultValue={user?.fullName || ""} className="bg-background/50 border-white/10" readOnly />
              <p className="text-xs text-muted-foreground">Managed via Clerk Auth</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Email Address</Label>
              <Input defaultValue={user?.primaryEmailAddress?.emailAddress || ""} className="bg-background/50 border-white/10" readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
