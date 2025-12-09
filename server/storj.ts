import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const STORJ_ENDPOINT = "https://gateway.storjshare.io";

if (!process.env.STORJ_ACCESS_KEY_ID || !process.env.STORJ_SECRET_ACCESS_KEY || !process.env.STORJ_BUCKET_NAME) {
  console.warn("Storj credentials not configured. File storage will not work.");
}

export const s3Client = new S3Client({
  endpoint: STORJ_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.STORJ_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
  maxAttempts: 5,
  requestHandler: {
    requestTimeout: 300000,
    httpsAgent: {
      maxSockets: 50,
      keepAlive: true,
    },
  } as any,
});

export const BUCKET_NAME = process.env.STORJ_BUCKET_NAME || "";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    queueSize: 10,
    partSize: 1024 * 1024 * 10,
    leavePartsOnError: false,
  });

  if (onProgress) {
    upload.on("httpUploadProgress", (progress) => {
      const loaded = progress.loaded || 0;
      const total = progress.total || 0;
      onProgress({
        loaded,
        total,
        percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
      });
    });
  }

  await upload.done();
  return key;
}

export async function uploadFileSimple(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
  // Create a separate client for presigned URLs without checksum requirements
  const presignClient = new S3Client({
    endpoint: STORJ_ENDPOINT,
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.STORJ_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.STORJ_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: true,
  });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(presignClient, command, { 
    expiresIn,
    signableHeaders: new Set(['host', 'content-type']),
  });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function getFileMetadata(key: string): Promise<FileMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
    };
  } catch (error) {
    return null;
  }
}

export async function listFiles(prefix?: string): Promise<FileMetadata[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  
  return (response.Contents || []).map((obj) => ({
    key: obj.Key || "",
    size: obj.Size || 0,
    lastModified: obj.LastModified || new Date(),
  }));
}

export function generateFileKey(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `uploads/${userId}/${timestamp}-${sanitizedName}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
