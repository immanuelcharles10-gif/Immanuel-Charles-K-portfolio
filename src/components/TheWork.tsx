"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./TheWork.module.css";

interface WorkItem {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
}

const works: WorkItem[] = [
  {
    id: "video-editing",
    category: "Post-Production & Editorial",
    title: "Video Editing & Color Grading",
    description: "Crafting high-impact cinematic reels, commercial edits, and narrative visual storytelling. Precision color correction and grading to evoke emotion and tone.",
    image: "/work_video.png",
    tags: ["Premiere Pro", "DaVinci Resolve", "Color Grading", "Sound Design", "Visual Storytelling"]
  },
  {
    id: "motion-graphics",
    category: "Motion & Visual Effects",
    title: "Motion Graphics & 3D Typography",
    description: "Designing fluid kinetic typography, animated branding systems, complex visual effects, and 3D motion elements for digital campaigns.",
    image: "/work_motion.png",
    tags: ["After Effects", "Cinema 4D", "Kinetic Type", "Visual Effects", "Brand Motion"]
  },
  {
    id: "fullstack-dev",
    category: "Software & WebGL",
    title: "Full-Stack Web Applications",
    description: "Building responsive, modern digital products, interactive WebGL experiences, custom web applications, and fast scalable backends.",
    image: "/work_web.png",
    tags: ["Next.js", "React", "TypeScript", "Three.js", "Node.js", "GSAP"]
  },
  {
    id: "product-design",
    category: "Product & Architecture",
    title: "Digital Products & Systems",
    description: "Architecting product systems from concept to release. Turning real-world problem statements into practical software architectures and business models.",
    image: "/work_product.png",
    tags: ["Product Strategy", "UI/UX Systems", "Full-Stack Tech", "Business Models", "Problem Solving"]
  },
  {
    id: "business-monetization",
    category: "Strategy & Commercial Growth",
    title: "Building and Monetizing Business Models",
    description: "Architecting sustainable revenue frameworks, unit economics, and go-to-market strategies for digital platforms. Transforming innovative ideas into market-ready, scalable business models.",
    image: "/work_business.png",
    tags: ["Business Models", "Monetization Strategy", "Unit Economics", "Growth Architecture", "Venture Scaling"]
  }
];

export default function TheWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const img = imagesRef.current[index];

        // Apple-like 3D Perspective Scroll Reveal
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
            scale: 0.94,
            rotationX: 6,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 35%",
              scrub: 0.8,
            }
          }
        );

        // Subtle parallax scale effect inside the image container
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.15, y: -20 },
            {
              scale: 1.0,
              y: 0,
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              }
            }
          );
        }
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className={`container ${styles.wrapper}`} ref={sectionRef} id="work">
      <div className={styles.header}>
        <span className={styles.titleTag}>Portfolio &amp; Showcase</span>
        <h2 className={styles.heading}>The Work</h2>
        <p className={styles.subheading}>
          A showcase of visual storytelling, motion graphics, color grading, full-stack software, and digital products.
        </p>
      </div>

      <div className={styles.grid}>
        {works.map((item, index) => (
          <div
            key={item.id}
            className={`${styles.workCard} glass-card`}
            ref={(el) => { cardsRef.current[index] = el; }}
            data-cursor="view"
          >
            <div className={styles.imageFrame}>
              <img
                ref={(el) => { imagesRef.current[index] = el; }}
                src={item.image}
                alt={item.title}
                className={styles.workImage}
              />
              <div className={styles.imageOverlay} />
            </div>

            <div className={styles.content}>
              <span className={styles.category}>{item.category}</span>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>

              <div className={styles.tagList}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
