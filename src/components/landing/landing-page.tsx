"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Car,
  Package,
  Shield,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CAROUSEL_SLIDES = [
  {
    id: "camera",
    title: "กล้อง",
    subtitle: "เช่ากล้องและอุปกรณ์ถ่ายภาพระดับโปร",
    description: "จากกล้องมิเรอร์เลส เลนส์ ขาตั้ง ไปจนถึงอุปกรณ์สตูดิโอ",
    icon: Camera,
    gradient: "from-violet-600 via-purple-700 to-indigo-800",
    cta: "ดูรายการกล้อง",
    href: "/rent",
  },
  {
    id: "car",
    title: "รถ",
    subtitle: "เช่ารถยนต์และจักรยานยนต์",
    description: "เดินทางอย่างมั่นใจ ด้วยรถที่พร้อมบริการ",
    icon: Car,
    gradient: "from-emerald-600 via-teal-700 to-cyan-800",
    cta: "ดูรายการรถ",
    href: "/rent",
  },
  {
    id: "more",
    title: "อื่นๆ",
    subtitle: "อุปกรณ์หลากหลายตามความต้องการ",
    description: "โปรเจคเตอร์ ไมค์ ไฟสตูดิโอ และอีกมากมาย",
    icon: Package,
    gradient: "from-amber-500 via-orange-600 to-rose-600",
    cta: "สำรวจทั้งหมด",
    href: "/rent",
  },
];

const FEATURES = [
  {
    icon: CreditCard,
    title: "ชำระง่าย",
    description: "รองรับบัตรเครดิตผ่าน Stripe ปลอดภัย มั่นใจได้",
  },
  {
    icon: Shield,
    title: "มัดจำชัดเจน",
    description: "ระบบมัดจำและคืนเงินเป็นมาตรฐาน โปร่งใส",
  },
  {
    icon: Package,
    title: "จัดส่งถึงที่",
    description: "จัดการที่อยู่จัดส่งได้หลายที่ เลือกที่รับของสะดวก",
  },
];

const STEPS = [
  { step: 1, title: "เลือกสินค้า", detail: "เลือกหมวดและรายการที่ต้องการเช่า กำหนดวันที่เริ่ม-คืน" },
  { step: 2, title: "กรอกข้อมูล & ชำระเงิน", detail: "ลงทะเบียนหรือเข้าสู่ระบบ ชำระผ่านบัตรด้วย Stripe" },
  { step: 3, title: "รับของ & คืนตามกำหนด", detail: "รับสินค้าตามที่อยู่จัดส่ง คืนตามวันที่กำหนด" },
];

export function LandingPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setSlideIndex((i) => (index + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => goTo(slideIndex + 1), 5000);
    return () => clearInterval(t);
  }, [slideIndex, isPaused, goTo]);

  const current = CAROUSEL_SLIDES[slideIndex];
  const IconCurrent = current.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
            <span className="text-xl">Zend Rental</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-white/90 hover:bg-white/10 hover:text-white">
              <Link href="/rent">รายการเช่า</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white/90 hover:bg-white/10 hover:text-white">
              <Link href="/customer-login">เข้าสู่ระบบ</Link>
            </Button>
            <Button size="sm" className="bg-white text-neutral-900 hover:bg-white/90" asChild>
              <Link href="/register">สมัครสมาชิก</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
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

      {/* ─── Carousel Banner ─── */}
      <section className="relative bg-neutral-100 py-16 dark:bg-neutral-900 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              เลือกหมวดที่ต้องการ
            </h2>
            <p className="mt-2 text-muted-foreground">
              หลายหมวด รองรับทุกความต้องการ
            </p>
          </motion.div>

          <div
            className="relative overflow-hidden rounded-3xl bg-neutral-200/50 dark:bg-neutral-800/50"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex min-h-[320px] flex-col items-center justify-center gap-6 bg-gradient-to-br ${current.gradient} p-8 text-white md:min-h-[380px] md:flex-row md:gap-12 md:p-12`}
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur sm:h-28 sm:w-28">
                  <IconCurrent className="h-12 w-12 sm:h-14 sm:w-14" />
                </div>
                <div className="max-w-xl text-center md:text-left">
                  <p className="text-sm font-medium uppercase tracking-widest text-white/80">
                    {current.subtitle}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {current.title}
                  </h3>
                  <p className="mt-3 text-white/90">
                    {current.description}
                  </p>
                  <Button
                    size="lg"
                    className="mt-6 rounded-full bg-white text-neutral-900 hover:bg-white/90"
                    asChild
                  >
                    <Link href={current.href}>{current.cta}</Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel controls */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 md:bottom-6">
              <button
                type="button"
                onClick={() => goTo(slideIndex - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {CAROUSEL_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`h-2 w-2 rounded-full transition md:h-2.5 md:w-2.5 ${
                      i === slideIndex ? "w-6 bg-white md:w-8" : "bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`สไลด์ ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => goTo(slideIndex + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label="ถัดไป"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              ทำไมต้อง Zend Rental
            </h2>
            <p className="mt-2 text-muted-foreground">
              กระบวนการเช่าง่าย ปลอดภัย โปร่งใส
            </p>
          </motion.div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-3xl border border-border/60 bg-card p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="border-t border-border bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              ใช้บริการอย่างไร
            </h2>
            <p className="mt-2 text-muted-foreground">
              3 ขั้นตอน สะดวก รวดเร็ว
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="border-t border-border bg-neutral-950 py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            พร้อมเริ่มเช่าแล้วหรือยัง?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-white/70"
          >
            สมัครสมาชิกวันนี้ จองของที่ต้องการได้ทันที
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link href="/rent">ไปหน้ารายการเช่า</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/register">สมัครสมาชิก</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="font-semibold tracking-tight">
              Zend Rental
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/rent" className="hover:text-foreground">รายการเช่า</Link>
              <Link href="/register" className="hover:text-foreground">สมัครสมาชิก</Link>
              <Link href="/customer-login" className="hover:text-foreground">เข้าสู่ระบบ</Link>
              <Link href="/login" className="hover:text-foreground">พนักงาน</Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Zend Rental. ระบบเช่าอุปกรณ์ครบวงจร.
          </p>
        </div>
      </footer>
    </div>
  );
}
