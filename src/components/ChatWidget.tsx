"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    MessageSquare, X, Send, Trash2, Copy, Check, ChevronDown,
    Zap, AlertTriangle, Bot, User, Sparkles, RotateCcw, Minimize2, Maximize2
} from "lucide-react";
import type { Vehicle, AnalysisResult } from "@/lib/types";
import {
    buildSystemPrompt,
    PROMPT_STARTERS,
    type ChatMessage,
    saveChatSession,
    loadChatSession,
    clearChatSession,
    makeVehicleId,
    parseFollowUps,
} from "@/lib/chat-context";

interface ChatWidgetProps {
    vehicle: Vehicle | null;
    analysis: AnalysisResult | null;
}

// ── Typing indicator ──
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-4 py-3">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] opacity-70"
                        style={{ animation: `vera-bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                ))}
            </div>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">VERA is analyzing...</span>
        </div>
    );
}

// ── Single message bubble ──
function MessageBubble({
    message,
    onFollowUp,
}: {
    message: ChatMessage;
    onFollowUp: (q: string) => void;
}) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === "user";

    const copy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center border
                ${isUser
                    ? "bg-[var(--color-accent-indigo)]/20 border-[var(--color-accent-indigo)]/40"
                    : "bg-[var(--color-accent-cyan)]/10 border-[var(--color-accent-cyan)]/30"
                }`}>
                {isUser
                    ? <User className="w-3.5 h-3.5 text-[var(--color-accent-indigo)]" />
                    : <Bot className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                }
            </div>

            <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                {/* Bubble */}
                <div className={`relative px-4 py-3 rounded-lg text-sm leading-relaxed
                    ${isUser
                        ? "bg-[var(--color-accent-indigo)]/15 border border-[var(--color-accent-indigo)]/30 text-[var(--color-text-primary)]"
                        : "bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                    }`}>
                    {/* VERA label */}
                    {!isUser && (
                        <span className="block text-[10px] font-mono font-bold text-[var(--color-accent-cyan)] tracking-widest uppercase mb-1.5 opacity-70">
                            VERA //
                        </span>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Copy button */}
                    <button
                        onClick={copy}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-bg-glass-hover)]"
                        title="Copy message"
                    >
                        {copied
                            ? <Check className="w-3 h-3 text-[var(--color-accent-emerald)]" />
                            : <Copy className="w-3 h-3 text-[var(--color-text-muted)]" />
                        }
                    </button>
                </div>

                {/* Follow-up chips */}
                {!isUser && message.followUps && message.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {message.followUps.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => onFollowUp(q)}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)]
                                    bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]
                                    hover:border-[var(--color-accent-cyan)]/50 hover:text-[var(--color-accent-cyan)]
                                    hover:bg-[var(--color-accent-cyan)]/5 transition-all truncate max-w-[220px]"
                                title={q}
                            >
                                ↳ {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-[var(--color-text-disabled)] mt-1 font-mono">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
}

