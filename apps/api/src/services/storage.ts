import crypto from "node:crypto";
import { supabaseAdmin } from "../lib/supabase";
import { config } from "../config/env";
import { logger } from "../config/logger";

const bucket = config.supabase.storageBucket;

export const uploadAttachment = async (input: {
  data: Buffer;
  fileName: string;
  contentType: string;
}) => {
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

export const getPublicUrl = (fileKey: string) => {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileKey);
  return data?.publicUrl ?? null;
};
