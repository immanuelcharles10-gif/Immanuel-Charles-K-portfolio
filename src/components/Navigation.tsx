"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navigation.module.css";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const performScrollTo = useCallback((targetId: string | null) => {
    if (!targetId) {
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.start();
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return true;
    }

    const element = document.getElementById(targetId);
    if (!element) return false;

    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.start();
      lenis.scrollTo(element, { offset: -40, duration: 1.2 });
    } else {
      element.scrollIntoView({ behavior: "smooth" });
    }

    const rect = element.getBoundingClientRect();
    return rect.top <= 120;
  }, []);

  // Handle scroll target when landing on home page from another page or direct hash URL
  useEffect(() => {
    if (pathname !== "/") return;

    const storedTarget = typeof window !== "undefined" ? sessionStorage.getItem("target_scroll_section") : null;
    const hashTarget = typeof window !== "undefined" && window.location.hash ? window.location.hash.replace("#", "") : null;
    const targetId = storedTarget || hashTarget;

    if (!targetId) return;

    let attempts = 0;
    const maxAttempts = 60; // Retry for up to 6 seconds to account for LoadingScreen

    const timer = setInterval(() => {
      attempts++;
      const success = performScrollTo(targetId);
      if (success || attempts >= maxAttempts) {
        if (storedTarget) {
          sessionStorage.removeItem("target_scroll_section");
        }
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [pathname, performScrollTo]);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    
    if (pathname !== "/") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("trigger_home_loader", "true");
        sessionStorage.removeItem("target_scroll_section");
      }
      router.push("/");
      return;
    }

    performScrollTo(null);
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    
    if (pathname !== "/") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("target_scroll_section", id);
      }
      router.push(`/#${id}`);
      return;
    }

    performScrollTo(id);
  };

  return (
    <>
      <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.logo}>
          <Link href="/" onClick={scrollToTop} data-cursor="view">Immanuel Charles K</Link>
        </div>
        
        <nav className={styles.links}>
          <button 
            type="button" 
            className={styles.link} 
            onClick={() => scrollToSection("work")}
            data-cursor="view"
          >
            Work
          </button>
          <button 
            type="button" 
            className={styles.link} 
            onClick={() => scrollToSection("attachments")}
            data-cursor="view"
          >
            Attachments
          </button>
          <button 
            type="button" 
            className={styles.link} 
            onClick={() => scrollToSection("skills")}
            data-cursor="view"
          >
            Skills
          </button>
          <button 
            type="button" 
            className={styles.link} 
            onClick={() => scrollToSection("about")}
            data-cursor="view"
          >
            About
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={styles.cta}
            onClick={() => scrollToSection("contact")}
            data-cursor="view"
          >
            Let's Talk
          </motion.button>
        </nav>

        <button 
          className={styles.mobileMenuBtn} 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }}></span>
          <span style={{ opacity: menuOpen ? 0 : 1 }}></span>
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }}></span>
        </button>
      </header>

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}>
        <button className={styles.link} onClick={() => scrollToSection("work")}>Work</button>
        <button className={styles.link} onClick={() => scrollToSection("attachments")}>Attachments</button>
        <button className={styles.link} onClick={() => scrollToSection("skills")}>Skills</button>
        <button className={styles.link} onClick={() => scrollToSection("about")}>About</button>
        <button 
          className={styles.cta} 
          style={{ marginTop: "1rem" }}
          onClick={() => scrollToSection("contact")}
        >
          Let's Talk
        </button>
      </div>
    </>
  );
}

