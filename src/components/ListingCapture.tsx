"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Clipboard, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import type { Vehicle } from "@/lib/types";

interface Props {
    onExtracted: (vehicle: Vehicle) => void;
    isLoading?: boolean;
}

type Status = "idle" | "preview" | "extracting" | "success" | "error";

export default function ListingCapture({ onExtracted, isLoading }: Props) {
    const [status, setStatus] = useState<Status>("idle");
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string>("");
    const [extractedFields, setExtractedFields] = useState<number>(0);
    const [isDragging, setIsDragging] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    // Global paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (isLoading || status === "extracting") return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) processImage(file);
                    return;
                }
            }
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [isLoading, status]);

    const processImage = useCallback(async (file: File) => {
        // Show preview
        const url = URL.createObjectURL(file);
        setPreview(url);
        setStatus("preview");
        setError("");

        // Small delay to show preview before processing
        await new Promise(r => setTimeout(r, 500));
        setStatus("extracting");

        try {
            // Convert to base64
            const buffer = await file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );

            const res = await fetch("/api/extract-listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64,
                    mimeType: file.type,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Extraction failed");
            }

            const vehicle = data.vehicle as Vehicle;
            setExtractedFields(Object.keys(vehicle).length);
            setStatus("success");

            // Fire callback after brief success state
            setTimeout(() => {
                onExtracted(vehicle);
            }, 1200);
        } catch (err: any) {
            setError(err.message || "Failed to extract data");
            setStatus("error");
        }
    }, [onExtracted]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            processImage(file);
        }
    }, [processImage]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
    }, [processImage]);

    const reset = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setStatus("idle");
        setError("");
        setExtractedFields(0);
    };

    return (
        <div className="relative">
            <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                    relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                    ${isDragging
                        ? "border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/5 scale-[1.01]"
                        : status === "idle"
                            ? "border-[var(--color-border-subtle)] hover:border-[var(--color-accent-indigo)] hover:bg-[var(--color-accent-indigo)]/5"
                            : "border-transparent"
                    }
                `}
                onClick={() => {
                    if (status === "idle") document.getElementById("listing-screenshot-input")?.click();
                }}
            >
                <input
                    id="listing-screenshot-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    title="Upload listing screenshot"
                    onChange={handleFileInput}
                />

                {/* Idle state */}
                {status === "idle" && (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-indigo)] to-[var(--color-accent-purple)] mb-4">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                            Screenshot Import
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                            Paste a screenshot of any vehicle listing — AI extracts all data instantly
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                                <Clipboard className="w-3 h-3" />
                                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] font-mono text-[10px]">Ctrl+V</kbd>
                                to paste
                            </span>
                            <span>or drag &amp; drop</span>
                            <span>or click to browse</span>
                        </div>
                    </div>
                )}

                {/* Preview / Processing state */}
                {preview && status !== "idle" && (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Listing screenshot"
                            className={`w-full max-h-[300px] object-contain transition-all duration-500 ${status === "extracting" ? "opacity-40 blur-[1px]" : "opacity-100"
                                }`}
                        />

                        {/* Processing overlay */}
                        {status === "extracting" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                <Loader2 className="w-10 h-10 text-[var(--color-accent-indigo)] animate-spin mb-3" />
                                <p className="text-white font-semibold text-lg">Extracting listing data...</p>
                                <p className="text-white/60 text-sm mt-1">Gemini Pro Vision is reading the screenshot</p>
                            </div>
                        )}

                        {/* Success overlay */}
                        {status === "success" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                <CheckCircle className="w-12 h-12 text-[var(--color-accent-green)] mb-3" />
                                <p className="text-white font-semibold text-lg">Extracted {extractedFields} fields!</p>
                                <p className="text-white/60 text-sm mt-1">Launching analysis...</p>
                            </div>
                        )}

                        {/* Error overlay */}
                        {status === "error" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                                <p className="text-white font-semibold">{error}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); reset(); }}
                                    className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Close button */}
                        {status !== "extracting" && (
                            <button
                                onClick={(e) => { e.stopPropagation(); reset(); }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                                title="Clear screenshot"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
