import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  User, 
  Shield, 
  CreditCard,
  Activity,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Wifi,
  AlertTriangle,
  Upload,
  Download,
  Loader2,
  Copy,
  Check,
  Trash2,
  FileIcon,
  X,
  Link2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TabType = 'overview' | 'account' | 'security' | 'billing' | 'danger';

interface NavItemProps {
  id: TabType;
  icon: React.ElementType;
  label: string;
  active: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function NavItem({ id, icon: Icon, label, active, isHovered, onClick, onMouseEnter }: NavItemProps) {
  return (
    <div className="relative" onMouseEnter={onMouseEnter}>
      {isHovered && (
        <motion.div
          layoutId="account-nav-hover"
          className="absolute inset-0 bg-accent/60 rounded-md"
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
      <button
        onClick={onClick}
        data-testid={`nav-${id}`}
        className={`
          relative z-10 w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-200 rounded-md
          ${active 
            ? 'text-foreground' 
            : 'text-muted-foreground'
          }
        `}
      >
        <Icon size={16} className={active ? 'text-cyan-500' : isHovered ? 'text-foreground/80' : ''} />
        <span className={isHovered && !active ? 'text-foreground/80' : ''}>{label}</span>
        {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-500 rounded-full" />}
      </button>
    </div>
  );
}

interface UsageCardProps {
  title: string;
  percentage: number;
  used: string;
  total: string;
  status?: string;
  color?: 'cyan' | 'green';
  testId?: string;
}

function UsageCard({ title, percentage, used, total, status, color = 'cyan', testId }: UsageCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-5 transition-colors hover:border-muted-foreground/30" data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] text-muted-foreground border border-muted-foreground/30 px-2 py-0.5 rounded-full">
          {status || `${percentage}%`}
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-1 bg-accent rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              color === 'green' 
                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
            }`}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{used}</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
}

interface ActivityItemRowProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  status?: string;
  testId?: string;
}

function ActivityItemRow({ icon: Icon, title, subtitle, status, testId }: ActivityItemRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0" data-testid={testId}>
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-secondary rounded-md flex items-center justify-center">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground truncate max-w-[200px]">{title}</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      {status && (
        <span className="text-[11px] text-muted-foreground/70">{status}</span>
      )}
    </div>
  );
}

interface StorageData {
  usedBytes: number;
  usedFormatted: string;
  totalBytes: number;
  totalFormatted: string;
  percentage: number;
  fileCount: number;
}

interface ActivityItem {
  id: string;
  type: string;
  fileName: string;
  size: number;
  sizeFormatted: string;
  downloadCount: number;
  createdAt: string;
}

interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  sizeFormatted: string;
  shareCode: string;
  downloadCount: number;
  createdAt: string;
  existsInStorage: boolean;
}

function useIsXlScreen() {
  const [isXl, setIsXl] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 1280px)').matches;
    }
    return false;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const handler = (e: MediaQueryListEvent) => setIsXl(e.matches);
    
    setIsXl(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return isXl;
}

function OverviewTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const isXlScreen = useIsXlScreen();
  
  const { data: storageData, isLoading: storageLoading } = useQuery<StorageData>({
    queryKey: ['/api/account/storage'],
  });

  const { data: uploadedFiles = [], isLoading: filesLoading } = useQuery<UploadedFile[]>({
    queryKey: ['/api/files'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account/storage'] });
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
  
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Share code copied!" });
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

  const handleFileClick = (file: UploadedFile) => {
    if (file.existsInStorage) {
      setSelectedFile(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-foreground mb-1">Dashboard</h1>
      <p className="text-xs text-muted-foreground mb-8">Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <UsageCard 
          title="Cloud Storage" 
          percentage={storageData?.percentage || 0} 
          used={storageLoading ? "Loading..." : (storageData?.usedFormatted || "0 B") + " Used"} 
          total={storageData?.totalFormatted || "1 GB"} 
          testId="card-cloud-storage"
        />
        <UsageCard 
          title="Transfers" 
          percentage={Math.min((storageData?.fileCount || 0) * 10, 100)} 
          used={`${storageData?.fileCount || 0} Files`} 
          total="This Month"
          status="Ready"
          color="green"
          testId="card-transfers"
        />
      </div>

      <div className="flex flex-row gap-5">
        {/* History Panel - Fixed width, no shrinking when file details appear */}
        <div className="bg-card border border-border rounded-md p-5 flex-1 min-w-0 xl:min-w-[500px] xl:shrink-0" data-testid="card-history">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">History</h3>
            <span className="text-[10px] text-muted-foreground border border-muted-foreground/30 px-2 py-0.5 rounded-full flex items-center gap-1" data-testid="badge-live">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          
          {filesLoading ? (
            <div className="text-center py-8">
              <Loader2 size={24} className="text-muted-foreground mx-auto animate-spin" />
            </div>
          ) : uploadedFiles.length > 0 ? (
            <div 
              className="space-y-2 max-h-[400px] overflow-y-auto"
              onMouseLeave={() => setHoveredFileId(null)}
            >
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="relative"
                  onMouseEnter={() => setHoveredFileId(file.id)}
                >
                  {hoveredFileId === file.id && (
                    <motion.div
                      layoutId="file-list-hover-bg"
                      className={`absolute inset-0 rounded-md ${
                        file.existsInStorage 
                          ? 'bg-accent/60' 
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
                  
                  <div
                    data-testid={`uploaded-file-${file.id}`}
                    onClick={() => handleFileClick(file)}
                    className={`relative z-10 bg-secondary/50 border p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 rounded-md ${
                      file.existsInStorage 
                        ? 'border-border' 
                        : 'border-red-900/50'
                    } ${hoveredFileId === file.id ? (file.existsInStorage ? 'border-muted-foreground/50' : 'border-red-700/50') : ''} ${selectedFile?.id === file.id ? 'ring-1 ring-cyan-500 border-cyan-500' : ''}`}
                  >
                    {file.existsInStorage ? (
                      <FileIcon size={16} className={`shrink-0 transition-colors ${hoveredFileId === file.id ? 'text-foreground/80' : 'text-muted-foreground'}`} />
                    ) : (
                      <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs truncate transition-colors ${
                          file.existsInStorage 
                            ? (hoveredFileId === file.id ? 'text-foreground' : 'text-foreground/80')
                            : 'text-red-400'
                        }`}>
                          {file.originalName}
                        </p>
                      </div>
                      <p className={`text-[10px] transition-colors ${hoveredFileId === file.id ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                        {file.existsInStorage ? `${file.sizeFormatted} - ${formatTimeAgo(file.createdAt)}` : 'File no longer exists in storage'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {file.existsInStorage && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyShareCode(file.shareCode); }}
                            className="flex items-center gap-1 px-2 py-1 bg-accent text-[10px] font-mono hover:bg-accent transition-colors rounded-sm"
                            data-testid={`copy-code-${file.id}`}
                          >
                            {copiedCode === file.shareCode ? (
                              <><Check size={10} className="text-green-500" /> Copied</>
                            ) : (
                              <><Copy size={10} /> {file.shareCode}</>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadMutation.mutate(file.shareCode); }}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`download-${file.id}`}
                          >
                            <Download size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        data-testid={`delete-${file.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileIcon size={32} className="text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No files uploaded yet</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">Your uploaded files will appear here</p>
            </div>
          )}
        </div>

        {/* File Details Panel - Side panel on xl screens */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden xl:block bg-card border border-border rounded-md p-5 w-[420px] shrink-0"
              data-testid="file-details-panel"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">File Details</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  data-testid="btn-close-details"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Name */}
                <div className="bg-secondary/50 border border-border rounded-md p-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">File Name</div>
                  <div className="flex items-center gap-2">
                    <FileIcon size={16} className="text-cyan-500 shrink-0" />
                    <p className="text-foreground text-sm font-medium truncate" data-testid="text-detail-filename">
                      {selectedFile.originalName}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{selectedFile.sizeFormatted}</p>
                </div>

                {/* Share Code */}
                <div className="bg-secondary/50 border border-border rounded-md p-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Share Code</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold text-cyan-400 tracking-widest" data-testid="text-detail-code">
                      {selectedFile.shareCode}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); copyShareCode(selectedFile.shareCode); }}
                      className="text-[10px]"
                      data-testid="btn-copy-detail-code"
                    >
                      {copiedCode === selectedFile.shareCode ? <Check size={12} /> : <Copy size={12} />}
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-secondary/50 border border-border rounded-md p-4">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Statistics</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Downloads</span>
                    <span className="text-sm text-foreground font-medium" data-testid="text-detail-downloads">{selectedFile.downloadCount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Uploaded</span>
                    <span className="text-sm text-foreground font-medium">{formatTimeAgo(selectedFile.createdAt)}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-secondary/50 border border-border rounded-md p-4 flex flex-col items-center">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-3 self-start">QR Code</div>
                  <div className="bg-white p-3 rounded-md">
                    <QRCodeSVG 
                      value={getDownloadUrl(selectedFile.shareCode)} 
                      size={120}
                      level="M"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground/70 mt-2">Scan to download</p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={(e) => { e.stopPropagation(); copyDownloadLink(selectedFile.shareCode); }}
                    variant="outline"
                    className="w-full justify-start"
                    data-testid="btn-copy-detail-link"
                  >
                    {copiedLink ? <Check size={14} className="mr-2 text-green-500" /> : <Link2 size={14} className="mr-2" />}
                    {copiedLink ? "Link Copied!" : "Copy Download Link"}
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); downloadMutation.mutate(selectedFile.shareCode); }}
                    className="w-full justify-start"
                    data-testid="btn-download-detail"
                  >
                    <Download size={14} className="mr-2" />
                    Download File
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(selectedFile.id); setSelectedFile(null); }}
                    variant="destructive"
                    className="w-full justify-start"
                    data-testid="btn-delete-detail"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete File
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile/Tablet Modal for File Details - Only render on non-xl screens */}
      {!isXlScreen && (
        <Dialog open={selectedFile !== null} onOpenChange={(open) => !open && setSelectedFile(null)}>
          <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          {selectedFile && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">File Details</h3>
              
              {/* File Name */}
              <div className="bg-secondary/50 border border-border rounded-md p-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">File Name</div>
                <div className="flex items-center gap-2">
                  <FileIcon size={16} className="text-cyan-500 shrink-0" />
                  <p className="text-foreground text-sm font-medium truncate">
                    {selectedFile.originalName}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{selectedFile.sizeFormatted}</p>
              </div>

              {/* Share Code */}
              <div className="bg-secondary/50 border border-border rounded-md p-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Share Code</div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold text-cyan-400 tracking-widest">
                    {selectedFile.shareCode}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyShareCode(selectedFile.shareCode)}
                    className="text-[10px]"
                  >
                    {copiedCode === selectedFile.shareCode ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-secondary/50 border border-border rounded-md p-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Statistics</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Downloads</span>
                  <span className="text-sm text-foreground font-medium">{selectedFile.downloadCount}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Uploaded</span>
                  <span className="text-sm text-foreground font-medium">{formatTimeAgo(selectedFile.createdAt)}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-secondary/50 border border-border rounded-md p-4 flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-3 self-start">QR Code</div>
                <div className="bg-white p-3 rounded-md">
                  <QRCodeSVG 
                    value={getDownloadUrl(selectedFile.shareCode)} 
                    size={140}
                    level="M"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground/70 mt-2">Scan to download</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={() => copyDownloadLink(selectedFile.shareCode)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {copiedLink ? <Check size={14} className="mr-2 text-green-500" /> : <Link2 size={14} className="mr-2" />}
                  {copiedLink ? "Link Copied!" : "Copy Download Link"}
                </Button>
                <Button
                  onClick={() => downloadMutation.mutate(selectedFile.shareCode)}
                  className="w-full justify-start"
                >
                  <Download size={14} className="mr-2" />
                  Download File
                </Button>
                <Button
                  onClick={() => { deleteMutation.mutate(selectedFile.id); setSelectedFile(null); }}
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete File
                </Button>
              </div>
            </div>
          )}
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

function AccountTab() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || '');
  
  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const res = await apiRequest('PATCH', '/api/account/username', { username: newUsername });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update username');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Username updated", description: "Your display name has been changed." });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-foreground mb-1">Account</h1>
      <p className="text-xs text-muted-foreground mb-8">Manage your account settings.</p>

      <div className="bg-card border border-border rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Profile Information</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-accent text-foreground/80 text-lg">
              {user?.username?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-medium text-foreground">{user?.username || 'User'}</h4>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
              Display Name
            </label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-display-name"
              className="bg-background border-border text-foreground h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
              Email Address
            </label>
            <Input 
              defaultValue={user?.email || ''}
              data-testid="input-email"
              className="bg-background border-border text-foreground h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
              disabled
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            data-testid="btn-save-profile"
            onClick={() => updateUsernameMutation.mutate(username)}
            disabled={updateUsernameMutation.isPending || username === user?.username}
          >
            {updateUsernameMutation.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md p-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm text-foreground">Email Notifications</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Receive transfer alerts via email</p>
            </div>
            <Switch data-testid="switch-email-notifications" />
          </div>
          <Separator className="bg-accent" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm text-foreground">Auto-delete Files</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Delete files after 7 days</p>
            </div>
            <Switch data-testid="switch-auto-delete" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SecurityTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/account/change-password', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-foreground mb-1">Security</h1>
      <p className="text-xs text-muted-foreground mb-8">Manage your security settings.</p>

      <div className="bg-card border border-border rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Account Information</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <h4 className="text-sm text-foreground">Login Method</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">How you sign in to your account</p>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full capitalize">
              {user?.provider || 'Local'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm text-foreground">Account Created</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">When you joined Titanium</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
              Current Password
            </label>
            <Input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              data-testid="input-current-password"
              className="bg-background border-border text-foreground h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
              New Password
            </label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              data-testid="input-new-password"
              className="bg-background border-border text-foreground h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
              Confirm New Password
            </label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              data-testid="input-confirm-password"
              className="bg-background border-border text-foreground h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div className="pt-2">
            <Button 
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
              data-testid="btn-change-password"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Changing...
                </>
              ) : 'Change Password'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Current Session</h3>
        
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-secondary rounded-md flex items-center justify-center">
              <Settings size={16} className="text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">This Browser</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Currently active session</p>
            </div>
          </div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-md p-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Two-Factor Authentication</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm text-foreground">Enable 2FA</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Coming soon</p>
          </div>
          <Switch data-testid="switch-2fa" disabled />
        </div>
      </div>
    </motion.div>
  );
}

function BillingTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-foreground mb-1">Billing</h1>
      <p className="text-xs text-muted-foreground mb-8">Manage your subscription and payments.</p>

      <div className="bg-card border border-border rounded-md p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            Free Tier
          </span>
        </div>
        
        <div className="bg-background border border-border rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-foreground">Free</h4>
              <p className="text-xs text-muted-foreground">1GB Storage - 100 API calls/month</p>
            </div>
            <span className="text-2xl font-bold text-foreground">$0<span className="text-sm text-muted-foreground">/mo</span></span>
          </div>
        </div>

        <Button 
          data-testid="btn-upgrade"
          className="w-full"
        >
          Upgrade to Pro
        </Button>
      </div>

      <div className="bg-card border border-border rounded-md p-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Payment History</h3>
        
        <div className="text-center py-8">
          <FileText size={32} className="text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No payment history</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">Invoices will appear here once you upgrade</p>
        </div>
      </div>
    </motion.div>
  );
}

function DangerZoneTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/account', { confirmEmail });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete account');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      logout();
      navigate('/');
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-foreground mb-1">Danger Zone</h1>
      <p className="text-xs text-muted-foreground mb-8">Irreversible and destructive actions.</p>

      <div className="bg-card border border-red-900/50 rounded-md p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-md flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Delete Account</h3>
            <p className="text-[11px] text-muted-foreground">Permanently delete your account and all data</p>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-900/30 rounded-md p-4 mb-5">
          <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Warning</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>All your files will be permanently deleted</li>
            <li>Your account data will be erased</li>
            <li>You will NOT be able to create a new account with this email for 5 days</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>

        {!showConfirm ? (
          <Button 
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            data-testid="btn-show-delete-confirm"
            className="w-full"
          >
            Delete My Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
                Type your email to confirm: <span className="text-red-400">{user?.email}</span>
              </label>
              <Input 
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Enter your email"
                data-testid="input-confirm-delete-email"
                className="bg-background border-red-900/50 text-foreground h-10 focus-visible:ring-0 focus-visible:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmEmail('');
                }}
                className="flex-1"
                data-testid="btn-cancel-delete"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending || confirmEmail !== user?.email}
                className="flex-1"
                data-testid="btn-confirm-delete"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Account() {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hoveredNavItem, setHoveredNavItem] = useState<TabType | null>(null);

  const navItems: { id: TabType; icon: React.ElementType; label: string }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'account', icon: User, label: 'Account' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'danger', icon: AlertTriangle, label: 'Danger Zone' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'account':
        return <AccountTab />;
      case 'security':
        return <SecurityTab />;
      case 'billing':
        return <BillingTab />;
      case 'danger':
        return <DangerZoneTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="h-screen bg-background text-foreground font-mono flex flex-col overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute w-[600px] h-[600px] -top-[200px] -left-[200px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'breath 10s infinite alternate',
          }}
        />
      </div>

      <style>{`
        @keyframes breath {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          100% { transform: translate(50px, 50px) scale(1.1); opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 z-10 bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight size={16} className="rotate-180" />
          <span className="text-xs uppercase tracking-wider">Back to Titanium</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
                data-testid="btn-logout"
                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              >
                <LogOut size={14} />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 border-r border-border p-4 flex flex-col bg-background/60 backdrop-blur-md shrink-0">
          <nav className="flex flex-col gap-1 flex-1 mt-4" onMouseLeave={() => setHoveredNavItem(null)}>
            <AnimatePresence>
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  isHovered={hoveredNavItem === item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => setHoveredNavItem(item.id)}
                />
              ))}
            </AnimatePresence>
          </nav>

          {/* User Profile */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center gap-3 px-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-accent text-foreground/80 text-xs">
                  {user?.username?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-foreground">{user?.username || 'User'}</p>
                <p className="text-[10px] text-muted-foreground/70">Free Plan</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-12 overflow-y-auto">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 flex items-center justify-between bg-background shrink-0 z-10">
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/70 font-mono uppercase tracking-widest">
          <span>Powered by</span>
          <span className="text-foreground font-bold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" /> REPLIT
          </span>
        </div>

        <div className="border border-border bg-card px-3 py-1.5 flex items-center gap-4 min-w-[160px]">
          <Wifi size={12} className="text-muted-foreground/70" />
          <div className="flex-1 flex justify-between items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted-foreground/70 font-mono uppercase">Down</span>
              <span className="text-[10px] text-foreground/80 font-mono">80.7 Mbps</span>
            </div>
            <div className="h-5 w-px bg-secondary" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-muted-foreground/70 font-mono uppercase">Up</span>
              <span className="text-[10px] text-foreground/80 font-mono">38.3 Mbps</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
