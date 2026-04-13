import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GeminiKey;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
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

        const { GoogleGenAI } = require("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        // Create streaming response
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const streamResponse = await ai.models.generateContentStream({
                        model: "gemini-3-pro-preview",
                        config: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                            systemInstruction: systemPrompt,
                        },
                        contents: messages,
                    });

                    for await (const chunk of streamResponse) {
                        const text = chunk.text;
                        if (text) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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
