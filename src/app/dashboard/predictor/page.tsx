"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  UploadCloud,
  FileText,
  Video,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Copy,
  Bookmark,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Eye,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Film,
  Building2,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { BrandProfile } from "../brand/page";
import { getApiHeaders } from "@/lib/client-api";
import { ApiKeyModal } from "@/components/dashboard/ApiKeyModal";

interface MediaMeta {
  fileName: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  duration?: number;
  thumbnailUrl?: string;
}

interface SubScoreItem {
  score: number;
  weight: string;
  explanation: string;
}

interface ViralAnalysisReport {
  id: string;
  analyzedAt: string;
  platform: string;
  contentType: string;
  content: string;
  mediaMeta: MediaMeta | null;
  overallScore: number;
  tier: string;
  tierKey: string;
  subScores: {
    hookStrength: SubScoreItem;
    engagementPotential: SubScoreItem;
    contentQuality: SubScoreItem;
    audienceRelevance: SubScoreItem;
    platformSuitability: SubScoreItem;
  };
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  failureRisks: string[];
  audienceAppeal: string;
  retentionAnalysis: string;
  platformRecommendations: string[];
  actionableSuggestions: string[];
}

interface ImprovementResult {
  improvedContent: string;
  changesSummary: string;
  expectedImpact: string;
}

const platformOptions = ["Instagram", "X (Twitter)", "LinkedIn", "Facebook"];
const contentTypeOptions = [
  { id: "text", label: "Text Dispatch", icon: FileText },
  { id: "reel", label: "Reel / Video Short", icon: Video },
  { id: "image", label: "Visual & Caption", icon: ImageIcon },
  { id: "carousel", label: "Multi-Slide Carousel", icon: Film },
];

