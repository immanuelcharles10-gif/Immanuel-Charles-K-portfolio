"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./About.module.css";

const aboutText = "I enjoy working at the intersection of creativity and technology. From editing a video and designing motion graphics to building applications and developing business ideas, I like understanding how things work and then building them better.";

export default function About() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current || !textRef.current) return;

    const words = textRef.current.children;

    gsap.fromTo(
      words,
      { color: "var(--text-muted)" },
      {
        color: "var(--text-primary)",
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 60%",
          end: "bottom 70%",
          scrub: 1,
        }
      }
    );
  }, []);

  return (
    <section className={`container ${styles.section}`} ref={containerRef}>
      <h2 className={styles.heading}>A multidisciplinary creator.</h2>
      
      <p className={styles.text} ref={textRef}>
        {aboutText.split(" ").map((word, i) => (
          <span key={i}>{word} </span>
        ))}
      </p>
    </section>
  );
}
