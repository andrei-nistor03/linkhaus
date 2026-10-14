import { notFound } from "next/navigation";
import Preloader from "@/components/layout/Preloader";
import Nav from "@/components/layout/Nav";
import CustomCursor from "@/components/layout/CustomCursor";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import SectionTransitionOverlay from "@/components/layout/SectionTransitionOverlay";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Services from "@/components/sections/Services";
import Contact from "@/components/sections/Contact";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { buildJsonLd } from "@/lib/structuredData";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const jsonLd = buildJsonLd(lang, getDictionary(lang));

  return (
    <SmoothScrollProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <Preloader />
      <CustomCursor />
      <SectionTransitionOverlay />
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Services />
        <Contact />
      </main>
      <Footer />
    </SmoothScrollProvider>
  );
}
