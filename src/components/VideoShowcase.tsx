"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./VideoShowcase.module.css";

export default function VideoShowcase() {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      }
    );
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <section className={`container ${styles.section}`} ref={containerRef}>
      <h2 className={styles.heading}>Motion. Story. Impact.</h2>
      
      <div 
        className={styles.videoWrapper} 
        onClick={togglePlay}
        data-cursor="play"
      >
        {/* Placeholder video source */}
        <video 
          ref={videoRef}
          className={styles.video}
          poster="/background-frames/frame_001.png"
          src="/showcase-video.mp4"
          loop
          muted={isMuted}
          playsInline
        />

        <div className={`${styles.playButton} ${isPlaying ? styles.hidden : ""}`}>
          <Play fill="currentColor" size={32} />
        </div>

        <div className={styles.controls} onClick={e => e.stopPropagation()}>
          <button className={styles.controlBtn} onClick={togglePlay}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.controlBtn} onClick={toggleMute}>
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <button className={styles.controlBtn} onClick={toggleFullscreen}>
              <Maximize size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
