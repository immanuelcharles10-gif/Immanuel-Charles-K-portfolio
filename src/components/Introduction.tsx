"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./Introduction.module.css";

const text = "I work across video, motion, sound, software and product ideas — turning concepts into experiences that look good, work well and solve real problems.";

export default function Introduction() {
  const containerRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const words = wordsRef.current.filter(Boolean);

      // Subtle background color shift (black to very dark grey)
      gsap.to("body", {
        backgroundColor: "#050505",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        }
      });

      // Reveal words on scroll
      gsap.fromTo(words, 
        {
          color: "var(--text-muted)",
          y: 15,
        },
        {
          color: "var(--text-primary)",
          y: 0,
          stagger: 0.1,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "bottom 60%",
            scrub: 1, // Smooth scrubbing
          }
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className={styles.intro} ref={containerRef} id="about">
      <h2 className={styles.statement} data-cursor="view">
        Creative thinking meets technology.
      </h2>
      <p className={styles.paragraph}>
        {text.split(" ").map((word, i) => (
          <span
            key={i}
            className={styles.word}
            ref={(el) => { wordsRef.current[i] = el; }}
          >
            {word}
          </span>
        ))}
      </p>
    </section>
  );
}
