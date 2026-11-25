import Link from "next/link";
import {
  Sparkles,
  Palette,
  Calendar,
  BookmarkCheck,
  Inbox,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";

export default function DashboardPage() {
  const chapters = [
    {
      num: "01",
      title: "Brand Blueprint",
      jp: "印",
      desc: "Establish voice guidelines, persona parameters, and content pillars for AI conditioning.",
      href: "/dashboard/brand",
      meta: "Foundation",
      icon: Palette,
    },
    {
      num: "02",
      title: "AI Synthesis",
      jp: "創",
      desc: "Direct NVIDIA Nemotron 3 Ultra to produce high-impact captions, tags, and reels.",
      href: "/dashboard/generator",
      meta: "Core Intelligence",
      icon: Sparkles,
    },
    {
      num: "03",
      title: "AI Counsel & Chat",
      jp: "対話",
      desc: "Interactive strategy dialogue, viral hook engineering, and realtime content architecture.",
      href: "/dashboard/chat",
      meta: "Conversational Mind",
      icon: MessageSquare,
    },
    {
      num: "04",
      title: "Content Timeline",
      jp: "暦",
      desc: "Schedule releases across platforms and visualize publication velocity.",
      href: "/dashboard/calendar",
      meta: "Temporal Grid",
      icon: Calendar,
    },
    {
      num: "05",
      title: "The Archives",
      jp: "蔵",
      desc: "Curated repository of approved social dispatches, scripts, and drafts.",
      href: "/dashboard/library",
      meta: "Vault",
      icon: BookmarkCheck,
    },
  ];

  return (
    <div className="space-y-12">
      {/* Chapter 00: Temple Hero Overview */}
      <section className="relative pt-2 pb-8 border-b border-line-soft">
        <div className="kage-sec-head">
          <span className="k"><b>00</b> — The Command Console</span>
          <span className="kage-rule" />
          <span className="k kage-jp">制御盤</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="kage-display text-2xl sm:text-3xl md:text-4xl text-bone leading-tight">
              Where quiet strategy commands the cultural current.
            </h2>
            <p className="text-sm font-light text-bone-dim leading-relaxed max-w-2xl">
              SocialPilot strips away the noise of modern social management. Condition your brand identity,
              synthesize sharp narratives with NVIDIA Nemotron 3 Ultra, and publish with deliberate precision.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between p-5 kage-card border border-line-soft">
            <div className="kage-eyebrow mb-2">
              <span className="dot" />
              <span>Engine Status</span>
            </div>
            <div className="text-xs text-bone-dim space-y-1 font-light">
              <p>Model: <strong className="text-bone font-medium">Nemotron 3 Ultra 550B</strong></p>
              <p>Environment: <strong className="text-emerald-400 font-medium">Live & Synchronized</strong></p>
              <p>Design Language: <strong className="text-bone font-medium">Kyoto Temple Baseline</strong></p>
            </div>
          </div>
        </div>

        {/* Gate Stats Row (Kage gate-stats pattern) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 mt-8 border-t border-line-soft">
          <div>
            <span className="kage-num block text-2xl md:text-3xl">05</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Active Chambers</span>
          </div>
          <div>
            <span className="kage-num block text-2xl md:text-3xl">550B</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Neural Weights</span>
          </div>
          <div>
            <span className="kage-num block text-2xl md:text-3xl">30d</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Temporal Grid</span>
          </div>
          <div>
            <span className="kage-num block text-2xl md:text-3xl">∞</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Stillness</span>
          </div>
        </div>
      </section>

      {/* Chapter Cards Grid (Kage cards pattern) */}
      <section className="space-y-6">
        <div className="kage-sec-head">
          <span className="k"><b>01</b> — System Chambers</span>
          <span className="kage-rule" />
          <span className="k kage-jp">伽藍</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {chapters.map((chap) => {
            return (
              <Link
                key={chap.num}
                href={chap.href}
                className="group relative flex flex-col justify-between p-6 kage-card border border-line-soft hover:border-line transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="kage-num text-2xl text-bone group-hover:text-vermilion transition-colors">
                      {chap.num}
                    </span>
                    <span className="kage-jp text-xs text-muted group-hover:text-bone-dim transition-colors">
                      {chap.jp}
                    </span>
                  </div>

                  <div className="kage-eyebrow mb-2">
                    <span>{chap.meta}</span>
                  </div>

                  <h3 className="kage-display text-sm tracking-wider text-bone group-hover:text-white transition-colors">
                    {chap.title}
                  </h3>

                  <p className="mt-2 text-xs font-light text-bone-dim leading-relaxed">
                    {chap.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-line-soft flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-muted group-hover:text-bone transition-colors">
                  <span>Enter Chamber</span>
                  <div className="w-6 h-6 rounded-full border border-line flex items-center justify-center group-hover:border-bone group-hover:bg-bone transition-all">
                    <ArrowUpRight className="w-3.5 h-3.5 text-bone group-hover:text-ink transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Pipeline Status / Clean Kage Empty State */}
      <section className="kage-card border border-line-soft p-8 md:p-10 space-y-6">
        <div className="kage-sec-head mb-0">
          <span className="k"><b>02</b> — Publication Pipeline</span>
          <span className="kage-rule" />
          <span className="k kage-jp">残光</span>
        </div>

        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-full border border-line flex items-center justify-center text-muted mb-4">
            <Inbox className="w-5 h-5 stroke-[1.2]" />
          </div>

          <h4 className="kage-display text-base tracking-wider text-bone">
            The Sanctuary is Quiet
          </h4>
          <p className="text-xs font-light text-bone-dim max-w-md mt-2 mb-8 leading-relaxed">
            No drafts or broadcasts are currently queued. Establish your brand parameters or initiate a new AI dispatch through Nemotron 3 Ultra.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard/brand"
              className="kage-cta text-[10px] tracking-[0.22em]"
            >
              <span>Setup Brand Profile</span>
            </Link>
            <Link
              href="/dashboard/generator"
              className="kage-cta text-[10px] tracking-[0.22em]"
            >
              <Sparkles className="w-3.5 h-3.5 text-vermilion" />
              <span>Synthesize Dispatch</span>
            </Link>
            <Link
              href="/dashboard/chat"
              className="kage-cta kage-cta--vermilion text-[10px] tracking-[0.22em]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-vermilion" />
              <span>Open AI Counsel</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
