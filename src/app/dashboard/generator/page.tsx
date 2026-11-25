"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  Building2,
  ExternalLink,
} from "lucide-react";
import type { BrandProfile } from "../brand/page";
import { getApiHeaders } from "@/lib/client-api";
import { ApiKeyModal } from "@/components/dashboard/ApiKeyModal";

type ModeType = "captions" | "hashtags" | "ideas" | "reels";

const modes: {
  id: ModeType;
  num: string;
  label: string;
  jp: string;
  placeholder: string;
}[] = [
  {
    id: "captions",
    num: "01",
    label: "Captions",
    jp: "文",
    placeholder: "e.g. Announcing our stealth developer suite with zero-bloat architecture...",
  },
  {
    id: "hashtags",
    num: "02",
    label: "Hashtags",
    jp: "標",
    placeholder: "e.g. Minimalist tech workspace, indie software engineer building in public...",
  },
  {
    id: "reels",
    num: "03",
    label: "Reel Script",
    jp: "影",
    placeholder: "e.g. 3 counter-intuitive rules of high-retention technical writing...",
  },
  {
    id: "ideas",
    num: "04",
    label: "Post Concepts",
    jp: "想",
    placeholder: "e.g. Navigating software engineering leadership in turbulent tech markets...",
  },
];

const toneOptions = [
  "Viral & Punchy",
  "Professional & Authoritative",
  "Casual & Relatable",
  "Inspirational & Bold",
  "Educational & Actionable",
  "Humorous & Witty",
];

