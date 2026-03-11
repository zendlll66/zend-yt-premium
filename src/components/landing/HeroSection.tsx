import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Package, CreditCard, Truck } from "lucide-react";
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
    { icon: Package, label: "รายการให้เช่า", value: productCount > 0 ? `${productCount}+` : "หลากหลาย" },
    { icon: CreditCard, label: "ชำระบัตร", value: "Stripe" },
    { icon: Truck, label: "จัดส่งถึงที่", value: "รับที่ร้าน/ส่ง" },
  ];

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4 pt-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,80,200,0.25),transparent)]" />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-center"
        >
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest text-white/70">
            <Sparkles className="h-4 w-4" />
            ระบบเช่าอุปกรณ์ระดับพรีเมียม
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            เช่าทุกอย่าง
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
              ที่คุณต้องการ
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-white/70 sm:text-xl">
            กล้อง รถ และอุปกรณ์อื่นๆ — จองออนไลน์ ชำระด้วยบัตร รับของถึงที่
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="rounded-full bg-violet-500 px-8 text-base hover:bg-violet-600" asChild>
              <Link href="/rent">
                เริ่มเช่าตอนนี้
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-white/5 px-8 text-base text-white hover:bg-white/15 hover:text-white"
              asChild
            >
              <Link href="/register">สมัครสมาชิก</Link>
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
            <div key={s.label} className="flex items-center gap-3 text-white/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <s.icon className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">{s.label}</p>
                <p className="font-semibold text-white">{s.value}</p>
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
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-white/50">
              สินค้าแนะนำ
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
                    className="group flex w-[140px] flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-violet-400/40 hover:bg-white/10 sm:w-[160px]"
                  >
                    <div className="aspect-square overflow-hidden bg-white/5">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3">
                      <p className="line-clamp-2 text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-violet-300">
                        {formatMoney(product.price)} ฿/วัน
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 text-center">
              <Link
                href="#products"
                className="text-sm font-medium text-white/60 underline-offset-4 hover:text-violet-300 hover:underline"
              >
                เลื่อนลงดูรายการทั้งหมด
              </Link>
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
