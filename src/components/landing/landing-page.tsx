"use client";

import { HeroSection } from "./HeroSection";
import { CategoryCarousel } from "./CategoryCarousel";
import { ProductsCarouselSection } from "./ProductsCarouselSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { FinalCtaSection } from "./FinalCtaSection";
import type { MenuProduct } from "@/features/modifier/modifier.repo";

type LandingPageProps = {
  products?: MenuProduct[];
};

export function LandingPage({ products = [] }: LandingPageProps) {
  return (
    <div className="bg-background text-foreground">
      <HeroSection featuredProducts={products.slice(0, 6)} productCount={products.length} />
      {/* <CategoryCarousel /> */}
      <ProductsCarouselSection products={products} />
      <FeaturesSection />
      <HowItWorksSection />
      <FinalCtaSection />
    </div>
  );
}

