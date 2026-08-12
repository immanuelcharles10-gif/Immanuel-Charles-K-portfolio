"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./Skills.module.css";

const skills = {
  creative: ["Video Editing", "Color Grading", "Motion Graphics", "Sound Mixing", "Visual Storytelling"],
  development: ["Frontend", "Backend", "Full-Stack Development", "Web Applications", "Problem Solving"],
  product: ["Business Models", "Product Ideas", "Digital Experiences", "Creative Strategy"]
};

export default function Skills() {
  const containerRef = useRef<HTMLElement>(null);
  const skillRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current) return;

    // Filter out nulls
    const elements = skillRefs.current.filter(Boolean);

    gsap.fromTo(
      elements,
      { y: "100%" },
      {
        y: "0%",
        duration: 0.8,
        stagger: 0.05,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.skillsGrid}`,
          start: "top 80%",
        }
      }
    );
  }, []);

  const addToRefs = (el: HTMLSpanElement | null) => {
    if (el && !skillRefs.current.includes(el)) {
      skillRefs.current.push(el);
    }
  };

  return (
    <section className={`container ${styles.section}`} ref={containerRef}>
      <div className={styles.devHeader}>
        <h2 className={styles.devHeading}>
          I don't just design ideas.
          <span>I build them.</span>
        </h2>
        
        <div className={styles.devList}>
          <div className={styles.devItem}>Websites</div>
          <div className={styles.devItem}>Applications</div>
          <div className={styles.devItem}>Experiments</div>
          <div className={styles.devItem}>Problem Solving</div>
        </div>

        <a 
          href="https://github.com/immanuelcharles10-gif?tab=repositories" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.githubLink}
          data-cursor="view"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.4 5.4 0 0 0-1.5-3.8 5.3 5.3 0 0 0 0-3.8s-1.3-.4-4 1.4a13.3 13.3 0 0 0-7 0C6.2 1.4 5 1.8 5 1.8a5.3 5.3 0 0 0 0 3.8A5.4 5.4 0 0 0 3.5 9.4c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path>
          </svg>
          View GitHub
        </a>
      </div>

      <div className={styles.skillsHeader}>
        <h3 className={styles.skillsTitle}>Tools & Skills</h3>
        
        <div className={styles.skillsGrid}>
          <div className={styles.skillCategoryBox}>
            <h4 className={styles.categoryTitle}>Creative</h4>
            <div className={styles.skillList}>
              {skills.creative.map((skill, i) => (
                <div key={i} className={styles.skill}>
                  <span ref={addToRefs}>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.skillCategoryBox}>
            <h4 className={styles.categoryTitle}>Development</h4>
            <div className={styles.skillList}>
              {skills.development.map((skill, i) => (
                <div key={i} className={styles.skill}>
                  <span ref={addToRefs}>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.skillCategoryBox}>
            <h4 className={styles.categoryTitle}>Product</h4>
            <div className={styles.skillList}>
              {skills.product.map((skill, i) => (
                <div key={i} className={styles.skill}>
                  <span ref={addToRefs}>{skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
