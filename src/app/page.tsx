import { LandingPage } from "@/components/landing/landing-page";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";

export default async function HomePage() {
  const products = await getMenuForOrder();
  return <LandingPage products={products} />;
}
