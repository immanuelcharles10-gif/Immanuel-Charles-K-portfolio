"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  FileText,
  File,
  HardDrive,
  Calendar,
  ExternalLink,
  PackageOpen,
} from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./view.module.css";

import { loadVaultItems } from "@/utils/attachmentStorage";

interface FileEntry {
  fileName: string;
  fileSize: string;
  mimeType: string;
  fileUrl: string;
}

interface AttachmentItem {
  id: string;
  type: "note" | "file";
  title?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  files?: FileEntry[];
  timestamp: number;
  dateLabel: string;
  timeLabel: string;
}

function getFileTypeName(item: AttachmentItem): string {
  if (item.type === "note") return "Text Note";
  const isBundle = Array.isArray(item.files) && item.files.length > 1;
  if (isBundle) return `${item.files!.length} Files Bundle`;
  const mime = (item.mimeType || item.files?.[0]?.mimeType || "").toLowerCase();
  const ext = (item.fileName || item.files?.[0]?.fileName || "").split(".").pop()?.toLowerCase() || "";
  return getSingleFileTypeName(mime, ext);
}

function getSingleFileTypeName(mime: string, ext: string): string {
  if (mime.startsWith("image/")) {
    if (mime.includes("png") || ext === "png") return "PNG Image";
    if (mime.includes("jpeg") || mime.includes("jpg") || ext === "jpg" || ext === "jpeg") return "JPEG Image";
    if (mime.includes("svg") || ext === "svg") return "SVG Vector";
    if (mime.includes("gif") || ext === "gif") return "GIF Animation";
    if (mime.includes("webp") || ext === "webp") return "WebP Image";
    return "Image File";
  }
  if (mime.startsWith("video/")) {
    if (mime.includes("mp4") || ext === "mp4") return "MP4 Video";
    if (mime.includes("webm") || ext === "webm") return "WebM Video";
    if (mime.includes("quicktime") || ext === "mov") return "MOV Video";
    return "Video File";
  }
  if (mime.startsWith("audio/")) {
    if (mime.includes("mpeg") || mime.includes("mp3") || ext === "mp3") return "MP3 Audio";
    if (mime.includes("wav") || ext === "wav") return "WAV Audio";
    if (mime.includes("ogg") || ext === "ogg") return "OGG Audio";
    return "Audio Track";
  }
  if (ext === "pdf" || mime.includes("pdf")) return "PDF Document";
  if (ext === "zip" || ext === "rar" || ext === "7z" || mime.includes("zip")) return "ZIP Archive";
  if (ext === "txt" || mime.includes("text/plain")) return "TXT Document";
  if (["json","js","ts","html","css"].includes(ext)) return `${ext.toUpperCase()} Source File`;
  return ext ? `${ext.toUpperCase()} File` : (mime || "Binary Document");
}

