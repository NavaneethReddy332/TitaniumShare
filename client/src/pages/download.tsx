import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download, FileIcon, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileInfo {
  url: string;
  originalName: string;
  size: number;
  sizeFormatted: string;
}

export default function DownloadPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "complete" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { data: fileInfo, isLoading, error, isError } = useQuery<FileInfo>({
    queryKey: ["/api/files/download", shareCode],
    queryFn: async () => {
      const response = await fetch(`/api/files/download/${shareCode}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get file info");
      }
      return response.json();
    },
    enabled: !!shareCode,
    retry: false,
  });

  const handleDownload = async () => {
    if (!fileInfo?.url) return;

    setDownloadStatus("downloading");
    setDownloadProgress(0);

    try {
      const response = await fetch(fileInfo.url, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : fileInfo.size;
      
      const reader = response.body?.getReader();
      
      if (!reader) {
        window.open(fileInfo.url, '_blank');
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
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = fileInfo.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadStatus("complete");
      setDownloadProgress(100);
    } catch (err) {
      window.open(fileInfo.url, '_blank');
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

          {downloadStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-md" data-testid="download-error">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-400 text-sm">{errorMessage}</span>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={downloadStatus === "downloading"}
            className="w-full gap-2"
            data-testid="button-download"
          >
            {downloadStatus === "downloading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Downloading...
              </>
            ) : downloadStatus === "complete" ? (
              <>
                <Download size={16} />
                Download Again
              </>
            ) : (
              <>
                <Download size={16} />
                Download File
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
