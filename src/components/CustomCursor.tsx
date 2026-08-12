"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Use GSAP quickTo for performance
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3" });

    const onMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Determine what element we're hovering over
      const isClickable = target.closest("a, button, input, textarea, [data-cursor]");
      const cursorType = target.closest("[data-cursor]")?.getAttribute("data-cursor");
      
      if (cursorType === "view" || cursorType === "play" || isClickable) {
        gsap.to(cursor, { width: 44, height: 44, duration: 0.3, ease: "back.out(1.5)", innerHTML: "" });
      } else {
        gsap.to(cursor, { width: 12, height: 12, duration: 0.3, ease: "power2.out", innerHTML: "" });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return <div ref={cursorRef} className={styles.cursor} />;
}
