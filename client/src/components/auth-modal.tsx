import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Welcome back!", description: "You have been logged in successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Signup failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Account created!", description: "Welcome to Titanium." });
    },
    onError: (error: Error) => {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "login") {
      loginMutation.mutate({ email, password });
    } else {
      signupMutation.mutate({ email, password, firstName: firstName || undefined, lastName: lastName || undefined });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const isLoading = loginMutation.isPending || signupMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono tracking-wider text-center">
            {tab === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 text-xs">
            {tab === "login" ? "Sign in to your account" : "Create a new account to get started"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
          <TabsList className="w-full bg-zinc-900 border border-zinc-800">
            <TabsTrigger 
              value="login" 
              data-testid="tab-login"
              className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              data-testid="tab-signup"
              className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white font-mono text-xs uppercase tracking-wider"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <TabsContent value="signup" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs text-zinc-400 uppercase tracking-wider">First Name</Label>
                  <Input
                    id="firstName"
                    data-testid="input-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs text-zinc-400 uppercase tracking-wider">Last Name</Label>
                  <Input
                    id="lastName"
                    data-testid="input-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-zinc-400 uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-zinc-400 uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                placeholder={tab === "signup" ? "Min 6 characters" : "Enter password"}
                required
                minLength={tab === "signup" ? 6 : undefined}
              />
            </div>

            <Button 
              type="submit" 
              data-testid="btn-submit-auth"
              className="w-full bg-white text-black hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : (tab === "login" ? "Login" : "Create Account")}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <Separator className="bg-zinc-800" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 px-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                or
              </span>
            </div>

            <Button 
              type="button"
              variant="outline"
              data-testid="btn-google"
              onClick={handleGoogleLogin}
              className="w-full mt-4 bg-transparent border-zinc-800 text-white hover:bg-zinc-900 font-mono text-xs uppercase tracking-wider"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
