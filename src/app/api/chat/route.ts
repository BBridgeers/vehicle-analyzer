import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, CHAT_LIMIT } from '@/lib/rate-limit';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    // ── Rate Limiting ──
    const ip = getClientIp(request);
    // Use IP as userId for rate limiting
    const rl = await rateLimit(`chat:${ip}`, CHAT_LIMIT.max, CHAT_LIMIT.windowSec, ip);
    if (!rl.allowed) {
        return NextResponse.json(
            { error: `Daily chat limit of ${CHAT_LIMIT.max} messages reached. Resets at midnight.` },
            { status: 429 }
        );
    }

    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return new Response(
                JSON.stringify({ error: "GROQ_API_KEY not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { messages, systemPrompt } = body as {
            messages: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
            systemPrompt: string;
        };

        if (!messages || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: "No messages provided" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Map Gemini-style messages to Groq/OpenAI style
        const groqMessages = messages.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts.map(p => p.text).join('\n')
        }));

        // Add system prompt if present
        if (systemPrompt) {
            groqMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                temperature: 0.7,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Groq request failed');
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = response.body?.getReader();

        const stream = new ReadableStream({
            async start(controller) {
                if (!reader) {
                    controller.close();
                    return;
                }

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    const text = data.choices[0]?.delta?.content;
                                    if (text) {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                                    }
                                } catch (e) {
                                    // Ignore parse errors for partial chunks
                                }
                            }
                        }
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (err: any) {
                    console.error("[VERA Chat] Stream error:", err);
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: err.message || "Stream failed" })}\n\n`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error: any) {
        console.error("[VERA Chat] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Chat request failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
