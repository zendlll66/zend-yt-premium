import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Car,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CAROUSEL_SLIDES = [
  {
    id: "camera",
    title: "กล้อง",
    subtitle: "เช่ากล้องและอุปกรณ์ถ่ายภาพระดับโปร",
    description: "จากกล้องมิเรอร์เลส เลนส์ ขาตั้ง ไปจนถึงอุปกรณ์สตูดิโอ",
    icon: Camera,
    gradient: "from-red-600 to-red-800",
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
    gradient: "from-red-500 to-red-700",
    cta: "สำรวจทั้งหมด",
    href: "/rent",
  },
];

export function CategoryCarousel() {
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
  );
}

