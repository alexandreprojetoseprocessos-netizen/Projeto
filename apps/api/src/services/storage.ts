import crypto from "node:crypto";
import { supabaseAdmin } from "../lib/supabase";
import { config } from "../config/env";
import { logger } from "../config/logger";

const bucket = config.supabase.storageBucket;
let bucketReady: Promise<void> | null = null;

const ensureBucket = async () => {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const { error } = await supabaseAdmin.storage.getBucket(bucket);
    if (!error) return;

    const status = typeof error.status === "number" ? error.status : Number(error.statusCode);
    if (status !== 404 && error.statusCode !== "404") {
      logger.error({ err: error }, "Failed to fetch storage bucket");
      throw new Error("Falha ao acessar o bucket do storage");
    }

    const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
    if (createError) {
      const message = createError.message?.toLowerCase() ?? "";
      if (!message.includes("already exists")) {
        logger.error({ err: createError }, "Failed to create storage bucket");
        throw new Error("Falha ao criar o bucket do storage");
      }
    }
  })();
  return bucketReady;
};

export const uploadAttachment = async (input: {
  data: Buffer;
  fileName: string;
  contentType: string;
}) => {
  await ensureBucket();
  const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const objectKey = `projects/${crypto.randomUUID()}-${sanitizedName}`.toLowerCase();

  const { error } = await supabaseAdmin.storage.from(bucket).upload(objectKey, input.data, {
    contentType: input.contentType,
    upsert: false
  });

  if (error) {
    logger.error({ err: error }, "Failed to upload attachment to Supabase Storage");
    throw new Error("Falha ao enviar arquivo para o storage");
  }

  return {
    fileKey: objectKey,
    publicUrl: getPublicUrl(objectKey)
  };
};

export const uploadAvatar = async (input: {
  userId: string;
  data: Buffer;
  fileName: string;
  contentType: string;
}) => {
  await ensureBucket();
  const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const objectKey = `avatars/${input.userId}/${crypto.randomUUID()}-${sanitizedName}`.toLowerCase();

  const { error } = await supabaseAdmin.storage.from(bucket).upload(objectKey, input.data, {
    contentType: input.contentType,
    upsert: true
  });

  if (error) {
    logger.error({ err: error }, "Failed to upload avatar to Supabase Storage");
    throw new Error("Falha ao enviar a foto para o storage");
  }

  return {
    fileKey: objectKey,
    publicUrl: getPublicUrl(objectKey)
  };
};

export const getPublicUrl = (fileKey: string) => {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileKey);
  return data?.publicUrl ?? null;
};

export const removeAttachment = async (fileKey: string) => {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([fileKey]);
  if (error) {
    logger.error({ err: error }, "Failed to remove attachment from Supabase Storage");
    throw new Error("Falha ao remover arquivo do storage");
  }
};
