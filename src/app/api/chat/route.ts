import { llmFetch, TEXT_BASE, TEXT_MODEL, TEXT_KEY, VISION_BASE, VISION_MODEL, VISION_KEY } from '@/lib/llm-config';
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, CHAT_LIMIT } from '@/lib/rate-limit';
import { buildVeraContext } from '@/lib/vera-context';
import { comparablesFor, searchComps } from '@/lib/vera-db';
import { needsResearch, researchBlock } from '@/lib/vera-web';
import { getCurrentUserId } from '@/lib/kv-user-wrapper';

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
        const groqKey = process.env.GROQ_API_KEY || 'local';
        if (!groqKey) {
            return new Response(
                JSON.stringify({ error: "GROQ_API_KEY not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { messages, systemPrompt, page, pageTitle, pageText } = body as {
            messages: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
            systemPrompt: string;
            page?: string;
            pageTitle?: string;
            pageText?: string;
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

        // ── VERA omniscience: full DB record + live screen + optional web research ──
        let contextText = '';
        const extras: string[] = [];
        let veh: any = null;
        try {
            const userId = await getCurrentUserId(request);
            const ctx = await buildVeraContext(userId, page);
            contextText = ctx.text;
            veh = ctx.vehicle || null;
            console.log(`[VERA Chat] context injected (${contextText.length} chars) — form:${ctx.has.form} analysis:${ctx.has.analysis} carfax:${ctx.has.carfax} nhtsa:${ctx.has.nhtsa} fleet:${ctx.has.fleet}`);
        } catch (e: any) {
            console.warn('[VERA Chat] context build failed:', e?.message);
        }

        // ── In-time view of whatever screen the user is on ──
        if (pageText) {
            extras.push(`## CURRENT SCREEN (live snapshot, may include UI chrome)\nPage: ${page || '?'}${pageTitle ? ` — ${pageTitle}` : ''}\n${String(pageText).slice(0, 2500)}`);
        }

        // ── Local market database (the app's own comps datasets) ──
        try {
            if (veh?.make && veh?.model) {
                const c = comparablesFor(veh.make, veh.model);
                extras.push(`## LOCAL MARKET DATABASE\nDataset holds ${c.datasetSize} scraped listings; ${c.matched} comparable ${veh.make} ${veh.model} record(s)` +
                    (c.priceRange ? ` with prices $${c.priceRange.low.toLocaleString()}–$${c.priceRange.high.toLocaleString()} (avg $${c.priceRange.avg.toLocaleString()})` : '') +
                    (c.samples.length ? `\n` + c.samples.join('\n') : ''));
            }
        } catch { /* non-fatal */ }

        // ── Live internet research when the question warrants it ──
        const lastUser = [...messages].reverse().find((m: any) => m.role === 'user');
        const lastText = lastUser?.parts?.map((p: any) => p.text).join(' ').slice(0, 400) || '';
        if (needsResearch(lastText)) {
            const q = [veh?.year, veh?.make, veh?.model, veh?.trim, lastText].filter(Boolean).join(' ');
            try {
                const rb = await researchBlock(q);
                if (rb) { extras.push(rb); console.log('[VERA Chat] live web research injected'); }
            } catch (e: any) {
                console.warn('[VERA Chat] research failed:', e?.message);
            }
        }

        const persona = 'You are VERA — the blunt, expert used-car buying strategist inside the Veracar app. ' +
            'You are speaking with the operator (a professional buyer). Never claim a data point you were not given.';

        const systemParts = [persona, contextText, ...extras, systemPrompt].filter(Boolean);
        if (systemParts.length) {
            groqMessages.unshift({ role: 'system', content: systemParts.join('\n\n') });
        }

        const response = await llmFetch({
            messages: groqMessages,
            temperature: 0.7,
            stream: true,
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
