"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function SmoothScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.05,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    // Ensure body overflow and Lenis scroller are active
    document.body.style.overflow = "";
    lenis.start();

    // Attach to global window object so navigation can trigger Lenis scroll seamlessly
    if (typeof window !== "undefined") {
      (window as any).__lenis = lenis;
    }

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      if (typeof window !== "undefined") {
        delete (window as any).__lenis;
      }
    };
  }, []);

  // Every time the route changes, unlock scroll and refresh ScrollTrigger
  useEffect(() => {
    document.body.style.overflow = "";
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.start();
      lenis.scrollTo(0, { immediate: true });
    }
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}