export default function GeneratorPage() {
  const [selectedMode, setSelectedMode] = useState<ModeType>("captions");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Viral & Punchy");
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("socialpilot_brand_profile");
      if (stored) {
        const parsed: BrandProfile = JSON.parse(stored);
        setBrandProfile(parsed);
        if (parsed.brandTone) {
          setTone(parsed.brandTone);
        }
      }
    } catch {
      // Storage fallback
    }
  }, []);

  const activeModeConfig = modes.find((m) => m.id === selectedMode) || modes[0];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please specify a topic or announcement.");
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);
    setSaved(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          mode: selectedMode,
          topic: topic.trim(),
          tone,
          brandProfile: brandProfile || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate content.");
      }

      setResult(data.content);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate content.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy text.");
    }
  };

  const handleSave = () => {
    if (!result) return;
    try {
      const existing = localStorage.getItem("socialpilot_saved_posts");
      const list = existing ? JSON.parse(existing) : [];

      const newPost = {
        id: `post_${Date.now()}`,
        mode: selectedMode,
        topic: topic.trim(),
        tone,
        content: result,
        createdAt: new Date().toISOString(),
      };

      const updated = [newPost, ...list];
      localStorage.setItem("socialpilot_saved_posts", JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to archive dispatch.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Kage Section Header */}
      <div className="kage-sec-head">
        <span className="k"><b>03</b> — Neural Synthesis Chamber</span>
        <span className="kage-rule" />
        <span className="k kage-jp">創</span>
      </div>

      {/* Top Status & Brand Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="kage-eyebrow">
            <span className="dot" />
            <span>NVIDIA Nemotron 3 Ultra 550B</span>
          </div>
        </div>

        <div>
          {brandProfile?.businessName ? (
            <Link
              href="/dashboard/brand"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:text-bone px-3 py-1.5 border border-line-soft hover:border-line transition-all"
            >
              <Building2 className="w-3 h-3 text-vermilion" />
              <span>Blueprint: <strong className="text-bone">{brandProfile.businessName}</strong></span>
              <span className="text-muted">({brandProfile.preferredPlatform})</span>
            </Link>
          ) : (
            <Link
              href="/dashboard/brand"
              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-muted hover:text-bone-dim border border-line-soft px-3 py-1.5 transition-colors"
            >
              <span>No Blueprint Configured</span>
              <ExternalLink className="w-3 h-3 text-vermilion" />
            </Link>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs (Kage chapter chip pattern) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {modes.map((mode) => {
          const active = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id);
                setError(null);
              }}
              className={`p-3.5 text-left border transition-all flex flex-col justify-between ${
                active
                  ? "border-vermilion bg-line-soft text-bone"
                  : "border-line-soft bg-ink hover:border-line text-bone-dim hover:text-bone"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] tabular-nums ${active ? "text-vermilion" : "text-muted"}`}>
                  {mode.num}
                </span>
                <span className="kage-jp text-xs text-muted">
                  {mode.jp}
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-[0.16em] uppercase">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Parameters & Synthesis Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 6 Cols: Parameters */}
        <div className="lg:col-span-6 kage-card border border-line-soft p-6 sm:p-8 space-y-6">
          <div className="border-b border-line-soft pb-4 flex items-center justify-between">
            <h3 className="kage-display text-sm tracking-wider text-bone flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-vermilion" />
              <span>{activeModeConfig.label} Parameters</span>
            </h3>
            <span className="text-[9px] tracking-[0.22em] uppercase text-muted">
              {brandProfile?.businessName ? "Injected" : "Neutral"}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="kage-eyebrow mb-2 block">
                <span>Core Concept / Announcement <strong className="text-vermilion">*</strong></span>
              </label>
              <textarea
                rows={6}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={activeModeConfig.placeholder}
                className="w-full px-4 py-3 bg-ink border border-line-soft text-xs text-bone placeholder:text-muted/40 focus:outline-none focus:border-vermilion transition-colors resize-none rounded-none leading-relaxed"
              />
            </div>

            <div>
              <label className="kage-eyebrow mb-2 block">
                <span>Cadence & Tone</span>
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 bg-ink border border-line-soft text-xs text-bone focus:outline-none focus:border-vermilion transition-colors rounded-none cursor-pointer"
              >
                {toneOptions.map((t) => (
                  <option key={t} value={t} className="bg-ink-2 text-bone">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start justify-between gap-3 p-3 border border-vermilion/40 bg-vermilion/10 text-vermilion text-xs rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {error.includes("NEMOTRON_API_KEY") && (
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
          </div>

          <div className="pt-4 border-t border-line-soft">
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full kage-cta kage-cta--vermilion text-[10px] tracking-[0.22em] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Synthesizing with Nemotron...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-vermilion" />
                  <span>Synthesize {activeModeConfig.label}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 6 Cols: Synthesis Output */}
        <div className="lg:col-span-6 kage-card border border-line-soft p-6 sm:p-8 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between border-b border-line-soft pb-4 mb-4">
              <h3 className="kage-display text-sm tracking-wider text-bone">
                Synthesized Output
              </h3>

              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="kage-cta py-1.5 px-3 text-[9px] tracking-[0.2em] uppercase"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSave}
                    className="kage-cta py-1.5 px-3 text-[9px] tracking-[0.2em] uppercase"
                    title="Archive in Vault"
                  >
                    {saved ? (
                      <>
                        <BookmarkCheck className="w-3 h-3 text-vermilion" />
                        <span className="text-vermilion">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3 h-3" />
                        <span>Archive</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="min-h-[300px] border border-line-soft bg-ink flex flex-col items-center justify-center p-8 text-center space-y-4">
                {/* Authentic Kage Preloader Mark */}
                <svg viewBox="0 0 44 44" fill="none" className="w-10 h-10 animate-pulse">
                  <circle cx="22" cy="24" r="9.5" stroke="#e0231c" strokeWidth="1.2" />
                  <path d="M6 12h32M9.5 17h25M22 8v28" stroke="#dfe7e0" strokeWidth="1.2" />
                </svg>
                <div className="kage-jp text-sm text-bone-dim">影の道 · 思考中</div>
                <p className="text-xs font-light text-muted max-w-xs">
                  Streaming neural synthesis from NVIDIA Nemotron 3 Ultra...
                </p>
              </div>
            ) : result ? (
              <div className="min-h-[300px] max-h-[460px] overflow-y-auto border border-line-soft bg-ink p-5 text-xs text-bone leading-relaxed font-sans whitespace-pre-wrap select-text">
                {result}
              </div>
            ) : (
              <div className="min-h-[300px] border border-dashed border-line-soft bg-ink/40 flex flex-col items-center justify-center p-8 text-center">
                <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8 text-muted/30 mb-3">
                  <circle cx="22" cy="25" r="8.6" stroke="#dfe7e0" strokeWidth="1" strokeDasharray="2 2" />
                  <path d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
                <p className="kage-display text-xs tracking-wider text-bone-dim">
                  Chamber Awaiting Dispatch
                </p>
                <p className="text-[11px] font-light text-muted mt-1 max-w-xs">
                  {brandProfile?.businessName
                    ? `Ready to synthesize dispatches for ${brandProfile.businessName} on ${brandProfile.preferredPlatform}.`
                    : "Enter your topic, set your tone, and synthesize content."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-muted">
            <span>Model: Nemotron-3-Ultra-550b</span>
            <span>Target: {brandProfile?.preferredPlatform || "Universal"}</span>
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaved={() => {
          setError(null);
        }}
      />
    </div>
  );
}
