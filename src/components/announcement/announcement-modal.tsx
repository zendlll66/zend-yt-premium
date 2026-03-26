"use client";

import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WysiwygContent } from "@/components/wysiwyg-content";

interface Announcement {
  id: number;
  title: string;
  content: string;
}

const DISMISS_KEY = "announcement_dismissed";

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AnnouncementModal() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  // Sync selectedIndex with embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    // Check if dismissed today
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed === getTodayStr()) return;
    } catch {
      // ignore
    }

    // Fetch active announcements
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data: Announcement[]) => {
        if (data && data.length > 0) {
          setItems(data);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setOpen(false);
  }

  function dismissToday() {
    try {
      localStorage.setItem(DISMISS_KEY, getTodayStr());
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full overflow-hidden rounded-t-2xl border border-brand-border bg-brand-bg shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-border px-6 py-4 sm:px-8">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent" />
                <h2 className="text-sm font-semibold text-brand-fg">ประกาศ</h2>
                {items.length > 1 && (
                  <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs text-brand-fg/50">
                    {selectedIndex + 1}/{items.length}
                  </span>
                )}
              </div>
              <button
                onClick={dismiss}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fg/40 transition hover:bg-white/10 hover:text-brand-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {items.map((ann) => (
                  <div key={ann.id} className="min-w-0 flex-[0_0_100%]">
                    <div className="max-h-[70vh] overflow-y-auto px-6 py-5 sm:max-h-[75vh] sm:px-8">
                      <h3 className="mb-3 text-base font-semibold text-brand-fg">{ann.title}</h3>
                      <WysiwygContent
                        html={ann.content}
                        className="text-brand-fg/80"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation dots + buttons */}
            <div className="border-t border-brand-border px-6 py-4 sm:px-8">
              {/* Carousel controls */}
              {items.length > 1 && (
                <div className="mb-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => emblaApi?.scrollPrev()}
                    disabled={selectedIndex === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fg/50 transition hover:bg-white/10 hover:text-brand-fg disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1.5">
                    {items.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => emblaApi?.scrollTo(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === selectedIndex
                            ? "w-4 bg-brand-accent"
                            : "w-1.5 bg-brand-border hover:bg-brand-fg/30"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    disabled={selectedIndex === items.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-fg/50 transition hover:bg-white/10 hover:text-brand-fg disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={dismissToday}
                  className="flex items-center gap-1.5 text-xs text-brand-fg/40 transition hover:text-brand-fg/70"
                >
                  <BellOff className="h-3.5 w-3.5" />
                  ไม่แสดงวันนี้
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-lg bg-brand-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-accent-hover"
                >
                  รับทราบ
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
