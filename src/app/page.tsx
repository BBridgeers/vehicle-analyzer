"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Noise grain overlay via canvas data URL ─────────────────────────────────
const GRAIN_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E`;

export default function LandingPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const [scrollY, setScrollY] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const heroParallax = scrollY * 0.4;
    const heroOpacity = Math.max(0, 1 - scrollY / 600);

    return (
        <div className="landing-root">
            {/* ── Global grain overlay ── */}
            <div className="grain-overlay" aria-hidden="true" />

            {/* ── NAV ── */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <span className="nav-logo-mark">VA</span>
                    <span className="nav-logo-text">Vehicle Analyzer</span>
                </div>
                <div className="nav-links">
                    <a href="#how-it-works" className="nav-link">How It Works</a>
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#beta" className="nav-link">Beta</a>
                    <Link href="/app" className="nav-cta">Launch App →</Link>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════
                CHAPTER 1 — HERO
            ══════════════════════════════════════════════ */}
            <section className="hero-section" ref={heroRef}>
                {/* ── Cinematic car/desert hero image ── */}
                <div
                    className="hero-img-wrap"
                    style={{ transform: `translateY(${heroParallax}px)` }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/hero-car-desert.png"
                        alt="Dark muscle car on desert highway at sunset"
                        className="hero-img"
                    />
                    {/* colour-grade overlays */}
                    <div className="hero-img-overlay-l" />
                    <div className="hero-img-overlay-r" />
                    <div className="hero-vignette" />
                </div>

                <div
                    className="hero-content"
                    style={{ opacity: heroOpacity }}
                >
                    {/* Chapter label */}
                    <div className="chapter-label">
                        <span className="chapter-line" />
                        CHAPTER 1
                        <span className="chapter-line" />
                    </div>

                    {/* Oversized editorial headline */}
                    <h1 className="hero-headline">
                        <span className="hero-headline-line">STOP</span>
                        <span className="hero-headline-line hero-headline-accent">GETTING</span>
                        <span className="hero-headline-line">PLAYED.</span>
                    </h1>

                    <p className="hero-subline">
                        Paste a screenshot. Get the truth in seconds.<br />
                        Market value. Red flags. Rideshare viability. Negotiation script.
                    </p>

                    <div className="hero-actions">
                        <Link href="/app" className="cta-primary">
                            <span>Analyze Your First Listing</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <a href="#how-it-works" className="cta-ghost">See How It Works</a>
                    </div>

                    {/* Stats row */}
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="stat-number">8s</span>
                            <span className="stat-label">Avg Analysis Time</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="hero-stat">
                            <span className="stat-number">12+</span>
                            <span className="stat-label">Data Points Extracted</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="hero-stat">
                            <span className="stat-number">Free</span>
                            <span className="stat-label">During Beta</span>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="scroll-indicator">
                    <div className="scroll-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                    <span>Scroll</span>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                CHAPTER 2 — THE PROBLEM
            ══════════════════════════════════════════════ */}
            <section className="problem-section" id="how-it-works">
                <div className="section-inner">
                    <div className="chapter-label chapter-label-muted">
                        <span className="chapter-line" />
                        CHAPTER 2
                        <span className="chapter-line" />
                    </div>

                    <h2 className="editorial-headline">
                        THE USED CAR<br />
                        <span className="editorial-accent">MARKET IS<br />BROKEN.</span>
                    </h2>

                    <div className="problem-grid">
                        <ProblemCard
                            number="01"
                            title="Overpriced junk listed as cream puffs"
                            body="Sellers know more than you. High-mileage lemons get washed titles. Private party prices are fiction."
                        />
                        <ProblemCard
                            number="02"
                            title="You have no time to research every listing"
                            body="Carfax costs money. KBB gives ranges, not answers. Reddit threads take hours. You need answers now."
                        />
                        <ProblemCard
                            number="03"
                            title="Negotiation is a skill most buyers don't have"
                            body="Without leverage you pay retail. With data you close below ask, every time."
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                CHAPTER 3 — THE SOLUTION (HOW IT WORKS)
            ══════════════════════════════════════════════ */}
            <section className="solution-section" id="features">
                <div className="solution-bg-accent" />
                <div className="section-inner">
                    <div className="chapter-label">
                        <span className="chapter-line" />
                        CHAPTER 3
                        <span className="chapter-line" />
                    </div>

                    <h2 className="section-headline">HOW IT WORKS</h2>

                    <div className="steps-track">
                        <StepCard
                            step="01"
                            icon={<PasteIcon />}
                            title="Paste a Screenshot"
                            body="Screenshot from Facebook Marketplace, Craigslist, or anywhere. Paste it directly into the app."
                            accent="red"
                        />
                        <div className="step-connector" aria-hidden="true">→</div>
                        <StepCard
                            step="02"
                            icon={<BrainIcon />}
                            title="AI Extracts Everything"
                            body="Our Groq vision model reads price, mileage, VIN, location, condition, seller cues — in seconds."
                            accent="blue"
                        />
                        <div className="step-connector" aria-hidden="true">→</div>
                        <StepCard
                            step="03"
                            icon={<ReportIcon />}
                            title="Get a Full Intelligence Report"
                            body="Market value benchmarks, red flags, rideshare projections, insurance costs, and a negotiation script written for that exact vehicle."
                            accent="red"
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                CHAPTER 4 — FEATURES BENTO
            ══════════════════════════════════════════════ */}
            <section className="features-section">
                <div className="section-inner">
                    <div className="chapter-label chapter-label-muted">
                        <span className="chapter-line" />
                        CHAPTER 4
                        <span className="chapter-line" />
                    </div>
                    <h2 className="section-headline">WHAT YOU GET</h2>

                    <div className="bento-grid">
                        <BentoCard className="bento-large" title="Deal Score" icon="🎯" accent="red">
                            <p>Every listing gets a 0–100 score. <strong>STRONG BUY</strong>, <strong>RECOMMENDED</strong>, <strong>CAUTION</strong>, or <strong>AVOID</strong> — with the reasoning behind it.</p>
                        </BentoCard>
                        <BentoCard title="Market Value" icon="📊" accent="blue">
                            <p>Private party low/avg/high. Dealer retail. Trade-in. Know exactly where the listing sits vs. the market.</p>
                        </BentoCard>
                        <BentoCard title="VERA — AI Coach" icon="🤖" accent="blue">
                            <p>Ask VERA anything about the vehicle. She knows your analysis and will help you negotiate, spot issues, or decide.</p>
                        </BentoCard>
                        <BentoCard title="Rideshare Viability" icon="🚗" accent="neutral">
                            <p>Uber X / XL / Comfort eligibility. Conservative, baseline, and optimistic earnings projections at 13, 26, and 52 weeks.</p>
                        </BentoCard>
                        <BentoCard title="Red Flags" icon="⚠️" accent="red">
                            <p>Issues flagged as low / medium / high / critical with two scenarios: benign explanation and malicious explanation.</p>
                        </BentoCard>
                        <BentoCard className="bento-wide" title="PDF / DOCX Export" icon="📄" accent="neutral">
                            <p>Export a professional full-analysis report. Share it with a mechanic, co-buyer, or keep it for records.</p>
                        </BentoCard>
                        <BentoCard title="VIN Intelligence" icon="🔍" accent="blue">
                            <p>Decode the VIN for spec verification. Cross-check recalls, drivetrain, and factory options against what the seller claims.</p>
                        </BentoCard>
                        <BentoCard title="Bulk Compare" icon="⚖️" accent="neutral">
                            <p>Import multiple listings. Compare them side-by-side on a single score sheet to find the best deal fast.</p>
                        </BentoCard>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                CHAPTER 5 — BETA CTA (RED FULL-BLEED)
            ══════════════════════════════════════════════ */}
            <section className="cta-section" id="beta">
                <div className="cta-bg-texture" aria-hidden="true" />
                <div className="section-inner cta-inner">
                    <div className="chapter-label chapter-label-light">
                        <span className="chapter-line chapter-line-light" />
                        CHAPTER 5
                        <span className="chapter-line chapter-line-light" />
                    </div>
                    <h2 className="cta-headline">
                        JOIN THE<br />FREE BETA.
                    </h2>
                    <p className="cta-body">
                        No account. No credit card. No bullshit.<br />
                        Just paste a screenshot and know if the deal is worth it.
                    </p>
                    <Link href="/app" className="cta-primary cta-primary-invert">
                        <span>Start Analyzing — It's Free</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <p className="cta-disclaimer">
                        Built for buyers who are tired of getting ripped off. Free during beta. No spam, ever.
                    </p>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-logo">
                        <span className="nav-logo-mark">VA</span>
                        <span>Vehicle Analyzer Pro</span>
                    </div>
                    <p className="footer-tagline">Data-driven intelligence for used car buyers.</p>
                    <div className="footer-links">
                        <Link href="/app">Launch App</Link>
                        <span>·</span>
                        <a href="mailto:feedback@vehicleanalyzer.ai">Feedback</a>
                    </div>
                    <p className="footer-legal">© {new Date().getFullYear()} Vehicle Analyzer Pro. Free beta — use at your own discretion.</p>
                </div>
            </footer>

            <style>{`
                /* ─── RESET & ROOT ─── */
                .landing-root {
                    background: #0a0905;
                    color: #f0ede6;
                    font-family: 'Bricolage Grotesque', 'Space Grotesk', system-ui, sans-serif;
                    overflow-x: hidden;
                    position: relative;
                }

                /* ─── GRAIN OVERLAY ─── */
                .grain-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    pointer-events: none;
                    opacity: 0.035;
                    background-image: url("${GRAIN_SVG}");
                    background-size: 200px 200px;
                    mix-blend-mode: overlay;
                }

                /* ─── NAV ─── */
                .landing-nav {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 500;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 48px;
                    background: linear-gradient(to bottom, rgba(10,9,5,0.9) 0%, transparent 100%);
                    backdrop-filter: blur(0px);
                }
                .nav-logo { display: flex; align-items: center; gap: 10px; }
                .nav-logo-mark {
                    width: 36px; height: 36px;
                    background: #d94a2a;
                    border-radius: 6px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 13px; font-weight: 800; letter-spacing: 0.5px;
                    color: #fff;
                }
                .nav-logo-text { font-size: 15px; font-weight: 600; letter-spacing: 0.5px; }
                .nav-links { display: flex; align-items: center; gap: 32px; }
                .nav-link {
                    font-size: 13px; font-weight: 500; letter-spacing: 1px;
                    text-transform: uppercase; color: #b0ab9f;
                    text-decoration: none; transition: color 0.2s;
                }
                .nav-link:hover { color: #f0ede6; }
                .nav-cta {
                    font-size: 13px; font-weight: 700; letter-spacing: 1px;
                    text-transform: uppercase;
                    background: #d94a2a; color: #fff;
                    padding: 10px 22px; border-radius: 4px;
                    text-decoration: none; transition: background 0.2s;
                }
                .nav-cta:hover { background: #c23e22; }

                /* ─── HERO SECTION ─── */
                .hero-section {
                    position: relative;
                    height: 100vh;
                    min-height: 700px;
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden;
                }

                /* Cinematic photo hero */
                .hero-img-wrap {
                    position: absolute;
                    inset: -20%;
                    will-change: transform;
                }
                .hero-img {
                    position: absolute;
                    inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    object-position: center 40%;
                    filter: brightness(0.72) saturate(1.2);
                }
                /* left-side cinematic gradient — blends image into dark bg */
                .hero-img-overlay-l {
                    position: absolute; inset: 0;
                    background: linear-gradient(
                        to right,
                        rgba(10,9,5,0.92) 0%,
                        rgba(10,9,5,0.55) 35%,
                        transparent 65%
                    );
                }
                /* top + bottom fade */
                .hero-img-overlay-r {
                    position: absolute; inset: 0;
                    background: linear-gradient(
                        to bottom,
                        rgba(10,9,5,0.5) 0%,
                        transparent 20%,
                        transparent 65%,
                        rgba(10,9,5,0.98) 100%
                    );
                }
                .hero-vignette {
                    position: absolute; inset: 0;
                    background: radial-gradient(ellipse at 30% 50%, transparent 20%, rgba(10,9,5,0.55) 100%);
                }
                .hero-content {
                    position: relative; z-index: 10;
                    text-align: center;
                    max-width: 900px;
                    padding: 0 24px;
                    display: flex; flex-direction: column; align-items: center; gap: 28px;
                    will-change: opacity;
                }

                /* Chapter label */
                .chapter-label {
                    display: flex; align-items: center; gap: 12px;
                    font-size: 11px; font-weight: 700; letter-spacing: 3px;
                    text-transform: uppercase; color: #7a766e;
                }
                .chapter-label-muted { color: #5a5650; }
                .chapter-label-light { color: rgba(255,255,255,0.7); }
                .chapter-line {
                    display: block; width: 40px; height: 1px;
                    background: currentColor; opacity: 0.5;
                }
                .chapter-line-light { background: rgba(255,255,255,0.5); }

                /* Hero headline — Prometheus style massive editorial */
                .hero-headline {
                    display: flex; flex-direction: column; align-items: center;
                    font-size: clamp(72px, 12vw, 160px);
                    font-weight: 900;
                    line-height: 0.88;
                    letter-spacing: -3px;
                    text-transform: uppercase;
                    margin: 0;
                }
                .hero-headline-line { display: block; }
                .hero-headline-accent {
                    color: #d94a2a;
                    -webkit-text-stroke: 2px #d94a2a;
                }

                .hero-subline {
                    font-size: 18px; line-height: 1.6;
                    color: #9a968e; max-width: 520px;
                    text-align: center; margin: 0;
                }

                /* CTAs */
                .hero-actions {
                    display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
                    justify-content: center;
                }
                .cta-primary {
                    display: inline-flex; align-items: center; gap: 10px;
                    background: #d94a2a; color: #fff;
                    font-size: 14px; font-weight: 700; letter-spacing: 1px;
                    text-transform: uppercase; text-decoration: none;
                    padding: 16px 32px; border-radius: 4px;
                    transition: background 0.2s, transform 0.15s;
                    cursor: pointer;
                }
                .cta-primary:hover { background: #c23e22; transform: translateY(-2px); }
                .cta-primary-invert {
                    background: #0a0905; color: #fff;
                    border: 2px solid rgba(255,255,255,0.3);
                }
                .cta-primary-invert:hover { background: #1a1712; border-color: rgba(255,255,255,0.6); transform: translateY(-2px); }
                .cta-ghost {
                    font-size: 14px; font-weight: 600; letter-spacing: 0.5px;
                    color: #7a766e; text-decoration: none;
                    border-bottom: 1px solid #3a3630;
                    padding-bottom: 2px;
                    transition: color 0.2s, border-color 0.2s;
                }
                .cta-ghost:hover { color: #f0ede6; border-color: #7a766e; }

                /* Hero stats */
                .hero-stats {
                    display: flex; align-items: center; gap: 24px;
                    margin-top: 8px;
                }
                .hero-stat { text-align: center; }
                .stat-number {
                    display: block;
                    font-size: 28px; font-weight: 900; letter-spacing: -1px;
                    color: #f0ede6;
                }
                .stat-label {
                    font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
                    color: #6a6660;
                }
                .stat-divider { width: 1px; height: 40px; background: #2a2722; }

                /* Scroll indicator */
                .scroll-indicator {
                    position: absolute; bottom: 36px; left: 50%;
                    transform: translateX(-50%);
                    display: flex; flex-direction: column; align-items: center; gap: 8px;
                    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
                    color: #4a4642;
                    animation: float 2s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-8px); }
                }

                /* ─── PROBLEM SECTION ─── */
                .problem-section {
                    padding: 120px 0;
                    background: #0a0905;
                }
                .section-inner {
                    max-width: 1200px; margin: 0 auto; padding: 0 48px;
                }
                .editorial-headline {
                    font-size: clamp(48px, 7vw, 96px);
                    font-weight: 900; line-height: 0.9;
                    letter-spacing: -2px; text-transform: uppercase;
                    margin: 24px 0 64px 0;
                }
                .editorial-accent { color: #d94a2a; }

                .problem-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
                }

                /* Problem cards */
                .problem-card {
                    padding: 48px 36px;
                    border-top: 1px solid #1e1c17;
                    transition: background 0.3s;
                }
                .problem-card:hover { background: rgba(255,255,255,0.02); }
                .problem-number {
                    font-size: 11px; font-weight: 700; letter-spacing: 3px;
                    color: #d94a2a; margin-bottom: 16px;
                }
                .problem-title {
                    font-size: 22px; font-weight: 800; line-height: 1.2;
                    margin-bottom: 16px; letter-spacing: -0.5px;
                }
                .problem-body { font-size: 15px; line-height: 1.7; color: #7a766e; }

                /* ─── SOLUTION SECTION ─── */
                .solution-section {
                    padding: 120px 0;
                    background: #0e0d09;
                    position: relative; overflow: hidden;
                }
                .solution-bg-accent {
                    position: absolute;
                    right: -200px; top: 50%;
                    transform: translateY(-50%);
                    width: 600px; height: 600px;
                    border-radius: 50%;
                    background: radial-gradient(ellipse, rgba(28,95,138,0.15) 0%, transparent 70%);
                    filter: blur(60px);
                }
                .section-headline {
                    font-size: clamp(40px, 5vw, 72px);
                    font-weight: 900; letter-spacing: -2px;
                    text-transform: uppercase;
                    margin: 24px 0 64px 0;
                }

                .steps-track {
                    display: flex; align-items: flex-start; gap: 0;
                }
                .step-card {
                    flex: 1;
                    padding: 40px 36px;
                    border: 1px solid #1e1c17;
                    border-radius: 2px;
                    transition: border-color 0.3s, transform 0.3s;
                    position: relative;
                }
                .step-card:hover { transform: translateY(-4px); }
                .step-card-red { border-top: 3px solid #d94a2a; }
                .step-card-blue { border-top: 3px solid #1c6ea4; }
                .step-connector {
                    padding: 0 4px; margin-top: 80px;
                    font-size: 28px; font-weight: 300; color: #2a2822;
                    flex-shrink: 0;
                }
                .step-number {
                    font-size: 11px; font-weight: 700; letter-spacing: 3px;
                    margin-bottom: 20px;
                }
                .step-card-red .step-number { color: #d94a2a; }
                .step-card-blue .step-number { color: #1c6ea4; }
                .step-icon {
                    width: 42px; height: 42px; margin-bottom: 20px;
                    opacity: 0.8;
                }
                .step-title {
                    font-size: 20px; font-weight: 800; letter-spacing: -0.3px;
                    margin-bottom: 12px;
                }
                .step-body { font-size: 14px; line-height: 1.7; color: #7a766e; }

                /* ─── FEATURES BENTO ─── */
                .features-section {
                    padding: 120px 0;
                    background: #0a0905;
                }
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-auto-rows: auto;
                    gap: 2px;
                }
                .bento-card {
                    padding: 40px 32px;
                    background: #0e0d09;
                    border: 1px solid #1a1815;
                    transition: background 0.3s, border-color 0.3s, transform 0.25s;
                    cursor: default;
                    position: relative;
                    overflow: hidden;
                }
                .bento-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 2px;
                }
                .bento-card-red::before { background: #d94a2a; }
                .bento-card-blue::before { background: #1c6ea4; }
                .bento-card-neutral::before { background: #2a2822; }
                .bento-card:hover { background: #121108; border-color: #2a2822; transform: scale(1.01); }
                .bento-large { grid-column: span 2; }
                .bento-wide { grid-column: span 2; }
                .bento-icon {
                    font-size: 28px; margin-bottom: 16px; display: block;
                    filter: grayscale(0.3);
                }
                .bento-title {
                    font-size: 18px; font-weight: 800; letter-spacing: -0.3px;
                    margin-bottom: 10px;
                }
                .bento-body { font-size: 14px; line-height: 1.7; color: #7a766e; }
                .bento-body strong { color: #b0ab9f; }

                /* ─── CTA SECTION ─── */
                .cta-section {
                    padding: 140px 0;
                    background: #c23e22;
                    position: relative; overflow: hidden;
                }
                .cta-bg-texture {
                    position: absolute; inset: 0;
                    background-image: url("${GRAIN_SVG}");
                    background-size: 200px 200px;
                    opacity: 0.08; mix-blend-mode: multiply;
                }
                .cta-inner { text-align: center; position: relative; z-index: 2; }
                .cta-headline {
                    font-size: clamp(64px, 10vw, 140px);
                    font-weight: 900; line-height: 0.88;
                    letter-spacing: -3px; text-transform: uppercase;
                    color: #fff; margin: 24px 0 32px 0;
                }
                .cta-body {
                    font-size: 18px; line-height: 1.6;
                    color: rgba(255,255,255,0.75);
                    margin-bottom: 40px;
                }
                .cta-disclaimer {
                    font-size: 13px; color: rgba(255,255,255,0.5);
                    margin-top: 24px; letter-spacing: 0.3px;
                }

                /* ─── FOOTER ─── */
                .landing-footer {
                    padding: 60px 0;
                    background: #060504;
                    border-top: 1px solid #1a1815;
                }
                .footer-inner {
                    max-width: 1200px; margin: 0 auto; padding: 0 48px;
                    display: flex; flex-direction: column; align-items: center;
                    gap: 16px; text-align: center;
                }
                .footer-logo {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 15px; font-weight: 600;
                }
                .footer-tagline { font-size: 14px; color: #5a5650; }
                .footer-links {
                    display: flex; align-items: center; gap: 12px;
                    font-size: 13px; color: #7a766e;
                }
                .footer-links a { color: #7a766e; text-decoration: none; }
                .footer-links a:hover { color: #f0ede6; }
                .footer-legal { font-size: 12px; color: #3a3630; }

                /* ─── MOBILE ─── */
                @media (max-width: 768px) {
                    .landing-nav { padding: 16px 20px; }
                    .nav-links { gap: 16px; }
                    .nav-link { display: none; }
                    .section-inner { padding: 0 24px; }
                    .problem-grid { grid-template-columns: 1fr; }
                    .steps-track { flex-direction: column; gap: 2px; }
                    .step-connector { display: none; }
                    .bento-grid { grid-template-columns: 1fr; }
                    .bento-large, .bento-wide { grid-column: span 1; }
                    .hero-stats { flex-direction: column; gap: 12px; }
                    .stat-divider { width: 40px; height: 1px; }
                    .hero-actions { flex-direction: column; gap: 12px; }
                    .hero-headline { letter-spacing: -1px; }
                }
            `}</style>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProblemCard({ number, title, body }: { number: string; title: string; body: string }) {
    return (
        <div className="problem-card">
            <div className="problem-number">{number}</div>
            <div className="problem-title">{title}</div>
            <div className="problem-body">{body}</div>
        </div>
    );
}

function StepCard({ step, icon, title, body, accent }: {
    step: string; icon: React.ReactNode; title: string; body: string; accent: "red" | "blue" | "neutral";
}) {
    return (
        <div className={`step-card step-card-${accent}`}>
            <div className="step-number">{step}</div>
            <div className="step-icon">{icon}</div>
            <div className="step-title">{title}</div>
            <div className="step-body">{body}</div>
        </div>
    );
}

function BentoCard({ title, icon, body, accent, className, children }: {
    title: string; icon: string; body?: string; accent: "red" | "blue" | "neutral";
    className?: string; children?: React.ReactNode;
}) {
    return (
        <div className={`bento-card bento-card-${accent} ${className || ""}`}>
            <span className="bento-icon">{icon}</span>
            <div className="bento-title">{title}</div>
            <div className="bento-body">{children || body}</div>
        </div>
    );
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function PasteIcon() {
    return (
        <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="42" height="42" rx="8" fill="rgba(217,74,42,0.1)" />
            <path d="M14 16h14v16H14V16z" stroke="#d94a2a" strokeWidth="1.5" fill="none" />
            <path d="M18 16v-3h6v3" stroke="#d94a2a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 22h8M17 26h5" stroke="#d94a2a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function BrainIcon() {
    return (
        <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="42" height="42" rx="8" fill="rgba(28,110,164,0.1)" />
            <circle cx="21" cy="21" r="8" stroke="#1c6ea4" strokeWidth="1.5" fill="none" />
            <path d="M17 18l2 2 4-4" stroke="#1c6ea4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 13v-2M21 31v-2M13 21h-2M31 21h-2" stroke="#1c6ea4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function ReportIcon() {
    return (
        <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="42" height="42" rx="8" fill="rgba(217,74,42,0.1)" />
            <rect x="13" y="12" width="16" height="20" rx="2" stroke="#d94a2a" strokeWidth="1.5" fill="none" />
            <path d="M17 18h8M17 22h8M17 26h5" stroke="#d94a2a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
