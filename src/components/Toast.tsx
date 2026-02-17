"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface ToastProps {
    message: string;
    type: "success" | "error";
}

export default function Toast({ message, type }: ToastProps) {
    return (
        <div className="toast flex items-center gap-3">
            {type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-emerald)] shrink-0" />
            ) : (
                <XCircle className="w-5 h-5 text-[var(--color-accent-rose)] shrink-0" />
            )}
            <span className="text-[var(--color-text-primary)]">{message}</span>
        </div>
    );
}
