import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Package, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuProduct } from "@/features/modifier/modifier.repo";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type HeroSectionProps = {
  featuredProducts?: MenuProduct[];
  productCount?: number;
};

export function HeroSection({ featuredProducts = [], productCount = 0 }: HeroSectionProps) {
  const stats = [
    { icon: Package, label: "แพ็กเกจพร้อมขาย", value: productCount > 0 ? `${productCount}+` : "หลากหลาย" },
    { icon: CreditCard, label: "ชำระบัตร", value: "Stripe" },
    { icon: Shield, label: "จัดส่งรหัสทันที", value: "Auto Delivery" },
  ];

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-brand-bg px-4 pt-20 text-brand-fg">
      <div className="absolute inset-0 brand-gradient-hero" />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-center"
        >
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest text-brand-fg-muted">
            <Sparkles className="h-4 w-4" />
            บริการแพ็กเกจ Premium และบัญชีดิจิทัล
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            ซื้อแพ็กเกจพรีเมียม
            <br />
            <span className="bg-gradient-to-r from-brand-accent-muted to-brand-accent-muted/90 bg-clip-text text-transparent">
              รับรหัสใช้งานได้ทันที
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-brand-fg-muted sm:text-xl">
            รองรับ Individual, Family, Invite Link และแบบลูกค้าส่งบัญชีมาให้ร้าน พร้อมระบบ Inventory เช็กวันคงเหลือ
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="rounded-full bg-brand-accent px-8 text-base text-white hover:bg-brand-accent-hover" asChild>
              <Link href="/rent">
                เลือกแพ็กเกจตอนนี้
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-brand-border bg-brand-bg-subtle px-8 text-base text-brand-fg hover:bg-white/15 hover:text-brand-fg"
              asChild
            >
              <Link href="/register">สมัครสมาชิก</Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-8 text-base text-brand-fg-muted hover:bg-white/10 hover:text-brand-fg"
              asChild
            >
              <Link href="/#membership">ดูโปรและสิทธิพิเศษ</Link>
            </Button>
          </div>
        </motion.div>

        {/* สถิติสั้น ๆ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-14 flex w-full max-w-2xl flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 text-brand-fg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-bg-subtle">
                <s.icon className="h-5 w-5 text-brand-accent-muted" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-brand-fg-subtle">{s.label}</p>
                <p className="font-semibold text-brand-fg">{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* สินค้าแนะนำ — แถบเล็กใต้ Hero */}
        {featuredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="mt-16 w-full"
          >
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-brand-fg-subtle">
              แพ็กเกจแนะนำ
            </p>
            <div className="flex flex-wrap items-stretch justify-center gap-4">
              {featuredProducts.slice(0, 4).map((product) => {
                const imageSrc = product.imageUrl
                  ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
                  : null;
                return (
                  <Link
                    key={product.id}
                    href="/rent"
                    className="group flex w-[140px] flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-bg-subtle transition hover:border-brand-accent/40 hover:bg-white/10 sm:w-[160px]"
                  >
                    <div className="aspect-square overflow-hidden bg-brand-bg-subtle">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-brand-fg-subtle" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3">
                      <p className="line-clamp-2 text-sm font-medium text-brand-fg">
                        {product.name}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-brand-accent-muted">
                        {formatMoney(product.price)} ฿
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 text-center">
              <Link
                href="#products"
                className="text-sm font-medium text-brand-fg-subtle underline-offset-4 hover:text-brand-accent-muted hover:underline"
              >
                เลื่อนลงดูแพ็กเกจทั้งหมด
              </Link>
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
