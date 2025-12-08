import { motion } from "framer-motion";
import { Cloud, Share2, Lock, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function TitaniumLogo({ className = "" }: { className?: string }) {
  return (
    <svg width="200" height="48" viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="titaniumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a1a1aa', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#71717a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="textGradientTitanium" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#a1a1aa', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <g>
        <g transform="translate(8, 16)">
          <rect x="0" y="8" width="40" height="40" fill="url(#titaniumGradient)" rx="4" />
          <text x="20" y="36" textAnchor="middle" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', fill: '#18181b' }}>T</text>
        </g>
        <text x="60" y="50" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', fill: 'url(#textGradientTitanium)', letterSpacing: '0.05em' }}>TITANIUM</text>
      </g>
    </svg>
  );
}

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    { icon: Cloud, title: "Cloud Storage", description: "Upload and share files instantly" },
    { icon: Share2, title: "P2P Transfer", description: "Direct peer-to-peer file sharing" },
    { icon: Lock, title: "Secure", description: "End-to-end encrypted transfers" },
    { icon: Zap, title: "Fast", description: "Lightning-fast upload speeds" },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black flex flex-col">
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} 
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <TitaniumLogo />
        <Button 
          onClick={handleLogin}
          data-testid="btn-header-login"
          className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest px-6"
        >
          Login / Sign Up
        </Button>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Cloud size={32} className="text-zinc-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            File Transfer
            <span className="block text-zinc-500">Made Simple</span>
          </h1>
          
          <p className="text-zinc-400 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            Upload, share, and transfer files securely. Fast cloud storage with peer-to-peer capabilities.
          </p>

          <Button 
            onClick={handleLogin}
            data-testid="btn-hero-login"
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-sm uppercase tracking-widest px-8 py-6 h-auto"
          >
            Get Started
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 max-w-4xl w-full"
        >
          {features.map((feature, idx) => (
            <div 
              key={feature.title}
              data-testid={`feature-${idx}`}
              className="border border-zinc-900 bg-zinc-950/50 p-6 flex flex-col items-center text-center"
            >
              <feature.icon size={24} className="text-zinc-500 mb-3" />
              <h3 className="text-xs uppercase tracking-widest text-white mb-1">{feature.title}</h3>
              <p className="text-[10px] text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-zinc-900 px-6 py-4">
        <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
          <span>Powered by</span>
          <span className="text-white font-bold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" /> REPLIT
          </span>
        </div>
      </footer>
    </div>
  );
}
