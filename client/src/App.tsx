import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/home"));
const Account = lazy(() => import("@/pages/account"));
const DownloadPage = lazy(() => import("@/pages/download"));
const FeedbackPage = lazy(() => import("@/pages/feedback"));
const AboutPage = lazy(() => import("@/pages/about"));
const NotFound = lazy(() => import("@/pages/not-found"));

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.15,
};

function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
    </div>
  );
}

function AnimatedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen"
    >
      <Component />
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />} key={location}>
        <Switch location={location}>
          <Route path="/">
            <AnimatedRoute component={Home} />
          </Route>
          <Route path="/account">
            <AnimatedRoute component={Account} />
          </Route>
          <Route path="/download/:shareCode">
            <AnimatedRoute component={DownloadPage} />
          </Route>
          <Route path="/feedback">
            <AnimatedRoute component={FeedbackPage} />
          </Route>
          <Route path="/about">
            <AnimatedRoute component={AboutPage} />
          </Route>
          <Route>
            <AnimatedRoute component={NotFound} />
          </Route>
        </Switch>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
