"use client";

import { useState, useRef } from "react";
import styles from "./Contact.module.css";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const avatarCardRef = useRef<HTMLDivElement>(null);

  // 3D Magnetic Tilt Values for Apple-style mouse interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 180, damping: 28 });
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 180, damping: 28 });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 180, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!avatarCardRef.current) return;
    const rect = avatarCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus("loading");
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        // Fallback: save directly to Firebase Firestore from client
        try {
          const { db } = await import("@/lib/firebase");
          const { collection, addDoc } = await import("firebase/firestore");
          await addDoc(collection(db, "messages"), {
            name: formData.name,
            email: formData.email,
            message: formData.message,
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
            read: false,
          });
          setStatus("success");
          setFormData({ name: "", email: "", message: "" });
          return;
        } catch (clientFsErr: any) {
          console.warn("Client-side Firebase save status:", clientFsErr?.message || clientFsErr);
        }
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
      }
    } catch (err) {
      // Network Fallback: save directly to Firebase Firestore from client
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "messages"), {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          createdAt: new Date().toISOString(),
          timestamp: Date.now(),
          read: false,
        });
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        return;
      } catch (clientFsErr: any) {
        console.warn("Client-side Firebase save status:", clientFsErr?.message || clientFsErr);
      }
      setStatus("error");
      setErrorMsg("Failed to send message. Please try again.");
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
    <section className={`container ${styles.section}`} id="contact">
      <div className={styles.sectionHeader}>
        <h2 className={styles.heading}>Have an idea?<br/>Let's build it.</h2>
        <p className={styles.subheading}>Tell me what you're working on.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.formBox}>
          <div className={styles.formBoxHeader}>
            <p className={styles.formBoxEyebrow}>✦ Get in touch</p>
            <h3 className={styles.formBoxTitle}>Drop me a message</h3>
            <p className={styles.formBoxSub}>
              Fill in your details below and I'll get back to you as soon as possible.
            </p>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Name</label>
              <input 
                type="text" 
                id="name" 
                className={styles.input} 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input 
                type="email" 
                id="email" 
                className={styles.input} 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="message" className={styles.label}>Message</label>
              <textarea 
                id="message" 
                className={styles.textarea} 
                required 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={status === "loading"}
              data-cursor="view"
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && (
              <div className={`${styles.statusMessage} ${styles.success}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Thank you! Your message was sent successfully. I'll get back to you soon.</span>
              </div>
            )}
            {status === "error" && (
              <div className={`${styles.statusMessage} ${styles.error}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        <div className={styles.directColumn}>
          {/* Avatar placed at top of Connect Directly section */}
          <div className={styles.avatarContainer}>
            <motion.div
              ref={avatarCardRef}
              className={styles.avatarCardWrapper}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              data-cursor="view"
            >
              {/* Dynamic shimmer highlight */}
              <motion.div
                className={styles.shimmer}
                style={{
                  background: useTransform(
                    [glowX, glowY],
                    ([x, y]) =>
                      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.13) 0%, transparent 65%)`
                  ),
                }}
              />

              {/* Outer ring glow */}
              <div className={styles.outerGlow} />

              {/* Image */}
              <div className={styles.avatarImageWrap}>
                <img
                  src="/hero_avatar.png"
                  alt="Immanuel Charles K"
                  className={styles.avatarImage}
                />
                <div className={styles.imageFade} />
              </div>

              {/* Decorative corner accents */}
              <div className={`${styles.corner} ${styles.cornerTL}`} />
              <div className={`${styles.corner} ${styles.cornerTR}`} />
              <div className={`${styles.corner} ${styles.cornerBL}`} />
              <div className={`${styles.corner} ${styles.cornerBR}`} />
            </motion.div>
          </div>

          <div className={styles.formBoxHeader}>
            <p className={styles.formBoxEyebrow}>✦ Direct channels</p>
            <h3 className={styles.formBoxTitle}>Connect directly</h3>
            <p className={styles.formBoxSub}>
              You can contact me via these platforms:
            </p>
          </div>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                <span className={styles.label}>WhatsApp</span>
              </div>
              <a href="https://wa.me/7736588339" target="_blank" rel="noopener noreferrer" className={styles.detailLinkBox} data-cursor="view">
                <span>+91 7736588339</span>
                <span className={styles.arrowIcon}>↗</span>
              </a>
            </div>
            
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span className={styles.label}>Email</span>
              </div>
              <a href="mailto:immanuelcharles10@gmail.com" className={styles.detailLinkBox} data-cursor="view">
                <span>immanuelcharles10@gmail.com</span>
                <span className={styles.arrowIcon}>↗</span>
              </a>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                <span className={styles.label}>GitHub</span>
              </div>
              <a href="https://github.com/immanuelcharles10-gif?tab=repositories" target="_blank" rel="noopener noreferrer" className={styles.detailLinkBox} data-cursor="view">
                <span>@immanuelcharles10-gif</span>
                <span className={styles.arrowIcon}>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Immanuel Charles K</div>
        <div className={styles.footerRole}>Creative Technologist</div>
        
        <div className={styles.footerLinks}>
          <button type="button" onClick={() => scrollToSection("work")} className={styles.footerLink}>Work</button>
          <button type="button" onClick={() => scrollToSection("skills")} className={styles.footerLink}>Skills</button>
          <button type="button" onClick={() => scrollToSection("about")} className={styles.footerLink}>About</button>
          <button type="button" onClick={() => scrollToSection("contact")} className={styles.footerLink}>Contact</button>
          <a href="https://github.com/immanuelcharles10-gif?tab=repositories" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>GitHub</a>
          <a href="https://wa.me/7736588339" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>WhatsApp</a>
          <a href="mailto:immanuelcharles10@gmail.com" className={styles.footerLink}>Email</a>
        </div>
        
        <div className={styles.copyright}>
          © 2026 Immanuel Charles K
        </div>
      </footer>
    </section>
  );
}
