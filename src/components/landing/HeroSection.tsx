import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4 pt-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,80,200,0.25),transparent)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-4xl text-center"
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
          <Button size="lg" className="rounded-full px-8 text-base" asChild>
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
    </section>
  );
}

