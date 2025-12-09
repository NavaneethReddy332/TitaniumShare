import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download, FileIcon, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FileInfo {
  url?: string;
  originalName: string;
  size: number;
  sizeFormatted: string;
  requiresPassword?: boolean;
}

export default function DownloadPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "complete" | "error">("idle");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);

  const { data: fileInfo, isLoading, error, isError } = useQuery<FileInfo>({
    queryKey: ["/api/files/download", shareCode],
    queryFn: async () => {
      const response = await fetch(`/api/files/download/${shareCode}`);
      const data = await response.json();
      if (response.status === 401 && data.requiresPassword) {
        return {
          originalName: data.originalName,
          size: data.size,
          sizeFormatted: data.sizeFormatted,
          requiresPassword: true,
        };
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to get file info");
      }
      return data;
    },
    enabled: !!shareCode,
    retry: false,
  });

  const handleUnlock = async () => {
    if (!password.trim()) {
      setPasswordError("Please enter the password");
      return;
    }
    
    setIsUnlocking(true);
    setPasswordError("");
    
    try {
      const response = await fetch(`/api/files/download/${shareCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          setPasswordError("Incorrect password");
        } else {
          setPasswordError(data.message || "Failed to unlock file");
        }
        return;
      }
      
      setUnlockedUrl(data.url);
    } catch {
      setPasswordError("Failed to unlock file");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDownload = async () => {
    const url = unlockedUrl || fileInfo?.url;
    if (!url || !fileInfo) return;

    setDownloadStatus("downloading");
    setDownloadProgress(0);

    try {
      const response = await fetch(url, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : fileInfo.size;
      
      const reader = response.body?.getReader();
      
      if (!reader) {
        window.open(url, '_blank');
        setDownloadStatus("complete");
        setDownloadProgress(100);
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
        setDownloadProgress(progress);
      }

      const blob = new Blob(chunks);
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileInfo.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setDownloadStatus("complete");
      setDownloadProgress(100);
    } catch {
      window.open(url, '_blank');
      setDownloadStatus("complete");
      setDownloadProgress(100);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading file info...</p>
        </div>
      </div>
    );
  }

  if (isError || !fileInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-white text-lg">File Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-zinc-400 text-sm">
              {error instanceof Error ? error.message : "The file you're looking for doesn't exist or has expired."}
            </p>
            <Link href="/">
              <Button variant="outline" className="gap-2" data-testid="button-go-home">
                <ArrowLeft size={16} />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsPassword = fileInfo.requiresPassword && !unlockedUrl;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-zinc-400" data-testid="button-back">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Download File</span>
            {fileInfo.requiresPassword && (
              <Badge variant="destructive" className="gap-1 ml-auto">
                <Lock size={10} />
                Protected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-md">
            <FileIcon className="w-10 h-10 text-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate" data-testid="text-filename">
                {fileInfo.originalName}
              </h3>
              <p className="text-zinc-500 text-sm" data-testid="text-filesize">
                {fileInfo.sizeFormatted}
              </p>
              <p className="text-zinc-600 text-xs font-mono mt-1" data-testid="text-sharecode">
                Code: {shareCode}
              </p>
            </div>
          </div>

          {needsPassword && (
            <div className="space-y-4 p-4 bg-red-900/10 border border-red-900/30 rounded-md">
              <div className="flex items-center gap-2 text-red-400">
                <Lock size={16} />
                <span className="text-sm font-medium">This file is password protected</span>
              </div>
              <div className="space-y-2">
                <label className="text-zinc-400 text-xs uppercase tracking-wider">Enter Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter file password"
                    className="bg-zinc-800 border-zinc-700 text-white pr-10"
                    data-testid="input-password"
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-400 text-xs">{passwordError}</p>
                )}
              </div>
              <Button
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="w-full gap-2"
                data-testid="button-unlock"
              >
                {isUnlocking ? (
                  <><Loader2 size={16} className="animate-spin" /> Unlocking...</>
                ) : (
                  <><Lock size={16} /> Unlock File</>
                )}
              </Button>
            </div>
          )}

          {!needsPassword && (
            <>
              {downloadStatus === "downloading" && downloadProgress !== null && (
                <div className="space-y-2" data-testid="download-progress-container">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">Downloading...</span>
                    <span className="text-white font-mono" data-testid="text-download-percentage">{downloadProgress}%</span>
                  </div>
                  <Progress value={downloadProgress} className="h-2" data-testid="progress-download" />
                </div>
              )}

              {downloadStatus === "complete" && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-md" data-testid="download-complete">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 text-sm">Download complete!</span>
                </div>
              )}

              <Button
                onClick={handleDownload}
                disabled={downloadStatus === "downloading"}
                className="w-full gap-2"
                data-testid="button-download"
              >
                {downloadStatus === "downloading" ? (
                  <><Loader2 size={16} className="animate-spin" /> Downloading...</>
                ) : downloadStatus === "complete" ? (
                  <><Download size={16} /> Download Again</>
                ) : (
                  <><Download size={16} /> Download File</>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