export default function ViralPredictorPage() {
  const [activeTab, setActiveTab] = useState<"analyze" | "improve" | "history">("analyze");

  // Input states
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setContentType] = useState("reel");
  const [hashtags, setHashtags] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaMeta, setMediaMeta] = useState<MediaMeta | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  // Brand profile & History
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [history, setHistory] = useState<ViralAnalysisReport[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ViralAnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Improvement states
  const [improveType, setImproveType] = useState<string>("hook");
  const [targetImprovePlatform, setTargetImprovePlatform] = useState("Instagram");
  const [isImproving, setIsImproving] = useState(false);
  const [improvement, setImprovement] = useState<ImprovementResult | null>(null);

  // Action status indicators
  const [copiedImproved, setCopiedImproved] = useState(false);
  const [savedVault, setSavedVault] = useState(false);
  const [scheduledCalendar, setScheduledCalendar] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleTitle, setScheduleTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load Brand Profile & Saved Analyses on Mount
  useEffect(() => {
    try {
      const storedBrand = localStorage.getItem("socialpilot_brand_profile");
      if (storedBrand) {
        const parsed = JSON.parse(storedBrand);
        setBrandProfile(parsed);
        if (parsed.preferredPlatform && platformOptions.includes(parsed.preferredPlatform)) {
          setPlatform(parsed.preferredPlatform);
          setTargetImprovePlatform(parsed.preferredPlatform);
        }
      }

      const storedHistory = localStorage.getItem("socialpilot_viral_analyses");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch {
      // Storage fallback
    }
  }, []);

  // Sync History to localStorage
  const saveToHistory = (newReport: ViralAnalysisReport) => {
    const updated = [newReport, ...history.filter((h) => h.id !== newReport.id)];
    setHistory(updated);
    try {
      localStorage.setItem("socialpilot_viral_analyses", JSON.stringify(updated));
    } catch {
      // Storage fallback
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("socialpilot_viral_analyses", JSON.stringify(updated));
    } catch {
      // Storage fallback
    }
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all analysis history?")) {
      setHistory([]);
      try {
        localStorage.removeItem("socialpilot_viral_analyses");
      } catch {
        // Storage fallback
      }
    }
  };

  // Handle Drag & Drop / File Upload
  const handleFileChange = (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setErrorMessage("Please upload an image (PNG, JPG, WEBP) or video (MP4, MOV, WEBM).");
      return;
    }

    if (isVideo && file.size > 100 * 1024 * 1024) {
      setErrorMessage("Video file size must be under 100MB.");
      return;
    }

    if (isImage && file.size > 20 * 1024 * 1024) {
      setErrorMessage("Image file size must be under 20MB.");
      return;
    }

    setErrorMessage(null);
    setMediaFile(file);

    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);

    if (isVideo) {
      setContentType("reel");
      const tempVideo = document.createElement("video");
      tempVideo.src = objectUrl;
      tempVideo.preload = "metadata";
      tempVideo.onloadedmetadata = () => {
        const width = tempVideo.videoWidth;
        const height = tempVideo.videoHeight;
        const duration = tempVideo.duration;

        let aspect = "16:9";
        if (width && height) {
          const ratio = width / height;
          if (ratio < 0.65) aspect = "9:16 Vertical";
          else if (ratio < 0.9) aspect = "4:5 Portrait";
          else if (ratio < 1.1) aspect = "1:1 Square";
          else aspect = "16:9 Widescreen";
        }

        // Capture frame 0 thumbnail via canvas
        let thumbUrl = "";
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(width, 320);
          canvas.height = Math.min(height, 568);
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          thumbUrl = canvas.toDataURL("image/jpeg", 0.7);
        } catch {
          // Canvas capture fallback
        }

        setMediaMeta({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          width,
          height,
          aspectRatio: aspect,
          duration,
          thumbnailUrl: thumbUrl,
        });
      };
    } else if (isImage) {
      setContentType("image");
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        let aspect = "1:1";
        if (width && height) {
          const ratio = width / height;
          if (ratio < 0.9) aspect = "4:5 Portrait";
          else if (ratio > 1.2) aspect = "16:9 Landscape";
          else aspect = "1:1 Square";
        }
        setMediaMeta({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          width,
          height,
          aspectRatio: aspect,
          thumbnailUrl: objectUrl,
        });
      };
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaMeta(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
      setMediaPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Perform Viral Analysis
  const handleAnalyze = async () => {
    if (!content.trim() && !mediaMeta) {
      setErrorMessage("Please enter post text/script or upload media to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setImprovement(null);

    try {
      const res = await fetch("/api/viral-predictor", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: "analyze",
          content: content.trim(),
          platform,
          contentType,
          hashtags: hashtags.trim(),
          mediaMeta,
          brandProfile: brandProfile || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze content.");
      }

      setReport(data);
      saveToHistory(data);
      setScheduleTitle(content.slice(0, 40) || `${platform} Dispatch`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze content.";
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Perform AI Improvement
  const handleImprove = async (typeOverride?: string) => {
    const selectedType = typeOverride || improveType;
    if (!content.trim()) {
      setErrorMessage("Please enter text copy or script to optimize.");
      return;
    }

    setIsImproving(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/viral-predictor", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: "improve",
          content: content.trim(),
          platform,
          targetPlatform: targetImprovePlatform,
          improveType: selectedType,
          previousAnalysis: report
            ? {
                overallScore: report.overallScore,
                weaknesses: report.weaknesses,
                failureRisks: report.failureRisks,
              }
            : undefined,
          brandProfile: brandProfile || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to improve content.");
      }

      setImprovement(data);
      setActiveTab("improve");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate improvement.";
      setErrorMessage(msg);
    } finally {
      setIsImproving(false);
    }
  };

  // Copy improved content
  const handleCopyImproved = async () => {
    if (!improvement) return;
    try {
      await navigator.clipboard.writeText(improvement.improvedContent);
      setCopiedImproved(true);
      setTimeout(() => setCopiedImproved(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Save improved content to Vault (Saved Posts)
  const handleSaveToVault = () => {
    if (!improvement) return;
    try {
      const existing = localStorage.getItem("socialpilot_saved_posts");
      const list = existing ? JSON.parse(existing) : [];

      const newPost = {
        id: `post_${Date.now()}`,
        mode: contentType === "reel" ? "reels" : "captions",
        topic: content.slice(0, 50) || `${platform} Optimized Dispatch`,
        tone: brandProfile?.brandTone || "Viral & Punchy",
        content: improvement.improvedContent,
        createdAt: new Date().toISOString(),
      };

      const updated = [newPost, ...list];
      localStorage.setItem("socialpilot_saved_posts", JSON.stringify(updated));
      setSavedVault(true);
      setTimeout(() => setSavedVault(false), 2500);
    } catch {
      setErrorMessage("Failed to save to Vault.");
    }
  };

  // Save improved content to Calendar
  const handleScheduleToCalendar = () => {
    if (!improvement) return;
    try {
      const existing = localStorage.getItem("socialpilot_calendar_posts");
      const list = existing ? JSON.parse(existing) : [];

      const newPost = {
        id: `cal_${Date.now()}`,
        title: scheduleTitle.trim() || `${platform} Dispatch`,
        content: improvement.improvedContent,
        date: scheduleDate,
        createdAt: new Date().toISOString(),
      };

      const updated = [newPost, ...list];
      localStorage.setItem("socialpilot_calendar_posts", JSON.stringify(updated));
      setScheduledCalendar(true);
      setCalendarModalOpen(false);
      setTimeout(() => setScheduledCalendar(false), 2500);
    } catch {
      setErrorMessage("Failed to schedule to Calendar.");
    }
  };

  // Tier color styling helper
  const getTierBadgeStyle = (tierKey: string) => {
    switch (tierKey) {
      case "excellent":
        return "border-emerald-500/50 text-emerald-400 bg-emerald-950/20";
      case "high":
        return "border-vermilion/50 text-vermilion bg-vermilion/10";
      case "moderate":
        return "border-gold/50 text-gold bg-gold/10";
      case "needs_improvement":
        return "border-amber-500/50 text-amber-400 bg-amber-950/20";
      default:
        return "border-rose-500/40 text-rose-400 bg-rose-950/20";
    }
  };

  // Filter history
  const filteredHistory = history.filter((h) => {
    const matchesPlatform = historyFilter === "all" || h.platform.toLowerCase() === historyFilter.toLowerCase();
    const matchesSearch =
      !historySearch ||
      h.content.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.verdict.toLowerCase().includes(historySearch.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Kage Section Header */}
      <div className="kage-sec-head">
        <span className="k"><b>07</b> — Content Intelligence & Viral Forecast</span>
        <span className="kage-rule" />
        <span className="k kage-jp">兆</span>
      </div>

      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line-soft pb-4">
        <div>
          <span className="kage-eyebrow">
            <span className="dot" />
            <span>Algorithmic Pre-Flight Audit</span>
          </span>
          <h2 className="kage-display text-lg tracking-wider text-bone mt-1">
            Viral Predictor Chamber
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("analyze")}
            className={`kage-cta py-1.5 px-3.5 text-[9px] tracking-[0.2em] uppercase ${
              activeTab === "analyze" ? "kage-cta--vermilion" : "text-muted hover:text-bone"
            }`}
          >
            <TrendingUp className="w-3 h-3 text-vermilion" />
            <span>Audit Chamber</span>
          </button>

          <button
            onClick={() => setActiveTab("improve")}
            className={`kage-cta py-1.5 px-3.5 text-[9px] tracking-[0.2em] uppercase ${
              activeTab === "improve" ? "kage-cta--vermilion" : "text-muted hover:text-bone"
            }`}
          >
            <Zap className="w-3 h-3 text-vermilion" />
            <span>AI Optimizer</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`kage-cta py-1.5 px-3.5 text-[9px] tracking-[0.2em] uppercase ${
              activeTab === "history" ? "kage-cta--vermilion" : "text-muted hover:text-bone"
            }`}
          >
            <span>History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Brand Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 border border-line-soft bg-ink-2/70 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-vermilion shrink-0" />
          <span className="text-bone-dim font-light">
            Algorithmic model: <strong className="text-bone font-medium">NVIDIA Nemotron 3 Ultra 550B</strong>
          </span>
        </div>

        <div className="mt-2 sm:mt-0">
          {brandProfile?.businessName ? (
            <Link
              href="/dashboard/brand"
              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-bone hover:text-vermilion transition-colors"
            >
              <Building2 className="w-3 h-3 text-vermilion" />
              <span>Voice: <strong>{brandProfile.businessName}</strong> ({brandProfile.industry})</span>
            </Link>
          ) : (
            <Link
              href="/dashboard/brand"
              className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-muted hover:text-bone transition-colors"
            >
              <span>No Brand Profile Configured</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AUDIT CHAMBER */}
      {/* ===================================================================== */}
      {activeTab === "analyze" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 Columns: Submission Form */}
            <div className="lg:col-span-6 space-y-6">
              <div className="kage-card border border-line-soft p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-line-soft pb-4">
                  <h3 className="kage-display text-sm tracking-wider text-bone flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-vermilion" />
                    <span>Submission Parameters</span>
                  </h3>
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted">
                    Pre-Flight Input
                  </span>
                </div>

                {/* Platform Selector */}
                <div>
                  <label className="kage-eyebrow mb-2 block">
                    <span>Target Platform <strong className="text-vermilion">*</strong></span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {platformOptions.map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => {
                          setPlatform(plat);
                          setTargetImprovePlatform(plat);
                        }}
                        className={`py-2 px-3 text-[10px] tracking-wider uppercase border transition-all ${
                          platform === plat
                            ? "border-vermilion bg-line-soft text-bone font-medium"
                            : "border-line-soft bg-ink text-muted hover:text-bone hover:border-line"
                        }`}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Type Selector */}
                <div>
                  <label className="kage-eyebrow mb-2 block">
                    <span>Format Classification</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {contentTypeOptions.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setContentType(type.id)}
                          className={`p-2.5 text-left border transition-all flex flex-col justify-between ${
                            contentType === type.id
                              ? "border-vermilion bg-line-soft text-bone font-medium"
                              : "border-line-soft bg-ink text-muted hover:text-bone hover:border-line"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 mb-2 ${contentType === type.id ? "text-vermilion" : "text-muted"}`} />
                          <span className="text-[10px] tracking-wider uppercase">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text / Script / Caption Textarea */}
                <div>
                  <label className="kage-eyebrow mb-2 block">
                    <span>Content Copy, Script, or Opening Hook</span>
                  </label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your post caption, reel screenplay, X thread draft, or hook here..."
                    className="w-full px-4 py-3 bg-ink border border-line-soft text-xs text-bone placeholder:text-muted/40 focus:outline-none focus:border-vermilion transition-colors resize-none rounded-none leading-relaxed"
                  />
                </div>

                {/* Drag & Drop Media Upload Area */}
                <div>
                  <label className="kage-eyebrow mb-2 block">
                    <span>Media Attachment (Image or Video)</span>
                  </label>

                  {!mediaFile ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileChange(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-line-soft bg-ink hover:border-line hover:bg-ink-3/40 transition-all p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                      />
                      <UploadCloud className="w-6 h-6 text-muted group-hover:text-vermilion transition-colors" />
                      <div className="text-xs text-bone font-light">
                        Drag & drop or <span className="text-vermilion underline">browse files</span>
                      </div>
                      <p className="text-[10px] text-muted tracking-wider uppercase">
                        Supports MP4, MOV, WEBM (≤100MB) & PNG, JPG, WEBP (≤20MB)
                      </p>
                    </div>
                  ) : (
                    <div className="border border-line-soft bg-ink p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          {mediaFile.type.startsWith("video/") ? (
                            <Video className="w-4 h-4 text-vermilion shrink-0" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-vermilion shrink-0" />
                          )}
                          <span className="text-xs text-bone truncate">{mediaFile.name}</span>
                        </div>
                        <button
                          onClick={removeMedia}
                          className="text-muted hover:text-vermilion text-xs p-1"
                          title="Remove media"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Video Player or Image Preview */}
                      {mediaPreviewUrl && (
                        <div className="relative border border-line-soft bg-black/60 max-h-56 overflow-hidden flex items-center justify-center">
                          {mediaFile.type.startsWith("video/") ? (
                            <video
                              ref={videoRef}
                              src={mediaPreviewUrl}
                              controls
                              className="max-h-52 w-auto mx-auto"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaPreviewUrl}
                              alt="Upload preview"
                              className="max-h-52 w-auto object-contain mx-auto"
                            />
                          )}
                        </div>
                      )}

                      {/* Media Signals Pill */}
                      {mediaMeta && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[10px] text-muted font-mono uppercase tracking-wider">
                          <span className="bg-ink-2 px-2 py-1 border border-line-soft">
                            {mediaMeta.aspectRatio || "Aspect: N/A"}
                          </span>
                          <span className="bg-ink-2 px-2 py-1 border border-line-soft">
                            {mediaMeta.width ? `${mediaMeta.width}x${mediaMeta.height}` : "Res: N/A"}
                          </span>
                          {mediaMeta.duration ? (
                            <span className="bg-ink-2 px-2 py-1 border border-line-soft">
                              Duration: {Math.round(mediaMeta.duration)}s
                            </span>
                          ) : (
                            <span className="bg-ink-2 px-2 py-1 border border-line-soft">
                              {(mediaMeta.fileSize / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hashtags Input */}
                <div>
                  <label className="kage-eyebrow mb-2 block">
                    <span>Hashtags (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#tech #founders #architecture #minimalism"
                    className="w-full px-4 py-2.5 bg-ink border border-line-soft text-xs text-bone placeholder:text-muted/40 focus:outline-none focus:border-vermilion transition-colors rounded-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 border border-vermilion/40 bg-vermilion/10 text-vermilion text-xs flex items-center justify-between gap-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    {errorMessage.includes("NEMOTRON_API_KEY") && (
                      <button
                        type="button"
                        onClick={() => setIsKeyModalOpen(true)}
                        className="underline hover:text-white font-mono shrink-0 whitespace-nowrap text-[11px]"
                      >
                        Set Key →
                      </button>
                    )}
                  </div>
                )}

                {/* Submit Action */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!content.trim() && !mediaMeta)}
                  className="w-full kage-cta kage-cta--vermilion text-[10px] tracking-[0.22em] uppercase py-3.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-vermilion" />
                      <span>Auditing Algorithmic Signals with Nemotron...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-vermilion" />
                      <span>Execute Viral Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right 6 Columns: Analysis Report Presentation */}
            <div className="lg:col-span-6 space-y-6">
              {isAnalyzing ? (
                <div className="kage-card border border-line-soft p-12 min-h-[520px] flex flex-col items-center justify-center text-center space-y-4">
                  <svg viewBox="0 0 44 44" fill="none" className="w-12 h-12 animate-pulse">
                    <circle cx="22" cy="24" r="9.5" stroke="#e0231c" strokeWidth="1.2" />
                    <path d="M6 12h32M9.5 17h25M22 8v28" stroke="#dfe7e0" strokeWidth="1.2" />
                  </svg>
                  <div className="kage-jp text-sm text-bone-dim">影の道 · 解析中</div>
                  <h4 className="kage-display text-sm tracking-wider text-bone">
                    Deconstructing Feed Trajectory
                  </h4>
                  <p className="text-xs font-light text-muted max-w-sm leading-relaxed">
                    Auditing first 3-second hook drop-off, emotional comment triggers, readability score, and {platform} algorithmic distribution weights...
                  </p>
                </div>
              ) : report ? (
                <div className="space-y-6">
                  {/* Master Score Card */}
                  <div className="kage-card border border-line-soft p-6 sm:p-7 space-y-6 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line-soft pb-5">
                      <div>
                        <span className="kage-eyebrow mb-1">
                          <span className="dot" />
                          <span>Algorithmic Forecast · {report.platform}</span>
                        </span>
                        <h3 className="kage-display text-lg text-bone">
                          Viral Potential Score
                        </h3>
                      </div>

                      {/* Tier Badge */}
                      <span className={`text-[10px] tracking-[0.24em] uppercase px-3 py-1 border ${getTierBadgeStyle(report.tierKey)}`}>
                        {report.tier}
                      </span>
                    </div>

                    {/* Big Score Gauge Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                      <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 border border-line-soft bg-ink/70 text-center">
                        <span className="kage-num text-5xl sm:text-6xl text-bone leading-none mb-1">
                          {report.overallScore}
                        </span>
                        <span className="text-[10px] tracking-[0.22em] uppercase text-muted">
                          Score / 100
                        </span>
                      </div>

                      <div className="sm:col-span-8 space-y-2">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-vermilion block">
                          AI Executive Verdict
                        </span>
                        <p className="text-xs font-light text-bone-dim leading-relaxed">
                          {report.verdict}
                        </p>
                      </div>
                    </div>

                    {/* Methodology & Disclaimer Notice */}
                    <div className="p-3 border border-line-soft bg-ink/50 text-[10px] font-light text-muted leading-relaxed space-y-1">
                      <div className="flex items-center gap-1.5 text-bone-dim">
                        <HelpCircle className="w-3 h-3 text-vermilion" />
                        <span className="uppercase tracking-wider">Scoring Formula</span>
                      </div>
                      <p>
                        Weighted: 25% Hook Strength + 25% Engagement Drivers + 20% Content Quality + 15% Audience Resonance + 15% Platform Fit.
                      </p>
                      <p className="italic text-muted/70">
                        *AI-based potential assessment, NOT a guarantee of actual virality, view counts, or reach.
                      </p>
                    </div>

                    {/* Quick Button to Jump to Content Improvement */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleImprove("hook")}
                        className="w-full kage-cta py-2.5 px-4 text-[10px] tracking-[0.2em] uppercase text-bone hover:text-white border-line flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-vermilion" />
                          <span>Optimize & Elevate This Dispatch</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-vermilion" />
                      </button>
                    </div>
                  </div>

                  {/* 5 Sub-Score Progress Breakdown */}
                  <div className="kage-card border border-line-soft p-6 space-y-5">
                    <h4 className="kage-display text-sm tracking-wider text-bone border-b border-line-soft pb-3">
                      Sub-Score Diagnostic Matrix
                    </h4>

                    <div className="space-y-4">
                      {/* Hook Strength */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-bone font-medium">Hook Strength (0-3s / Line 1)</span>
                          <span className="text-vermilion tabular-nums font-mono font-medium">
                            {report.subScores.hookStrength.score}/100 ({report.subScores.hookStrength.weight})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-ink-3 overflow-hidden">
                          <div
                            className="h-full bg-vermilion transition-all duration-700"
                            style={{ width: `${report.subScores.hookStrength.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted font-light leading-relaxed">
                          {report.subScores.hookStrength.explanation}
                        </p>
                      </div>

                      {/* Engagement Potential */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-bone font-medium">Engagement Potential (Comments & Shares)</span>
                          <span className="text-vermilion tabular-nums font-mono font-medium">
                            {report.subScores.engagementPotential.score}/100 ({report.subScores.engagementPotential.weight})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-ink-3 overflow-hidden">
                          <div
                            className="h-full bg-vermilion transition-all duration-700"
                            style={{ width: `${report.subScores.engagementPotential.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted font-light leading-relaxed">
                          {report.subScores.engagementPotential.explanation}
                        </p>
                      </div>

                      {/* Content Quality */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-bone font-medium">Content Quality & Storytelling</span>
                          <span className="text-bone-dim tabular-nums font-mono font-medium">
                            {report.subScores.contentQuality.score}/100 ({report.subScores.contentQuality.weight})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-ink-3 overflow-hidden">
                          <div
                            className="h-full bg-bone transition-all duration-700"
                            style={{ width: `${report.subScores.contentQuality.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted font-light leading-relaxed">
                          {report.subScores.contentQuality.explanation}
                        </p>
                      </div>

                      {/* Audience Relevance */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-bone font-medium">Audience Relevance & Persona Fit</span>
                          <span className="text-bone-dim tabular-nums font-mono font-medium">
                            {report.subScores.audienceRelevance.score}/100 ({report.subScores.audienceRelevance.weight})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-ink-3 overflow-hidden">
                          <div
                            className="h-full bg-bone transition-all duration-700"
                            style={{ width: `${report.subScores.audienceRelevance.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted font-light leading-relaxed">
                          {report.subScores.audienceRelevance.explanation}
                        </p>
                      </div>

                      {/* Platform Suitability */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-bone font-medium">{report.platform} Format Suitability</span>
                          <span className="text-bone-dim tabular-nums font-mono font-medium">
                            {report.subScores.platformSuitability.score}/100 ({report.subScores.platformSuitability.weight})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-ink-3 overflow-hidden">
                          <div
                            className="h-full bg-bone transition-all duration-700"
                            style={{ width: `${report.subScores.platformSuitability.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted font-light leading-relaxed">
                          {report.subScores.platformSuitability.explanation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="kage-card border border-line-soft p-5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Core Strengths</span>
                      </div>
                      <ul className="space-y-2 text-xs font-light text-bone-dim">
                        {report.strengths.map((str, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-1 select-none text-[10px]">▪</span>
                            <span className="leading-relaxed">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="kage-card border border-line-soft p-5 space-y-3">
                      <div className="flex items-center gap-2 text-vermilion text-xs font-medium uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Critical Weaknesses</span>
                      </div>
                      <ul className="space-y-2 text-xs font-light text-bone-dim">
                        {report.weaknesses.map((weak, wIdx) => (
                          <li key={wIdx} className="flex items-start gap-2">
                            <span className="text-vermilion mt-1 select-none text-[10px]">▪</span>
                            <span className="leading-relaxed">{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Failure Risks & Retention Drop-off */}
                  <div className="kage-card border border-line-soft p-5 space-y-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-vermilion block">
                      Algorithmic Failure Modes & Retention Drop-Off
                    </span>
                    <p className="text-xs font-light text-bone leading-relaxed">
                      {report.retentionAnalysis}
                    </p>
                    <div className="pt-2 border-t border-line-soft space-y-1.5">
                      {report.failureRisks.map((risk, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2 text-[11px] text-muted">
                          <span className="text-vermilion mt-0.5">⚠️</span>
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actionable Suggestions */}
                  <div className="kage-card border border-line-soft p-5 space-y-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-bone block">
                      Immediate Tactical Recommendations
                    </span>
                    <ul className="space-y-2 text-xs font-light text-bone-dim">
                      {report.actionableSuggestions.map((sug, suIdx) => (
                        <li key={suIdx} className="flex items-start gap-2">
                          <span className="text-vermilion font-mono text-[11px]">{suIdx + 1}.</span>
                          <span className="leading-relaxed">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="kage-card border border-dashed border-line-soft p-12 min-h-[520px] flex flex-col items-center justify-center text-center">
                  <svg viewBox="0 0 44 44" fill="none" className="w-10 h-10 text-muted/30 mb-4">
                    <circle cx="22" cy="25" r="8.6" stroke="#dfe7e0" strokeWidth="1" strokeDasharray="2 2" />
                    <path d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                  <h4 className="kage-display text-sm tracking-wider text-bone-dim">
                    Predictor Awaiting Dispatch
                  </h4>
                  <p className="text-xs font-light text-muted max-w-sm mt-2 leading-relaxed">
                    Submit your text copy, reel screenplay, image framing, or video media on the left to initiate the 5-tier algorithmic audit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CONTENT OPTIMIZER (IMPROVE MY CONTENT) */}
      {/* ===================================================================== */}
      {activeTab === "improve" && (
        <div className="space-y-6">
          <div className="kage-card border border-line-soft p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line-soft pb-4">
              <div>
                <span className="kage-eyebrow mb-1">
                  <span className="dot" />
                  <span>Iterative Transformation Chamber</span>
                </span>
                <h3 className="kage-display text-base text-bone">
                  AI Content Improvement
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase text-muted">Adapt For:</span>
                <select
                  value={targetImprovePlatform}
                  onChange={(e) => setTargetImprovePlatform(e.target.value)}
                  className="px-3 py-1.5 bg-ink border border-line-soft text-xs text-bone focus:outline-none focus:border-vermilion cursor-pointer"
                >
                  {platformOptions.map((p) => (
                    <option key={p} value={p} className="bg-ink-2 text-bone">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Directive Action Buttons */}
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-2.5">
                Select Optimization Directive
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { id: "hook", label: "Rewrite Hook", icon: "⚡" },
                  { id: "caption", label: "Polish Caption", icon: "✍️" },
                  { id: "engagement", label: "Boost Comments", icon: "💬" },
                  { id: "cta", label: "Sharpen CTA", icon: "🎯" },
                  { id: "storytelling", label: "Deep Story", icon: "📖" },
                  { id: "alternative", label: "3 Alt Angles", icon: "🔀" },
                  { id: "platform", label: "Repurpose", icon: "🌐" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setImproveType(item.id);
                      handleImprove(item.id);
                    }}
                    disabled={isImproving || !content.trim()}
                    className={`p-3 text-left border transition-all flex flex-col justify-between ${
                      improveType === item.id
                        ? "border-vermilion bg-line-soft text-bone"
                        : "border-line-soft bg-ink text-muted hover:text-bone hover:border-line"
                    }`}
                  >
                    <span className="text-sm mb-1">{item.icon}</span>
                    <span className="text-[10px] tracking-wider uppercase font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Side-by-Side Comparison Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
              {/* Left 6: Original Content */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider">
                  <span>Original Submission</span>
                  <span>{platform}</span>
                </div>
                <div className="p-4 bg-ink border border-line-soft text-xs text-bone-dim leading-relaxed min-h-[280px] max-h-[460px] overflow-y-auto whitespace-pre-wrap font-sans">
                  {content || "[No written text entered. Switch to Audit Chamber to paste text.]"}
                </div>
              </div>

              {/* Right 6: Improved Content */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider">
                  <span className="text-vermilion font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-vermilion" />
                    <span>Nemotron Elevated Output</span>
                  </span>
                  <span>{targetImprovePlatform}</span>
                </div>

                {isImproving ? (
                  <div className="p-4 bg-ink border border-line-soft min-h-[280px] flex flex-col items-center justify-center text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-vermilion" />
                    <p className="text-xs text-bone-dim font-light">
                      Synthesizing strategic upgrade with Nemotron 3 Ultra...
                    </p>
                  </div>
                ) : improvement ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-ink border border-line text-xs text-bone leading-relaxed min-h-[280px] max-h-[460px] overflow-y-auto whitespace-pre-wrap font-sans select-text">
                      {improvement.improvedContent}
                    </div>

                    {/* Summary of Improvements */}
                    <div className="p-3 border border-line-soft bg-ink-2/60 space-y-1 text-xs">
                      <div className="text-[10px] tracking-wider uppercase text-vermilion">
                        Modifications Applied:
                      </div>
                      <p className="text-bone-dim font-light text-[11px] leading-relaxed">
                        {improvement.changesSummary}
                      </p>
                      <div className="text-[10px] tracking-wider uppercase text-emerald-400 pt-1">
                        Expected Algorithmic Lift:
                      </div>
                      <p className="text-bone-dim font-light text-[11px] leading-relaxed">
                        {improvement.expectedImpact}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={handleCopyImproved}
                        className="kage-cta py-2 px-3 text-[9px] tracking-[0.2em] uppercase"
                      >
                        {copiedImproved ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSaveToVault}
                        className="kage-cta py-2 px-3 text-[9px] tracking-[0.2em] uppercase"
                      >
                        {savedVault ? (
                          <>
                            <Check className="w-3 h-3 text-vermilion" />
                            <span className="text-vermilion">Archived</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3" />
                            <span>Save to Vault</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setCalendarModalOpen(true)}
                        className="kage-cta kage-cta--vermilion py-2 px-3 text-[9px] tracking-[0.2em] uppercase"
                      >
                        <CalendarIcon className="w-3 h-3 text-vermilion" />
                        <span>Send to Calendar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-ink border border-dashed border-line-soft min-h-[280px] flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-muted font-light">
                      Select one of the directives above to synthesize an elevated version.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: AUDIT HISTORY */}
      {/* ===================================================================== */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="kage-card border border-line-soft p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line-soft pb-4">
              <div>
                <span className="kage-eyebrow mb-1">
                  <span className="dot" />
                  <span>Diagnostic Archives</span>
                </span>
                <h3 className="kage-display text-base text-bone">
                  Previous Viral Audits ({history.length})
                </h3>
              </div>

              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-[10px] tracking-wider uppercase text-muted hover:text-vermilion transition-colors"
                >
                  Clear All History
                </button>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search previous audits by keyword or verdict..."
                  className="w-full pl-9 pr-4 py-2 bg-ink border border-line-soft text-xs text-bone placeholder:text-muted/40 focus:outline-none focus:border-vermilion"
                />
              </div>

              <div className="flex items-center gap-2 bg-ink border border-line-soft px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-muted" />
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-bone focus:outline-none cursor-pointer uppercase tracking-wider text-[10px]"
                >
                  <option value="all" className="bg-ink-2 text-bone">All Platforms</option>
                  <option value="instagram" className="bg-ink-2 text-bone">Instagram</option>
                  <option value="x (twitter)" className="bg-ink-2 text-bone">X (Twitter)</option>
                  <option value="linkedin" className="bg-ink-2 text-bone">LinkedIn</option>
                  <option value="facebook" className="bg-ink-2 text-bone">Facebook</option>
                </select>
              </div>
            </div>

            {/* History Cards Grid */}
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted font-light border border-line-soft bg-ink">
                No analysis reports match your filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setReport(item);
                      setContent(item.content);
                      setPlatform(item.platform);
                      setContentType(item.contentType);
                      setActiveTab("analyze");
                    }}
                    className="kage-card border border-line-soft p-5 space-y-4 hover:border-line transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-wider uppercase text-muted font-medium">
                          {item.platform}
                        </span>
                        <span className="text-line">/</span>
                        <span className="text-[10px] tracking-wider uppercase text-bone-dim">
                          {item.contentType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${getTierBadgeStyle(item.tierKey)}`}>
                          {item.overallScore} · {item.tier}
                        </span>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1 text-muted hover:text-vermilion transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-bone-dim line-clamp-3 font-light leading-relaxed">
                      {item.content || item.verdict}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted pt-2 border-t border-line-soft">
                      <span>{new Date(item.analyzedAt).toLocaleDateString()}</span>
                      <span className="group-hover:text-vermilion transition-colors flex items-center gap-1 uppercase tracking-wider">
                        <span>Reopen Analysis</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule to Calendar Modal */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md">
          <div
            className="w-full max-w-md kage-card border border-line-soft p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kage-sec-head mb-0">
              <span className="k"><b>SCHEDULE</b> — TIMELINE ENTRY</span>
              <span className="kage-rule" />
              <button
                onClick={() => setCalendarModalOpen(false)}
                className="text-muted hover:text-bone text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="kage-eyebrow mb-2 block">
                  <span>Dispatch Title</span>
                </label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-ink border border-line-soft text-xs text-bone focus:outline-none focus:border-vermilion"
                />
              </div>

              <div>
                <label className="kage-eyebrow mb-2 block">
                  <span>Scheduled Publication Date</span>
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-ink border border-line-soft text-xs text-bone focus:outline-none focus:border-vermilion cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-line-soft flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="kage-cta py-1.5 px-3 text-[9px] tracking-wider uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleToCalendar}
                  className="kage-cta kage-cta--vermilion py-1.5 px-4 text-[9px] tracking-wider uppercase"
                >
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaved={() => setErrorMessage(null)}
      />
    </div>
  );
}
