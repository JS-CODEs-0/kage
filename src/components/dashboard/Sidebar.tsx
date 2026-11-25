"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navigationItems = [
  {
    num: "01",
    name: "Overview",
    jp: "制御盤",
    href: "/dashboard",
    exact: true,
  },
  {
    num: "02",
    name: "Brand Profile",
    jp: "印",
    href: "/dashboard/brand",
    exact: false,
  },
  {
    num: "03",
    name: "AI Generator",
    jp: "創",
    href: "/dashboard/generator",
    exact: false,
  },
  {
    num: "04",
    name: "Content Calendar",
    jp: "暦",
    href: "/dashboard/calendar",
    exact: false,
  },
  {
    num: "05",
    name: "Saved Library",
    jp: "蔵",
    href: "/dashboard/library",
    exact: false,
  },
  {
    num: "06",
    name: "AI Assistant",
    jp: "対話",
    href: "/dashboard/chat",
    exact: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Burger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-5 left-5 z-50 p-2.5 rounded bg-ink-2 border border-line text-bone hover:text-white transition-colors"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/80 backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-ink-2 border-r border-line flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Authentic Kage Brand Mark */}
          <div className="h-20 px-6 flex items-center border-b border-line-soft">
            <Link
              href="/"
              className="flex items-center gap-3 group"
              onClick={() => setMobileOpen(false)}
            >
              <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8 shrink-0">
                <circle cx="22" cy="25" r="8.6" fill="#e0231c" fillOpacity="0.9" />
                <path d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" strokeWidth="1.5" />
                <path d="M14 35.5h16" stroke="#dfe7e0" strokeWidth="1.2" strokeOpacity="0.6" />
              </svg>
              <div className="flex flex-col line-height-none gap-0.5">
                <span className="text-[11px] font-medium tracking-[0.26em] text-bone group-hover:text-white transition-colors uppercase">
                  SOCIAL<span className="text-vermilion">PILOT</span>
                </span>
                <span className="text-[8px] font-normal tracking-[0.34em] text-muted uppercase font-sans">
                  KAGE ARCHITECTURE
                </span>
              </div>
            </Link>
          </div>

          {/* Section Indicator */}
          <div className="px-6 pt-6 pb-2">
            <div className="kage-eyebrow">
              <span className="dot" />
              <span>Sanctuary Navigation</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navigationItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center justify-between px-4 py-3 text-xs tracking-wider transition-all border-l-2 ${
                    active
                      ? "border-vermilion bg-line-soft text-bone font-medium"
                      : "border-transparent text-bone-dim hover:text-bone hover:bg-ink-3/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-sans tabular-nums tracking-normal transition-colors ${
                        active ? "text-vermilion" : "text-muted group-hover:text-bone-dim"
                      }`}
                    >
                      {item.num}
                    </span>
                    <span className="uppercase tracking-[0.16em] text-[11px]">
                      {item.name}
                    </span>
                  </div>

                  <span
                    className={`kage-jp text-xs transition-colors ${
                      active ? "text-vermilion" : "text-muted/60 group-hover:text-bone-dim"
                    }`}
                  >
                    {item.jp}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-5 border-t border-line-soft space-y-3">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:text-bone border border-line-soft hover:border-line transition-all rounded-sm"
          >
            <span>Return to Landing</span>
            <ExternalLink className="w-3 h-3 text-muted" />
          </Link>

          <div className="flex items-center justify-between px-1 text-[9px] tracking-[0.24em] text-muted uppercase">
            <span>Kyoto Live live</span>
            <span className="kage-jp text-[10px] text-bone-dim">影の道</span>
          </div>
        </div>
      </aside>
    </>
  );
}
