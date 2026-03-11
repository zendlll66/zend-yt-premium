"use client";

import { HeroSection } from "./HeroSection";
import { CategoryCarousel } from "./CategoryCarousel";
import { ProductsCarouselSection } from "./ProductsCarouselSection";
import { OnSaleSection } from "./OnSaleSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { MembershipBentoPricing } from "@/components/bento-pricing";
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import type { MenuProductWithDiscount } from "@/features/promotion/promotion.repo";
import type { MembershipPlanForBento } from "@/components/bento-pricing";

type LandingPageProps = {
  products?: (MenuProduct & { discountPercent?: number })[];
  onSaleProducts?: MenuProductWithDiscount[];
  membershipPlans?: MembershipPlanForBento[];
};

export function LandingPage({ products = [], onSaleProducts = [], membershipPlans = [] }: LandingPageProps) {
  return (
    <div className="bg-background text-foreground">
      <HeroSection featuredProducts={products.slice(0, 6)} productCount={products.length} />
      <HowItWorksSection />
      {/* <CategoryCarousel /> */}
      <OnSaleSection products={onSaleProducts} />

      <FeaturesSection />
   

      {/* โปรสมาชิก — ใช้ Bento Pricing */}
      {membershipPlans.length > 0 && (
        <section id="membership" className="border-t border-border bg-muted/20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
                สมาชิก
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                โปรสมัครสมาชิก
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                เลือกแผนรายเดือนหรือรายปี ใช้สิทธิ์วันเช่าฟรีและส่วนลดทุกครั้งที่เช่า
              </p>
            </div>
            <MembershipBentoPricing plans={membershipPlans} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              กดสมัครแล้วเข้าสู่ระบบ (หรือสมัครสมาชิก) เพื่อชำระค่าสมาชิก
            </p>
          </div>
        </section>
      )}
      <ProductsCarouselSection products={products} />

      <FinalCtaSection />
    </div>
  );
}

