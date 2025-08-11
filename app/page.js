import AboutUsSection from "@/components/AboutUsSection";
import HeroSection from "@/components/HeroSection";
import RandomTourPackageSection from "@/components/RandomTourPackageSection";
import Boxes from "@/components/Boxes";
import InstaBlog from "@/components/InstaBlog";
import Banner from "@/components/Banner";
import ChatBot from "@/components/ChatBot";
import PopUpBanner from "@/components/PopUpBanner";
import Social from "@/components/Social";

export default async function Home() {
  return (
    <>
      <PopUpBanner />
      <HeroSection />
      <Boxes />
      <AboutUsSection />
      <Banner />
      <RandomTourPackageSection />
      <InstaBlog />
      <Social/>
      <ChatBot/>
    </>
  );
}
