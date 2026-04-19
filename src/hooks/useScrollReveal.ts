import { useEffect, useRef } from "react";

/**
 * useScrollReveal
 * Attaches an IntersectionObserver to the container ref.
 * When the element enters the viewport, adds the "revealed" class.
 * Works with .reveal, .reveal-stagger, .reveal-left, .reveal-scale CSS classes.
 */
export function useScrollReveal(threshold = 0.12) {
    const containerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const els = containerRef.current?.querySelectorAll<HTMLElement>(
            ".reveal, .reveal-stagger, .reveal-left, .reveal-scale"
        );
        if (!els || els.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        observer.unobserve(entry.target); // Only animate once
                    }
                });
            },
            { threshold, rootMargin: "0px 0px -40px 0px" }
        );

        els.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [threshold]);

    return containerRef;
}

/**
 * useElementReveal
 * Simpler version for a single element ref.
 */
export function useElementReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("revealed");
                    observer.unobserve(el);
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return ref;
}
