"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import type { MenuProduct } from "@/features/modifier/modifier.repo";

const AUTO_SCROLL_MS = 4000;

type ProductWithOptionalDiscount = MenuProduct & { discountPercent?: number };

function formatMoney(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product }: { product: ProductWithOptionalDiscount }) {
  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;
  const discountPercent = product.discountPercent ?? 0;
  const hasPromo = discountPercent > 0;
  const discountedPrice = hasPromo
    ? Math.round(product.price * (1 - discountPercent / 100))
    : product.price;

  return (
    <Link
      href="/rent"
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:border-brand-accent/30 hover:shadow-md hover:shadow-brand-accent/5 dark:hover:border-brand-accent/50 sm:rounded-2xl sm:hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-10 w-10 sm:h-14 sm:w-14" />
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 flex flex-col items-end gap-0.5 sm:bottom-2 sm:right-2">
          {hasPromo && (
            <span className="rounded-full bg-brand-accent px-1.5 py-0.5 text-[10px] font-medium text-white sm:px-2 sm:text-xs">
              ลด {discountPercent}%
            </span>
          )}
          {hasPromo ? (
            <>
              <span className="text-muted-foreground text-[10px] tabular-nums line-through sm:text-xs">
                {formatMoney(product.price)} ฿
              </span>
              <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-medium text-white tabular-nums sm:px-2.5 sm:text-xs">
                {formatMoney(discountedPrice)} ฿
              </span>
            </>
          ) : (
            <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-medium text-white sm:px-2.5 sm:text-xs">
              {formatMoney(product.price)} ฿
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-sm font-semibold tracking-tight line-clamp-2 sm:text-base">{product.name}</h3>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-accent sm:mt-3 sm:text-sm">
          ดูรายการ
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
        </span>
      </div>
    </Link>
  );
}

type ProductsCarouselSectionProps = {
  products: ProductWithOptionalDiscount[];
};

export function ProductsCarouselSection({ products }: ProductsCarouselSectionProps) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!api || isPaused) return;
    intervalRef.current = setInterval(() => {
      api.scrollNext();
    }, AUTO_SCROLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [api, isPaused]);

  const handlePointerEnter = () => setIsPaused(true);
  const handlePointerLeave = () => setIsPaused(false);

  if (products.length === 0) return null;

  return (
    <section id="products" className="border-t border-border bg-background py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="mb-6 text-center sm:mb-8 md:mb-10">
          <p className="text-[10px] font-medium uppercase tracking-widest text-brand-accent sm:text-xs">
            รายการทั้งหมด
          </p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight sm:mt-2 sm:text-3xl md:text-4xl">
            เลื่อนดูแพ็กเกจทั้งหมด
          </h2>
        </div>

        <div
          className="relative"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <Carousel
            opts={{ align: "start", loop: true }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-3 md:-ml-4">
              {products.slice(0, 12).map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[72%] pl-2 sm:basis-1/2 sm:pl-3 md:basis-1/3 md:pl-4 lg:basis-1/4"
                >
                  <div className="p-0.5 sm:p-1">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-1 h-7 w-7 border-border bg-background/95 hover:bg-background sm:left-0 sm:h-8 sm:w-8" />
            <CarouselNext className="-right-1 h-7 w-7 border-border bg-background/95 hover:bg-background sm:right-0 sm:h-8 sm:w-8" />
          </Carousel>
          {!isPaused && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-brand-bg/80 px-2 py-0.5 text-[10px] text-brand-fg/90 sm:bottom-2 sm:px-3 sm:py-1 sm:text-xs">
              เลื่อนอัตโนมัติ
            </span>
          )}
        </div>

        <div className="mt-8 text-center sm:mt-10 md:mt-12">
          <Button
            asChild
            size="lg"
            className="h-9 rounded-full bg-brand-accent px-5 text-sm text-white hover:bg-brand-accent-hover sm:h-11 sm:px-8 sm:text-base"
          >
            <Link href="/rent">
              ไปหน้ารายการแพ็กเกจ
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
