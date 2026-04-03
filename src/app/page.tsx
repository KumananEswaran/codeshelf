import { auth } from "@/auth";
import { Navbar } from "@/components/homepage/Navbar";
import { HeroSection } from "@/components/homepage/HeroSection";
import { FeaturesSection } from "@/components/homepage/FeaturesSection";
import { AiSection } from "@/components/homepage/AiSection";
import { PricingSection } from "@/components/homepage/PricingSection";
import { CtaSection } from "@/components/homepage/CtaSection";
import { Footer } from "@/components/homepage/Footer";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="bg-[#0a0a0f] text-[#e4e4e7] min-h-screen scroll-smooth">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AiSection />
      <PricingSection isLoggedIn={isLoggedIn} />
      <CtaSection />
      <Footer />
    </div>
  );
}
