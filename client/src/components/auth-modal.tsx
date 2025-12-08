import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

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

  const handleGoogleAuthMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Welcome!", description: "You have been logged in with Google." });
    } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
      toast({ title: "Authentication failed", description: event.data.message || "Google login failed", variant: "destructive" });
    }
  }, [queryClient, onOpenChange, toast]);

  useEffect(() => {
    window.addEventListener("message", handleGoogleAuthMessage);
    return () => window.removeEventListener("message", handleGoogleAuthMessage);
  }, [handleGoogleAuthMessage]);

  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      "/api/auth/google",
      "Google Login",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  const isLoading = loginMutation.isPending || signupMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-zinc-800 text-white overflow-hidden">
        <DialogHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <DialogTitle className="text-xl font-mono tracking-wider text-center">
                {tab === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-500 text-xs mt-1">
                {tab === "login" ? "Sign in to your account" : "Create a new account to get started"}
              </DialogDescription>
            </motion.div>
          </AnimatePresence>
        </DialogHeader>

        <div className="w-full">
          <div className="w-full bg-zinc-900 border border-zinc-800 p-1 flex">
            <button
              type="button"
              data-testid="tab-login"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                tab === "login" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              data-testid="tab-signup"
              onClick={() => setTab("signup")}
              className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                tab === "signup" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {tab === "signup" && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 pb-4">
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
                  </motion.div>
                )}
              </AnimatePresence>

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
                <FcGoogle className="w-5 h-5 mr-2" />
                Continue with Google
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
