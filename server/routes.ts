import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import { z } from "zod";
import { uploadFile, getDownloadUrl, getUploadUrl, deleteFile, generateFileKey, formatFileSize } from "./storj";

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
  'application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
  'application/x-7z-compressed', 'application/gzip', 'application/x-tar',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'text/markdown',
  'application/json', 'application/xml', 'application/javascript',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
  'font/ttf', 'font/woff', 'font/woff2', 'font/otf',
  'application/octet-stream',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        username: data.username || null,
        provider: "local",
        providerId: null,
        profileImageUrl: null,
      });

      req.login(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
        },
        (err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed after signup" });
          }
          return res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            profileImageUrl: user.profileImageUrl,
          });
        }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/api/auth/google/popup-error" }),
      (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>Authentication Successful</title></head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, window.location.origin);
                  window.close();
                } else {
                  window.location.href = "/";
                }
              </script>
              <p>Authentication successful. You can close this window.</p>
            </body>
          </html>
        `);
      }
    );

    app.get("/api/auth/google/popup-error", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Failed</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", message: "Google authentication failed" }, window.location.origin);
                window.close();
              } else {
                window.location.href = "/?error=google_auth_failed";
              }
            </script>
            <p>Authentication failed. You can close this window.</p>
          </body>
        </html>
      `);
    });
  }

  // Get presigned upload URL for direct browser upload to Storj
  app.post("/api/files/presign", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const { fileName, contentType, size } = req.body;

      if (!fileName || !size) {
        return res.status(400).json({ message: "fileName and size are required" });
      }

      const storageKey = generateFileKey(user.id, fileName);
      const shareCode = generateShareCode();
      const uploadUrl = await getUploadUrl(storageKey, contentType || 'application/octet-stream', 3600);

      res.json({
        uploadUrl,
        storageKey,
        shareCode,
      });
    } catch (error) {
      console.error("Presign error:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Confirm direct upload completed and save file metadata
  app.post("/api/files/confirm", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const { storageKey, shareCode, originalName, size, contentType } = req.body;

      if (!storageKey || !shareCode || !originalName || !size) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const file = await storage.createFile({
        userId: user.id,
        originalName,
        storageKey,
        size,
        contentType: contentType || 'application/octet-stream',
        shareCode,
        expiresAt: null,
      });

      res.json({
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        shareCode: file.shareCode,
        createdAt: file.createdAt,
      });
    } catch (error) {
      console.error("Confirm upload error:", error);
      res.status(500).json({ message: "Failed to confirm upload" });
    }
  });

  // Legacy file upload endpoint (fallback)
  app.post("/api/files/upload", isAuthenticated, (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Upload filter error:", err.message);
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const user = req.user as { id: string };
      const originalName = req.file.originalname;
      const contentType = req.file.mimetype;
      const size = req.file.size;

      const storageKey = generateFileKey(user.id, originalName);
      const shareCode = generateShareCode();

      await uploadFile(storageKey, req.file.buffer, contentType);

      const file = await storage.createFile({
        userId: user.id,
        originalName,
        storageKey,
        size,
        contentType,
        shareCode,
        expiresAt: null,
      });

      res.json({
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        shareCode: file.shareCode,
        createdAt: file.createdAt,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Get user's files
  app.get("/api/files", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const files = await storage.getFilesByUserId(user.id);
      
      res.json(files.map(f => ({
        id: f.id,
        originalName: f.originalName,
        size: f.size,
        sizeFormatted: formatFileSize(f.size),
        shareCode: f.shareCode,
        downloadCount: f.downloadCount,
        createdAt: f.createdAt,
      })));
    } catch (error) {
      console.error("List files error:", error);
      res.status(500).json({ message: "Failed to list files" });
    }
  });

  // Get download URL by share code
  app.get("/api/files/download/:shareCode", async (req, res) => {
    try {
      const { shareCode } = req.params;
      const file = await storage.getFileByShareCode(shareCode);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.expiresAt && new Date() > file.expiresAt) {
        return res.status(410).json({ message: "File has expired" });
      }

      const downloadUrl = await getDownloadUrl(file.storageKey, 3600);
      await storage.incrementDownloadCount(file.id);

      res.json({
        url: downloadUrl,
        originalName: file.originalName,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  // Delete file
  app.delete("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { id: string };
      const { id } = req.params;

      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await deleteFile(file.storageKey);
      await storage.deleteFile(id);

      res.json({ message: "File deleted" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  return httpServer;
}
