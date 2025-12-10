import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import JSZip from "jszip";
import { 
  Cloud, 
  Share2, 
  Upload, 
  FolderOpen, 
  ArrowRight, 
  X, 
  Wifi, 
  WifiOff,
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
  EyeOff,
  Archive,
  XCircle,
  Zap,
  Server
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
import { 
  P2PTransfer, 
  generateRoomCode, 
  formatBytes as p2pFormatBytes, 
  formatSpeed,
  type P2PStatus,
  type P2PTransferProgress
} from "@/lib/p2p";

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

interface CompressionProgress {
  status: 'idle' | 'compressing' | 'uploading' | 'complete' | 'error' | 'cancelled';
  progress: number;
  currentFile: string;
  totalFiles: number;
  processedFiles: number;
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
              ? 'bg-accent/60' 
              : 'bg-destructive/20'
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
        className={`relative z-10 bg-secondary/50 border p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 rounded-md ${
          file.existsInStorage 
            ? 'border-border' 
            : 'border-destructive/50'
        } ${isHovered ? (file.existsInStorage ? 'border-muted-foreground/50' : 'border-destructive/70') : ''}`}
      >
        {file.existsInStorage ? (
          <FileIcon size={16} className={`shrink-0 transition-colors ${isHovered ? 'text-foreground/80' : 'text-muted-foreground'}`} />
        ) : (
          <AlertTriangle size={16} className="text-destructive shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-xs truncate transition-colors ${
              file.existsInStorage 
                ? (isHovered ? 'text-foreground' : 'text-foreground/80')
                : 'text-destructive'
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
          <p className={`text-[10px] transition-colors ${isHovered ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
            {file.existsInStorage ? file.sizeFormatted : 'File no longer exists in storage'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {file.existsInStorage && (
            <>
              <button
                onClick={() => onCopyCode(file.shareCode)}
                className="flex items-center gap-1 px-2 py-1 bg-accent text-[10px] font-mono hover:bg-accent/80 transition-colors rounded-sm"
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
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`download-${file.id}`}
              >
                <Download size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(file.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
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

function Sidebar({ activeTab, setActiveTab, onLogout, isAuthenticated, onNavigateAccount, onNavigate }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void, isAuthenticated: boolean, onNavigateAccount: () => void, onNavigate: (path: string) => void }) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { id: 'send', icon: Send, label: 'Send', action: () => setActiveTab('cloud') },
    { id: 'receive', icon: Download, label: 'Receive', action: () => setActiveTab('cloud') },
    { id: 'p2p', icon: Zap, label: 'P2P', action: () => setActiveTab('p2p') },
    { id: 'account', icon: User, label: 'Account', action: onNavigateAccount },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback', action: () => onNavigate('/feedback') },
    { id: 'about', icon: Info, label: 'About', action: () => onNavigate('/about') },
  ];

  return (
    <>
      <div className="sidebar-trigger-area" />
      <div className="sidebar-container bg-background/90 backdrop-blur-xl border-l border-border flex flex-col items-center py-6">
        
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
                  className="absolute inset-0 bg-accent/80 rounded-lg"
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
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`} 
                />
                
                <span className={`sidebar-label text-[10px] font-mono uppercase tracking-widest transition-colors ${
                  hoveredItem === item.id || activeTab === item.id 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
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
               className="absolute inset-0 bg-destructive/20 rounded-lg"
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
              className="relative z-10 p-3 w-full flex justify-center text-muted-foreground hover:text-destructive transition-colors"
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
    requiresPassword?: boolean;
  } | null>(null);
  const [receiveDownloadProgress, setReceiveDownloadProgress] = useState<number | null>(null);
  const [receiveDownloadStatus, setReceiveDownloadStatus] = useState<"idle" | "fetching" | "ready" | "downloading" | "complete" | "error" | "needs_password">("idle");
  const [receivePassword, setReceivePassword] = useState("");
  const [showReceivePassword, setShowReceivePassword] = useState(false);
  const [receivePasswordError, setReceivePasswordError] = useState("");
  const [isUnlockingReceive, setIsUnlockingReceive] = useState(false);
  const [filePassword, setFilePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const networkSpeed = useNetworkSpeed();
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress>({
    status: 'idle',
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    processedFiles: 0,
  });
  const cancelRef = useRef(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // P2P State
  const [p2pMode, setP2pMode] = useState<"send" | "receive">("send");
  const [p2pSelectedFile, setP2pSelectedFile] = useState<File | null>(null);
  const [p2pRoomCode, setP2pRoomCode] = useState<string>("");
  const [p2pSendStatus, setP2pSendStatus] = useState<P2PStatus>("idle");
  const [p2pSendProgress, setP2pSendProgress] = useState<P2PTransferProgress | null>(null);
  const [p2pPeerConnected, setP2pPeerConnected] = useState(false);
  const [p2pCopiedCode, setP2pCopiedCode] = useState(false);
  const [p2pCopiedLink, setP2pCopiedLink] = useState(false);
  const p2pSendTransferRef = useRef<P2PTransfer | null>(null);
  
  const [p2pReceiveRoomCode, setP2pReceiveRoomCode] = useState<string>("");
  const [p2pReceiveStatus, setP2pReceiveStatus] = useState<P2PStatus>("idle");
  const [p2pReceiveProgress, setP2pReceiveProgress] = useState<P2PTransferProgress | null>(null);
  const [p2pReceivedFile, setP2pReceivedFile] = useState<{ blob: Blob; name: string } | null>(null);
  const p2pReceiveTransferRef = useRef<P2PTransfer | null>(null);

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

  const compressFilesToZip = async (files: File[]): Promise<File | null> => {
    const zip = new JSZip();
    const totalFiles = files.length;
    
    setCompressionProgress({
      status: 'compressing',
      progress: 0,
      currentFile: '',
      totalFiles,
      processedFiles: 0,
    });

    for (let i = 0; i < files.length; i++) {
      if (cancelRef.current) {
        setCompressionProgress(prev => ({ ...prev, status: 'cancelled' }));
        return null;
      }
      
      const file = files[i];
      setCompressionProgress(prev => ({
        ...prev,
        currentFile: file.name,
        processedFiles: i,
        progress: Math.round((i / totalFiles) * 50),
      }));
      
      const arrayBuffer = await file.arrayBuffer();
      zip.file(file.name, arrayBuffer);
    }
    
    if (cancelRef.current) {
      setCompressionProgress(prev => ({ ...prev, status: 'cancelled' }));
      return null;
    }
    
    setCompressionProgress(prev => ({
      ...prev,
      currentFile: 'Generating archive...',
      processedFiles: totalFiles,
      progress: 50,
    }));
    
    const zipBlob = await zip.generateAsync(
      { 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        if (cancelRef.current) return;
        const progressPercent = 50 + Math.round(metadata.percent / 2);
        setCompressionProgress(prev => ({
          ...prev,
          progress: progressPercent,
        }));
      }
    );
    
    if (cancelRef.current) {
      setCompressionProgress(prev => ({ ...prev, status: 'cancelled' }));
      return null;
    }
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFileName = `archive_${timestamp}_${files.length}files.zip`;
    return new File([zipBlob], zipFileName, { type: 'application/zip' });
  };

  const handleCancelOperation = () => {
    cancelRef.current = true;
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setCompressionProgress({
      status: 'cancelled',
      progress: 0,
      currentFile: '',
      totalFiles: 0,
      processedFiles: 0,
    });
    setUploadProgress([]);
    toast({ title: "Operation cancelled" });
    setTimeout(() => {
      cancelRef.current = false;
      setCompressionProgress({
        status: 'idle',
        progress: 0,
        currentFile: '',
        totalFiles: 0,
        processedFiles: 0,
      });
    }, 1500);
  };

  const uploadWithProgressAndRef = async (file: File): Promise<UploadedFile> => {
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

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setCompressionProgress(prev => ({
            ...prev,
            status: 'uploading',
            progress: percent,
          }));
          setUploadProgress(prev => 
            prev.map(p => p.fileName === file.name ? { ...p, progress: percent } : p)
          );
        }
      });

      xhr.addEventListener('load', () => {
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Upload to storage failed'));
        }
      });

      xhr.addEventListener('error', () => {
        xhrRef.current = null;
        reject(new Error('Upload failed'));
      });
      xhr.addEventListener('abort', () => {
        xhrRef.current = null;
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });

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

    return confirmResponse.json();
  };

  const handleUploadAll = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    cancelRef.current = false;
    const filesToProcess = [...filesToUpload];
    setFilesToUpload([]);

    if (filesToProcess.length > 1) {
      try {
        const zipFile = await compressFilesToZip(filesToProcess);
        
        if (!zipFile || cancelRef.current) {
          return;
        }

        setCompressionProgress(prev => ({
          ...prev,
          status: 'uploading',
          progress: 0,
          currentFile: zipFile.name,
        }));

        const uploadedFileData = await uploadWithProgressAndRef(zipFile);
        
        setCompressionProgress(prev => ({ ...prev, status: 'complete', progress: 100 }));
        setLastUploadedFile(uploadedFileData);
        toast({ title: `Uploaded ${zipFile.name} (${filesToProcess.length} files compressed)` });
        
        queryClient.invalidateQueries({ queryKey: ['/api/files'] });
        
        setTimeout(() => {
          setCompressionProgress({
            status: 'idle',
            progress: 0,
            currentFile: '',
            totalFiles: 0,
            processedFiles: 0,
          });
        }, 3000);
        
      } catch (error) {
        if (cancelRef.current) return;
        setCompressionProgress(prev => ({ ...prev, status: 'error' }));
        toast({ title: "Failed to compress and upload files", variant: "destructive" });
        setTimeout(() => {
          setCompressionProgress({
            status: 'idle',
            progress: 0,
            currentFile: '',
            totalFiles: 0,
            processedFiles: 0,
          });
        }, 3000);
      }
    } else {
      setUploadProgress(prev => [
        ...prev,
        ...filesToProcess.map(file => ({ fileName: file.name, progress: 0, status: 'uploading' as const }))
      ]);

      const uploadPromises = filesToProcess.map(async (file) => {
        try {
          const uploadedFileData = await uploadWithProgress(file);
          
          setUploadProgress(prev => 
            prev.map(p => p.fileName === file.name ? { ...p, progress: 100, status: 'complete' } : p)
          );
          
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
    }
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
    setReceivePassword("");
    setReceivePasswordError("");
    
    try {
      const response = await fetch(`/api/files/download/${code}`);
      const data = await response.json();
      
      // Handle password-protected files
      if (response.status === 401 && data.requiresPassword) {
        setReceivedFileInfo({
          shareCode: code,
          originalName: data.originalName,
          size: data.size,
          sizeFormatted: data.sizeFormatted,
          url: "",
          requiresPassword: true,
        });
        setReceiveDownloadStatus("needs_password");
        setReceiveCode("");
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'File not found');
      }
      
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

  const handleUnlockReceivedFile = async () => {
    if (!receivedFileInfo || !receivePassword.trim()) {
      setReceivePasswordError("Please enter the password");
      return;
    }
    
    setIsUnlockingReceive(true);
    setReceivePasswordError("");
    
    try {
      const response = await fetch(`/api/files/download/${receivedFileInfo.shareCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: receivePassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          setReceivePasswordError("Incorrect password");
        } else {
          setReceivePasswordError(data.message || "Failed to unlock file");
        }
        return;
      }
      
      // Update file info with the download URL
      setReceivedFileInfo({
        ...receivedFileInfo,
        url: data.url,
        requiresPassword: false,
      });
      setReceiveDownloadStatus("ready");
      setReceivePassword("");
    } catch {
      setReceivePasswordError("Failed to unlock file");
    } finally {
      setIsUnlockingReceive(false);
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
    setReceivePassword("");
    setReceivePasswordError("");
  };

  // P2P Dropzone
  const onP2pDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setP2pSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getP2pRootProps, getInputProps: getP2pInputProps, isDragActive: isP2pDragActive } = useDropzone({ 
    onDrop: onP2pDrop,
    multiple: false
  });

  // P2P Functions
  const startP2pSending = async () => {
    if (!p2pSelectedFile) return;

    const code = generateRoomCode();
    setP2pRoomCode(code);
    setP2pSendStatus("connecting");
    setP2pPeerConnected(false);

    const transfer = new P2PTransfer("host", code, {
      onStatusChange: (status) => {
        setP2pSendStatus(status);
        if (status === "completed") {
          toast({ title: "File sent successfully!" });
        }
      },
      onProgress: (progress) => {
        setP2pSendProgress(progress);
      },
      onPeerConnected: () => {
        setP2pPeerConnected(true);
        toast({ title: "Peer connected! Starting transfer..." });
      },
      onPeerLeft: () => {
        setP2pPeerConnected(false);
        toast({ title: "Peer disconnected", variant: "destructive" });
      },
      onError: (error) => {
        toast({ title: error, variant: "destructive" });
      },
    });

    p2pSendTransferRef.current = transfer;
    await transfer.connect(p2pSelectedFile);
  };

  const cancelP2pSend = () => {
    p2pSendTransferRef.current?.disconnect();
    p2pSendTransferRef.current = null;
    setP2pSendStatus("idle");
    setP2pSendProgress(null);
    setP2pRoomCode("");
    setP2pPeerConnected(false);
  };

  const startP2pReceiving = async () => {
    if (!p2pReceiveRoomCode.trim()) {
      toast({ title: "Please enter a room code", variant: "destructive" });
      return;
    }

    setP2pReceiveStatus("connecting");

    const transfer = new P2PTransfer("peer", p2pReceiveRoomCode.toUpperCase().trim(), {
      onStatusChange: (status) => {
        setP2pReceiveStatus(status);
      },
      onProgress: (progress) => {
        setP2pReceiveProgress(progress);
      },
      onFileReceived: (blob, fileName) => {
        setP2pReceivedFile({ blob, name: fileName });
        toast({ title: "File received successfully!" });
      },
      onPeerLeft: () => {
        toast({ title: "Host disconnected", variant: "destructive" });
        setP2pReceiveStatus("error");
      },
      onError: (error) => {
        toast({ title: error, variant: "destructive" });
      },
    });

    p2pReceiveTransferRef.current = transfer;
    await transfer.connect();
  };

  const cancelP2pReceive = () => {
    p2pReceiveTransferRef.current?.disconnect();
    p2pReceiveTransferRef.current = null;
    setP2pReceiveStatus("idle");
    setP2pReceiveProgress(null);
    setP2pReceivedFile(null);
  };

  const downloadP2pReceivedFile = () => {
    if (!p2pReceivedFile) return;
    
    const url = URL.createObjectURL(p2pReceivedFile.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = p2pReceivedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyP2pCode = () => {
    navigator.clipboard.writeText(p2pRoomCode);
    setP2pCopiedCode(true);
    setTimeout(() => setP2pCopiedCode(false), 2000);
  };

  const copyP2pLink = () => {
    const url = `${window.location.origin}/?p2p=${p2pRoomCode}`;
    navigator.clipboard.writeText(url);
    setP2pCopiedLink(true);
    setTimeout(() => setP2pCopiedLink(false), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  const getP2pShareUrl = () => `${window.location.origin}/?p2p=${p2pRoomCode}`;

  // P2P URL param handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p2pCode = params.get("p2p");
    if (p2pCode) {
      setActiveTab("p2p");
      setP2pMode("receive");
      setP2pReceiveRoomCode(p2pCode.toUpperCase());
    }
  }, []);

  // P2P cleanup on unmount
  useEffect(() => {
    return () => {
      p2pSendTransferRef.current?.disconnect();
      p2pReceiveTransferRef.current?.disconnect();
    };
  }, []);

  const handleNavigateAccount = () => {
    if (isAuthenticated) {
      navigate('/account');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground font-mono selection:bg-foreground selection:text-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border transition-all duration-300 shrink-0">
        <TitaniumLogo />
        
        <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
          <button data-testid="nav-send" className="hover:text-foreground transition-colors uppercase tracking-wider">Send</button>
          <span className="text-border">/</span>
          <button data-testid="nav-receive" className="hover:text-foreground transition-colors uppercase tracking-wider">Receive</button>
          <span className="text-border">/</span>
          <button data-testid="nav-tempmail" className="border border-border px-2 py-1 text-foreground/80 hover:bg-secondary transition-colors uppercase tracking-wider">
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
                  <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                    {user.username?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground text-xs">{user.username || user.email}</span>
              </button>
              <button 
                onClick={() => logout()}
                data-testid="btn-logout"
                className="text-muted-foreground hover:text-destructive transition-colors"
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
              className="hidden md:flex text-muted-foreground hover:text-foreground gap-2 text-xs"
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
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} isAuthenticated={isAuthenticated} onNavigateAccount={handleNavigateAccount} onNavigate={navigate} />
        
        <main className="flex-1 flex flex-col md:flex-row pr-4 transition-all duration-300 overflow-auto">
        
        {/* Left Panel - Controls */}
        <div className="w-full md:w-[26rem] border-r border-border p-5 flex flex-col gap-6 z-10 bg-background">
          
          <Tabs defaultValue="cloud" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-transparent border-b border-border p-0 h-auto justify-start gap-6 rounded-none">
              <TabsTrigger 
                value="cloud" 
                data-testid="tab-cloud"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-muted-foreground data-[state=active]:text-foreground font-mono uppercase tracking-wider text-[10px] hover:text-foreground/80 transition-colors"
              >
                Cloud Upload
              </TabsTrigger>
              <TabsTrigger 
                value="p2p" 
                data-testid="tab-p2p"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-muted-foreground data-[state=active]:text-foreground font-mono uppercase tracking-wider text-[10px] hover:text-foreground/80 transition-colors"
              >
                P2P Transfer
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              {activeTab === 'cloud' ? (
                <>
                  {/* SEND SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                      <span>Send</span>
                    </div>

                    {/* Unified Drop Zone with Files and Progress */}
                    <div 
                      {...getRootProps()} 
                      data-testid="dropzone"
                      className={`
                        border border-dashed border-border rounded-none p-4
                        transition-all duration-300 cursor-pointer
                        hover:border-muted-foreground/50 hover:bg-secondary/30
                        ${isDragActive ? 'border-foreground bg-secondary/50' : ''}
                        ${(filesToUpload.length > 0 || uploadProgress.length > 0 || compressionProgress.status !== 'idle') ? 'min-h-[120px]' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      
                      {/* Empty state */}
                      {filesToUpload.length === 0 && uploadProgress.length === 0 && compressionProgress.status === 'idle' && (
                        <div className="flex flex-col items-center justify-center gap-3 py-4">
                          <Upload size={20} className="text-muted-foreground/70" />
                          <p className="text-muted-foreground text-xs font-mono text-center">
                            {isDragActive ? "DROP FILES HERE" : "drop or click (files/folders)"}
                          </p>
                        </div>
                      )}

                      {/* Files waiting to upload */}
                      {filesToUpload.length > 0 && compressionProgress.status === 'idle' && (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          {filesToUpload.map((file, idx) => (
                            <div key={`pending-${file.name}-${idx}`} data-testid={`file-item-${idx}`} className="flex items-center justify-between p-2 bg-secondary/50 border border-border text-[10px]">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileIcon size={12} className="text-muted-foreground shrink-0" />
                                <span className="truncate text-foreground/80">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-muted-foreground/70 text-[9px]">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="text-muted-foreground hover:text-destructive">
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Compression/Upload Progress - shown inside dropzone */}
                      {(compressionProgress.status === 'compressing' || compressionProgress.status === 'uploading' || compressionProgress.status === 'complete') && (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()} data-testid="compression-progress-container">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {compressionProgress.status === 'compressing' ? (
                                <Archive size={14} className="text-cyan-500 animate-pulse" />
                              ) : compressionProgress.status === 'complete' ? (
                                <CheckCircle2 size={14} className="text-green-500" />
                              ) : (
                                <Upload size={14} className="text-green-500 animate-pulse" />
                              )}
                              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                {compressionProgress.status === 'compressing' ? 'Compressing' : compressionProgress.status === 'complete' ? 'Complete' : 'Uploading'}
                              </span>
                            </div>
                            <span className="text-[10px] text-foreground font-mono" data-testid="text-progress-percent">
                              {compressionProgress.progress}%
                            </span>
                          </div>
                          
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${compressionProgress.progress}%` }}
                              transition={{ duration: 0.1 }}
                              className={`h-full ${compressionProgress.status === 'complete' ? 'bg-green-500' : compressionProgress.status === 'compressing' ? 'bg-cyan-500' : 'bg-foreground'}`}
                              data-testid="progress-compression"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[180px]" data-testid="text-current-file">
                              {compressionProgress.status === 'compressing' 
                                ? `${compressionProgress.processedFiles}/${compressionProgress.totalFiles} - ${compressionProgress.currentFile}`
                                : compressionProgress.status === 'complete'
                                ? 'Upload successful'
                                : compressionProgress.currentFile
                              }
                            </p>
                            {compressionProgress.status !== 'complete' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCancelOperation(); }}
                                className="h-6 px-2 text-[9px] text-destructive hover:text-destructive/80 hover:bg-destructive/20"
                                data-testid="btn-cancel-operation"
                              >
                                <XCircle size={12} className="mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cancelled Status */}
                      {compressionProgress.status === 'cancelled' && (
                        <div className="flex items-center justify-center gap-2 py-4" onClick={(e) => e.stopPropagation()} data-testid="status-cancelled">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-400 text-xs font-mono">Operation cancelled</span>
                        </div>
                      )}

                      {/* Error Status */}
                      {compressionProgress.status === 'error' && (
                        <div className="flex items-center justify-center gap-2 py-4" onClick={(e) => e.stopPropagation()} data-testid="status-error">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-400 text-xs font-mono">Operation failed</span>
                        </div>
                      )}

                      {/* Single file Upload Progress */}
                      {uploadProgress.length > 0 && compressionProgress.status === 'idle' && (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          {uploadProgress.map((p, idx) => (
                            <div key={`progress-${idx}`} className="p-2 bg-secondary/50 border border-border">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileIcon size={12} className="text-muted-foreground shrink-0" />
                                  <span className="truncate text-foreground/80">{p.fileName}</span>
                                </div>
                                <span className={`shrink-0 ml-2 ${p.status === 'complete' ? 'text-green-500' : p.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {p.status === 'complete' ? 'Done' : p.status === 'error' ? 'Failed' : `${p.progress}%`}
                                </span>
                              </div>
                              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${p.progress}%` }}
                                  transition={{ duration: 0.1 }}
                                  className={`h-full ${p.status === 'complete' ? 'bg-green-500' : p.status === 'error' ? 'bg-destructive' : 'bg-foreground'}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add more files hint when files exist */}
                      {(filesToUpload.length > 0 || uploadProgress.length > 0) && compressionProgress.status === 'idle' && (
                        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border/50">
                          <Upload size={12} className="text-muted-foreground/70" />
                          <span className="text-muted-foreground/70 text-[9px] font-mono">DROP MORE FILES</span>
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
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
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
                              className="rounded-none border-border bg-transparent font-mono text-xs h-10 focus-visible:ring-0 focus-visible:border-foreground transition-colors placeholder:text-muted-foreground/50 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="btn-toggle-password"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/80 transition-colors"
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
                                        : 'bg-secondary'
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
                      {filesToUpload.length > 0 && compressionProgress.status === 'idle' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Button 
                            data-testid="btn-start-upload" 
                            onClick={handleUploadAll}
                            disabled={uploadProgress.some(p => p.status === 'uploading') || compressionProgress.status !== 'idle'}
                            className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-[10px] uppercase font-bold h-10"
                          >
                            {filesToUpload.length > 1 ? (
                              <>
                                <Archive size={14} className="mr-2" />
                                {`Compress & Upload ${filesToUpload.length} Files`}
                              </>
                            ) : (
                              `Upload ${filesToUpload.length} File`
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
                      className="w-full rounded-none border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-muted-foreground/50 h-10 font-mono text-[10px] uppercase tracking-widest"
                    >
                      <FolderOpen size={14} className="mr-2" />
                      Select File(s)
                    </Button>
                  </div>

                  <Separator className="bg-border" />

                  {/* RECEIVE SECTION */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                      Receive
                    </div>
                    
                    <div className="flex gap-0">
                      <Input 
                        value={receiveCode}
                        onChange={(e) => setReceiveCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleReceive()}
                        data-testid="input-receive-code"
                        placeholder="Enter share code" 
                        className="rounded-none border-border bg-transparent text-center font-mono text-xs h-10 focus-visible:ring-0 focus-visible:border-foreground transition-colors placeholder:text-muted-foreground/50 uppercase"
                      />
                      <Button 
                        data-testid="btn-receive" 
                        onClick={handleReceive}
                        disabled={receiveDownloadStatus === "fetching"}
                        className="rounded-none h-10 w-10 bg-secondary border border-l-0 border-border hover:bg-accent"
                      >
                        {receiveDownloadStatus === "fetching" ? (
                          <Loader2 size={14} className="text-muted-foreground animate-spin" />
                        ) : (
                          <ArrowRight size={14} className="text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* P2P Transfer Section */
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* P2P Mode Toggle */}
                  <div className="flex gap-2">
                    <Button
                      variant={p2pMode === "send" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setP2pMode("send")}
                      className="flex-1 rounded-none font-mono text-[10px] uppercase"
                      data-testid="btn-p2p-send-mode"
                    >
                      <Upload size={14} className="mr-2" />
                      Send
                    </Button>
                    <Button
                      variant={p2pMode === "receive" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setP2pMode("receive")}
                      className="flex-1 rounded-none font-mono text-[10px] uppercase"
                      data-testid="btn-p2p-receive-mode"
                    >
                      <Download size={14} className="mr-2" />
                      Receive
                    </Button>
                  </div>

                  {/* P2P SEND */}
                  {p2pMode === "send" && (
                    <div className="space-y-4">
                      {p2pSendStatus === "idle" && (
                        <>
                          <div
                            {...getP2pRootProps()}
                            className={`border border-dashed rounded-none p-4 text-center cursor-pointer transition-all ${
                              isP2pDragActive 
                                ? "border-foreground bg-secondary/50" 
                                : p2pSelectedFile 
                                  ? "border-green-500 bg-green-500/5" 
                                  : "border-border hover:border-muted-foreground/50"
                            }`}
                            data-testid="dropzone-p2p-send"
                          >
                            <input {...getP2pInputProps()} />
                            {p2pSelectedFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileIcon size={16} className="text-green-500" />
                                <div className="text-left">
                                  <p className="font-mono text-xs text-foreground">{p2pSelectedFile.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {p2pFormatBytes(p2pSelectedFile.size)}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setP2pSelectedFile(null);
                                  }}
                                  data-testid="btn-p2p-remove-file"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ) : (
                              <div className="py-4">
                                <Upload size={20} className="mx-auto mb-2 text-muted-foreground/70" />
                                <p className="text-muted-foreground text-[10px] font-mono">
                                  {isP2pDragActive ? "DROP FILE HERE" : "drop or click to select"}
                                </p>
                              </div>
                            )}
                          </div>

                          <Button 
                            className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-[10px] uppercase h-10"
                            disabled={!p2pSelectedFile}
                            onClick={startP2pSending}
                            data-testid="btn-p2p-start-send"
                          >
                            <Zap size={14} className="mr-2" />
                            Start P2P Transfer
                          </Button>
                        </>
                      )}

                      {(p2pSendStatus === "connecting" || p2pSendStatus === "connected") && !p2pPeerConnected && (
                        <div className="space-y-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-cyan-500">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-[10px] font-mono uppercase">Waiting for peer...</span>
                          </div>

                          <div className="p-4 bg-secondary/50 border border-border">
                            <p className="text-[10px] text-muted-foreground mb-3 font-mono uppercase">Share this code:</p>
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <span className="text-2xl font-mono font-bold tracking-widest text-cyan-400">
                                {p2pRoomCode}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={copyP2pCode}
                                data-testid="btn-p2p-copy-code"
                              >
                                {p2pCopiedCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                              </Button>
                            </div>

                            <div className="flex justify-center mb-4">
                              <div className="bg-white p-2 rounded-md">
                                <QRCodeSVG value={getP2pShareUrl()} size={120} />
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={copyP2pLink}
                              className="gap-2 rounded-none font-mono text-[10px]"
                              data-testid="btn-p2p-copy-link"
                            >
                              {p2pCopiedLink ? <Check size={12} /> : <Link2 size={12} />}
                              Copy Link
                            </Button>
                          </div>

                          <Button 
                            variant="outline" 
                            onClick={cancelP2pSend}
                            className="rounded-none font-mono text-[10px]"
                            data-testid="btn-p2p-cancel-send"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {(p2pSendStatus === "transferring" || (p2pSendStatus === "connected" && p2pPeerConnected)) && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileIcon size={14} />
                              <span className="font-mono text-xs">{p2pSelectedFile?.name}</span>
                            </div>
                            <Badge variant={p2pSendProgress?.isRelay ? "secondary" : "default"} className="text-[9px]">
                              {p2pSendProgress?.isRelay ? (
                                <><Server size={10} className="mr-1" /> Relay</>
                              ) : (
                                <><Wifi size={10} className="mr-1" /> Direct</>
                              )}
                            </Badge>
                          </div>

                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p2pSendProgress?.progress || 0}%` }}
                              className="h-full bg-cyan-500"
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>
                              {p2pFormatBytes(p2pSendProgress?.transferred || 0)} / {p2pFormatBytes(p2pSendProgress?.fileSize || 0)}
                            </span>
                            <span>{formatSpeed(p2pSendProgress?.speed || 0)}</span>
                          </div>
                        </div>
                      )}

                      {p2pSendStatus === "completed" && (
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                            <Check size={24} className="text-green-500" />
                          </div>
                          <h3 className="font-mono text-sm uppercase">Transfer Complete!</h3>
                          <Button onClick={() => {
                            setP2pSendStatus("idle");
                            setP2pSelectedFile(null);
                            setP2pSendProgress(null);
                            setP2pRoomCode("");
                          }} className="rounded-none font-mono text-[10px]" data-testid="btn-p2p-send-another">
                            Send Another File
                          </Button>
                        </div>
                      )}

                      {p2pSendStatus === "error" && (
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <WifiOff size={24} className="text-destructive" />
                          </div>
                          <h3 className="font-mono text-sm uppercase">Connection Failed</h3>
                          <Button onClick={cancelP2pSend} className="rounded-none font-mono text-[10px]" data-testid="btn-p2p-retry-send">
                            Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* P2P RECEIVE */}
                  {p2pMode === "receive" && (
                    <div className="space-y-4">
                      {p2pReceiveStatus === "idle" && !p2pReceivedFile && (
                        <>
                          <div className="text-center py-4">
                            <Download size={24} className="mx-auto mb-2 text-muted-foreground/70" />
                            <p className="text-muted-foreground text-[10px] font-mono">
                              Enter the 6-digit code from sender
                            </p>
                          </div>

                          <Input
                            placeholder="ABC123"
                            value={p2pReceiveRoomCode}
                            onChange={(e) => setP2pReceiveRoomCode(e.target.value.toUpperCase())}
                            className="text-center text-xl font-mono tracking-widest h-12 rounded-none"
                            maxLength={6}
                            data-testid="input-p2p-room-code"
                          />

                          <Button 
                            className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-[10px] uppercase h-10"
                            disabled={p2pReceiveRoomCode.length < 6}
                            onClick={startP2pReceiving}
                            data-testid="btn-p2p-start-receive"
                          >
                            <Download size={14} className="mr-2" />
                            Connect & Receive
                          </Button>
                        </>
                      )}

                      {p2pReceiveStatus === "connecting" && (
                        <div className="text-center space-y-4">
                          <Loader2 size={32} className="mx-auto animate-spin text-cyan-500" />
                          <p className="text-muted-foreground text-[10px] font-mono">Connecting to sender...</p>
                          <Button variant="outline" onClick={cancelP2pReceive} className="rounded-none font-mono text-[10px]" data-testid="btn-p2p-cancel-receive">
                            Cancel
                          </Button>
                        </div>
                      )}

                      {p2pReceiveStatus === "connected" && !p2pReceiveProgress && (
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 text-green-500">
                            <Wifi size={16} />
                            <span className="text-[10px] font-mono uppercase">Connected to sender</span>
                          </div>
                          <p className="text-muted-foreground text-[10px] font-mono">Waiting for transfer...</p>
                        </div>
                      )}

                      {p2pReceiveStatus === "transferring" && p2pReceiveProgress && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileIcon size={14} />
                              <span className="font-mono text-xs">{p2pReceiveProgress.fileName}</span>
                            </div>
                            <Badge variant={p2pReceiveProgress.isRelay ? "secondary" : "default"} className="text-[9px]">
                              {p2pReceiveProgress.isRelay ? (
                                <><Server size={10} className="mr-1" /> Relay</>
                              ) : (
                                <><Wifi size={10} className="mr-1" /> Direct</>
                              )}
                            </Badge>
                          </div>

                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p2pReceiveProgress.progress}%` }}
                              className="h-full bg-cyan-500"
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>
                              {p2pFormatBytes(p2pReceiveProgress.transferred)} / {p2pFormatBytes(p2pReceiveProgress.fileSize)}
                            </span>
                            <span>{formatSpeed(p2pReceiveProgress.speed)}</span>
                          </div>
                        </div>
                      )}

                      {(p2pReceiveStatus === "completed" || p2pReceivedFile) && (
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                            <Check size={24} className="text-green-500" />
                          </div>
                          <h3 className="font-mono text-sm uppercase">File Received!</h3>
                          {p2pReceivedFile && (
                            <>
                              <p className="text-muted-foreground text-xs font-mono">{p2pReceivedFile.name}</p>
                              <Button onClick={downloadP2pReceivedFile} className="rounded-none font-mono text-[10px]" data-testid="btn-p2p-download-received">
                                <Download size={14} className="mr-2" />
                                Download File
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setP2pReceiveStatus("idle");
                              setP2pReceiveProgress(null);
                              setP2pReceivedFile(null);
                              setP2pReceiveRoomCode("");
                            }}
                            className="rounded-none font-mono text-[10px]"
                            data-testid="btn-p2p-receive-another"
                          >
                            Receive Another File
                          </Button>
                        </div>
                      )}

                      {p2pReceiveStatus === "error" && (
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <WifiOff size={24} className="text-destructive" />
                          </div>
                          <h3 className="font-mono text-sm uppercase">Connection Failed</h3>
                          <p className="text-muted-foreground text-[10px] font-mono">
                            Room not found or host disconnected.
                          </p>
                          <Button onClick={cancelP2pReceive} className="rounded-none font-mono text-[10px]" data-testid="btn-p2p-retry-receive">
                            Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* P2P Info */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-4 text-[9px] text-muted-foreground font-mono">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>Direct P2P - Fastest</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span>Relay - When direct fails</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Visualization / Status */}
        <div className="flex-1 bg-background relative overflow-hidden flex items-center justify-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
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
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
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
                    <div className="bg-secondary/50 border border-border rounded-md p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">File Name</div>
                      <div className="flex items-center gap-2">
                        <FileIcon size={16} className="text-cyan-500 shrink-0" />
                        <p className="text-foreground text-sm font-medium truncate" data-testid="text-file-name">
                          {lastUploadedFile.originalName}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{lastUploadedFile.sizeFormatted}</p>
                    </div>

                    {/* Share Code */}
                    <div className="bg-secondary/50 border border-border rounded-md p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Share Code</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-background border border-muted-foreground/30 px-3 py-2 rounded-md">
                          <span className="text-lg font-bold font-mono text-cyan-400 tracking-widest" data-testid="text-share-code">
                            {lastUploadedFile.shareCode}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyShareCode(lastUploadedFile.shareCode)}
                          data-testid="btn-copy-code"
                          className="border-muted-foreground/30 hover:bg-accent"
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
                    <div className="bg-secondary/50 border border-border rounded-md p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Download Link</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-background border border-muted-foreground/30 px-3 py-2 rounded-md overflow-hidden">
                          <span className="text-xs text-muted-foreground font-mono truncate block" data-testid="text-download-link">
                            {getDownloadUrl(lastUploadedFile.shareCode)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyDownloadLink(lastUploadedFile.shareCode)}
                          data-testid="btn-copy-link"
                          className="border-muted-foreground/30 hover:bg-accent"
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
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-foreground font-mono uppercase tracking-wider"
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
                    <p className="text-[10px] text-muted-foreground mt-3 text-center font-mono uppercase tracking-wider">
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
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    data-testid="btn-close-received-file"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-secondary/50 border border-border rounded-md p-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2 flex items-center gap-2">
                      {receivedFileInfo.requiresPassword ? (
                        <>
                          <Lock size={12} className="text-red-400" />
                          <span>Password Protected File</span>
                        </>
                      ) : (
                        <span>File Ready to Download</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <FileIcon size={24} className={receivedFileInfo.requiresPassword ? "text-red-400 shrink-0" : "text-green-500 shrink-0"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate" data-testid="text-received-filename">
                          {receivedFileInfo.originalName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{receivedFileInfo.sizeFormatted}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/70 font-mono">Code:</span>
                      <span className="text-xs text-cyan-400 font-mono font-bold" data-testid="text-received-code">
                        {receivedFileInfo.shareCode}
                      </span>
                    </div>
                  </div>

                  {receiveDownloadStatus === "needs_password" && (
                    <div className="space-y-4 p-4 bg-red-900/10 border border-red-900/30 rounded-md">
                      <div className="flex items-center gap-2 text-red-400">
                        <Lock size={16} />
                        <span className="text-sm font-medium">This file is password protected</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-muted-foreground text-xs uppercase tracking-wider">Enter Password</label>
                        <div className="relative">
                          <Input
                            type={showReceivePassword ? "text" : "password"}
                            value={receivePassword}
                            onChange={(e) => setReceivePassword(e.target.value)}
                            placeholder="Enter file password"
                            className="bg-accent border-muted-foreground/30 text-foreground pr-10"
                            data-testid="input-receive-password"
                            onKeyDown={(e) => e.key === "Enter" && handleUnlockReceivedFile()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowReceivePassword(!showReceivePassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showReceivePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {receivePasswordError && (
                          <p className="text-red-400 text-xs">{receivePasswordError}</p>
                        )}
                      </div>
                      <Button
                        onClick={handleUnlockReceivedFile}
                        disabled={isUnlockingReceive}
                        className="w-full gap-2"
                        data-testid="btn-unlock-receive"
                      >
                        {isUnlockingReceive ? (
                          <><Loader2 size={16} className="animate-spin" /> Unlocking...</>
                        ) : (
                          <><Lock size={16} /> Unlock File</>
                        )}
                      </Button>
                    </div>
                  )}

                  {(receiveDownloadStatus === "downloading" || receiveDownloadStatus === "complete") && receiveDownloadProgress !== null && (
                    <div className="space-y-2" data-testid="receive-download-progress">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">
                          {receiveDownloadStatus === "complete" ? "Complete" : "Downloading..."}
                        </span>
                        <span className="text-foreground font-mono" data-testid="text-receive-percentage">{receiveDownloadProgress}%</span>
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

                  {receiveDownloadStatus !== "needs_password" && (
                    <Button
                      onClick={handleReceiveDownload}
                      disabled={receiveDownloadStatus === "downloading"}
                      data-testid="btn-receive-download"
                      className="w-full bg-green-600 hover:bg-green-700 text-foreground font-mono uppercase tracking-wider"
                    >
                      {receiveDownloadStatus === "downloading" ? (
                        <><Loader2 size={14} className="mr-2 animate-spin" /> Downloading...</>
                      ) : receiveDownloadStatus === "complete" ? (
                        <><Download size={14} className="mr-2" /> Download Again</>
                      ) : (
                        <><Download size={14} className="mr-2" /> Download File</>
                      )}
                    </Button>
                  )}
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
                    <div className="w-24 h-24 border border-border rounded-full flex items-center justify-center">
                      <Cloud size={36} className="text-muted-foreground/60" />
                    </div>
                    <h3 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">Cloud Storage</h3>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key="p2p-vis"
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-24 h-24 border border-border rounded-full flex items-center justify-center">
                      <Share2 size={36} className="text-muted-foreground/60" />
                    </div>
                    <h3 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">P2P Direct</h3>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-background z-20 transition-all duration-300 shrink-0">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {showLoginPrompt && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-secondary/50 border border-border px-3 py-2 flex items-center gap-2 max-w-xs"
              >
                <ArrowRight className="text-muted-foreground" size={12} />
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Sign in to track your file transfers.
                  </p>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    data-testid="btn-login-prompt" 
                    className="text-[9px] font-bold uppercase tracking-wider text-foreground mt-0.5 hover:underline"
                  >
                    Login Now
                  </button>
                </div>
                <button 
                  onClick={() => setShowLoginPrompt(false)}
                  data-testid="btn-close-prompt"
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border border-border bg-card px-3 py-1.5 flex items-center gap-4 min-w-[160px]">
          <Wifi size={12} className="text-muted-foreground/70" />
          <div className="flex-1 flex justify-between items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted-foreground/70 font-mono uppercase">Down</span>
              <span className="text-[10px] text-foreground/80 font-mono">{networkSpeed.down}</span>
            </div>
            <div className="h-5 w-px bg-secondary" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-muted-foreground/70 font-mono uppercase">Up</span>
              <span className="text-[10px] text-foreground/80 font-mono">{networkSpeed.up}</span>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
