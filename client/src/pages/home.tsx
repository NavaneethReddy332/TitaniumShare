import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cloud, 
  Share2, 
  Upload, 
  FolderOpen, 
  ArrowRight, 
  X, 
  Wifi, 
  Menu,
  User,
  Send,
  Download,
  MessageSquare,
  Info,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const NETWORK_STATS = {
  down: "80.7 Mbps",
  up: "38.3 Mbps"
};

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

      <style>{`
        .titanium-icon {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
      `}</style>

      <g>
        <g transform="translate(8, 16)">
          <rect className="titanium-icon" x="0" y="8" width="40" height="40" fill="url(#titaniumGradient)" rx="4" />
          <text x="20" y="36" textAnchor="middle" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', fill: '#18181b' }}>T</text>
        </g>

        <text x="60" y="50" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', fill: 'url(#textGradientTitanium)', letterSpacing: '0.05em' }}>TITANIUM</text>
      </g>
    </svg>
  );
}

function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { id: 'send', icon: Send, label: 'Send', action: () => setActiveTab('cloud') },
    { id: 'receive', icon: Download, label: 'Receive', action: () => setActiveTab('cloud') },
    { id: 'account', icon: User, label: 'Account', action: () => {} },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback', action: () => {} },
    { id: 'about', icon: Info, label: 'About', action: () => {} },
  ];

  return (
    <>
      <div className="sidebar-trigger-area" />
      <div className="sidebar-container bg-black/90 backdrop-blur-xl border-l border-zinc-800 flex flex-col items-center py-6">
        
        <nav 
          className="flex-1 flex flex-col w-full px-2 gap-1"
          onMouseLeave={() => setHoveredItem(null)}
        >
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className="relative flex items-center justify-center w-full"
              onMouseEnter={() => setHoveredItem(item.id)}
            >
              {hoveredItem === item.id && (
                <motion.div
                  layoutId="sidebar-hover-bg"
                  className="absolute inset-0 bg-zinc-800/80 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 350, 
                    damping: 25,
                    duration: 0.3
                  }}
                />
              )}
              
              <button
                onClick={item.action}
                data-testid={`sidebar-${item.id}`}
                className="relative z-10 p-3 w-full flex flex-col items-center justify-center gap-1 group"
              >
                <item.icon 
                  size={18} 
                  className={`transition-colors duration-200 ${
                    hoveredItem === item.id || activeTab === item.id 
                      ? 'text-white' 
                      : 'text-zinc-500'
                  }`} 
                />
                
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity absolute right-14 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </nav>

        <div 
          className="relative w-full px-2 mt-auto"
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {hoveredItem === 'logout' && (
             <motion.div
               layoutId="sidebar-hover-bg"
               className="absolute inset-0 bg-red-900/20 rounded-lg"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ type: "spring", stiffness: 350, damping: 25 }}
             />
          )}
          <button 
            data-testid="sidebar-logout"
            className="relative z-10 p-3 w-full flex justify-center text-zinc-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("cloud");
  const [files, setFiles] = useState<File[]>([]);
  const [receiveCode, setReceiveCode] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name));
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black flex flex-col overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 pr-16 transition-all duration-300">
        <TitaniumLogo />
        
        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-500">
          <button data-testid="nav-send" className="hover:text-white transition-colors uppercase tracking-wider">Send</button>
          <span className="text-zinc-800">/</span>
          <button data-testid="nav-receive" className="hover:text-white transition-colors uppercase tracking-wider">Receive</button>
          <span className="text-zinc-800">/</span>
          <button data-testid="nav-tempmail" className="border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-900 transition-colors uppercase tracking-wider">
            Temp Mail
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <Button data-testid="btn-login" variant="ghost" size="sm" className="hidden md:flex text-zinc-400 hover:text-white gap-2 text-xs">
            <User size={14} />
            LOGIN
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row pr-4 transition-all duration-300">
        
        {/* Left Panel - Controls */}
        <div className="w-full md:w-[26rem] border-r border-zinc-900 p-5 flex flex-col gap-6 z-10 bg-black">
          
          <Tabs defaultValue="cloud" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-transparent border-b border-zinc-900 p-0 h-auto justify-start gap-6 rounded-none">
              <TabsTrigger 
                value="cloud" 
                data-testid="tab-cloud"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent px-0 pb-2 text-zinc-500 data-[state=active]:text-white font-mono uppercase tracking-wider text-[10px] hover:text-zinc-300 transition-colors"
              >
                Cloud Upload
              </TabsTrigger>
              <TabsTrigger 
                value="p2p" 
                data-testid="tab-p2p"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent px-0 pb-2 text-zinc-500 data-[state=active]:text-white font-mono uppercase tracking-wider text-[10px] hover:text-zinc-300 transition-colors"
              >
                P2P Transfer
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              {activeTab === 'cloud' ? (
                <>
                  {/* SEND SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                      <span>Send</span>
                      <button data-testid="btn-history" className="hover:text-white transition-colors">History</button>
                    </div>

                    <div 
                      {...getRootProps()} 
                      data-testid="dropzone"
                      className={`
                        border border-dashed border-zinc-800 rounded-none p-6 
                        flex flex-col items-center justify-center gap-3 
                        transition-all duration-300 cursor-pointer
                        hover:border-zinc-600 hover:bg-zinc-900/30
                        ${isDragActive ? 'border-white bg-zinc-900/50' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload size={20} className="text-zinc-600" />
                      <p className="text-zinc-500 text-xs font-mono text-center">
                        {isDragActive ? "DROP FILES HERE" : "drop or click (files/folders)"}
                      </p>
                    </div>

                    <Button 
                      variant="outline" 
                      data-testid="btn-select-files"
                      className="w-full rounded-none border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-10 font-mono text-[10px] uppercase tracking-widest"
                    >
                      <FolderOpen size={14} className="mr-2" />
                      Select File(s)
                    </Button>

                    {/* File List Preview */}
                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 mt-3"
                        >
                          {files.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} data-testid={`file-item-${idx}`} className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800 text-[10px]">
                              <span className="truncate max-w-[180px] text-zinc-300">{file.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="text-zinc-500 hover:text-red-500">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          <Button data-testid="btn-start-upload" className="w-full rounded-none bg-white text-black hover:bg-zinc-200 mt-2 font-mono text-[10px] uppercase font-bold h-10">
                            Start Upload
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Separator className="bg-zinc-900" />

                  {/* RECEIVE SECTION */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                      Receive
                    </div>
                    
                    <div className="flex gap-0">
                      <Input 
                        value={receiveCode}
                        onChange={(e) => setReceiveCode(e.target.value)}
                        data-testid="input-receive-code"
                        placeholder="6/8 digit code" 
                        className="rounded-none border-zinc-800 bg-transparent text-center font-mono text-xs h-10 focus-visible:ring-0 focus-visible:border-white transition-colors placeholder:text-zinc-700"
                      />
                      <Button data-testid="btn-receive" className="rounded-none h-10 w-10 bg-zinc-900 border border-l-0 border-zinc-800 hover:bg-zinc-800">
                        <ArrowRight size={14} className="text-zinc-400" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* P2P Coming Soon */
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Share2 size={24} className="text-zinc-600" />
                  </div>
                  <h3 className="text-white font-mono text-sm uppercase tracking-widest mb-2">P2P Transfer</h3>
                  <p className="text-zinc-500 text-xs font-mono">Coming Soon</p>
                  <div className="mt-4 px-3 py-1 border border-zinc-800 bg-zinc-900/50">
                    <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">Under Development</span>
                  </div>
                </motion.div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Visualization / Status */}
        <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }} 
          />
          
          {/* Empty State / Visualization */}
          <div className="text-center space-y-4 z-10 opacity-30 pointer-events-none select-none">
            {activeTab === 'cloud' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="cloud-vis"
                className="flex flex-col items-center gap-3"
              >
                <div className="w-24 h-24 border border-zinc-800 rounded-full flex items-center justify-center">
                  <Cloud size={36} className="text-zinc-700" />
                </div>
                <h3 className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Cloud Storage</h3>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="p2p-vis"
                className="flex flex-col items-center gap-3"
              >
                <div className="w-24 h-24 border border-zinc-800 rounded-full flex items-center justify-center">
                  <Share2 size={36} className="text-zinc-700" />
                </div>
                <h3 className="text-zinc-500 font-mono text-xs tracking-widest uppercase">P2P Direct</h3>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-black z-20 pr-16 transition-all duration-300">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {showLoginPrompt && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-zinc-900/50 border border-zinc-800 px-3 py-2 flex items-center gap-2 max-w-xs"
              >
                <ArrowRight className="text-zinc-500" size={12} />
                <div className="flex-1">
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    Sign in to track your file transfers.
                  </p>
                  <button data-testid="btn-login-prompt" className="text-[9px] font-bold uppercase tracking-wider text-white mt-0.5 hover:underline">
                    Login Now
                  </button>
                </div>
                <button 
                  onClick={() => setShowLoginPrompt(false)}
                  data-testid="btn-close-prompt"
                  className="text-zinc-600 hover:text-white"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
          <span>Powered by</span>
          <span className="text-white font-bold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" /> REPLIT
          </span>
        </div>

        <div className="border border-zinc-900 bg-zinc-950 px-3 py-1.5 flex items-center gap-4 min-w-[160px]">
          <Wifi size={12} className="text-zinc-600" />
          <div className="flex-1 flex justify-between items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-mono uppercase">Down</span>
              <span className="text-[10px] text-zinc-300 font-mono">{NETWORK_STATS.down}</span>
            </div>
            <div className="h-5 w-px bg-zinc-900" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-zinc-600 font-mono uppercase">Up</span>
              <span className="text-[10px] text-zinc-300 font-mono">{NETWORK_STATS.up}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
