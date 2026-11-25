import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60 seconds for streaming LLM generation

interface BrandProfileInput {
  businessName?: string;
  businessDescription?: string;
  industry?: string;
  targetAudience?: string;
  brandTone?: string;
  preferredPlatform?: string;
}

interface MessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEMOTRON_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEMOTRON_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages, brandProfile } = body as {
      messages: MessageInput[];
      brandProfile?: BrandProfileInput;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "A valid messages array is required." },
        { status: 400 }
      );
    }

    // Prepare brand context snippet
    let brandContext = "";
    if (brandProfile && (brandProfile.businessName || brandProfile.industry)) {
      brandContext = `
ACTIVE BRAND PROFILE:
- Business / Entity Name: ${brandProfile.businessName || "Not specified"}
- Value Proposition: ${brandProfile.businessDescription || "N/A"}
- Industry / Sector: ${brandProfile.industry || "General"}
- Target Demographics: ${brandProfile.targetAudience || "General Audience"}
- Brand Cadence & Tone: ${brandProfile.brandTone || "Viral & Punchy"}
- Primary Broadcast Platform: ${brandProfile.preferredPlatform || "Universal"}
`;
    }

    const systemPrompt = `You are SocialPilot's Master AI Strategist & Social Architect, rooted in the refined, disciplined "Kage" (Kyoto Temple) aesthetic.
Your purpose is to counsel the user on high-impact social media strategy, viral content engineering, narrative positioning, copywriting, hook psychology, scriptwriting, and publication rhythm.

CORE GUIDANCE & PHILOSOPHY:
1. Stillness & Density: Eliminate generic corporate fluff, cliches, and hollow hype. Deliver dense, high-signal, punchy ideas that stop the scroll within 1.5 seconds.
2. Platform Fluency: You possess deep tactical expertise across X (Twitter), LinkedIn, Instagram, TikTok, YouTube Shorts, and Threads. You understand algorithmic distribution, carousel pacing, retention graphs, and comment triggers.
3. Brand Alignment: When an active brand profile is provided, seamlessly anchor your advice, copy, hooks, and content pillars directly to that identity.
4. Action-Ready Formatting: Format your outputs cleanly using Markdown with bold headers, bullet lists, code blocks for copy/scripts, and step-by-step blueprints when appropriate.
5. Versatility: You can brainstorm ideas, write full captions with hashtags, draft 30-60 second video scripts with visual/audio directions, critique existing posts, design 7-day content calendars, and advise on brand positioning.

${brandContext ? brandContext : "No specific brand profile is currently active. Provide universal, elite-tier strategic guidance unless the user describes their brand."}
Always maintain a sharp, confident, respectful, and highly strategic tone.`;

    const upstreamMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const upstreamResponse = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          messages: upstreamMessages,
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 0.95,
          stream: true,
        }),
      }
    );

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error("NVIDIA Chat API upstream error:", upstreamResponse.status, errorText);
      return NextResponse.json(
        { error: `NVIDIA API error: ${upstreamResponse.statusText} (${upstreamResponse.status})` },
        { status: upstreamResponse.status }
      );
    }

    if (!upstreamResponse.body) {
      return NextResponse.json(
        { error: "No response body received from upstream AI engine." },
        { status: 502 }
      );
    }

    // Set up SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const upstreamReader = upstreamResponse.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;

              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta;
                const contentChunk = delta?.content;

                if (contentChunk) {
                  const sseMessage = `data: ${JSON.stringify({ content: contentChunk })}\n\n`;
                  controller.enqueue(encoder.encode(sseMessage));
                }
              } catch {
                // Ignore incomplete JSON chunks in stream
              }
            }
          }
        } catch (err: unknown) {
          const errMessage = err instanceof Error ? err.message : "Stream processing error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error in chat route";
    console.error("Chat route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
