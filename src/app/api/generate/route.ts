import { NextRequest, NextResponse } from "next/server";
import { getNemotronApiKey } from "@/lib/nemotron";

export const maxDuration = 60; // Allow up to 60 seconds for LLM generation

interface BrandProfileInput {
  businessName?: string;
  businessDescription?: string;
  industry?: string;
  targetAudience?: string;
  brandTone?: string;
  preferredPlatform?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = getNemotronApiKey(req, body.apiKey);
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "NEMOTRON_API_KEY is not configured on the server.",
          help: "Configure NEMOTRON_API_KEY in .env.local, set it in Vercel project settings, or supply it via Settings in the application."
        },
        { status: 500 }
      );
    }
    const { mode, topic, tone = "Viral & Punchy", brandProfile } = body as {
      mode: string;
      topic: string;
      tone?: string;
      brandProfile?: BrandProfileInput;
    };

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Topic is required." },
        { status: 400 }
      );
    }

    const effectiveTone = brandProfile?.brandTone || tone;
    const platform = brandProfile?.preferredPlatform || "Social Media";

    let brandSnippet = "";
    if (brandProfile && (brandProfile.businessName || brandProfile.industry)) {
      brandSnippet = `
BRAND PROFILE INJECTION:
- Business: ${brandProfile.businessName || "Not specified"}
- Description: ${brandProfile.businessDescription || "N/A"}
- Industry: ${brandProfile.industry || "General"}
- Target Audience: ${brandProfile.targetAudience || "General Audience"}
- Preferred Platform: ${platform}
- Tone: ${effectiveTone}
`;
    }

    let prompt = "";
    switch (mode) {
      case "hashtags":
        prompt = `${brandSnippet ? `${brandSnippet}\n` : ""}Generate a high-performing social media hashtag set for: "${topic.trim()}".
Platform Focus: ${platform}.
Tone: ${effectiveTone}.

Format your response cleanly:
1. **High Reach / Broad Tags** (4-6 tags)
2. **Niche & Industry Community Tags** (8-10 tags tailored to ${brandProfile?.industry || "the niche"})
3. **Target Audience Tags** (4-6 tags matching ${brandProfile?.targetAudience || "the audience"})
4. **Ready-to-Copy Block**: A single block with 20-25 clean hashtags separated by spaces.`;
        break;

      case "reels":
        prompt = `${brandSnippet ? `${brandSnippet}\n` : ""}Write a viral 30-45 second video reel/short script for ${platform} about: "${topic.trim()}".
Tone: ${effectiveTone}.
${brandProfile?.targetAudience ? `Target Viewer: ${brandProfile.targetAudience}` : ""}

Format with these clear sections:
- **Audio Direction**: Fast-paced music / beat suggestion.
- **The Hook (0-3s)**:
  * Visual: [Camera cue / action]
  * Text on Screen: [Bold hook]
  * Voiceover: "[First words spoken]"
- **Body Breakdown (3-25s)**:
  * 3 quick sequential scene cuts with visual actions and spoken lines.
- **Call-to-Action (25-30s)**:
  * Direct action prompt tailored to ${brandProfile?.businessName || "the brand"}.
- **Recommended Caption**: 2 sentences + 5 relevant hashtags.`;
        break;

      case "ideas":
        prompt = `${brandSnippet ? `${brandSnippet}\n` : ""}Generate 5 creative, high-converting ${platform} post concepts about: "${topic.trim()}".
Tone: ${effectiveTone}.
${brandProfile?.businessName ? `Brand Context: ${brandProfile.businessName} (${brandProfile.industry || ""})` : ""}

For each of the 5 ideas, provide:
- **Idea #[N]: [Catchy Angle / Title]**
- **Format**: (Carousel / Single Image / Thread / Short Video)
- **The Hook**: Exact opening line to stop the scroll
- **Brief Outline**: 2-3 bullet points of what to share
- **Engagement Trigger**: Why this makes ${brandProfile?.targetAudience || "viewers"} comment, save, or share.
Keep it punchy, practical, and immediately usable.`;
        break;

      case "caption":
      case "captions":
      default:
        prompt = `${brandSnippet ? `${brandSnippet}\n` : ""}Write 3 high-converting social media caption variations for ${platform} about: "${topic.trim()}".
Tone: ${effectiveTone}.
${brandProfile?.targetAudience ? `Target Audience: ${brandProfile.targetAudience}` : ""}

Provide:
- **Option 1: Punchy & Direct** (Immediate hook, concise value, direct CTA)
- **Option 2: Story-Driven / Value-First** (Relatable opening, brief lesson/insight, question CTA)
- **Option 3: Conversational & Engagement-Focused** (Designed to trigger debate or comments)

Use clean line breaks, appropriate emojis, and include 5-8 relevant hashtags at the bottom of each option.`;
        break;
    }

    const systemPrompt = `You are SocialPilot's world-class AI social media strategist and copywriter. Produce sharp, authentic, high-converting content with zero generic fluff.
${brandSnippet ? `Always align the copy with this brand's voice and audience:\n${brandSnippet}` : ""}`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA API error:", response.status, errorText);
      return NextResponse.json(
        { error: `NVIDIA API error: ${response.statusText} (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from NVIDIA Nemotron." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content,
      mode: mode || "captions",
      topic: topic.trim(),
      tone: effectiveTone,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("Generate route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
