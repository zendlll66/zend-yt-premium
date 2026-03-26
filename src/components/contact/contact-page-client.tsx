"use client";

import { motion } from "framer-motion";
import { SocialIcon } from "./social-icon";
import { SOCIAL_PLATFORMS } from "@/db/schema/contact-social.schema";
import type { ContactSocialRow } from "@/features/contact/contact-social.repo";
import { ExternalLink } from "lucide-react";

interface Props {
  socials: ContactSocialRow[];
}

function getPlatformMeta(key: string) {
  return SOCIAL_PLATFORMS.find((p) => p.key === key) ?? {
    key: "other",
    label: "อื่นๆ",
    color: "#6B7280",
    bg: "bg-[#6B7280]",
  };
}

function buildHref(url: string, platform: string) {
  if (url.startsWith("http") || url.startsWith("tel:") || url.startsWith("mailto:")) return url;
  if (platform === "email") return `mailto:${url}`;
  if (platform === "phone") return `tel:${url}`;
  return url;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export function ContactPageClient({ socials }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-bg">
      {/* Animated background blobs */}
      <motion.div
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand-accent/10 blur-[120px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/8 blur-[100px]"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-brand-accent/6 blur-[90px]"
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-6">
        {/* Hero */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface/60 px-4 py-1.5 text-sm text-brand-fg/60 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            พร้อมให้บริการ
          </motion.div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-brand-fg sm:text-5xl">
            ติดต่อ{" "}
            <span className="bg-gradient-to-r from-brand-accent to-purple-400 bg-clip-text text-transparent">
              เรา
            </span>
          </h1>
          <p className="mx-auto max-w-md text-base text-brand-fg/60 sm:text-lg">
            มีคำถามหรือต้องการความช่วยเหลือ? ติดต่อเราได้ผ่านช่องทางด้านล่าง
          </p>
        </motion.div>

        {/* Social cards */}
        {socials.length === 0 ? (
          <motion.div
            className="rounded-2xl border border-brand-border bg-brand-surface/40 p-12 text-center text-brand-fg/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            ยังไม่มีช่องทางติดต่อ
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {socials.map((social) => {
              const meta = getPlatformMeta(social.platform);
              const href = buildHref(social.url, social.platform);
              return (
                <motion.a
                  key={social.id}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  variants={cardVariants}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface/60 p-5 backdrop-blur-sm transition-colors hover:border-brand-accent/30 hover:bg-brand-surface"
                >
                  {/* Glow on hover */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at 30% 50%, ${meta.color}15 0%, transparent 70%)` }}
                  />

                  {/* Icon */}
                  <div
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg`}
                    style={{ backgroundColor: meta.color }}
                  >
                    <SocialIcon platform={social.platform} className="h-6 w-6" />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-brand-fg/40">
                      {meta.label}
                    </p>
                    <p className="truncate text-sm font-semibold text-brand-fg">{social.label}</p>
                    <p className="truncate text-xs text-brand-fg/50">{social.url}</p>
                  </div>

                  {/* External arrow */}
                  <ExternalLink className="h-4 w-4 shrink-0 text-brand-fg/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-fg/60" />
                </motion.a>
              );
            })}
          </motion.div>
        )}

        {/* Bottom decoration */}
        <motion.div
          className="mt-20 text-center text-sm text-brand-fg/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          เราจะตอบกลับโดยเร็วที่สุด ✨
        </motion.div>
      </div>
    </div>
  );
}
