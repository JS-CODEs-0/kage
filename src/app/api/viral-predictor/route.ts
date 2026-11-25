import { NextRequest, NextResponse } from "next/server";
import { getNemotronApiKey } from "@/lib/nemotron";

export const maxDuration = 60; // Up to 60s for deep viral prediction and content refinement

interface BrandProfileInput {
  businessName?: string;
  businessDescription?: string;
  industry?: string;
  targetAudience?: string;
  brandTone?: string;
  preferredPlatform?: string;
}

interface MediaMetaInput {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  duration?: number; // in seconds for video
  hasAudio?: boolean;
}

async function fetchNemotronCompletion(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 1000,
  temperature: number = 0.3
): Promise<string> {
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error: ${response.statusText} (${response.status}) - ${errorText}`);
  }

  if (!response.body) {
    throw new Error("No response body received from NVIDIA API.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(dataStr);
        const contentChunk = parsed.choices?.[0]?.delta?.content;
        if (contentChunk) {
          accumulated += contentChunk;
        }
      } catch {
        // partial chunk
      }
    }
  }

  return accumulated.trim();
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
    const {
      action = "analyze",
      content = "",
      platform = "Instagram",
      contentType = "text",
      mediaMeta,
      hashtags = "",
      brandProfile,
      // For "improve" action
      improveType = "hook",
      targetPlatform,
      previousAnalysis,
    } = body;

    // Brand profile injection snippet
    let brandSnippet = "";
    if (brandProfile && (brandProfile.businessName || brandProfile.industry)) {
      brandSnippet = `
BRAND PROFILE CONTEXT:
- Brand Name: ${brandProfile.businessName || "Not specified"}
- Value Proposition: ${brandProfile.businessDescription || "N/A"}
- Industry / Niche: ${brandProfile.industry || "General"}
- Target Audience: ${brandProfile.targetAudience || "General Audience"}
- Brand Tone: ${brandProfile.brandTone || "Viral & Punchy"}
`;
    }

    // Media metadata formatting
    let mediaSnippet = "";
    if (mediaMeta) {
      mediaSnippet = `
ATTACHED MEDIA SIGNALS:
- Media Format: ${mediaMeta.fileType || contentType}
- Dimensions / Aspect Ratio: ${mediaMeta.width || "?"}x${mediaMeta.height || "?"} (${mediaMeta.aspectRatio || "N/A"})
${mediaMeta.duration ? `- Video Duration: ${Math.round(mediaMeta.duration)} seconds` : ""}
${mediaMeta.fileSize ? `- File Size: ${(mediaMeta.fileSize / (1024 * 1024)).toFixed(2)} MB` : ""}
`;
    }

    // =========================================================================
    // ACTION 1: ANALYZE VIRAL POTENTIAL
    // =========================================================================
    if (action === "analyze") {
      if (!content.trim() && !mediaMeta) {
        return NextResponse.json(
          { error: "Content copy, script, or media metadata is required for viral analysis." },
          { status: 400 }
        );
      }

      const systemPrompt = `You are SocialPilot's Lead Content Intelligence & Viral Algorithmic Auditor.
You analyze social media content (captions, reel scripts, text posts, video parameters, and image framing) using empirical distribution heuristics from X (Twitter), LinkedIn, Instagram, and Facebook.

EVALUATION CRITERIA:
1. Hook Strength (0-100, Weight 25%): Does the opening 3 seconds of video or opening 1.5 lines of text interrupt the feed scroll?
2. Engagement Potential (0-100, Weight 25%): Likelihood of comments, debate, bookmarks/saves, and high-velocity shares.
3. Content Quality (0-100, Weight 20%): Clarity, storytelling, readability, visual density, originality, and value delivery.
4. Audience Relevance (0-100, Weight 15%): Resonance with the target audience and niche pain points.
5. Platform Suitability (0-100, Weight 15%): Formatting, line breaks, length, and cultural norms matching ${platform}.

${brandSnippet}
${mediaSnippet}

CRITICAL RULES:
- Return strictly valid JSON without any markdown code blocks or wrapping.
- Provide objective, critical scoring. Do not artificially inflate scores.
- Never guarantee view counts, follower numbers, or revenue.
- Provide concrete, non-generic strengths, weaknesses, failure modes, and platform recommendations.`;

      const userPrompt = `AUDIT THIS SUBMISSION:
- Target Platform: ${platform}
- Content Format: ${contentType}
- Text / Script / Caption:
"""
${content.trim() || "[No written copy provided; evaluate based on media parameters]"}
"""
${hashtags ? `- Hashtags: ${hashtags}` : ""}

Return a single JSON object with this exact schema:
{
  "hookScore": <integer 0-100>,
  "hookExplanation": "<concise explanation of hook velocity and curiosity gap>",
  "engagementScore": <integer 0-100>,
  "engagementExplanation": "<explanation of comment, share, and save drivers>",
  "qualityScore": <integer 0-100>,
  "qualityExplanation": "<explanation of clarity, storytelling, and delivery>",
  "relevanceScore": <integer 0-100>,
  "relevanceExplanation": "<explanation of audience alignment and emotional resonance>",
  "platformScore": <integer 0-100>,
  "platformExplanation": "<explanation of ${platform} format, aspect ratio, and pacing suitability>",
  "verdict": "<2-3 sentence executive editorial verdict>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "failureRisks": ["<primary algorithmic or viewer drop-off risk 1>", "<risk 2>"],
  "audienceAppeal": "<concise breakdown of which demographic segment will engage most>",
  "retentionAnalysis": "<second-by-second hook audit, visual transition note, or drop-off warning>",
  "platformRecommendations": ["<platform specific tip 1>", "<platform specific tip 2>"],
  "actionableSuggestions": ["<immediate concrete improvement 1>", "<immediate concrete improvement 2>", "<immediate concrete improvement 3>"]
}`;

      const rawContent = await fetchNemotronCompletion(
        apiKey,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        1200,
        0.3
      );

      let cleanJson = rawContent;
      if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);

      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanJson.trim());
      } catch (err) {
        console.error("Failed to parse Nemotron JSON output:", rawContent);
        return NextResponse.json(
          { error: "AI model returned unparseable analysis output." },
          { status: 502 }
        );
      }

      // Calculate transparent weighted score
      const hook = Number(parsedResult.hookScore) || 50;
      const engagement = Number(parsedResult.engagementScore) || 50;
      const quality = Number(parsedResult.qualityScore) || 50;
      const relevance = Number(parsedResult.relevanceScore) || 50;
      const platformScore = Number(parsedResult.platformScore) || 50;

      const weightedOverall = Math.round(
        hook * 0.25 +
        engagement * 0.25 +
        quality * 0.20 +
        relevance * 0.15 +
        platformScore * 0.15
      );

      // Determine classification tier
      let tier = "Moderate Potential";
      let tierKey = "moderate";
      if (weightedOverall <= 30) {
        tier = "Low Potential";
        tierKey = "low";
      } else if (weightedOverall <= 50) {
        tier = "Needs Improvement";
        tierKey = "needs_improvement";
      } else if (weightedOverall <= 70) {
        tier = "Moderate Potential";
        tierKey = "moderate";
      } else if (weightedOverall <= 85) {
        tier = "High Potential";
        tierKey = "high";
      } else {
        tier = "Excellent Potential";
        tierKey = "excellent";
      }

      const finalReport = {
        id: `audit_${Date.now()}`,
        analyzedAt: new Date().toISOString(),
        platform,
        contentType,
        content,
        mediaMeta: mediaMeta || null,
        overallScore: weightedOverall,
        tier,
        tierKey,
        subScores: {
          hookStrength: {
            score: hook,
            weight: "25%",
            explanation: parsedResult.hookExplanation || "Evaluates opening hook velocity and retention hold.",
          },
          engagementPotential: {
            score: engagement,
            weight: "25%",
            explanation: parsedResult.engagementExplanation || "Measures comment triggers, shareability, and save-worthiness.",
          },
          contentQuality: {
            score: quality,
            weight: "20%",
            explanation: parsedResult.qualityExplanation || "Audits clarity, storytelling depth, and informational value.",
          },
          audienceRelevance: {
            score: relevance,
            weight: "15%",
            explanation: parsedResult.relevanceExplanation || "Measures alignment with target audience pain points.",
          },
          platformSuitability: {
            score: platformScore,
            weight: "15%",
            explanation: parsedResult.platformExplanation || `Evaluates cultural and algorithmic fit for ${platform}.`,
          },
        },
        verdict: parsedResult.verdict || "Analysis completed based on current algorithmic parameters.",
        strengths: parsedResult.strengths || [],
        weaknesses: parsedResult.weaknesses || [],
        failureRisks: parsedResult.failureRisks || [],
        audienceAppeal: parsedResult.audienceAppeal || "Resonates with general platform demographic.",
        retentionAnalysis: parsedResult.retentionAnalysis || "Monitor opening 3 seconds for initial drop-off.",
        platformRecommendations: parsedResult.platformRecommendations || [],
        actionableSuggestions: parsedResult.actionableSuggestions || [],
      };

      return NextResponse.json(finalReport);
    }

    // =========================================================================
    // ACTION 2: IMPROVE CONTENT
    // =========================================================================
    if (action === "improve") {
      if (!content.trim()) {
        return NextResponse.json(
          { error: "Original content is required for AI improvement." },
          { status: 400 }
        );
      }

      const activePlatform = targetPlatform || platform || "Instagram";

      let directive = "";
      switch (improveType) {
        case "hook":
          directive = "Rewrite the opening hook into 3 distinct, high-impact options: 1) Negative pattern-interrupt, 2) High-stakes contrarian statement, 3) Specific curiosity-gap question. Retain the rest of the message.";
          break;
        case "caption":
          directive = `Optimize the full caption for ${activePlatform}: tighten sentence structure, add rhythmic line breaks, remove fluff, and ensure high skimmability without sacrificing depth.`;
          break;
        case "engagement":
          directive = "Inject intense comment triggers, relatable debate questions, and a compelling reason for viewers to save and share the post.";
          break;
        case "cta":
          directive = `Replace or upgrade the call-to-action with 3 high-converting options tailored to ${brandProfile?.businessName || "the creator"}: 1) Direct value-capture, 2) Conversation starter, 3) Action prompt.`;
          break;
        case "storytelling":
          directive = "Elevate the narrative: introduce clear tension in the opening, a relatable conflict in the middle, and an actionable, memorable resolution.";
          break;
        case "alternative":
          directive = "Generate 3 completely different creative angles/variations of this core idea: 1) Data-driven / Case study, 2) Personal lesson learned, 3) Contrarian hot-take.";
          break;
        case "platform":
          directive = `Completely adapt and reformat this content specifically for ${activePlatform}, matching its native cadence, character length, and viewer expectations.`;
          break;
        default:
          directive = `Refine and elevate this content for maximum impact on ${activePlatform}.`;
          break;
      }

      const systemPrompt = `You are SocialPilot's Master Content Optimizer.
