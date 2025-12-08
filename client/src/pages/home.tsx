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
  ArrowUp, 
  ArrowDown,
  Menu,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock Data
const NETWORK_STATS = {
  down: "80.7 Mbps",
  up: "38.3 Mbps"
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("cloud");
  const [files, setFiles] = useState<File[]>([]);
  const [receiveCode, setReceiveCode] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name));
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white rotate-45" />
          <span className="text-lg font-bold tracking-tight font-sans">Aero Send</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-500">
          <button className="hover:text-white transition-colors">SEND</button>
          <span className="text-zinc-800">/</span>
          <button className="hover:text-white transition-colors">RECEIVE</button>
          <span className="text-zinc-800">/</span>
          <button className="border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-zinc-900 transition-colors">
            TEMP MAIL
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden md:flex text-zinc-400 hover:text-white gap-2">
            <User size={16} />
            LOGIN
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Panel - Controls */}
        <div className="w-full md:w-[450px] border-r border-zinc-900 p-6 flex flex-col gap-8">
          
          <Tabs defaultValue="cloud" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-transparent border-b border-zinc-900 p-0 h-auto justify-start gap-8 rounded-none">
              <TabsTrigger 
                value="p2p" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent px-0 pb-2 text-zinc-500 data-[state=active]:text-white font-mono uppercase tracking-wider text-xs hover:text-zinc-300 transition-colors"
              >
                P2P Transfer
              </TabsTrigger>
              <TabsTrigger 
                value="cloud" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent px-0 pb-2 text-zinc-500 data-[state=active]:text-white font-mono uppercase tracking-wider text-xs hover:text-zinc-300 transition-colors"
              >
                Cloud Upload
              </TabsTrigger>
            </TabsList>

            <div className="mt-8 space-y-8">
              {/* SEND SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-widest font-mono">
                  <span>Send</span>
                  <span>History</span>
                </div>

                <div 
                  {...getRootProps()} 
                  className={`
                    border border-dashed border-zinc-800 rounded-none p-8 
                    flex flex-col items-center justify-center gap-4 
                    transition-all duration-300 cursor-pointer
                    hover:border-zinc-600 hover:bg-zinc-900/30
                    ${isDragActive ? 'border-white bg-zinc-900/50' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload size={24} className="text-zinc-600" />
                  <p className="text-zinc-500 text-sm font-mono text-center">
                    {isDragActive ? "DROP FILES HERE" : "drop or click (files/folders)"}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full rounded-none border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-12 font-mono text-xs uppercase tracking-widest"
                >
                  <FolderOpen size={16} className="mr-2" />
                  Select File(s)
                </Button>

                {/* File List Preview */}
                <AnimatePresence>
                  {files.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-4"
                    >
                      {files.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 text-xs">
                          <span className="truncate max-w-[200px] text-zinc-300">{file.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="text-zinc-500 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <Button className="w-full rounded-none bg-white text-black hover:bg-zinc-200 mt-2 font-mono text-xs uppercase font-bold">
                        Start Upload
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator className="bg-zinc-900" />

              {/* RECEIVE SECTION */}
              <div className="space-y-4">
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
                  Receive
                </div>
                
                <div className="flex gap-0">
                  <Input 
                    value={receiveCode}
                    onChange={(e) => setReceiveCode(e.target.value)}
                    placeholder="6/8 digit code" 
                    className="rounded-none border-zinc-800 bg-transparent text-center font-mono text-sm h-12 focus-visible:ring-0 focus-visible:border-white transition-colors placeholder:text-zinc-700"
                  />
                  <Button className="rounded-none h-12 w-12 bg-zinc-900 border border-l-0 border-zinc-800 hover:bg-zinc-800">
                    <ArrowRight size={16} className="text-zinc-400" />
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Visualization / Status */}
        <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} 
          />
          
          {/* Empty State / Visualization */}
          <div className="text-center space-y-6 z-10 opacity-30 pointer-events-none select-none">
            {activeTab === 'cloud' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="cloud-vis"
                className="flex flex-col items-center gap-4"
              >
                <div className="w-32 h-32 border border-zinc-800 rounded-full flex items-center justify-center">
                  <Cloud size={48} className="text-zinc-700" />
                </div>
                <h3 className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Cloud Storage</h3>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="p2p-vis"
                className="flex flex-col items-center gap-4"
              >
                <div className="w-32 h-32 border border-zinc-800 rounded-full flex items-center justify-center">
                  <Share2 size={48} className="text-zinc-700" />
                </div>
                <h3 className="text-zinc-500 font-mono text-sm tracking-widest uppercase">P2P Direct</h3>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-black z-20">
        <div className="flex items-center gap-4">
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 px-4 py-3 flex items-center gap-3 max-w-sm"
            >
              <ArrowRight className="text-zinc-500" size={14} />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 leading-snug">
                  Sign in to track your file transfers and access them later.
                </p>
                <button className="text-[10px] font-bold uppercase tracking-wider text-white mt-1 hover:underline">
                  Login Now
                </button>
              </div>
              <button className="text-zinc-600 hover:text-white">
                <X size={14} />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          <span>Powered by</span>
          <span className="text-white font-bold flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-sm" /> REPLIT
          </span>
        </div>

        <div className="border border-zinc-900 bg-zinc-950 px-4 py-2 flex items-center gap-6 min-w-[200px]">
          <Wifi size={14} className="text-zinc-600" />
          <div className="flex-1 flex justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-600 font-mono uppercase">Down</span>
              <span className="text-xs text-zinc-300 font-mono">{NETWORK_STATS.down}</span>
            </div>
            <div className="h-6 w-px bg-zinc-900" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-zinc-600 font-mono uppercase">Up</span>
              <span className="text-xs text-zinc-300 font-mono">{NETWORK_STATS.up}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
