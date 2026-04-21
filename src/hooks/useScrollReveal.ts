import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = ".reveal, .reveal-stagger, .reveal-left, .reveal-scale";

/**
 * useScrollReveal
 * Attaches an IntersectionObserver + MutationObserver to the container ref.
 * The MutationObserver watches for newly-added .reveal elements (e.g. analysis
 * results that render after async state updates) and immediately starts
 * observing them — fixing the "results invisible forever" bug where elements
 * added after mount never received the "revealed" class.
 */
export function useScrollReveal(threshold = 0.12) {
    const containerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // ── Intersection Observer ──────────────────────────────────────────
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold, rootMargin: "0px 0px -40px 0px" }
        );

        const observe = (el: Element) => {
            // Skip elements that are already revealed
            if (!el.classList.contains("revealed")) {
                io.observe(el as HTMLElement);
            }
        };

        // Observe everything already in the DOM at mount time
        container.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(observe);

        // ── Mutation Observer — catch elements added after mount ───────────
        const mo = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    const el = node as Element;
                    // The added node itself might be a .reveal element
                    if (el.matches(REVEAL_SELECTOR)) observe(el);
                    // Or it might contain .reveal descendants
                    el.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(observe);
                });
            });
        });

        mo.observe(container, { childList: true, subtree: true });

        return () => {
            io.disconnect();
            mo.disconnect();
        };
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