Your job is to elevate, sharpen, and transform social media posts into elite-tier dispatches adhering to the Kage philosophy: stillness, density, and zero generic fluff.

${brandSnippet}
Directive: ${directive}

Format your response as a valid JSON object:
{
  "improvedContent": "<complete improved text/script, ready to copy and publish>",
  "changesSummary": "<concise summary of exact structural upgrades made>",
  "expectedImpact": "<why this version achieves higher retention, comments, or saves>"
}`;

      const userPrompt = `ORIGINAL CONTENT (${activePlatform}):
"""
${content.trim()}
"""
${previousAnalysis ? `PREVIOUS WEAKNESSES TO FIX: ${JSON.stringify(previousAnalysis.weaknesses || [])}` : ""}

Return strictly valid JSON without markdown wrapping.`;

      const rawContent = await fetchNemotronCompletion(
        apiKey,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        1200,
        0.5
      );

      let cleanJson = rawContent;
      if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);

      let parsedImprovement;
      try {
        parsedImprovement = JSON.parse(cleanJson.trim());
      } catch (err) {
        return NextResponse.json({
          improvedContent: rawContent,
          changesSummary: "Upgraded hook, pacing, and storytelling.",
          expectedImpact: "Higher retention and comment velocity.",
        });
      }

      return NextResponse.json(parsedImprovement);
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error in viral predictor route";
    console.error("Viral predictor route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
