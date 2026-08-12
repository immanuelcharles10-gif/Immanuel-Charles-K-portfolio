import Hero from "@/components/Hero";
import Introduction from "@/components/Introduction";
import WhatIDo from "@/components/WhatIDo";
import TheWork from "@/components/TheWork";
import AttachmentsSection from "@/components/AttachmentsSection";
import Skills from "@/components/Skills";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main style={{ position: "relative", zIndex: 10 }}>
      <Hero />
      <Introduction />
      <WhatIDo />
      <TheWork />
      <AttachmentsSection />
      <Skills />
      <About />
      <Contact />
    </main>
  );
}
