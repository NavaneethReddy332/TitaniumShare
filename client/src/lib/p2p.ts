export type P2PRole = "host" | "peer";
export type P2PStatus = "idle" | "connecting" | "connected" | "transferring" | "completed" | "error" | "using-relay";

export interface P2PTransferProgress {
  fileName: string;
  fileSize: number;
  transferred: number;
  progress: number;
  speed: number;
  isRelay: boolean;
}

export interface P2PCallbacks {
  onStatusChange?: (status: P2PStatus) => void;
  onProgress?: (progress: P2PTransferProgress) => void;
  onFileReceived?: (file: Blob, fileName: string) => void;
  onError?: (error: string) => void;
  onPeerConnected?: () => void;
  onPeerLeft?: () => void;
}

// Default STUN servers (free, public)
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// Metered TURN servers for relay fallback (requires API key)
function getIceServers(): RTCIceServer[] {
  const servers = [...DEFAULT_ICE_SERVERS];
  
  // Add Metered TURN servers if credentials are available
  const turnUrl = import.meta.env.VITE_METERED_TURN_URL;
  const turnUsername = import.meta.env.VITE_METERED_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_METERED_TURN_CREDENTIAL;
  
  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }
  
  return servers;
}

export class P2PTransfer {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private role: P2PRole;
  private roomCode: string;
  private callbacks: P2PCallbacks;
  private file: File | null = null;
  private receivedChunks: ArrayBuffer[] = [];
  private receivedSize = 0;
  private fileName = "";
  private fileSize = 0;
  private transferStartTime = 0;
  private isUsingRelay = false;
  private hostId: string;

  constructor(role: P2PRole, roomCode: string, callbacks: P2PCallbacks, hostId?: string) {
    this.role = role;
    this.roomCode = roomCode;
    this.callbacks = callbacks;
    this.hostId = hostId || crypto.randomUUID();
  }

