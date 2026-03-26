import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const SOCIAL_PLATFORMS = [
  { key: "facebook",  label: "Facebook",   color: "#1877F2", bg: "bg-[#1877F2]" },
  { key: "instagram", label: "Instagram",  color: "#E1306C", bg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045]" },
  { key: "line",      label: "LINE",       color: "#00B900", bg: "bg-[#00B900]" },
  { key: "youtube",   label: "YouTube",    color: "#FF0000", bg: "bg-[#FF0000]" },
  { key: "tiktok",    label: "TikTok",     color: "#000000", bg: "bg-black" },
  { key: "twitter",   label: "X / Twitter",color: "#000000", bg: "bg-black" },
  { key: "discord",   label: "Discord",    color: "#5865F2", bg: "bg-[#5865F2]" },
  { key: "telegram",  label: "Telegram",   color: "#0088CC", bg: "bg-[#0088CC]" },
  { key: "whatsapp",  label: "WhatsApp",   color: "#25D366", bg: "bg-[#25D366]" },
  { key: "website",   label: "Website",    color: "#6366F1", bg: "bg-[#6366F1]" },
  { key: "email",     label: "Email",      color: "#64748B", bg: "bg-[#64748B]" },
  { key: "phone",     label: "โทรศัพท์",   color: "#059669", bg: "bg-[#059669]" },
  { key: "shopee",    label: "Shopee",     color: "#EE4D2D", bg: "bg-[#EE4D2D]" },
  { key: "lazada",    label: "Lazada",     color: "#0F146D", bg: "bg-[#0F146D]" },
  { key: "other",     label: "อื่นๆ",      color: "#6B7280", bg: "bg-[#6B7280]" },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export const contactSocials = sqliteTable("contact_socials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** ชื่อที่แสดง */
  label: text("label").notNull(),
  /** platform key เช่น "facebook", "line" */
  platform: text("platform").notNull(),
  /** URL หรือ เบอร์/อีเมล */
  url: text("url").notNull(),
  /** ลำดับการแสดง */
  sortOrder: integer("sort_order").notNull().default(0),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ContactSocial = typeof contactSocials.$inferSelect;