// ── Main widget ──
export default function ChatWidget({ vehicle, analysis }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [showStarters, setShowStarters] = useState(true);
    const [postPurchaseMode, setPostPurchaseMode] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const vehicleId = vehicle ? makeVehicleId(vehicle) : null;
    const hasContext = !!(vehicle && analysis);

    // ── Load chat from localStorage when vehicle changes ──
    useEffect(() => {
        if (!vehicleId) return;
        const saved = loadChatSession(vehicleId);
        if (saved.length > 0) {
            setMessages(saved);
            setShowStarters(false);
        } else {
            setMessages([]);
            setShowStarters(true);
        }
    }, [vehicleId]);

    // ── Persist chat ──
    useEffect(() => {
        if (!vehicleId || messages.length === 0) return;
        saveChatSession(vehicleId, messages);
    }, [messages, vehicleId]);

    // ── Auto-scroll ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    // ── Unread badge when closed ──
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === "assistant") {
                setUnreadCount((n) => n + 1);
            }
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen) setUnreadCount(0);
    }, [isOpen]);

    // ── Focus input on open ──
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isStreaming) return;
        if (!hasContext) return;

        const userMessage: ChatMessage = {
            role: "user",
            content: text.trim(),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setShowStarters(false);
        setIsStreaming(true);

        // Build conversation history for Gemini (role must be "user" | "model")
        const allMessages = [...messages, userMessage];
        const geminiMessages = allMessages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        // Placeholder for streaming
        const assistantId = Date.now() + 1;
        const placeholder: ChatMessage = {
            role: "assistant",
            content: "",
            timestamp: assistantId,
            followUps: [],
        };
        setMessages((prev) => [...prev, placeholder]);

        abortRef.current = new AbortController();

        try {
            const systemPrompt = buildSystemPrompt(vehicle!, analysis!);
            if (postPurchaseMode) {
                // Inject post-purchase context into system prompt
                const ppNote = "\n\nIMPORTANT: The user has PURCHASED this vehicle. Switch to POST-PURCHASE ownership mode. Focus on: immediate next steps, recall repairs, maintenance milestones, rideshare onboarding, first-week checklist. Do NOT warn them about whether to buy — they already own it.";
                const augmentedPrompt = systemPrompt + ppNote;

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: geminiMessages, systemPrompt: augmentedPrompt }),
                    signal: abortRef.current.signal,
                });

                await handleStream(res, assistantId);
            } else {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: geminiMessages, systemPrompt }),
                    signal: abortRef.current.signal,
                });

                await handleStream(res, assistantId);
            }
        } catch (err: any) {
            if (err.name !== "AbortError") {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.timestamp === assistantId
                            ? { ...m, content: "⚠️ VERA encountered an error. Please try again.", followUps: [] }
                            : m
                    )
                );
            }
        } finally {
            setIsStreaming(false);
        }
    }, [isStreaming, hasContext, messages, vehicle, analysis, postPurchaseMode]);

    const handleStream = async (res: Response, assistantId: number) => {
        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6);
                if (data === "[DONE]") break;

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.text) {
                        fullText += parsed.text;
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.timestamp === assistantId
                                    ? { ...m, content: fullText }
                                    : m
                            )
                        );
                    }
                    if (parsed.error) throw new Error(parsed.error);
                } catch {
                    // skip malformed chunks
                }
            }
        }

        // Parse follow-ups from the completed text
        const { clean, followUps } = parseFollowUps(fullText);
        setMessages((prev) =>
            prev.map((m) =>
                m.timestamp === assistantId
                    ? { ...m, content: clean, followUps }
                    : m
            )
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const stopStream = () => {
        abortRef.current?.abort();
        setIsStreaming(false);
    };

    const clearHistory = () => {
        if (!vehicleId) return;
        clearChatSession(vehicleId);
        setMessages([]);
        setShowStarters(true);
    };

    const contextLabel = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "No vehicle scanned";

    return (
        <>
            {/* ── Keyframe injection ── */}
            <style>{`
                @keyframes vera-bounce {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(-4px); opacity: 1; }
                }
                @keyframes vera-slide-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes vera-pulse-ring {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>

            {/* ── Floating Button ── */}
            {!isOpen && (
                <button
                    id="vera-chat-toggle"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl
                        bg-[var(--color-bg-secondary)] border border-[var(--color-accent-cyan)]/40
                        shadow-[0_0_20px_rgba(0,240,255,0.2),0_8px_32px_rgba(0,0,0,0.5)]
                        hover:shadow-[0_0_30px_rgba(0,240,255,0.4),0_12px_40px_rgba(0,0,0,0.6)]
                        hover:border-[var(--color-accent-cyan)]/70
                        transition-all duration-300 group"
                    title="Open VERA - Vehicle AI Assistant"
                >
                    {/* Pulse ring */}
                    <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 rounded-full bg-[var(--color-accent-cyan)] opacity-30"
                            style={{ animation: "vera-pulse-ring 2s ease-out infinite" }} />
                        <div className="w-8 h-8 rounded-full bg-[var(--color-accent-cyan)]/15 border border-[var(--color-accent-cyan)]/50
                            flex items-center justify-center">
                            <Bot className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                        </div>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] tracking-wider uppercase">VERA</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">AI Vehicle Analyst</span>
                    </div>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-accent-cyan)]
                            flex items-center justify-center text-[10px] font-bold text-black">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* ── Chat Panel ── */}
            {isOpen && (
                <div
                    className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden
                        bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)]
                        shadow-[0_0_40px_rgba(0,240,255,0.15),0_24px_64px_rgba(0,0,0,0.7)]
                        rounded-2xl"
                    style={{
                        width: "420px",
                        maxWidth: "calc(100vw - 24px)",
                        height: isMinimized ? "auto" : "600px",
                        maxHeight: "calc(100vh - 48px)",
                        animation: "vera-slide-up 0.25s ease-out",
                    }}
                    id="vera-chat-panel"
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]
                        bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-glass)]
                        flex-shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Animated avatar */}
                            <div className="relative w-8 h-8 rounded-lg bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/30
                                flex items-center justify-center">
                                <Bot className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                                {isStreaming && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-accent-lime)]
                                        border border-[var(--color-bg-secondary)]"
                                        style={{ animation: "vera-pulse-ring 1s ease-out infinite" }} />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-bold text-[var(--color-text-primary)] tracking-wider uppercase">VERA</span>
                                    {hasContext ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-emerald)]/15
                                            text-[var(--color-accent-emerald)] border border-[var(--color-accent-emerald)]/30 font-mono uppercase tracking-wider">
                                            Context Active
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-amber)]/15
                                            text-[var(--color-accent-amber)] border border-[var(--color-accent-amber)]/30 font-mono uppercase tracking-wider">
                                            No Vehicle
                                        </span>
                                    )}
                                    {postPurchaseMode && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-indigo)]/15
                                            text-[var(--color-accent-indigo)] border border-[var(--color-accent-indigo)]/30 font-mono uppercase tracking-wider">
                                            Owned
                                        </span>
                                    )}
                                </div>
                                {hasContext && (
                                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono truncate block" style={{ maxWidth: "200px" }}>
                                        [{contextLabel}]
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Post-purchase toggle */}
                            {hasContext && (
                                <button
                                    onClick={() => setPostPurchaseMode(!postPurchaseMode)}
                                    className={`p-1.5 rounded-lg transition-all text-[11px] font-mono uppercase tracking-widest
                                        ${postPurchaseMode
                                            ? "bg-[var(--color-accent-indigo)]/20 text-[var(--color-accent-indigo)] border border-[var(--color-accent-indigo)]/40"
                                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-glass-hover)]"
                                        }`}
                                    title={postPurchaseMode ? "Switch back to pre-purchase mode" : "I bought this car — switch to ownership mode"}
                                >
                                    {postPurchaseMode ? "✓ Owned" : "I Bought It"}
                                </button>
                            )}
                            {messages.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-glass-hover)] hover:text-[var(--color-accent-rose)] transition-all"
                                    title="Clear conversation"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-glass-hover)] transition-all"
                                title={isMinimized ? "Expand" : "Minimize"}
                            >
                                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-glass-hover)] hover:text-[var(--color-accent-rose)] transition-all"
                                title="Close VERA"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* ── Messages Area ── */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ minHeight: 0 }}>

                                {/* No context state */}
                                {!hasContext && (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-amber)]/10 border border-[var(--color-accent-amber)]/30
                                            flex items-center justify-center">
                                            <AlertTriangle className="w-7 h-7 text-[var(--color-accent-amber)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">No Vehicle Loaded</p>
                                            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-[260px]">
                                                Analyze a vehicle first — paste a listing URL, upload a screenshot, or fill in the form above. VERA will then have full context to assist you.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Welcome state with starters */}
                                {hasContext && showStarters && messages.length === 0 && (
                                    <div className="space-y-4">
                                        {/* Welcome message */}
                                        <div className="bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                                                <span className="text-xs font-mono font-bold text-[var(--color-accent-cyan)] uppercase tracking-widest">VERA Online</span>
                                            </div>
                                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                                I've fully analyzed the{" "}
                                                <span className="text-[var(--color-text-primary)] font-semibold">{contextLabel}</span>.
                                                Ask me anything — negotiation tactics, red flag breakdowns, rideshare math, or what to do after purchase.
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 font-mono">
                                                Verdict: <span className="text-[var(--color-text-primary)]">{analysis?.verdict}</span> •
                                                Score: <span className="text-[var(--color-text-primary)]">{analysis?.verdictScore}/100</span> •
                                                Confidence: <span className="text-[var(--color-text-primary)]">{analysis?.structuredVerdict.confidence}%</span>
                                            </p>
                                        </div>

                                        {/* Prompt starters grid */}
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Quick Actions</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {PROMPT_STARTERS.map((starter) => (
                                                    <button
                                                        key={starter.id}
                                                        onClick={() => sendMessage(starter.prompt)}
                                                        className="text-left px-3 py-2.5 rounded-lg border border-[var(--color-border-subtle)]
                                                            bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]
                                                            hover:border-[var(--color-accent-cyan)]/50 hover:text-[var(--color-text-primary)]
                                                            hover:bg-[var(--color-accent-cyan)]/5 transition-all text-xs leading-tight"
                                                        id={`vera-starter-${starter.id}`}
                                                    >
                                                        {starter.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Conversation */}
                                {messages.map((msg, i) => (
                                    <MessageBubble
                                        key={i}
                                        message={msg}
                                        onFollowUp={(q) => sendMessage(q)}
                                    />
                                ))}

                                {/* Typing indicator */}
                                {isStreaming && messages[messages.length - 1]?.content === "" && (
                                    <TypingIndicator />
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Quick starters bar (visible during chat) ── */}
                            {hasContext && messages.length > 0 && (
                                <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
                                    {PROMPT_STARTERS.slice(0, 5).map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => sendMessage(s.prompt)}
                                            disabled={isStreaming}
                                            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)]
                                                bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] whitespace-nowrap
                                                hover:border-[var(--color-accent-cyan)]/40 hover:text-[var(--color-accent-cyan)]
                                                disabled:opacity-40 transition-all"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowStarters(true)}
                                        disabled={isStreaming}
                                        className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)]
                                            bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] whitespace-nowrap
                                            hover:border-[var(--color-accent-indigo)]/40 hover:text-[var(--color-accent-indigo)]
                                            disabled:opacity-40 transition-all"
                                    >
                                        + More
                                    </button>
                                </div>
                            )}

                            {/* ── Input Area ── */}
                            <div className="px-3 pb-3 pt-2 border-t border-[var(--color-border-subtle)] flex-shrink-0
                                bg-[var(--color-bg-secondary)]">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={hasContext ? "Ask VERA anything about this vehicle..." : "Scan a vehicle to activate VERA..."}
                                        disabled={!hasContext || isStreaming}
                                        rows={2}
                                        className="flex-1 resize-none px-3 py-2.5 rounded-xl text-sm
                                            bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)]
                                            text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]
                                            focus:border-[var(--color-accent-cyan)]/60 focus:ring-1 focus:ring-cyan-500/30
                                            disabled:opacity-40 disabled:cursor-not-allowed
                                            font-mono transition-all outline-none"
                                        id="vera-chat-input"
                                    />
                                    <div className="flex flex-col gap-1">
                                        {isStreaming ? (
                                            <button
                                                onClick={stopStream}
                                                className="p-2.5 rounded-xl bg-[var(--color-accent-rose)]/15 border border-[var(--color-accent-rose)]/40
                                                    text-[var(--color-accent-rose)] hover:bg-[var(--color-accent-rose)]/25 transition-all"
                                                title="Stop generating"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => sendMessage(input)}
                                                disabled={!hasContext || !input.trim()}
                                                className="p-2.5 rounded-xl bg-[var(--color-accent-cyan)] text-black
                                                    hover:bg-[var(--color-text-primary)]
                                                    shadow-[0_0_12px_rgba(0,240,255,0.3)]
                                                    disabled:opacity-30 disabled:cursor-not-allowed
                                                    transition-all"
                                                title="Send (Enter)"
                                                id="vera-send-btn"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-[var(--color-text-disabled)] mt-1.5 font-mono text-center">
                                    Enter to send · Shift+Enter for newline · Powered by Gemini 3 Pro Preview
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
