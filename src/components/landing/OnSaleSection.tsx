"use client";

import Link from "next/link";
import { Package, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuProductWithDiscount } from "@/features/promotion/promotion.repo";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductSaleCard({ product }: { product: MenuProductWithDiscount }) {
  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;
  const discountedPrice =
    product.price * (1 - product.discountPercent / 100);
  const roundedPrice = Math.round(discountedPrice);

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
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-violet-500">
          <Tag className="h-3 w-3" />
          ลด {product.discountPercent}%
        </span>
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-0.5">
          <span className="text-muted-foreground line-through text-xs tabular-nums">
            {formatMoney(product.price)} ฿
          </span>
          <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-medium text-white tabular-nums dark:bg-violet-500">
                {formatMoney(roundedPrice)} ฿
          </span>
        </div>
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

type OnSaleSectionProps = {
  products: MenuProductWithDiscount[];
};

export function OnSaleSection({ products }: OnSaleSectionProps) {
  if (products.length === 0) return null;

  return (
    <section
      id="on-sale"
      className="border-t border-border bg-muted/20 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            โปรโมชัน
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            แพ็กเกจลดราคา
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            เลือกแพ็กเกจที่ร่วมโปรและรับราคาพิเศษทันที
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductSaleCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-violet-600 px-8 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            <Link href="/rent">
              ไปหน้ารายการแพ็กเกจ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
