"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./WhatIDo.module.css";

const services = [
  {
    num: "01",
    title: "Video Editing",
    tool: "Premiere Pro",
    desc: "Cinematic editing, storytelling, pacing, transitions and polished final cuts.",
    icon: "/premiere_pro.png"
  },
  {
    num: "02",
    title: "Color Grading",
    tool: "DaVinci Resolve",
    desc: "Creating consistent and cinematic visual looks through professional color correction and grading.",
    icon: "/davinci_resolve.png"
  },
  {
    num: "03",
    title: "Motion Graphics",
    tool: "After Effects",
    desc: "Motion graphics, animated typography, visual effects and dynamic compositions.",
    icon: "/after_effects.png"
  },
  {
    num: "04",
    title: "Sound",
    tool: "Audition",
    desc: "Sound mixing and audio finishing for a cleaner and more immersive final result.",
    icon: "/audition.png"
  },
  {
    num: "05",
    title: "Full-Stack Development",
    tool: "Next.js & React",
    desc: "Building complete web applications and digital experiences.",
    icon: "/fullstack_dev.png"
  },
  {
    num: "06",
    title: "Problem Solving",
    tool: "Logic & Strategy",
    desc: "Turning real problems and ideas into practical digital solutions.",
    icon: "/problem_solving.png"
  },
  {
    num: "07",
    title: "Business Models",
    tool: "Product & Strategy",
    desc: "Turning concepts into structured products, services and business models.",
    icon: "/business_models.png"
  }
];

export default function WhatIDo() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    if (!containerRef.current) return;

    const isMobile = window.innerWidth < 768;
    const triggers: ScrollTrigger[] = [];

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const isEven = i % 2 === 0;

      // 1. Entry reveal animation as each card enters viewport
      const entryAnim = gsap.fromTo(
        card,
        {
          y: isMobile ? 40 : 70,
          opacity: 0,
          scale: isMobile ? 0.97 : 0.94,
          rotationX: isMobile ? 0 : 8,
          transformPerspective: 1000,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotationX: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );

      if (entryAnim.scrollTrigger) triggers.push(entryAnim.scrollTrigger);

      // 2. Continuous parallax scroll effect between columns
      if (!isMobile) {
        const parallaxAnim = gsap.to(card, {
          y: isEven ? -15 : -35,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        });

        if (parallaxAnim.scrollTrigger) triggers.push(parallaxAnim.scrollTrigger);
      }
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <section className={`container ${styles.section}`} ref={containerRef} id="skills">
      <h2 className={styles.heading}>What I do</h2>
      <div className={styles.grid}>
        {services.map((service, i) => (
          <div 
            key={i} 
            className={`${styles.card} ${i === services.length - 1 && services.length % 2 !== 0 ? styles.cardFull : ""}`}
            ref={(el) => { cardsRef.current[i] = el; }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <span className={styles.number}>{service.num}</span>
                {service.tool && <span className={styles.tool}>{service.tool}</span>}
              </div>
              <h3 className={styles.title}>{service.title}</h3>
              <p className={styles.desc}>{service.desc}</p>
            </div>
            {service.icon && (
              <div className={styles.iconWrapper}>
                <img src={service.icon} alt={service.tool} className={styles.appIcon} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
