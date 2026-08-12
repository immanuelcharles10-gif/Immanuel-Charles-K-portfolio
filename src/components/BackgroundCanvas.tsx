"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const airpodsRef = useRef({ frame: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastRenderedFrameRef = useRef(-1);

  const frameCount = 142;

  const render = (force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const currentFrameIndex = Math.round(airpodsRef.current.frame);
    if (!force && currentFrameIndex === lastRenderedFrameRef.current) return;

    const images = imagesRef.current;
    let img = images[currentFrameIndex];

    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let i = currentFrameIndex - 1; i >= 0; i--) {
        if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
          img = images[i];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let i = currentFrameIndex + 1; i < frameCount; i++) {
        if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
          img = images[i];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const zoomFactor = 1.35;
    const ratio = Math.max(hRatio, vRatio) * zoomFactor;

    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 0.6;
    context.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
    );

    lastRenderedFrameRef.current = currentFrameIndex;
  };

  // Image Preloading (once on mount)
  useEffect(() => {
    const isTouchDevice =
      typeof window !== "undefined" &&
      (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

    if (isTouchDevice) {
      (window as any).__bgLoaded = true;
      window.dispatchEvent(new CustomEvent("bgCanvasLoaded"));
      return;
    }

    const currentFrame = (index: number) =>
      `/background-frames/frame_${(index + 1).toString().padStart(3, "0")}.png`;

    let isCancelled = false;
    let loadedCount = 0;

    const loadFrame = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) return resolve(imagesRef.current[index]);
        const img = new Image();
        img.src = currentFrame(index);
        img.onload = () => {
          imagesRef.current[index] = img;
          loadedCount++;

          const initialPct = Math.min(100, Math.round((loadedCount / 20) * 100));
          window.dispatchEvent(new CustomEvent("bgCanvasProgress", { detail: { progress: initialPct } }));

          if (index === 0) {
            (window as any).__bgLoaded = true;
            render(true);
          }
          resolve(img);
        };
        img.onerror = () => {
          loadedCount++;
          resolve(img);
        };
      });
    };

    loadFrame(0);

    const loadBatchFrames = async () => {
      const batchSize = 6;
      for (let i = 1; i < frameCount; i += batchSize) {
        if (isCancelled) break;
        const batchPromises: Promise<HTMLImageElement>[] = [];
        for (let j = i; j < Math.min(i + batchSize, frameCount); j++) {
          batchPromises.push(loadFrame(j));
        }
        await Promise.all(batchPromises);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      (window as any).__bgLoaded = true;
      window.dispatchEvent(new CustomEvent("bgCanvasLoaded"));
    };

    loadBatchFrames();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Setup / Re-setup GSAP ScrollTrigger & canvas sizing whenever route or window resizes
  useEffect(() => {
    const isTouchDevice =
      typeof window !== "undefined" &&
      (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

    if (isTouchDevice) return;

    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      lastRenderedFrameRef.current = -1;
      render(true);
    };

    resizeCanvas();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      resizeCanvas();
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Clean up existing tween/trigger if any
    if (tweenRef.current) {
      if (tweenRef.current.scrollTrigger) {
        tweenRef.current.scrollTrigger.kill();
      }
      tweenRef.current.kill();
      tweenRef.current = null;
    }

    // Create fresh ScrollTrigger tween for canvas frames
    tweenRef.current = gsap.to(airpodsRef.current, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: () => render(false),
      },
      onUpdate: () => render(false),
    });

    // Refresh ScrollTrigger after route transition DOM settles
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
      render(true);
    }, 120);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      clearTimeout(resizeTimeout);
      clearTimeout(refreshTimer);

      if (tweenRef.current) {
        if (tweenRef.current.scrollTrigger) {
          tweenRef.current.scrollTrigger.kill();
        }
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

