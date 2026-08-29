"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Key, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import styles from "./AttachmentsSection.module.css";

export default function AttachmentsSection() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset verification state on mount and when restored from browser back-forward cache (bfcache)
  useEffect(() => {
    setIsLoading(false);
    setPassword("");
    setError(false);

    const handlePageShow = (e: PageTransitionEvent) => {
      setIsLoading(false);
      setPassword("");
      setError(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;

    setError(false);
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/vault-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("trigger_attachments_loader", "true");
          document.body.style.overflow = "";
          const lenis = (window as any).__lenis;
          if (lenis) lenis.start();
          // Reset loading state right before navigating so bfcache snapshot is never stuck
          setIsLoading(false);
          window.location.href = "/attachments";
        }
      } else {
        setError(true);
        setIsLoading(false);
      }
    } catch {
      setError(true);
      setIsLoading(false);
    }
  };

  return (
    <section className={`container ${styles.section}`} id="attachments">
      <div className={styles.header}>
        <span className={styles.titleTag}>✦ Vault &amp; Documents</span>
        <h2 className={styles.heading}>Attachments</h2>
        <p className={styles.subheading}>
          Access private files, uploaded media, project briefs, and text notes.
        </p>
      </div>

      <div className={styles.vaultCard}>
        <div className={styles.lockBgPattern}>
          <div className={styles.floatingIcon1}><Lock size={32} /></div>
          <div className={styles.floatingIcon2}><Key size={28} /></div>
          <div className={styles.floatingIcon3}><Lock size={24} /></div>
          <div className={styles.floatingIcon4}><Key size={36} /></div>
          <div className={styles.floatingIcon5}><Lock size={40} /></div>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.iconHeader}>
            <div className={styles.lockBadge}>
              <ShieldCheck size={28} />
            </div>
            <h3 className={styles.cardTitle}>Protected Vault</h3>
            <p className={styles.cardDesc}>
              Enter the passcode below to unlock the attachments repository.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIcon}>
                <Key size={18} />
              </div>
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className={`${styles.input} ${error ? styles.inputError : ""}`}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || !password}
                data-cursor="view"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            {isLoading && (
              <div className={styles.unlockingMessage}>
                <ShieldCheck size={16} />
                <span>Verifying...</span>
              </div>
            )}

            {error && !isLoading && (
              <div className={styles.errorMessage}>
                <AlertCircle size={16} />
                <span>Wrong password</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
