"use client";

import { HeroSection } from "./HeroSection";
import { CategoryCarousel } from "./CategoryCarousel";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { FinalCtaSection } from "./FinalCtaSection";

export function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <HeroSection />
      <CategoryCarousel />
      <FeaturesSection />
      <HowItWorksSection />
      <FinalCtaSection />
    </div>
  );
}