export default function RepositoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [item, setItem] = useState<AttachmentItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedFileIdx, setCopiedFileIdx] = useState<number | null>(null);

  // Ensure scroll is active
  useEffect(() => {
    document.body.style.overflow = "";
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (lenis) lenis.start();
  }, []);

  // Preloader transition & data fetching
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load items from IndexedDB / localStorage vault
    loadVaultItems().then((list) => {
      if (list && Array.isArray(list)) {
        const found = list.find((i) => i.id === itemId);
        setItem(found || null);
      }
    }).catch((err) => {
      console.error("Failed to read repository item:", err);
    });

    // Smooth loading progress animation
    let current = 0;
    const timer = setInterval(() => {
      current += Math.floor(Math.random() * 25) + 18;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => setLoading(false), 250);
      } else {
        setProgress(current);
      }
    }, 60);

    return () => clearInterval(timer);
  }, [itemId, router]);

  // GSAP 3D Scroll Perspective Animation for content card & items
  useEffect(() => {
    if (loading || !item) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const elements = document.querySelectorAll(
        `.${styles.contentCard}, .${styles.bundleFileCard}, .${styles.noteView}`
      );
      elements.forEach((el) => {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 70,
            scale: 0.94,
            rotationX: 5,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 35%",
              scrub: 0.8,
            },
          }
        );
      });
    });

    return () => {
      ctx.revert();
    };
  }, [loading, item]);

  const handleCopy = async () => {
    if (!item) return;
    try {
      if (item.type === "note") {
        const text = item.title ? `${item.title}\n\n${item.content}` : item.content || "";
        await navigator.clipboard.writeText(text);
      } else if (item.mimeType?.startsWith("image/") && item.fileUrl) {
        // Copy image as actual image blob
        const res = await fetch(item.fileUrl);
        const blob = await res.blob();
        const mimeType = blob.type || "image/png";
        const pngBlob = mimeType === "image/png" ? blob : await convertToPng(blob);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
      } else {
        // For non-image files, copy the filename + type as text
        const text = item.fileName || item.title || "";
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: copy filename
      try {
        await navigator.clipboard.writeText(item.fileName || item.title || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch { /* ignore */ }
    }
  };

  const handleFileCopy = async (f: FileEntry, idx: number) => {
    try {
      if (f.mimeType?.startsWith("image/") && f.fileUrl) {
        const res = await fetch(f.fileUrl);
        const blob = await res.blob();
        const mimeType = blob.type || "image/png";
        const pngBlob = mimeType === "image/png" ? blob : await convertToPng(blob);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
      } else {
        await navigator.clipboard.writeText(f.fileName || "");
      }
      setCopiedFileIdx(idx);
      setTimeout(() => setCopiedFileIdx(null), 1800);
    } catch {
      try {
        await navigator.clipboard.writeText(f.fileName || "");
        setCopiedFileIdx(idx);
        setTimeout(() => setCopiedFileIdx(null), 1800);
      } catch { /* ignore */ }
    }
  };

  // Helper: draw blob on canvas and export as PNG blob
  async function convertToPng(blob: Blob): Promise<Blob> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => resolve(b || blob), "image/png");
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
      img.src = url;
    });
  }

  // Dedicated Homepage-style Preloader for Content View
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.topRow}>
          <span className={styles.brand}>Immanuel Charles K</span>
          <span className={styles.tagline}>Vault Content &amp; Experience</span>
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
            {progress < 100 ? "Loading vault content..." : "Content Ready."}
          </span>
          <span className={styles.percentage}>
            {progress}%
          </span>
        </div>
      </div>
    );
  }

  // If item not found
  if (!item) {
    return (
      <main className={`container ${styles.page}`}>
        <div className={styles.bgImage} />
        <div className={styles.bgOverlay} />

        <div className={styles.topBar}>
          <Link href="/attachments" className={styles.backBtn} data-cursor="view">
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </Link>
        </div>

        <div className={styles.notFoundCard}>
          <h2>Repository Item Not Found</h2>
          <p>The requested file or note could not be found in your local vault.</p>
          <Link href="/attachments" className={styles.primaryBtn} data-cursor="view">
            Return to Attachments
          </Link>
        </div>
      </main>
    );
  }

  const isBundle = item.type === "file" && Array.isArray(item.files) && item.files.length > 1;
  const isImage = !isBundle && item.mimeType?.startsWith("image/");
  const isVideo = !isBundle && item.mimeType?.startsWith("video/");
  const isAudio = !isBundle && item.mimeType?.startsWith("audio/");
  const fileTypeName = getFileTypeName(item);

  const wordCount = item.content ? item.content.trim().split(/\s+/).length : 0;
  const charCount = item.content ? item.content.length : 0;

  return (
    <main className={`container ${styles.page}`}>
      {/* Background hacker artwork */}
      <div className={styles.bgImage} />
      <div className={styles.bgOverlay} />

      {/* Top Bar with Go Back & Quick Actions */}
      <div className={styles.topBar}>
        <Link href="/attachments" className={styles.backBtn} data-cursor="view">
          <ArrowLeft size={18} />
          <span>Go Back</span>
        </Link>

        <div className={styles.actionGroup}>
          {/* Copy only for single file or note — bundles have per-file copy buttons */}
          {!isBundle && (
            <button
              className={styles.actionBtn}
              onClick={handleCopy}
              title="Copy Content"
              data-cursor="view"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          )}

          {/* Download only available for single files and notes */}
          {!isBundle && (
            <a
              href={
                item.fileUrl ||
                `data:text/plain;charset=utf-8,${encodeURIComponent(`${item.title || "Note"}\n\n${item.content || ""}`)}` 
              }
              download={
                item.fileName ||
                `${(item.title || "note").replace(/[^a-z0-9_-]/gi, "_")}.txt`
              }
              className={`${styles.actionBtn} ${styles.downloadBtn}`}
              title="Download File"
              data-cursor="view"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

      {/* Title & Subheading */}
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>Content</h1>

        {/* Subheading ONLY if note/file actually has a title */}
        {item.title && item.title.trim() !== "" && (
          <h2 className={styles.subheading}>{item.title}</h2>
        )}
      </div>

      {/* Content Display Card */}
      <div className={styles.contentCard}>
        {/* Meta Info Bar */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Calendar size={15} />
            <span>{item.dateLabel} at {item.timeLabel}</span>
          </div>
          <div className={styles.metaItem}>
            <HardDrive size={15} />
            <span>{fileTypeName}</span>
          </div>
          {item.fileSize && (
            <div className={styles.metaItem}>
              <File size={15} />
              <span>{item.fileSize}</span>
            </div>
          )}
          {item.type === "note" && (
            <div className={styles.metaItem}>
              <FileText size={15} />
              <span>{wordCount} words · {charCount} chars</span>
            </div>
          )}
        </div>

        {/* Text Note Content View */}
        {item.type === "note" && item.content && (
          <div className={styles.noteView}>
            <div className={styles.noteText}>{item.content}</div>
          </div>
        )}

        {/* File / Media Content View */}
        {item.type === "file" && (
          <div className={styles.fileView}>
            {/* Multi-file bundle: render each file in a grid */}
            {isBundle ? (
              <div className={styles.bundleGrid}>
                <div className={styles.bundleGridHeader}>
                  <PackageOpen size={20} />
                  <span>{item.files!.length} files in this repository</span>
                </div>
                {item.files!.map((f, fi) => {
                  const fMime = (f.mimeType || "").toLowerCase();
                  const fExt = f.fileName.split(".").pop()?.toLowerCase() || "";
                  const fIsImage = fMime.startsWith("image/");
                  const fIsVideo = fMime.startsWith("video/");
                  const fIsAudio = fMime.startsWith("audio/");
                  const fTypeName = getSingleFileTypeName(fMime, fExt);
                  return (
                    <div key={fi} className={styles.bundleFileCard}>
                      <div className={styles.bundleFileCardHeader}>
                        <span className={styles.bundleFileCardName}>{f.fileName}</span>
                        <div className={styles.bundleFileCardActions}>
                          <span className={styles.bundleFileCardType}>{fTypeName}</span>
                          <span className={styles.bundleFileCardSize}>{f.fileSize}</span>
                          <button
                            className={styles.bundleFileCopyBtn}
                            title={`Copy ${f.mimeType?.startsWith("image/") ? "image" : "filename"}`}
                            onClick={() => handleFileCopy(f, fi)}
                            data-cursor="view"
                          >
                            {copiedFileIdx === fi ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                          <a
                            href={f.fileUrl}
                            download={f.fileName}
                            className={styles.bundleFileDownloadBtn}
                            title={`Download ${f.fileName}`}
                            data-cursor="view"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                      <div className={styles.bundleFilePreview}>
                        {fIsImage && (
                          <img src={f.fileUrl} alt={f.fileName} className={styles.bundlePreviewImg} />
                        )}
                        {fIsVideo && (
                          <video src={f.fileUrl} controls className={styles.bundlePreviewVideo} />
                        )}
                        {fIsAudio && (
                          <audio src={f.fileUrl} controls className={styles.bundlePreviewAudio} />
                        )}
                        {!fIsImage && !fIsVideo && !fIsAudio && (
                          <div className={styles.bundleFileIconPlaceholder}>
                            <File size={32} />
                            <span>{fExt.toUpperCase() || "FILE"}</span>
                            <a
                              href={f.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.openExternalBtn}
                              data-cursor="view"
                            >
                              <ExternalLink size={14} />
                              <span>Open</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single file view
              <>
                {isImage && (
                  <div className={styles.imagePreviewWrapper}>
                    <img src={item.fileUrl} alt={item.title || item.fileName || "File"} className={styles.fullImage} />
                  </div>
                )}

                {isVideo && (
                  <div className={styles.videoPreviewWrapper}>
                    <video src={item.fileUrl} controls autoPlay muted className={styles.fullVideo} />
                  </div>
                )}

                {isAudio && (
                  <div className={styles.audioPreviewWrapper}>
                    <audio src={item.fileUrl} controls className={styles.fullAudio} />
                  </div>
                )}

                {!isImage && !isVideo && !isAudio && (
                  <div className={styles.fileBoxPlaceholder}>
                    <File size={64} className={styles.largeFileIcon} />
                    <h3 className={styles.fileNameTitle}>{item.fileName || item.title || "File Attachment"}</h3>
                    <p className={styles.fileSubMeta}>{fileTypeName} · {item.fileSize}</p>
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.openExternalBtn}
                        data-cursor="view"
                      >
                        <ExternalLink size={16} />
                        <span>Open in New Tab</span>
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
