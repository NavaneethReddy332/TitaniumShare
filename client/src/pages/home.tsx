import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  LogOut,
  Loader2,
  Copy,
  Check,
  Trash2,
  FileIcon,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthModal } from "@/components/auth-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Link2 } from "lucide-react";
import { useNetworkSpeed } from "@/hooks/useNetworkSpeed";

interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  sizeFormatted: string;
  shareCode: string;
  hasPassword: boolean;
  downloadCount: number;
  createdAt: string;
  existsInStorage: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}


interface FileItemProps {
  file: UploadedFile;
  onCopyCode: (code: string) => void;
  onDownload: (code: string) => void;
  onDelete: (id: string) => void;
  copiedCode: string | null;
  isHovered: boolean;
  onMouseEnter: () => void;
}

function FileItem({ file, onCopyCode, onDownload, onDelete, copiedCode, isHovered, onMouseEnter }: FileItemProps) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
    >
      {isHovered && (
        <motion.div
          layoutId="file-list-hover-bg"
          className={`absolute inset-0 rounded-md ${
            file.existsInStorage 
              ? 'bg-zinc-800/60' 
              : 'bg-red-900/20'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 350, 
            damping: 25,
            duration: 0.2
          }}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        data-testid={`uploaded-file-${file.id}`}
        className={`relative z-10 bg-zinc-900/50 border p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 rounded-md ${
          file.existsInStorage 
            ? 'border-zinc-800' 
            : 'border-red-900/50'
        } ${isHovered ? (file.existsInStorage ? 'border-zinc-600' : 'border-red-700/50') : ''}`}
      >
        {file.existsInStorage ? (
          <FileIcon size={16} className={`shrink-0 transition-colors ${isHovered ? 'text-zinc-300' : 'text-zinc-500'}`} />
        ) : (
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-xs truncate transition-colors ${
              file.existsInStorage 
                ? (isHovered ? 'text-white' : 'text-zinc-300')
                : 'text-red-400'
            }`}>
              {file.originalName}
            </p>
            {file.hasPassword && file.existsInStorage && (
              <Badge 
                variant="destructive" 
                className="text-[8px] px-1.5 py-0 h-4 uppercase tracking-wider font-bold gap-0.5"
                data-testid={`locked-badge-${file.id}`}
              >
                <Lock size={8} />
                LOCKED
              </Badge>
            )}
            {!file.existsInStorage && (
              <Badge 
                variant="destructive" 
                className="text-[8px] px-1.5 py-0 h-4 uppercase tracking-wider font-bold animate-pulse"
                data-testid={`deleted-badge-${file.id}`}
              >
                DELETED
              </Badge>
            )}
          </div>
          <p className={`text-[10px] transition-colors ${isHovered ? 'text-zinc-500' : 'text-zinc-600'}`}>
            {file.existsInStorage ? file.sizeFormatted : 'File no longer exists in storage'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {file.existsInStorage && (
            <>
              <button
                onClick={() => onCopyCode(file.shareCode)}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800 text-[10px] font-mono hover:bg-zinc-700 transition-colors rounded-sm"
                data-testid={`copy-code-${file.id}`}
              >
                {copiedCode === file.shareCode ? (
                  <><Check size={10} className="text-green-500" /> Copied</>
                ) : (
                  <><Copy size={10} /> {file.shareCode}</>
                )}
              </button>
              <button
                onClick={() => onDownload(file.shareCode)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
                data-testid={`download-${file.id}`}
              >
                <Download size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(file.id)}
            className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
            data-testid={`delete-${file.id}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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

function Sidebar({ activeTab, setActiveTab, onLogout, isAuthenticated, onNavigateAccount }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void, isAuthenticated: boolean, onNavigateAccount: () => void }) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { id: 'send', icon: Send, label: 'Send', action: () => setActiveTab('cloud') },
    { id: 'receive', icon: Download, label: 'Receive', action: () => setActiveTab('cloud') },
    { id: 'account', icon: User, label: 'Account', action: onNavigateAccount },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback', action: () => window.location.href = '/feedback' },
    { id: 'about', icon: Info, label: 'About', action: () => window.location.href = '/about' },
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
                className="relative z-10 p-3 w-full flex flex-row items-center justify-start gap-3 group"
              >
                <item.icon 
                  size={18} 
                  className={`transition-colors duration-200 shrink-0 ${
                    hoveredItem === item.id || activeTab === item.id 
                      ? 'text-white' 
                      : 'text-zinc-500'
                  }`} 
                />
                
                <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors hidden xl:block ${
                  hoveredItem === item.id || activeTab === item.id 
                    ? 'text-white' 
                    : 'text-zinc-500'
                }`}>
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
          {isAuthenticated && (
            <button 
              onClick={onLogout}
              data-testid="sidebar-logout"
              className="relative z-10 p-3 w-full flex justify-center text-zinc-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cloud");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [receiveCode, setReceiveCode] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<UploadedFile | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [receivedFileInfo, setReceivedFileInfo] = useState<{
    shareCode: string;
    originalName: string;
    size: number;
    sizeFormatted: string;
    url: string;
  } | null>(null);
  const [receiveDownloadProgress, setReceiveDownloadProgress] = useState<number | null>(null);
  const [receiveDownloadStatus, setReceiveDownloadStatus] = useState<"idle" | "fetching" | "ready" | "downloading" | "complete" | "error">("idle");
  const [filePassword, setFilePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const networkSpeed = useNetworkSpeed();

  const getPasswordStrength = (password: string): { level: 0 | 1 | 2 | 3 | 4; label: string; color: string } => {
    if (!password) return { level: 0, label: "", color: "" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { level: 2, label: "Fair", color: "bg-orange-500" };
    if (score === 3) return { level: 3, label: "Good", color: "bg-yellow-500" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(filePassword);

  const { data: uploadedFiles = [], isLoading: filesLoading } = useQuery<UploadedFile[]>({
    queryKey: ['/api/files'],
    enabled: isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({ title: "File deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete file", variant: "destructive" });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (shareCode: string) => {
      const response = await fetch(`/api/files/download/${shareCode}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.originalName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: `Downloading ${data.originalName}` });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginPrompt(false);
    }
  }, [isAuthenticated]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFilesToUpload(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (name: string) => {
    setFilesToUpload(filesToUpload.filter(f => f.name !== name));
  };

  const uploadWithProgress = async (file: File): Promise<UploadedFile> => {
    // Step 1: Get presigned URL from server
    const presignResponse = await fetch('/api/files/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      }),
    });

    if (!presignResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, storageKey, shareCode } = await presignResponse.json();

    // Step 2: Upload directly to Storj using presigned URL
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => 
            prev.map(p => p.fileName === file.name ? { ...p, progress: percent } : p)
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Upload to storage failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });

    // Step 3: Confirm upload with server
    const confirmResponse = await fetch('/api/files/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        storageKey,
        shareCode,
        originalName: file.name,
        size: file.size,
        contentType: file.type || 'application/octet-stream',
        password: filePassword || null,
      }),
    });

    if (!confirmResponse.ok) {
      throw new Error('Failed to confirm upload');
    }

    const uploadedFileData = await confirmResponse.json();
    return uploadedFileData;
  };

  const handleUploadAll = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const filesToProcess = [...filesToUpload];
    setFilesToUpload([]);

    // Initialize all progress entries
    setUploadProgress(prev => [
      ...prev,
      ...filesToProcess.map(file => ({ fileName: file.name, progress: 0, status: 'uploading' as const }))
    ]);

    // Upload all files in parallel for maximum speed
    const uploadPromises = filesToProcess.map(async (file) => {
      try {
        const uploadedFileData = await uploadWithProgress(file);
        
        setUploadProgress(prev => 
          prev.map(p => p.fileName === file.name ? { ...p, progress: 100, status: 'complete' } : p)
        );
        
        // Set the last uploaded file to show in the center panel
        setLastUploadedFile(uploadedFileData);
        
        toast({ title: `Uploaded ${file.name}` });
        return { success: true, file, data: uploadedFileData };
      } catch {
        setUploadProgress(prev => 
          prev.map(p => p.fileName === file.name ? { ...p, status: 'error' } : p)
        );
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
        return { success: false, file, data: null };
      }
    });

    await Promise.all(uploadPromises);
    queryClient.invalidateQueries({ queryKey: ['/api/files'] });

    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status !== 'complete'));
    }, 3000);
  };

  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDownloadUrl = (shareCode: string) => {
    return `${window.location.origin}/download/${shareCode}`;
  };

  const copyDownloadLink = (shareCode: string) => {
    navigator.clipboard.writeText(getDownloadUrl(shareCode));
    setCopiedLink(true);
    toast({ title: "Download link copied!" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadFile = (shareCode: string) => {
    downloadMutation.mutate(shareCode);
  };

  const clearLastUploadedFile = () => {
    setLastUploadedFile(null);
  };

  const handleReceive = async () => {
    if (!receiveCode.trim()) return;
    const code = receiveCode.trim().toUpperCase();
    setReceiveDownloadStatus("fetching");
    setLastUploadedFile(null);
    
    try {
      const response = await fetch(`/api/files/download/${code}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'File not found');
      }
      const data = await response.json();
      setReceivedFileInfo({
        shareCode: code,
        originalName: data.originalName,
        size: data.size,
        sizeFormatted: data.sizeFormatted,
        url: data.url,
      });
      setReceiveDownloadStatus("ready");
      setReceiveCode("");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "File not found", variant: "destructive" });
      setReceiveDownloadStatus("error");
      setTimeout(() => setReceiveDownloadStatus("idle"), 2000);
    }
  };

  const handleReceiveDownload = async () => {
    if (!receivedFileInfo) return;
    
    setReceiveDownloadStatus("downloading");
    setReceiveDownloadProgress(0);

    try {
      const response = await fetch(receivedFileInfo.url, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : receivedFileInfo.size;
      
      const reader = response.body?.getReader();
      
      if (!reader) {
        window.open(receivedFileInfo.url, '_blank');
        setReceiveDownloadStatus("complete");
        setReceiveDownloadProgress(100);
        toast({ title: `Downloaded ${receivedFileInfo.originalName}` });
        return;
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        const progress = Math.round((receivedLength / total) * 100);
        setReceiveDownloadProgress(progress);
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = receivedFileInfo.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setReceiveDownloadStatus("complete");
      setReceiveDownloadProgress(100);
      toast({ title: `Downloaded ${receivedFileInfo.originalName}` });
    } catch (err) {
      window.open(receivedFileInfo.url, '_blank');
      setReceiveDownloadStatus("complete");
      setReceiveDownloadProgress(100);
      toast({ title: `Downloaded ${receivedFileInfo.originalName}` });
    }
  };

  const clearReceivedFile = () => {
    setReceivedFileInfo(null);
    setReceiveDownloadProgress(null);
    setReceiveDownloadStatus("idle");
  };

  const handleNavigateAccount = () => {
    if (isAuthenticated) {
      navigate('/account');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="h-screen bg-black text-white font-mono selection:bg-white selection:text-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 transition-all duration-300 shrink-0">
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
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handleNavigateAccount}
                data-testid="btn-profile"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.username || 'User'} className="object-cover" />
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                    {user.username?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-zinc-400 text-xs">{user.username || user.email}</span>
              </button>
              <button 
                onClick={() => logout()}
                data-testid="btn-logout"
                className="text-zinc-500 hover:text-red-500 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Button 
              data-testid="btn-login" 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAuthModal(true)}
              className="hidden md:flex text-zinc-400 hover:text-white gap-2 text-xs"
            >
              <User size={14} />
              LOGIN
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => !user && setShowAuthModal(true)}>
            <Menu size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content Area - contains sidebar */}
      <div className="content-with-sidebar">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} isAuthenticated={isAuthenticated} onNavigateAccount={handleNavigateAccount} />
        
        <main className="flex-1 flex flex-col md:flex-row pr-4 transition-all duration-300 overflow-auto">
        
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
                    </div>

                    {/* Unified Drop Zone with Files and Progress */}
                    <div 
                      {...getRootProps()} 
                      data-testid="dropzone"
                      className={`
                        border border-dashed border-zinc-800 rounded-none p-4
                        transition-all duration-300 cursor-pointer
                        hover:border-zinc-600 hover:bg-zinc-900/30
                        ${isDragActive ? 'border-white bg-zinc-900/50' : ''}
                        ${(filesToUpload.length > 0 || uploadProgress.length > 0) ? 'min-h-[120px]' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      
                      {/* Empty state */}
                      {filesToUpload.length === 0 && uploadProgress.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 py-4">
                          <Upload size={20} className="text-zinc-600" />
                          <p className="text-zinc-500 text-xs font-mono text-center">
                            {isDragActive ? "DROP FILES HERE" : "drop or click (files/folders)"}
                          </p>
                        </div>
                      )}

                      {/* Files waiting to upload */}
                      {filesToUpload.length > 0 && (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          {filesToUpload.map((file, idx) => (
                            <div key={`pending-${file.name}-${idx}`} data-testid={`file-item-${idx}`} className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800 text-[10px]">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileIcon size={12} className="text-zinc-500 shrink-0" />
                                <span className="truncate text-zinc-300">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-zinc-600 text-[9px]">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="text-zinc-500 hover:text-red-500">
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Progress */}
                      {uploadProgress.length > 0 && (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          {uploadProgress.map((p, idx) => (
                            <div key={`progress-${idx}`} className="p-2 bg-zinc-900/50 border border-zinc-800">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileIcon size={12} className="text-zinc-500 shrink-0" />
                                  <span className="truncate text-zinc-300">{p.fileName}</span>
                                </div>
                                <span className={`shrink-0 ml-2 ${p.status === 'complete' ? 'text-green-500' : p.status === 'error' ? 'text-red-500' : 'text-zinc-400'}`}>
                                  {p.status === 'complete' ? 'Done' : p.status === 'error' ? 'Failed' : `${p.progress}%`}
                                </span>
                              </div>
                              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${p.progress}%` }}
                                  transition={{ duration: 0.1 }}
                                  className={`h-full ${p.status === 'complete' ? 'bg-green-500' : p.status === 'error' ? 'bg-red-500' : 'bg-white'}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add more files hint when files exist */}
                      {(filesToUpload.length > 0 || uploadProgress.length > 0) && (
                        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                          <Upload size={12} className="text-zinc-600" />
                          <span className="text-zinc-600 text-[9px] font-mono">DROP MORE FILES</span>
                        </div>
                      )}
                    </div>

                    {/* Password Protection Field */}
                    <AnimatePresence>
                      {filesToUpload.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                            <Lock size={12} />
                            <span>Password Protection (Optional)</span>
                          </div>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={filePassword}
                              onChange={(e) => setFilePassword(e.target.value)}
                              data-testid="input-file-password"
                              placeholder="Set a password for your files"
                              className="rounded-none border-zinc-800 bg-transparent font-mono text-xs h-10 focus-visible:ring-0 focus-visible:border-white transition-colors placeholder:text-zinc-700 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="btn-toggle-password"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {filePassword && (
                            <div className="space-y-1">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                      level <= passwordStrength.level
                                        ? passwordStrength.color
                                        : 'bg-zinc-800'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className={`text-[9px] font-mono uppercase tracking-wider ${
                                passwordStrength.level === 1 ? 'text-red-500' :
                                passwordStrength.level === 2 ? 'text-orange-500' :
                                passwordStrength.level === 3 ? 'text-yellow-500' :
                                'text-green-500'
                              }`}>
                                {passwordStrength.label}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Upload Button */}
                    <AnimatePresence>
                      {filesToUpload.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Button 
                            data-testid="btn-start-upload" 
                            onClick={handleUploadAll}
                            disabled={uploadProgress.some(p => p.status === 'uploading')}
                            className="w-full rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-[10px] uppercase font-bold h-10"
                          >
                            {uploadProgress.some(p => p.status === 'uploading') ? (
                              <><Loader2 size={14} className="mr-2 animate-spin" /> Uploading...</>
                            ) : (
                              `Upload ${filesToUpload.length} File${filesToUpload.length > 1 ? 's' : ''}`
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button 
                      variant="outline" 
                      data-testid="btn-select-files"
                      onClick={(e) => { e.stopPropagation(); }}
                      {...getRootProps()}
                      className="w-full rounded-none border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-10 font-mono text-[10px] uppercase tracking-widest"
                    >
                      <FolderOpen size={14} className="mr-2" />
                      Select File(s)
                    </Button>
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
                        onChange={(e) => setReceiveCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleReceive()}
                        data-testid="input-receive-code"
                        placeholder="Enter share code" 
                        className="rounded-none border-zinc-800 bg-transparent text-center font-mono text-xs h-10 focus-visible:ring-0 focus-visible:border-white transition-colors placeholder:text-zinc-700 uppercase"
                      />
                      <Button 
                        data-testid="btn-receive" 
                        onClick={handleReceive}
                        disabled={receiveDownloadStatus === "fetching"}
                        className="rounded-none h-10 w-10 bg-zinc-900 border border-l-0 border-zinc-800 hover:bg-zinc-800"
                      >
                        {receiveDownloadStatus === "fetching" ? (
                          <Loader2 size={14} className="text-zinc-400 animate-spin" />
                        ) : (
                          <ArrowRight size={14} className="text-zinc-400" />
                        )}
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
          
          <AnimatePresence mode="wait">
            {lastUploadedFile ? (
              <motion.div
                key="uploaded-file-details"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="z-10 w-full max-w-lg p-6"
              >
                {/* Close Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={clearLastUploadedFile}
                    className="text-zinc-500 hover:text-white transition-colors p-1"
                    data-testid="btn-close-file-details"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* File Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - File Info */}
                  <div className="space-y-6">
                    {/* File Name */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-4">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">File Name</div>
                      <div className="flex items-center gap-2">
                        <FileIcon size={16} className="text-cyan-500 shrink-0" />
                        <p className="text-white text-sm font-medium truncate" data-testid="text-file-name">
                          {lastUploadedFile.originalName}
                        </p>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">{lastUploadedFile.sizeFormatted}</p>
                    </div>

                    {/* Share Code */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-4">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">Share Code</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black border border-zinc-700 px-3 py-2 rounded-md">
                          <span className="text-lg font-bold font-mono text-cyan-400 tracking-widest" data-testid="text-share-code">
                            {lastUploadedFile.shareCode}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyShareCode(lastUploadedFile.shareCode)}
                          data-testid="btn-copy-code"
                          className="border-zinc-700 hover:bg-zinc-800"
                        >
                          {copiedCode === lastUploadedFile.shareCode ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Download Link */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-4">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">Download Link</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black border border-zinc-700 px-3 py-2 rounded-md overflow-hidden">
                          <span className="text-xs text-zinc-400 font-mono truncate block" data-testid="text-download-link">
                            {getDownloadUrl(lastUploadedFile.shareCode)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyDownloadLink(lastUploadedFile.shareCode)}
                          data-testid="btn-copy-link"
                          className="border-zinc-700 hover:bg-zinc-800"
                        >
                          {copiedLink ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Link2 size={14} />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={() => handleDownloadFile(lastUploadedFile.shareCode)}
                      disabled={downloadMutation.isPending}
                      data-testid="btn-download-file"
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-mono uppercase tracking-wider"
                    >
                      {downloadMutation.isPending ? (
                        <><Loader2 size={14} className="mr-2 animate-spin" /> Downloading...</>
                      ) : (
                        <><Download size={14} className="mr-2" /> Download File</>
                      )}
                    </Button>
                  </div>

                  {/* Right Column - QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-md">
                      <QRCodeSVG
                        value={getDownloadUrl(lastUploadedFile.shareCode)}
                        size={180}
                        level="H"
                        includeMargin={false}
                        data-testid="qr-code"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-3 text-center font-mono uppercase tracking-wider">
                      Scan to Download
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : receivedFileInfo ? (
              <motion.div
                key="received-file-details"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="z-10 w-full max-w-md p-6"
              >
                <div className="flex justify-end mb-4">
                  <button
                    onClick={clearReceivedFile}
                    className="text-zinc-500 hover:text-white transition-colors p-1"
                    data-testid="btn-close-received-file"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-4">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">File Ready to Download</div>
                    <div className="flex items-center gap-3">
                      <FileIcon size={24} className="text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate" data-testid="text-received-filename">
                          {receivedFileInfo.originalName}
                        </p>
                        <p className="text-[10px] text-zinc-500">{receivedFileInfo.sizeFormatted}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600 font-mono">Code:</span>
                      <span className="text-xs text-cyan-400 font-mono font-bold" data-testid="text-received-code">
                        {receivedFileInfo.shareCode}
                      </span>
                    </div>
                  </div>

                  {(receiveDownloadStatus === "downloading" || receiveDownloadStatus === "complete") && receiveDownloadProgress !== null && (
                    <div className="space-y-2" data-testid="receive-download-progress">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-mono">
                          {receiveDownloadStatus === "complete" ? "Complete" : "Downloading..."}
                        </span>
                        <span className="text-white font-mono" data-testid="text-receive-percentage">{receiveDownloadProgress}%</span>
                      </div>
                      <Progress value={receiveDownloadProgress} className="h-2" data-testid="progress-receive" />
                    </div>
                  )}

                  {receiveDownloadStatus === "complete" && (
                    <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-md" data-testid="receive-complete">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-400 text-sm">Download complete!</span>
                    </div>
                  )}

                  {receiveDownloadStatus === "error" && (
                    <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md" data-testid="receive-error">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-400 text-sm">Download failed</span>
                    </div>
                  )}

                  <Button
                    onClick={handleReceiveDownload}
                    disabled={receiveDownloadStatus === "downloading"}
                    data-testid="btn-receive-download"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-mono uppercase tracking-wider"
                  >
                    {receiveDownloadStatus === "downloading" ? (
                      <><Loader2 size={14} className="mr-2 animate-spin" /> Downloading...</>
                    ) : receiveDownloadStatus === "complete" ? (
                      <><Download size={14} className="mr-2" /> Download Again</>
                    ) : (
                      <><Download size={14} className="mr-2" /> Download File</>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 z-10 opacity-30 pointer-events-none select-none"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-black z-20 transition-all duration-300 shrink-0">
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
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    data-testid="btn-login-prompt" 
                    className="text-[9px] font-bold uppercase tracking-wider text-white mt-0.5 hover:underline"
                  >
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
              <span className="text-[10px] text-zinc-300 font-mono">{networkSpeed.down}</span>
            </div>
            <div className="h-5 w-px bg-zinc-900" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-zinc-600 font-mono uppercase">Up</span>
              <span className="text-[10px] text-zinc-300 font-mono">{networkSpeed.up}</span>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
