"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./Hero.module.css";
import { motion } from "framer-motion";

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set([contentRef.current, actionsRef.current], { opacity: 0, y: 20 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(wordsRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.12,
        delay: 0.2
      })
      .to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
      }, "-=0.5")
      .to(actionsRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
      }, "-=0.7");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el: HTMLSpanElement | null) => {
    if (el && !wordsRef.current.includes(el)) {
      wordsRef.current.push(el);
    }
  };

  const scrollToSection = (id: string) => {
    const lenis = (window as any).__lenis;
    const element = document.getElementById(id);
    if (lenis && element) {
      lenis.scrollTo(element, { offset: -40, duration: 1.2 });
    } else if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className={`container ${styles.hero}`} ref={containerRef}>
      {/* Top: text content */}
      <div className={styles.heroGrid}>
        <div className={styles.leftCol}>
          <p className={styles.greetingTag}>
            Creative Technologist
          </p>

          <h1 className={styles.title}>
            <span className={styles.line}>
              <span className={styles.word} ref={addToRefs}>It's me Immanuel</span>
            </span>
            <span className={styles.line}>
              <span className={styles.word} ref={addToRefs}>I create.</span>
            </span>
            <span className={styles.line}>
              <span className={styles.word} ref={addToRefs}>I build.</span>
            </span>
            <span className={styles.line}>
              <span className={styles.word} ref={addToRefs}>I solve.</span>
            </span>
          </h1>

          <div ref={contentRef}>
            <h2 className={styles.subtitle}>
              Video editor. Motion designer. Full-stack developer. Problem solver.
            </h2>
            <p className={styles.description}>
              I combine visual storytelling, technology and problem solving to turn ideas into polished digital experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: CTA buttons pinned to bottom of hero */}
      <div className={styles.actions} ref={actionsRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={styles.primaryBtn}
          onClick={() => scrollToSection("work")}
          data-cursor="view"
        >
          Explore The Work
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={styles.secondaryBtn}
          onClick={() => scrollToSection("contact")}
          data-cursor="view"
        >
          Let's Work Together
        </motion.button>
      </div>
    </section>
  );
}
