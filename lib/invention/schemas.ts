import { z } from "zod";

export const startBodySchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(10_000),
});

export const sessionIdBodySchema = z.object({
  session_id: z.string().trim().min(1).max(64),
});

export const followupBodySchema = z.object({
  session_id: z.string().trim().min(1).max(64),
  answer: z.string().trim().min(1).max(5_000),
});

export type StartBody = z.infer<typeof startBodySchema>;
export type FollowupBody = z.infer<typeof followupBodySchema>;
export type SessionIdBody = z.infer<typeof sessionIdBodySchema>;
