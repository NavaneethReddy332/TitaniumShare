import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info, Code2, Sparkles, Lock, Eye, EyeOff, CheckCircle2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AboutPage() {
  const { toast } = useToast();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      return res.json();
    },
    onSuccess: () => {
      setIsAdmin(true);
      setShowAdminLogin(false);
      toast({ title: "Admin login successful!" });
    },
    onError: () => {
      toast({ title: "Invalid credentials", variant: "destructive" });
    },
  });

  const { data: feedbacks = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/admin/feedback"],
    enabled: isAdmin,
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const devs = [
    {
      name: "RONINN",
      role: "Lead Developer",
      description: "Creator and visionary behind Titanium. Building the future of secure file sharing.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=roninn&backgroundColor=1a1a1a&accessories=blank&clothing=blazerAndShirt&clothingColor=1a1a1a",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "REPLIT",
      role: "AI Assistant",
      description: "Powered by advanced AI to help build and maintain this awesome application.",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=replit&backgroundColor=1a1a1a&primaryColorLevel=600",
      gradient: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid="button-back">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Info className="text-muted-foreground" size={24} />
            <h1 className="text-2xl font-bold text-foreground">About Titanium</h1>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="text-yellow-500" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Secure File Sharing Made Simple</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Titanium is a modern, secure file sharing platform that allows you to upload, share, and download files with ease. 
                With password protection, unique share codes, and a beautiful interface, sharing files has never been more elegant.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                <Badge variant="secondary">Fast Uploads</Badge>
                <Badge variant="secondary">Password Protection</Badge>
                <Badge variant="secondary">Share Codes</Badge>
                <Badge variant="secondary">Secure Storage</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground" size={20} />
            <h2 className="text-xl font-semibold text-foreground">Meet the Team</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {devs.map((dev) => (
              <Card key={dev.name} className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${dev.gradient}`} />
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-border">
                      <AvatarImage src={dev.avatar} alt={dev.name} />
                      <AvatarFallback className="bg-secondary text-muted-foreground text-lg">
                        {dev.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-foreground font-bold text-lg">{dev.name}</h3>
                        <Badge variant="outline">{dev.role}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mt-2">{dev.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdminLogin(!showAdminLogin)}
                className="text-muted-foreground"
                data-testid="button-admin-toggle"
              >
                <Lock size={14} className="mr-1" />
                Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {showAdminLogin && !isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Lock size={18} />
                Admin Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    data-testid="input-admin-username"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pr-10"
                      data-testid="input-admin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-admin-login"
                >
                  {loginMutation.isPending ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Logging in...</>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={18} />
                  Admin Panel - Feedback
                </CardTitle>
                <Badge variant="secondary">{feedbacks.length} submissions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No feedback submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 bg-secondary/50 border border-border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{fb.name}</span>
                          <span className="text-muted-foreground text-sm">{fb.email}</span>
                        </div>
                        <span className="text-muted-foreground/70 text-xs">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-sm">{fb.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
