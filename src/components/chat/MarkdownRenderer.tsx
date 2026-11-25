"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-xs sm:text-[13px] leading-relaxed text-bone break-words">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          return <CodeBlock key={index} rawCode={part} />;
        }
        return <TextBlock key={index} text={part} />;
      })}
    </div>
  );
}

function CodeBlock({ rawCode }: { rawCode: string }) {
  const [copied, setCopied] = useState(false);

  // Extract language and code body
  const lines = rawCode.slice(3, -3).split("\n");
  const firstLine = lines[0].trim();
  const language = firstLine && !firstLine.includes(" ") ? firstLine : "text";
  const codeContent = (firstLine && !firstLine.includes(" ") ? lines.slice(1) : lines).join("\n").replace(/^\n+|\n+$/g, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div className="my-3 border border-line-soft bg-ink-2 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-ink-3/80 border-b border-line-soft text-[10px] tracking-widest uppercase text-muted">
        <span className="font-mono text-bone-dim">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 hover:text-bone text-muted transition-colors rounded"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[11px] sm:text-xs font-mono text-bone leading-relaxed whitespace-pre selection:bg-vermilion selection:text-white">
        <code>{codeContent}</code>
      </div>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Header 1
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={pIdx} className="kage-display text-base sm:text-lg text-bone pt-2 pb-1 border-b border-line-soft">
              {formatInline(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        // Header 2
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={pIdx} className="kage-display text-sm sm:text-base text-bone pt-2 pb-0.5">
              {formatInline(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }

        // Header 3
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={pIdx} className="font-medium tracking-wide text-xs sm:text-sm text-vermilion uppercase pt-1">
              {formatInline(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={pIdx} className="border-l-2 border-vermilion pl-3 py-1 my-2 bg-ink-2/60 text-bone-dim italic text-xs">
              {formatInline(trimmed.replace(/^>\s*/gm, ""))}
            </blockquote>
          );
        }

        // Lists (unordered and ordered)
        const lines = para.split("\n");
        const isBulletList = lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* ") || !l.trim());
        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-2">
              {lines.map((l, lIdx) => {
                const item = l.trim().replace(/^[-*]\s+/, "");
                if (!item) return null;
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="text-vermilion mt-1 select-none text-[10px]">▪</span>
                    <span className="flex-1">{formatInline(item)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()) || !l.trim());
        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1.5 my-2 pl-2">
              {lines.map((l, lIdx) => {
                const match = l.trim().match(/^(\d+)\.\s+(.*)$/);
                if (!match) return null;
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-muted tabular-nums font-mono text-[11px] mt-0.5">{match[1]}.</span>
                    <span className="flex-1">{formatInline(match[2])}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Standard Paragraph with support for single line breaks
        return (
          <p key={pIdx} className="text-bone-dim font-light leading-relaxed my-1.5">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {formatInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function formatInline(text: string): React.ReactNode {
  // Parse inline elements: bold (**), italics (* or _), inline code (`)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono bg-ink-3 text-vermilion border border-line-soft rounded-none"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={idx} className="font-medium text-bone">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return (
        <em key={idx} className="text-bone italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    return token;
  });
}
