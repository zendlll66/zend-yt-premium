"use client";

import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import type { MenuProduct } from "@/features/modifier/modifier.repo";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product }: { product: MenuProduct }) {
  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;

  return (
    <Link
      href="/rent"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:border-violet-300/50 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:border-violet-500/30"
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
            <Package className="h-14 w-14" />
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-medium text-white">
          {formatMoney(product.price)} ฿/วัน
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold tracking-tight line-clamp-2">{product.name}</h3>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
          ดูรายการ
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

type ProductsCarouselSectionProps = {
  products: MenuProduct[];
};

export function ProductsCarouselSection({ products }: ProductsCarouselSectionProps) {
  if (products.length === 0) return null;

  return (
    <section id="products" className="border-t border-border bg-muted/20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            สินค้า
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            รายการเช่าขายดี
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            เลือกอุปกรณ์ที่ต้องการ กำหนดวันรับ–วันคืน แล้วจองได้ทันที
          </p>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {products.slice(0, 12).map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-full pl-2 sm:basis-1/2 md:basis-1/3 md:pl-4 lg:basis-1/4"
              >
                <div className="p-1">
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 border-border bg-background/80 hover:bg-background" />
          <CarouselNext className="right-0 border-border bg-background/80 hover:bg-background" />
        </Carousel>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-full bg-violet-600 px-8 hover:bg-violet-700" variant="default">
            <Link href="/rent">
              ดูรายการเช่าทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
