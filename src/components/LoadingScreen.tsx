"use client";

import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

/** Inner component — hooks always called in the same order, no conditional logic */
function LoadingScreenInner() {
  const [progress, setProgress] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Lock scrolling while preloader is active
    document.body.style.overflow = "hidden";
    if (typeof window !== "undefined" && (window as any).__lenis) {
      (window as any).__lenis.stop();
    }

    let targetProgress = 0;
    let isBgReady = typeof window !== "undefined" && !!(window as any).__bgLoaded;

    const handleProgress = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.progress === "number") {
        targetProgress = Math.max(targetProgress, customEvent.detail.progress);
      }
    };

    const handleLoaded = () => {
      isBgReady = true;
      targetProgress = 100;
    };

    window.addEventListener("bgCanvasProgress", handleProgress);
    window.addEventListener("bgCanvasLoaded", handleLoaded);

    const startTime = Date.now();
    let isLeavingTriggered = false;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const minProgress = Math.min(95, Math.floor((elapsed / 650) * 100));
      const currentTarget = Math.max(minProgress, targetProgress);

      setProgress((prev) => {
        if (prev >= 100) return 100;
        const diff = currentTarget - prev;
        const step = Math.max(2, Math.ceil(diff * 0.25));
        const next = Math.min(100, prev + step);

        if (next >= 100 && !isLeavingTriggered && (isBgReady || elapsed > 800)) {
          isLeavingTriggered = true;
          setTimeout(() => setIsLeaving(true), 200);
          return 100;
        }

        return next;
      });
    }, 40);

    // Failsafe: force exit after 2.0 seconds max
    const failsafe = setTimeout(() => {
      clearInterval(timer);
      setProgress(100);
      setIsLeaving(true);
    }, 2000);

    return () => {
      window.removeEventListener("bgCanvasProgress", handleProgress);
      window.removeEventListener("bgCanvasLoaded", handleLoaded);
      clearInterval(timer);
      clearTimeout(failsafe);
      document.body.style.overflow = "";
      if (typeof window !== "undefined" && (window as any).__lenis) {
        (window as any).__lenis.start();
      }
    };
  }, []);

  useEffect(() => {
    if (isLeaving) {
      const timer = setTimeout(() => {
        setIsHidden(true);
        document.body.style.overflow = "";
        if (typeof window !== "undefined" && (window as any).__lenis) {
          (window as any).__lenis.start();
        }
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isLeaving]);

  if (isHidden) return null;

  return (
    <div
      className={`${styles.overlay} ${isLeaving ? styles.overlayLeaving : ""}`}
      onTouchMove={(e) => {
        if (!isLeaving) e.preventDefault();
      }}
    >
      <div className={styles.topRow}>
        <span className={styles.brand}>Immanuel Charles K</span>
        <span className={styles.tagline}>Portfolio &amp; Experience</span>
      </div>

      <div className={styles.centerContent}>
        <div className={styles.monogram}>ICK</div>
        <div className={styles.progressContainer}>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <span className={styles.statusText}>
          {progress < 100 ? "Loading creative experience..." : "Experience Ready."}
        </span>
        <span className={styles.percentage}>
          {progress}%
        </span>
      </div>
    </div>
  );
}

/**
 * Public export — wraps the inner component.
 * Uses usePathname in the wrapper so the inner component's hooks
 * are always called in the exact same order regardless of route.
 */
import { usePathname } from "next/navigation";

export default function LoadingScreen() {
  const pathname = usePathname();
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    if (pathname === "/" && typeof window !== "undefined") {
      const triggered = sessionStorage.getItem("trigger_home_loader") === "true";
      if (triggered) {
        sessionStorage.removeItem("trigger_home_loader");
        setRemountKey((prev) => prev + 1);
      }
    }
  }, [pathname]);

  // Only show the loading screen on the home page.
  // Returning null here means LoadingScreenInner is never mounted
  // on other routes, so its hooks never fire and can't lock scroll.
  if (pathname !== "/") return null;

  return <LoadingScreenInner key={remountKey} />;
}
