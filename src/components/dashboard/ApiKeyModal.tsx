"use client";

import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, AlertCircle, X, Check, Loader2, ExternalLink } from "lucide-react";
import { getStoredApiKey, setStoredApiKey } from "@/lib/client-api";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeyInput(getStoredApiKey());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(keyInput);
    setSavedSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTestKey = async () => {
    const keyToTest = keyInput.trim().replace(/^["']|["']$/g, "").trim();
    if (!keyToTest) {
      setTestResult({ success: false, message: "Please enter an API key to test." });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nemotron-api-key": keyToTest,
        },
        body: JSON.stringify({
          topic: "AI verification test",
          mode: "hashtags",
          apiKey: keyToTest,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Authentication failed. Key was rejected by NVIDIA.");
      }

      setTestResult({
        success: true,
        message: "NVIDIA Nemotron authenticated successfully! Key is valid.",
      });
      // Automatically save if valid
      setStoredApiKey(keyToTest);
      if (onSaved) onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication test failed.";
      setTestResult({ success: false, message: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setStoredApiKey("");
    setKeyInput("");
    setTestResult(null);
    setSavedSuccess(false);
    if (onSaved) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-xl bg-[#0a0e12] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e0231c]/10 border border-[#e0231c]/20 flex items-center justify-center text-[#e0231c]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#dfe7e0]">NVIDIA Nemotron Key Setup</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-[#e0231c]/10 text-[#e0231c] border border-[#e0231c]/20">
                  認証
                </span>
              </div>
              <p className="text-xs text-[#78837c] mt-0.5">
                Configure your NVIDIA Nemotron API Key for AI synthesis and intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-[#aab4ad] flex items-center justify-between">
            <span>API Key (nvapi-...)</span>
            {keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 underline font-sans"
              >
                Clear Key
              </button>
            )}
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="nvapi-RIA5-..."
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setSavedSuccess(false);
                setTestResult(null);
              }}
              className="w-full px-4 py-3 rounded-xl bg-[#05070a] border border-white/10 text-sm text-[#dfe7e0] placeholder-[#78837c]/60 focus:outline-none focus:border-[#e0231c] transition-colors font-mono"
            />
          </div>
          <p className="text-[11px] text-[#78837c]">
            Keys saved here persist in your local browser and are securely attached via request headers.
          </p>
        </div>

        {/* Status / Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
              testResult.success
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                : "bg-red-950/30 border-red-500/30 text-red-400"
            }`}
          >
            {testResult.success ? (
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <div>
              <p className="font-medium">{testResult.success ? "Key Verified" : "Authentication Error"}</p>
              <p className="opacity-90 mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Key saved successfully! Closing...</span>
          </div>
        )}

        {/* Server & Vercel Instructions */}
        <div className="p-4 rounded-xl bg-[#05070a] border border-white/5 space-y-2 text-xs text-[#78837c]">
          <div className="flex items-center gap-2 text-[#aab4ad] font-medium">
            <ExternalLink className="w-3.5 h-3.5 text-[#e0231c]" />
            <span>Alternative Server Configuration</span>
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong className="text-[#dfe7e0]">Local Development:</strong> Add{" "}
              <code className="text-[#e0231c] bg-white/5 px-1 py-0.5 rounded font-mono">
                NEMOTRON_API_KEY=your_key
              </code>{" "}
              to your <code className="text-[#dfe7e0]">.env.local</code> file.
            </li>
            <li>
              <strong className="text-[#dfe7e0]">Vercel Cloud:</strong> In Vercel Project Settings &gt; Environment Variables, add{" "}
              <code className="text-[#e0231c] bg-white/5 px-1 py-0.5 rounded font-mono">
                NEMOTRON_API_KEY
              </code>{" "}
              for Production, Preview & Development.
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-[#78837c] hover:text-[#dfe7e0] hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing || !keyInput.trim()}
            className="px-4 py-2.5 rounded-xl border border-[#e0231c]/30 text-xs font-medium text-[#e0231c] hover:bg-[#e0231c]/10 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!keyInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#e0231c] hover:bg-[#ff5a3c] disabled:opacity-50 text-white text-xs font-medium shadow-lg shadow-[#e0231c]/20 transition-all flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Key</span>
          </button>
        </div>
      </div>
    </div>
  );
}
