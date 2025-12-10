import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";

interface SignalingMessage {
  type: "join" | "offer" | "answer" | "ice-candidate" | "file-info" | "ready" | "error" | "peer-joined" | "peer-left";
  roomCode?: string;
  hostId?: string;
  payload?: any;
}

interface RoomState {
  host: WebSocket | null;
  peer: WebSocket | null;
  hostId: string;
  fileName?: string;
  fileSize?: number;
}

const rooms = new Map<string, RoomState>();

export function setupSignaling(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws/signaling" });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoom: string | null = null;
    let isHost = false;

    ws.on("message", async (data: Buffer) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());

        switch (message.type) {
          case "join": {
            const { roomCode, hostId, payload } = message;
            if (!roomCode) {
              ws.send(JSON.stringify({ type: "error", payload: { message: "Room code required" } }));
              return;
            }

            currentRoom = roomCode;

            if (hostId) {
              // Creating a new room as host
              isHost = true;
              const expiresAt = new Date();
              expiresAt.setHours(expiresAt.getHours() + 1);

              try {
                await storage.createP2PRoom({
                  roomCode,
                  hostId,
                  fileName: payload?.fileName,
                  fileSize: payload?.fileSize,
                  status: "waiting",
                  expiresAt,
                });
              } catch (e) {
                // Room might already exist, that's ok
              }

              rooms.set(roomCode, {
                host: ws,
                peer: null,
                hostId,
                fileName: payload?.fileName,
                fileSize: payload?.fileSize,
              });

              ws.send(JSON.stringify({ 
                type: "ready", 
                payload: { 
                  roomCode,
                  role: "host",
                  message: "Room created, waiting for peer..." 
                } 
              }));
            } else {
              // Joining as peer
              isHost = false;
              const room = rooms.get(roomCode);
              
              if (!room || !room.host) {
                ws.send(JSON.stringify({ 
                  type: "error", 
                  payload: { message: "Room not found or host disconnected" } 
                }));
                return;
              }

              room.peer = ws;
              await storage.updateP2PRoomStatus(roomCode, "connected");

              // Notify host that peer has joined
              room.host.send(JSON.stringify({ 
                type: "peer-joined",
                payload: { message: "Peer connected" }
              }));

              // Send file info to peer
              ws.send(JSON.stringify({ 
                type: "ready", 
                payload: { 
                  roomCode,
                  role: "peer",
                  fileName: room.fileName,
                  fileSize: room.fileSize,
                  message: "Connected to host" 
                } 
              }));
            }
            break;
          }

          case "offer":
          case "answer":
          case "ice-candidate": {
            if (!currentRoom) return;
            const room = rooms.get(currentRoom);
            if (!room) return;

            // Forward to the other peer
            const target = isHost ? room.peer : room.host;
            if (target && target.readyState === WebSocket.OPEN) {
              target.send(JSON.stringify(message));
            }
            break;
          }

          case "file-info": {
            if (!currentRoom || !isHost) return;
            const room = rooms.get(currentRoom);
            if (!room) return;

            room.fileName = message.payload?.fileName;
            room.fileSize = message.payload?.fileSize;

            // Forward to peer
            if (room.peer && room.peer.readyState === WebSocket.OPEN) {
              room.peer.send(JSON.stringify(message));
            }
            break;
          }
        }
      } catch (error) {
        console.error("Signaling error:", error);
        // Only send error if websocket is still open
        if (ws.readyState === WebSocket.OPEN) {
          const errorMessage = error instanceof SyntaxError 
            ? "Invalid JSON format" 
            : error instanceof Error 
              ? error.message 
              : "An error occurred";
          ws.send(JSON.stringify({ type: "error", payload: { message: errorMessage } }));
        }
      }
    });

    ws.on("close", async () => {
      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          // Notify the other peer
          const other = isHost ? room.peer : room.host;
          if (other && other.readyState === WebSocket.OPEN) {
            other.send(JSON.stringify({ 
              type: "peer-left",
              payload: { message: isHost ? "Host disconnected" : "Peer disconnected" }
            }));
          }

          if (isHost) {
            // Host left, clean up room
            rooms.delete(currentRoom);
            try {
              await storage.deleteP2PRoom(currentRoom);
            } catch (e) {
              // Ignore
            }
          } else {
            // Peer left, update room state
            room.peer = null;
            try {
              await storage.updateP2PRoomStatus(currentRoom, "waiting");
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  console.log("WebSocket signaling server initialized on /ws/signaling");
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
