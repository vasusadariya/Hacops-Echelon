
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import Navbar from "@/components/navbar";
import { QuickLinks } from "@/components/quick-links";
import { ServicesSection } from "@/components/services-section";


export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar/>
      <HeroSection/>
      <QuickLinks />
      <HowItWorks />
      <ServicesSection />
      <Footer />
    </div>
  );
}
