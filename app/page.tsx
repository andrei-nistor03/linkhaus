import Preloader from "@/components/layout/Preloader";
import Nav from "@/components/layout/Nav";
import CustomCursor from "@/components/layout/CustomCursor";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Services from "@/components/sections/Services";

export default function Home() {
  return (
    <SmoothScrollProvider>
      <Preloader />
      <CustomCursor />
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Services />
      </main>
      <Footer />
    </SmoothScrollProvider>
  );
}
