import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Upload, 
  Download, 
  Wifi, 
  WifiOff,
  Copy, 
  Check, 
  ArrowLeft,
  Share2,
  Zap,
  Server,
  FileIcon,
  Loader2,
  X,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { 
  P2PTransfer, 
  generateRoomCode, 
  formatBytes, 
  formatSpeed,
  type P2PStatus,
  type P2PTransferProgress
} from "@/lib/p2p";

export default function P2PPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  
  // Send state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [sendStatus, setSendStatus] = useState<P2PStatus>("idle");
  const [sendProgress, setSendProgress] = useState<P2PTransferProgress | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const sendTransferRef = useRef<P2PTransfer | null>(null);

  // Receive state
  const [receiveRoomCode, setReceiveRoomCode] = useState<string>("");
  const [receiveStatus, setReceiveStatus] = useState<P2PStatus>("idle");
  const [receiveProgress, setReceiveProgress] = useState<P2PTransferProgress | null>(null);
  const [receivedFile, setReceivedFile] = useState<{ blob: Blob; name: string } | null>(null);
  const receiveTransferRef = useRef<P2PTransfer | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false
  });

  const startSending = async () => {
    if (!selectedFile) return;

    const code = generateRoomCode();
    setRoomCode(code);
    setSendStatus("connecting");
    setPeerConnected(false);

    const transfer = new P2PTransfer("host", code, {
      onStatusChange: (status) => {
        setSendStatus(status);
        if (status === "completed") {
          toast({ title: "File sent successfully!" });
        }
      },
      onProgress: (progress) => {
        setSendProgress(progress);
      },
      onPeerConnected: () => {
        setPeerConnected(true);
        toast({ title: "Peer connected! Starting transfer..." });
      },
      onPeerLeft: () => {
        setPeerConnected(false);
        toast({ title: "Peer disconnected", variant: "destructive" });
      },
      onError: (error) => {
        toast({ title: error, variant: "destructive" });
      },
    });

    sendTransferRef.current = transfer;
    await transfer.connect(selectedFile);
  };

  const cancelSend = () => {
    sendTransferRef.current?.disconnect();
    sendTransferRef.current = null;
    setSendStatus("idle");
    setSendProgress(null);
    setRoomCode("");
    setPeerConnected(false);
  };

  const startReceiving = async () => {
    if (!receiveRoomCode.trim()) {
      toast({ title: "Please enter a room code", variant: "destructive" });
      return;
    }

    setReceiveStatus("connecting");

    const transfer = new P2PTransfer("peer", receiveRoomCode.toUpperCase().trim(), {
      onStatusChange: (status) => {
        setReceiveStatus(status);
      },
      onProgress: (progress) => {
        setReceiveProgress(progress);
      },
      onFileReceived: (blob, fileName) => {
        setReceivedFile({ blob, name: fileName });
        toast({ title: "File received successfully!" });
      },
      onPeerLeft: () => {
        toast({ title: "Host disconnected", variant: "destructive" });
        setReceiveStatus("error");
      },
      onError: (error) => {
        toast({ title: error, variant: "destructive" });
      },
    });

    receiveTransferRef.current = transfer;
    await transfer.connect();
  };

  const cancelReceive = () => {
    receiveTransferRef.current?.disconnect();
    receiveTransferRef.current = null;
    setReceiveStatus("idle");
    setReceiveProgress(null);
    setReceivedFile(null);
  };

  const downloadReceivedFile = () => {
    if (!receivedFile) return;
    
    const url = URL.createObjectURL(receivedFile.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = receivedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/p2p?join=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  // Handle URL params for joining
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      setActiveTab("receive");
      setReceiveRoomCode(joinCode.toUpperCase());
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sendTransferRef.current?.disconnect();
      receiveTransferRef.current?.disconnect();
    };
  }, []);

  const getShareUrl = () => `${window.location.origin}/p2p?join=${roomCode}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <Share2 size={24} className="text-primary" />
            <h1 className="text-xl font-bold">P2P Transfer</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Zap size={12} className="mr-1" />
            Direct Peer-to-Peer
          </Badge>
          <h2 className="text-2xl font-bold mb-2">Lightning-Fast File Transfer</h2>
          <p className="text-muted-foreground">
            Send files directly to another device. No upload limits, no waiting.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "send" | "receive")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="send" data-testid="tab-send" className="gap-2">
              <Upload size={16} />
              Send File
            </TabsTrigger>
            <TabsTrigger value="receive" data-testid="tab-receive" className="gap-2">
              <Download size={16} />
              Receive File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card>
              <CardContent className="p-6">
                {sendStatus === "idle" && (
                  <div className="space-y-6">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                        isDragActive 
                          ? "border-primary bg-primary/5" 
                          : selectedFile 
                            ? "border-green-500 bg-green-500/5" 
                            : "border-border hover:border-primary/50"
                      }`}
                      data-testid="dropzone-send"
                    >
                      <input {...getInputProps()} />
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileIcon size={24} className="text-green-500" />
                          <div className="text-left">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatBytes(selectedFile.size)}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            data-testid="button-remove-file"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {isDragActive 
                              ? "Drop the file here..." 
                              : "Drag & drop a file here, or click to select"}
                          </p>
                        </>
                      )}
                    </div>

                    <Button 
                      className="w-full"
                      disabled={!selectedFile}
                      onClick={startSending}
                      data-testid="button-start-send"
                    >
                      <Share2 size={16} className="mr-2" />
                      Start P2P Transfer
                    </Button>
                  </div>
                )}

                {(sendStatus === "connecting" || sendStatus === "connected") && !peerConnected && (
                  <div className="space-y-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Waiting for peer to connect...</span>
                    </div>

                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">Share this code:</p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-3xl font-mono font-bold tracking-widest">
                          {roomCode}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={copyCode}
                          data-testid="button-copy-code"
                        >
                          {copiedCode ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </Button>
                      </div>

                      <div className="flex justify-center mb-4">
                        <div className="bg-white p-3 rounded-lg">
                          <QRCodeSVG value={getShareUrl()} size={150} />
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyLink}
                        className="gap-2"
                        data-testid="button-copy-link"
                      >
                        {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
                        Copy Link
                      </Button>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={cancelSend}
                      data-testid="button-cancel-send"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {(sendStatus === "transferring" || (sendStatus === "connected" && peerConnected)) && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileIcon size={16} />
                        <span className="font-medium">{selectedFile?.name}</span>
                      </div>
                      <Badge variant={sendProgress?.isRelay ? "secondary" : "default"}>
                        {sendProgress?.isRelay ? (
                          <><Server size={12} className="mr-1" /> Relay</>
                        ) : (
                          <><Wifi size={12} className="mr-1" /> Direct P2P</>
                        )}
                      </Badge>
                    </div>

                    <Progress value={sendProgress?.progress || 0} className="h-3" />

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {formatBytes(sendProgress?.transferred || 0)} / {formatBytes(sendProgress?.fileSize || 0)}
                      </span>
                      <span>{formatSpeed(sendProgress?.speed || 0)}</span>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      {Math.round(sendProgress?.progress || 0)}% complete
                    </p>
                  </div>
                )}

                {sendStatus === "completed" && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                      <Check size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold">Transfer Complete!</h3>
                    <p className="text-muted-foreground">
                      Your file has been sent successfully.
                    </p>
                    <Button onClick={() => {
                      setSendStatus("idle");
                      setSelectedFile(null);
                      setSendProgress(null);
                      setRoomCode("");
                    }} data-testid="button-send-another">
                      Send Another File
                    </Button>
                  </div>
                )}

                {sendStatus === "error" && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                      <WifiOff size={32} className="text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold">Connection Failed</h3>
                    <p className="text-muted-foreground">
                      Unable to establish P2P connection.
                    </p>
                    <Button onClick={cancelSend} data-testid="button-retry-send">
                      Try Again
                    </Button>
                  </div>
                )}

                {sendStatus === "using-relay" && (
                  <div className="text-center space-y-4">
                    <Badge variant="secondary" className="mb-2">
                      <Server size={12} className="mr-1" />
                      Using Relay Server
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Direct connection not possible. Using secure relay for transfer.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receive">
            <Card>
              <CardContent className="p-6">
                {receiveStatus === "idle" && !receivedFile && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Download size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Enter the 6-digit code from the sender
                      </p>
                    </div>

                    <Input
                      placeholder="Enter room code (e.g. ABC123)"
                      value={receiveRoomCode}
                      onChange={(e) => setReceiveRoomCode(e.target.value.toUpperCase())}
                      className="text-center text-2xl font-mono tracking-widest h-14"
                      maxLength={6}
                      data-testid="input-room-code"
                    />

                    <Button 
                      className="w-full"
                      disabled={receiveRoomCode.length < 6}
                      onClick={startReceiving}
                      data-testid="button-start-receive"
                    >
                      <Download size={16} className="mr-2" />
                      Connect & Receive
                    </Button>
                  </div>
                )}

                {receiveStatus === "connecting" && (
                  <div className="text-center space-y-4">
                    <Loader2 size={48} className="mx-auto animate-spin text-primary" />
                    <p className="text-muted-foreground">Connecting to sender...</p>
                    <Button variant="outline" onClick={cancelReceive} data-testid="button-cancel-receive">
                      Cancel
                    </Button>
                  </div>
                )}

                {receiveStatus === "connected" && !receiveProgress && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <Wifi size={20} />
                      <span>Connected to sender</span>
                    </div>
                    <p className="text-muted-foreground">Waiting for file transfer to start...</p>
                  </div>
                )}

                {receiveStatus === "transferring" && receiveProgress && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileIcon size={16} />
                        <span className="font-medium">{receiveProgress.fileName}</span>
                      </div>
                      <Badge variant={receiveProgress.isRelay ? "secondary" : "default"}>
                        {receiveProgress.isRelay ? (
                          <><Server size={12} className="mr-1" /> Relay</>
                        ) : (
                          <><Wifi size={12} className="mr-1" /> Direct P2P</>
                        )}
                      </Badge>
                    </div>

                    <Progress value={receiveProgress.progress} className="h-3" />

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {formatBytes(receiveProgress.transferred)} / {formatBytes(receiveProgress.fileSize)}
                      </span>
                      <span>{formatSpeed(receiveProgress.speed)}</span>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      {Math.round(receiveProgress.progress)}% complete
                    </p>
                  </div>
                )}

                {(receiveStatus === "completed" || receivedFile) && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                      <Check size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold">File Received!</h3>
                    {receivedFile && (
                      <>
                        <p className="text-muted-foreground">{receivedFile.name}</p>
                        <Button onClick={downloadReceivedFile} data-testid="button-download-received">
                          <Download size={16} className="mr-2" />
                          Download File
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setReceiveStatus("idle");
                        setReceiveProgress(null);
                        setReceivedFile(null);
                        setReceiveRoomCode("");
                      }}
                      data-testid="button-receive-another"
                    >
                      Receive Another File
                    </Button>
                  </div>
                )}

                {receiveStatus === "error" && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                      <WifiOff size={32} className="text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold">Connection Failed</h3>
                    <p className="text-muted-foreground">
                      Unable to connect. The room may have expired or the sender disconnected.
                    </p>
                    <Button onClick={cancelReceive} data-testid="button-retry-receive">
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">How it works:</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Direct P2P - Fastest, no server</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Relay - Uses server when direct fails</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
