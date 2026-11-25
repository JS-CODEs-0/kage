"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, Key } from "lucide-react";
import { ApiKeyModal } from "./ApiKeyModal";
import { getStoredApiKey } from "@/lib/client-api";

const pageConfigs: Record<string, { num: string; title: string; subtitle: string; jp: string }> = {
  "/dashboard": {
    num: "01",
    title: "Command Console",
    subtitle: "Stealth social media orchestration and system oversight",
    jp: "制御盤",
  },
  "/dashboard/brand": {
    num: "02",
    title: "Brand Blueprint",
    subtitle: "Identity guidelines, voice pillars, and audience conditioning",
    jp: "印",
  },
  "/dashboard/generator": {
    num: "03",
    title: "AI Synthesis",
    subtitle: "Nemotron 3 Ultra multi-format content generation",
    jp: "創",
  },
  "/dashboard/calendar": {
    num: "04",
    title: "Content Timeline",
    subtitle: "Monthly publication rhythm and release schedule",
    jp: "暦",
  },
  "/dashboard/library": {
    num: "05",
    title: "Archives & Vault",
    subtitle: "Curated repository of approved copy and video scripts",
    jp: "蔵",
  },
  "/dashboard/chat": {
    num: "06",
    title: "AI Counsel & Strategy",
    subtitle: "Interactive dialogue, content engineering, and campaign orchestration",
    jp: "対話",
  },
  "/dashboard/predictor": {
    num: "07",
    title: "Viral Predictor & Content Intelligence",
    subtitle: "Pre-flight algorithmic audit, hook strength scoring, and audience retention analysis",
    jp: "兆",
  },
};

export function Header() {
  const pathname = usePathname();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    setHasCustomKey(Boolean(getStoredApiKey()));
  }, []);

  const current = pageConfigs[pathname] || {
    num: "00",
    title: "SocialPilot Workspace",
    subtitle: "Kage Architecture",
    jp: "影",
  };

  return (
    <>
      <header className="h-20 border-b border-line-soft bg-ink/70 backdrop-blur-md px-6 md:px-10 flex items-center justify-between sticky top-0 z-30">
        <div className="pl-10 md:pl-0 flex items-center gap-4">
          <div className="flex flex-col">
            <div className="kage-eyebrow mb-1">
              <span className="dot" />
              <span>Chapter {current.num}</span>
              <span className="text-line">/</span>
              <span className="kage-jp text-bone-dim text-[11px]">{current.jp}</span>
            </div>
            <h1 className="kage-display text-base md:text-lg tracking-wider text-bone">
              {current.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-mono text-[#aab4ad] hover:text-[#dfe7e0] transition-colors"
            title="Configure NVIDIA Nemotron API Key"
          >
            <Key className="w-3.5 h-3.5 text-vermilion" />
            <span className="hidden sm:inline">API Key</span>
            {hasCustomKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <Link
            href="/dashboard/generator"
            className="kage-cta kage-cta--vermilion text-[10px] tracking-[0.22em] uppercase py-2 px-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-vermilion" />
            <span>New Dispatch</span>
          </Link>
        </div>
      </header>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaved={() => setHasCustomKey(Boolean(getStoredApiKey()))}
      />
    </>
  );
}
