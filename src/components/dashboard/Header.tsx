"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

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
};

export function Header() {
  const pathname = usePathname();
  const current = pageConfigs[pathname] || {
    num: "00",
    title: "SocialPilot Workspace",
    subtitle: "Kage Architecture",
    jp: "影",
  };

  return (
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

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/generator"
          className="kage-cta kage-cta--vermilion text-[10px] tracking-[0.22em] uppercase py-2 px-4"
        >
          <Sparkles className="w-3.5 h-3.5 text-vermilion" />
          <span>New Dispatch</span>
        </Link>
      </div>
    </header>
  );
}