  async connect(file?: File): Promise<void> {
    if (file) {
      this.file = file;
      this.fileName = file.name;
      this.fileSize = file.size;
    }

    this.callbacks.onStatusChange?.("connecting");
    
    // Connect to signaling server
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/signaling`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      // Join room
      const joinMessage: any = {
        type: "join",
        roomCode: this.roomCode,
      };

      if (this.role === "host") {
        joinMessage.hostId = this.hostId;
        joinMessage.payload = {
          fileName: this.fileName,
          fileSize: this.fileSize,
        };
      }

      this.ws?.send(JSON.stringify(joinMessage));
    };

    this.ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      } catch (error) {
        console.error("Failed to handle message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.callbacks.onError?.("Connection failed");
      this.callbacks.onStatusChange?.("error");
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
    };
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    switch (message.type) {
      case "ready":
        if (this.role === "peer") {
          // Store file info from host
          if (message.payload.fileName) {
            this.fileName = message.payload.fileName;
            this.fileSize = message.payload.fileSize;
          }
          // Peer initiates WebRTC connection
          await this.initPeerConnection();
          await this.createOffer();
        }
        break;

      case "peer-joined":
        this.callbacks.onPeerConnected?.();
        break;

      case "peer-left":
        this.callbacks.onPeerLeft?.();
        this.callbacks.onStatusChange?.("error");
        this.callbacks.onError?.("Peer disconnected");
        break;

      case "offer":
        await this.initPeerConnection();
        await this.pc?.setRemoteDescription(new RTCSessionDescription(message.payload));
        const answer = await this.pc?.createAnswer();
        await this.pc?.setLocalDescription(answer!);
        this.ws?.send(JSON.stringify({ type: "answer", payload: answer }));
        break;

      case "answer":
        await this.pc?.setRemoteDescription(new RTCSessionDescription(message.payload));
        break;

      case "ice-candidate":
        if (message.payload) {
          await this.pc?.addIceCandidate(new RTCIceCandidate(message.payload));
        }
        break;

      case "file-info":
        this.fileName = message.payload.fileName;
        this.fileSize = message.payload.fileSize;
        break;

      case "error":
        this.callbacks.onError?.(message.payload.message);
        this.callbacks.onStatusChange?.("error");
        break;
    }
  }

  private async initPeerConnection(): Promise<void> {
    const config: RTCConfiguration = {
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
    };

    this.pc = new RTCPeerConnection(config);

    // Monitor ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.pc?.iceConnectionState);
      
      if (this.pc?.iceConnectionState === "connected") {
        this.callbacks.onStatusChange?.("connected");
      } else if (this.pc?.iceConnectionState === "failed") {
        // Connection failed, might be using relay
        this.callbacks.onError?.("Direct connection failed, trying relay...");
      }
    };

    // Check if using relay
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Check if this is a relay candidate
        if (event.candidate.candidate.includes("relay")) {
          this.isUsingRelay = true;
          this.callbacks.onStatusChange?.("using-relay");
        }
        
        this.ws?.send(JSON.stringify({
          type: "ice-candidate",
          payload: event.candidate,
        }));
      }
    };

    // Handle data channel
    if (this.role === "host") {
      // Host receives data channel created by peer
      this.pc.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
  }

  private async createOffer(): Promise<void> {
    // Peer creates the data channel
    this.dataChannel = this.pc!.createDataChannel("fileTransfer", {
      ordered: true,
    });
    this.setupDataChannel();

    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);
    
    this.ws?.send(JSON.stringify({ type: "offer", payload: offer }));
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.binaryType = "arraybuffer";

    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
      this.callbacks.onStatusChange?.("connected");
      
      if (this.role === "host" && this.file) {
        // Host starts sending file
        this.sendFile();
      }
    };

    this.dataChannel.onclose = () => {
      console.log("Data channel closed");
    };

    this.dataChannel.onerror = (error) => {
      console.error("Data channel error:", error);
      this.callbacks.onError?.("Transfer failed");
      this.callbacks.onStatusChange?.("error");
    };

    this.dataChannel.onmessage = (event) => {
      if (typeof event.data === "string") {
        // Control message
        const msg = JSON.parse(event.data);
        if (msg.type === "file-start") {
          this.fileName = msg.fileName;
          this.fileSize = msg.fileSize;
          this.receivedChunks = [];
          this.receivedSize = 0;
          this.transferStartTime = Date.now();
          this.callbacks.onStatusChange?.("transferring");
        } else if (msg.type === "file-end") {
          // Reconstruct file
          const blob = new Blob(this.receivedChunks);
          this.callbacks.onFileReceived?.(blob, this.fileName);
          this.callbacks.onStatusChange?.("completed");
        }
      } else {
        // File chunk
        this.receivedChunks.push(event.data);
        this.receivedSize += event.data.byteLength;
        
        const elapsed = (Date.now() - this.transferStartTime) / 1000;
        const speed = elapsed > 0 ? this.receivedSize / elapsed : 0;
        
        this.callbacks.onProgress?.({
          fileName: this.fileName,
          fileSize: this.fileSize,
          transferred: this.receivedSize,
          progress: (this.receivedSize / this.fileSize) * 100,
          speed,
          isRelay: this.isUsingRelay,
        });
      }
    };
  }

  private async sendFile(): Promise<void> {
    if (!this.file || !this.dataChannel) return;

    this.callbacks.onStatusChange?.("transferring");
    this.transferStartTime = Date.now();

    // Send file metadata
    this.dataChannel.send(JSON.stringify({
      type: "file-start",
      fileName: this.file.name,
      fileSize: this.file.size,
    }));

    const CHUNK_SIZE = 16384; // 16KB chunks
    let offset = 0;

    const reader = new FileReader();
    
    const readSlice = (o: number) => {
      const slice = this.file!.slice(o, o + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (!e.target?.result || !this.dataChannel) return;
      
      const chunk = e.target.result as ArrayBuffer;
      
      // Wait for buffer to clear if needed
      const send = () => {
        if (this.dataChannel!.bufferedAmount > CHUNK_SIZE * 10) {
          setTimeout(send, 50);
          return;
        }
        
        this.dataChannel!.send(chunk);
        offset += chunk.byteLength;

        const elapsed = (Date.now() - this.transferStartTime) / 1000;
        const speed = elapsed > 0 ? offset / elapsed : 0;

        this.callbacks.onProgress?.({
          fileName: this.file!.name,
          fileSize: this.file!.size,
          transferred: offset,
          progress: (offset / this.file!.size) * 100,
          speed,
          isRelay: this.isUsingRelay,
        });

        if (offset < this.file!.size) {
          readSlice(offset);
        } else {
          // Send end marker
          this.dataChannel!.send(JSON.stringify({ type: "file-end" }));
          this.callbacks.onStatusChange?.("completed");
        }
      };
      
      send();
    };

    reader.onerror = () => {
      this.callbacks.onError?.("Failed to read file");
      this.callbacks.onStatusChange?.("error");
    };

    readSlice(0);
  }

  disconnect(): void {
    this.dataChannel?.close();
    this.pc?.close();
    this.ws?.close();
    this.dataChannel = null;
    this.pc = null;
    this.ws = null;
  }

  getRoomCode(): string {
    return this.roomCode;
  }

  getFileName(): string {
    return this.fileName;
  }

  getFileSize(): number {
    return this.fileSize;
  }

  isRelayConnection(): boolean {
    return this.isUsingRelay;
  }
}

// Generate unique room code
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Format speed to human readable
export function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + "/s";
}
