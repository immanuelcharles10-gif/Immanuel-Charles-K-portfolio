"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  File,
  Copy,
  Check,
  Plus,
  Clock,
  ChevronDown,
  Layers,
  Loader2,
  Eye,
  Maximize2,
  X,
  PackageOpen,
} from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./attachments.module.css";

import { loadVaultItems, addVaultItem, deleteVaultItem, uploadFileToStorage } from "@/utils/attachmentStorage";

export interface FileEntry {
  fileName: string;
  fileSize: string;
  mimeType: string;
  fileUrl: string;
}

export interface AttachmentItem {
  id: string;
  type: "note" | "file";
  title?: string;
  content?: string;
  // Single-file fields (legacy / note downloads)
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  // Multi-file bundle
  files?: FileEntry[];
  timestamp: number;
  dateLabel: string;
  timeLabel: string;
}

function groupByDate(items: AttachmentItem[]) {
  const groups: Record<string, AttachmentItem[]> = {};
  items.forEach((item) => {
    const key = item.dateLabel;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

function getFileTypeName(item: AttachmentItem): string {
  if (item.type === "note") return "Text Note";
  const mime = (item.mimeType || "").toLowerCase();
  const ext = (item.fileName || "").split(".").pop()?.toLowerCase() || "";

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
  if (ext === "json" || ext === "js" || ext === "ts" || ext === "html" || ext === "css") return `${ext.toUpperCase()} Source File`;

  return ext ? `${ext.toUpperCase()} File` : (mime || "Binary Document");
}

export default function AttachmentsPage() {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Preloader loading screen states
  const [pageLoading, setPageLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Deleting item ids for smooth exit animation
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Loading states for pagination buttons
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Note form & expanded editor animation state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [isClosingEditor, setIsClosingEditor] = useState(false);

  // Staged File Uploads
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isPublishingFiles, setIsPublishingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ensure body scroll is always unlocked on this page
  useEffect(() => {
    document.body.style.overflow = "";
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (lenis) lenis.start();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const fetchItems = useCallback(async () => {
    const firestoreItems = await loadVaultItems();
    setItems(firestoreItems);
  }, []);

  // Load items from Firestore on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsUnlocked(true);

    const triggered = sessionStorage.getItem("trigger_attachments_loader") === "true";
    if (triggered) {
      sessionStorage.removeItem("trigger_attachments_loader");
    }

    fetchItems();

    // Smooth preloader loading animation
    let curr = 0;
    const timer = setInterval(() => {
      curr += Math.floor(Math.random() * 22) + 16;
      if (curr >= 100) {
        curr = 100;
        setLoadProgress(100);
        clearInterval(timer);
        setTimeout(() => setPageLoading(false), 240);
      } else {
        setLoadProgress(curr);
      }
    }, 45);

    return () => {
      clearInterval(timer);
    };
  }, [fetchItems]);

  const makeTimestamp = () => {
    const now = new Date();
    return {
      timestamp: now.getTime(),
      dateLabel: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timeLabel: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const trimmedTitle = noteTitle.trim();
    const newItem: AttachmentItem = {
      id: "note-" + Date.now(),
      type: "note",
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      content: noteContent.trim(),
      ...makeTimestamp(),
    };
    await addVaultItem(newItem);
    await fetchItems();
    setNoteTitle("");
    setNoteContent("");
    closeExpandedEditor();
  };

  const closeExpandedEditor = () => {
    setIsClosingEditor(true);
    setTimeout(() => {
      setIsNoteExpanded(false);
      setIsClosingEditor(false);
    }, 280);
  };

  const handleStageFiles = (files: FileList | Array<File> | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    if (incoming.length === 0) return;
    setStagedFiles((prev) => [...prev, ...incoming]);
    setSaveError(null);
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublishStagedFiles = async () => {
    if (stagedFiles.length === 0 || isPublishingFiles) return;
    setIsPublishingFiles(true);
    setSaveError(null);

    const ts = makeTimestamp();
    const bundleId = "file-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    try {
      // Upload all files to Firebase Storage in parallel
      const uploadPromises = stagedFiles.map(async (file): Promise<FileEntry> => {
        const formData = new FormData();
        formData.append("file", file);
        const downloadUrl = await uploadFileToStorage(formData, bundleId);
        return {
          fileName: file.name,
          fileSize:
            file.size >= 1024 * 1024
              ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
              : (file.size / 1024).toFixed(1) + " KB",
          mimeType: file.type || "application/octet-stream",
          fileUrl: downloadUrl,
        };
      });

      const fileEntries = await Promise.all(uploadPromises);

      const bundleItem: AttachmentItem = {
        id: bundleId,
        type: "file",
        ...(fileEntries.length === 1
          ? {
              title: fileEntries[0].fileName,
              fileName: fileEntries[0].fileName,
              fileSize: fileEntries[0].fileSize,
              mimeType: fileEntries[0].mimeType,
              fileUrl: fileEntries[0].fileUrl,
            }
          : {
              title: `${fileEntries.length} Repository Files`,
            }),
        files: fileEntries,
        ...ts,
      };

      await addVaultItem(bundleItem);
      await fetchItems();
      setStagedFiles([]);
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveError("Could not upload files. Check your connection and try again.");
    } finally {
      setIsPublishingFiles(false);
    }
  };

  const handleDelete = (id: string) => {
    if (deletingIds.includes(id)) return;
    setDeletingIds((prev) => [...prev, id]);

    setTimeout(async () => {
      await deleteVaultItem(id);
      await fetchItems();
      setDeletingIds((prev) => prev.filter((item) => item !== id));
    }, 500);
  };

  // GSAP 3D Scroll Perspective Animation for all cards & columns
  useEffect(() => {
    if (pageLoading) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = document.querySelectorAll(`.${styles.card}, .${styles.repoCard}`);
      cards.forEach((card) => {
        gsap.fromTo(
          card,
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
              trigger: card,
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
  }, [pageLoading, items, visibleCount]);

  const handleCopy = async (item: AttachmentItem) => {
    const text = item.type === "note"
      ? (item.title ? `${item.title}\n\n${item.content}` : item.content || "")
      : item.fileName || item.title || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch { /* ignore */ }
  };

  const handleLoadNext = () => {
    if (isLoadingNext) return;
    setIsLoadingNext(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 5, items.length));
      setIsLoadingNext(false);
    }, 450);
  };

  const handleLoadAll = () => {
    if (isLoadingAll) return;
    setIsLoadingAll(true);
    setTimeout(() => {
      setVisibleCount(items.length);
      setIsLoadingAll(false);
    }, 450);
  };

  if (isUnlocked === null || pageLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.topRow}>
          <span className={styles.brand}>Immanuel Charles K</span>
          <span className={styles.tagline}>Attachments Vault</span>
        </div>

        <div className={styles.centerContent}>
          <div className={styles.monogram}>ICK</div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <span className={styles.statusText}>
            {loadProgress < 100 ? "Unlocking vault security..." : "Vault Unlocked."}
          </span>
          <span className={styles.percentage}>
            {loadProgress}%
          </span>
        </div>
      </div>
    );
  }

  // Sort items newest first
  const sortedItems = [...items].sort((a, b) => b.timestamp - a.timestamp);

  // Slice based on visibleCount for pagination
  const visibleItems = sortedItems.slice(0, visibleCount);

  // Group visible items by date
  const grouped = groupByDate(visibleItems);
  const dateKeys = Object.keys(grouped).sort((a, b) => {
    const aTs = grouped[a][0].timestamp;
    const bTs = grouped[b][0].timestamp;
    return bTs - aTs; // newest first
  });

  return (
    <main className={`container ${styles.page}`}>
      {/* Cinematic Hacker Background Image */}
      <div className={styles.bgImage} />
      <div className={styles.bgOverlay} />

      {/* Fullscreen Note Editor Overlay */}
      {isNoteExpanded && (
        <div
          className={`${styles.fullscreenEditorOverlay} ${
            isClosingEditor ? styles.fullscreenEditorOverlayClosing : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeExpandedEditor();
          }}
        >
          <div
            className={`${styles.fullscreenEditorCard} ${
              isClosingEditor ? styles.fullscreenEditorCardClosing : ""
            }`}
          >
            <div className={styles.fullscreenHeader}>
              <div className={styles.fullscreenTitleGroup}>
                <FileText size={22} />
                <span>Expanded Note Editor</span>
              </div>
              <button
                type="button"
                className={styles.doneBtn}
                onClick={closeExpandedEditor}
                data-cursor="view"
              >
                <Check size={18} />
                <span>Done Formatting</span>
              </button>
            </div>

            <input
              type="text"
              placeholder="Note Title (Optional)..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className={styles.fullscreenInput}
            />

            <textarea
              placeholder="Type your formatted note content here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className={styles.fullscreenTextarea}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.backBtn} data-cursor="view">
          <ArrowLeft size={18} />
          <span>Back to Portfolio</span>
        </Link>
        <div className={styles.statusBadge}>
          <ShieldCheck size={16} />
          <span>Vault Unlocked</span>
        </div>
      </div>

      {/* Page header */}
      <div className={styles.header}>
        <h1 className={styles.heading}>Attachments Vault</h1>
        <p className={styles.subheading}>
          Upload, preview, and store text notes, media files, documents, and project assets.
        </p>
      </div>

      {/* Two-column upload panels */}
      <div className={styles.gridTwo}>
        {/* Note Publisher */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}><FileText size={22} /></div>
            <h2 className={styles.cardTitle}>Create Text Note</h2>
          </div>
          <form onSubmit={handleAddNote} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Note Title <span className={styles.optionalTag}>(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="E.g. Technical Specs... (Optional)"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Content</label>
                <button
                  type="button"
                  className={styles.expandIconBtn}
                  onClick={() => setIsNoteExpanded(true)}
                  title="Expand Fullscreen Editor"
                  data-cursor="view"
                >
                  <Maximize2 size={15} />
                  <span>Expand</span>
                </button>
              </div>
              <textarea
                placeholder="Type your note details here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className={styles.textarea}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} data-cursor="view">
              <Plus size={18} />
              <span>Publish Note</span>
            </button>
          </form>
        </div>

        {/* File Uploader */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}><UploadCloud size={22} /></div>
            <h2 className={styles.cardTitle}>Upload Files</h2>
          </div>

          {/* Hidden file input — shared by drop zone and add-more button */}
          <input
            type="file"
            ref={fileInputRef}
            className={styles.fileInput}
            multiple
            onChange={(e) => { handleStageFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }}
          />

          {/* Drop zone — always visible so user can keep adding files */}
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleStageFiles(e.dataTransfer.files);
            }}
          >
            <UploadCloud size={44} className={styles.uploadIcon} />
            <p className={styles.uploadText}>
              {isDragging ? "Drop files here!" : "Click or Drag & Drop Files"}
            </p>
            <p className={styles.uploadSub}>Images · Videos · Audio · PDF · ZIP · Docs</p>
          </div>

          {/* Staged files list — shown whenever files are selected */}
          {stagedFiles.length > 0 && (
            <div className={styles.stagedContainer}>
              <div className={styles.stagedHeader}>
                <span>
                  {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} selected
                  {stagedFiles.length > 1 && (
                    <span className={styles.bundleNote}> · will be saved as 1 repository</span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={() => setStagedFiles([])}
                  data-cursor="view"
                >
                  <X size={13} />
                  <span>Clear all</span>
                </button>
              </div>

              <div className={styles.stagedList}>
                {stagedFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className={styles.stagedItem}>
                    <File size={16} />
                    <span className={styles.stagedFileName}>{file.name}</span>
                    <span className={styles.stagedFileSize}>
                      {file.size >= 1024 * 1024
                        ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
                        : (file.size / 1024).toFixed(1) + " KB"}
                    </span>
                    <button
                      type="button"
                      className={styles.removeStagedBtn}
                      onClick={() => handleRemoveStagedFile(idx)}
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={styles.publishFilesBtn}
                onClick={handlePublishStagedFiles}
                disabled={isPublishingFiles}
                data-cursor="view"
              >
                {isPublishingFiles ? (
                  <Loader2 size={18} className={styles.spinnerIcon} />
                ) : (
                  <PackageOpen size={18} />
                )}
                <span>
                  {isPublishingFiles
                    ? "Publishing Repository..."
                    : stagedFiles.length > 1
                      ? `Publish ${stagedFiles.length} Files as 1 Repository`
                      : "Publish File"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Repository timeline */}
      <div className={styles.repoSection}>
        <div className={styles.repoHeader}>
          <Clock size={20} />
          <h2 className={styles.repoTitle}>
            Repository ({items.length} entries total — showing {visibleItems.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            No attachments yet. Use the panels above to publish a note or upload files.
          </div>
        ) : (
          <>
            <div className={styles.timeline}>
              {dateKeys.map((dateKey) => (
                <div key={dateKey} className={styles.dateGroup}>
                  <div className={styles.dateHeading}>
                    <span className={styles.dateDot} />
                    <span>{dateKey}</span>
                  </div>

                  <div className={styles.dateItems}>
                    {grouped[dateKey].map((item, idx) => {
                      const isDeleting = deletingIds.includes(item.id);
                      // Multi-file bundle detection
                      const isBundle = item.type === "file" && Array.isArray(item.files) && item.files.length > 1;
                      const primaryFile = item.files?.[0];
                      // For display purposes use primary file or legacy fields
                      const displayMime = primaryFile?.mimeType || item.mimeType || "";
                      const isImage = displayMime.startsWith("image/") && !isBundle;
                      const isVideo = displayMime.startsWith("video/") && !isBundle;
                      const isAudio = displayMime.startsWith("audio/") && !isBundle;
                      const fileTypeName = isBundle
                        ? `${item.files!.length} Files`
                        : getFileTypeName(item);

                      return (
                        <div
                          key={item.id}
                          className={`${styles.repoCard} ${isDeleting ? styles.repoCardDeleting : ""}`}
                          style={{ animationDelay: `${0.05 * (idx + 1)}s` }}
                        >
                          {/* Media / Bundle preview */}
                          {item.type === "file" && (
                            <div className={styles.mediaPreview}>
                              {isBundle ? (
                                // Multi-file bundle preview — icon grid
                                <div className={styles.bundlePreview}>
                                  <PackageOpen size={36} />
                                  <span className={styles.bundleCount}>{item.files!.length} files bundled</span>
                                  <div className={styles.bundleFileTypes}>
                                    {item.files!.slice(0, 4).map((f, fi) => (
                                      <span key={fi} className={styles.bundleFileTag}>
                                        {f.fileName.split(".").pop()?.toUpperCase() || "FILE"}
                                      </span>
                                    ))}
                                    {item.files!.length > 4 && (
                                      <span className={styles.bundleFileTag}>+{item.files!.length - 4}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {isImage && <img src={item.fileUrl} alt={item.title || item.fileName || "File"} className={styles.mediaImg} />}
                                  {isVideo && <video src={item.fileUrl} controls className={styles.mediaVideo} />}
                                  {isAudio && <audio src={item.fileUrl} controls className={styles.mediaAudio} />}
                                  {!isImage && !isVideo && !isAudio && (
                                    <div className={styles.filePlaceholder}>
                                      <File size={38} />
                                      <span>{(item.fileName || primaryFile?.fileName || "").split(".").pop()?.toUpperCase()}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          <div className={styles.repoCardBody}>
                            <div className={styles.repoMeta}>
                              <span className={`${styles.repoTypeTag} ${isBundle ? styles.bundleTag : ""}`}>
                                {isBundle && <PackageOpen size={12} />}
                                {fileTypeName}
                              </span>
                              <span className={styles.repoTime}><Clock size={13} /> {item.timeLabel}</span>
                            </div>

                            {/* Only render title if item actually has one */}
                            {item.title && item.title.trim() !== "" && (
                              <h3 className={styles.repoItemTitle}>{item.title}</h3>
                            )}

                            {item.content && <p className={styles.repoItemContent}>{item.content}</p>}

                            {/* For multi-file bundles: show file names */}
                            {isBundle && (
                              <div className={styles.bundleFileList}>
                                {item.files!.slice(0, 3).map((f, fi) => (
                                  <span key={fi} className={styles.bundleFileItem}>
                                    <File size={11} /> {f.fileName}
                                  </span>
                                ))}
                                {item.files!.length > 3 && (
                                  <span className={styles.bundleFileItem}>+{item.files!.length - 3} more</span>
                                )}
                              </div>
                            )}

                            {/* Single file size */}
                            {!isBundle && item.fileSize && <p className={styles.repoItemMeta}>{item.fileSize}</p>}

                            <div className={styles.repoActions}>
                              <Link
                                href={`/attachments/${item.id}`}
                                className={styles.iconBtn}
                                title="View Content"
                                data-cursor="view"
                              >
                                <Eye size={16} />
                              </Link>
                              <button
                                className={styles.iconBtn}
                                onClick={() => handleCopy(item)}
                                title="Copy"
                                data-cursor="view"
                              >
                                {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                              {/* Download only if single file */}
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
                                  className={styles.iconBtn}
                                  title="Download"
                                  data-cursor="view"
                                >
                                  <Download size={16} />
                                </a>
                              )}
                              <button
                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                onClick={() => handleDelete(item.id)}
                                title="Delete"
                                data-cursor="view"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                     })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className={styles.loadControls}>
              {visibleCount < items.length && (
                <>
                  <button
                    className={styles.loadBtn}
                    onClick={handleLoadNext}
                    disabled={isLoadingNext || isLoadingAll}
                    data-cursor="view"
                  >
                    {isLoadingNext ? (
                      <Loader2 size={18} className={styles.spinnerIcon} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                    <span>{isLoadingNext ? "Loading Repositories..." : "Load Next 5 Repositories"}</span>
                  </button>

                  <button
                    className={`${styles.loadBtn} ${styles.loadAllBtn}`}
                    onClick={handleLoadAll}
                    disabled={isLoadingNext || isLoadingAll}
                    data-cursor="view"
                  >
                    {isLoadingAll ? (
                      <Loader2 size={18} className={styles.spinnerIcon} />
                    ) : (
                      <Layers size={18} />
                    )}
                    <span>{isLoadingAll ? "Loading All..." : `Load All (${items.length})`}</span>
                  </button>
                </>
              )}

              {visibleCount > 5 && items.length > 5 && (
                <button
                  className={`${styles.loadBtn} ${styles.showLessBtn}`}
                  onClick={() => setVisibleCount(5)}
                  disabled={isLoadingNext || isLoadingAll}
                  data-cursor="view"
                >
                  <span>Show Last 5 Only</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
