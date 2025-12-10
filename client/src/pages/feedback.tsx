import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function FeedbackPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const submitMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; message: string }) => {
      return apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      toast({ title: "Feedback submitted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to submit feedback", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ name, email, message });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid="button-back">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <MessageSquare className="text-muted-foreground" size={20} />
            <CardTitle className="text-foreground text-lg">Send Feedback</CardTitle>
          </div>
          <p className="text-muted-foreground text-sm">We'd love to hear from you. Share your thoughts, suggestions, or report issues.</p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-foreground text-xl font-semibold">Thank You!</h3>
              <p className="text-muted-foreground">Your feedback has been received. We appreciate you taking the time to help us improve.</p>
              <Button onClick={() => setSubmitted(false)} variant="outline" data-testid="button-send-another">
                Send Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                  Name {isAuthenticated && <span className="text-muted-foreground/60">(from account)</span>}
                </label>
                <Input
                  value={name}
                  onChange={(e) => !isAuthenticated && setName(e.target.value)}
                  placeholder="Your name"
                  className={isAuthenticated ? 'opacity-70 cursor-not-allowed' : ''}
                  readOnly={isAuthenticated}
                  data-testid="input-name"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                  Email {isAuthenticated && <span className="text-muted-foreground/60">(from account)</span>}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => !isAuthenticated && setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={isAuthenticated ? 'opacity-70 cursor-not-allowed' : ''}
                  readOnly={isAuthenticated}
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your feedback, suggestions, or report issues..."
                  className="min-h-[120px]"
                  data-testid="input-message"
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Send size={16} /> Submit Feedback</>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
