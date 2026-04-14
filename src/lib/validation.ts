import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Prenom requis").max(50, "50 caracteres max"),
  age: z.number().int().min(18, "18 ans minimum").max(99, "99 ans maximum"),
  gender: z.enum(["homme", "femme", "autre"], { message: "Genre requis" }),
  looking_for: z.enum(["hommes", "femmes", "tous"], { message: "Preference requise" }),
  bio: z.string().max(500, "500 caracteres max").optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message vide").max(2000, "2000 caracteres max").trim(),
});

export const reportSchema = z.object({
  reason: z.enum([
    "fake_profile", "harassment", "inappropriate_content",
    "spam", "underage", "scam", "other",
  ], { message: "Raison requise" }),
  details: z.string().max(1000, "1000 caracteres max").optional(),
});

export const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caracteres minimum").max(128, "128 caracteres max"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type AuthInput = z.infer<typeof authSchema>;
