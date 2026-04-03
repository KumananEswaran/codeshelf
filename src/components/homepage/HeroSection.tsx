"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ScrollFadeIn } from "./ScrollFadeIn";

// SVG icon data for the chaos container
const CHAOS_ICONS = [
  { key: "notion", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.17c-.466-.373-.746-.56-1.586-.513l-12.71.746c-.466.046-.56.28-.373.466l.838 1.34zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.934-.56.934-1.166V6.354c0-.606-.233-.933-.747-.886l-15.177.84c-.56.047-.747.327-.747.98zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.934-.234-1.494-.934l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.187c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.222-.187zM1.936 1.035l13.31-.98c1.634-.14 2.053-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" /></svg> },
  { key: "github", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg> },
  { key: "slack", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" /></svg> },
  { key: "vscode", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" /></svg> },
  { key: "browser", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" /><line x1="2" y1="9" x2="22" y2="9" /><line x1="9" y1="3" x2="9" y2="9" /></svg> },
  { key: "terminal", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg> },
  { key: "textfile", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
  { key: "bookmark", svg: <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg> },
];

const PREVIEW_CARD_COLORS = ["#3b82f6", "#f59e0b", "#06b6d4", "#22c55e", "#ec4899", "#6366f1"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  scale: number;
  scaleDir: number;
}

const REPEL_RADIUS = 80;
const REPEL_STRENGTH = 1.2;
const ICON_SIZE = 60;

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const initParticles = useCallback(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const padding = 8;

    particlesRef.current = CHAOS_ICONS.map(() => {
      const x = padding + Math.random() * (w - ICON_SIZE - padding * 2);
      const y = padding + Math.random() * (h - ICON_SIZE - padding * 2);
      const speed = 0.04 + Math.random() * 0.06;
      const angle = Math.random() * Math.PI * 2;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        scale: 0.9 + Math.random() * 0.2,
        scaleDir: Math.random() > 0.5 ? 1 : -1,
      };
    });
  }, []);

  const animate = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const mouse = mouseRef.current;

    particlesRef.current.forEach((p, i) => {
      const dx = p.x + ICON_SIZE / 2 - mouse.x;
      const dy = p.y + ICON_SIZE / 2 - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      p.vx *= 0.96;
      p.vy *= 0.96;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 0.8;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }
      const minSpeed = 0.03;
      if (speed < minSpeed && speed > 0) {
        p.vx = (p.vx / speed) * minSpeed;
        p.vy = (p.vy / speed) * minSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;

      const inset = 8;
      if (p.x < inset) { p.x = inset; p.vx *= -1; }
      if (p.x > w - ICON_SIZE - inset) { p.x = w - ICON_SIZE - inset; p.vx *= -1; }
      if (p.y < inset) { p.y = inset; p.vy *= -1; }
      if (p.y > h - ICON_SIZE - inset) { p.y = h - ICON_SIZE - inset; p.vy *= -1; }

      const el = iconRefs.current[i];
      if (el) {
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          initParticles();
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initParticles, animate]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-[120px] pb-20 px-6 text-center max-w-[1200px] mx-auto max-md:min-h-auto max-md:pt-[100px] max-md:pb-[60px]">
      <ScrollFadeIn className="mb-16">
        <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-5 max-md:text-4xl max-sm:text-[1.875rem]">
          Stop Losing Your<br />
          <span className="gradient-text">Developer Knowledge</span>
        </h1>
        <p className="text-lg text-[#71717a] max-w-[600px] mx-auto mb-8 leading-relaxed max-md:text-base">
          Your snippets, prompts, commands, and notes are scattered across dozens of tools. CodeShelf brings them all into one searchable, AI-enhanced hub.
        </p>
        <div className="flex gap-4 justify-center flex-wrap max-sm:flex-col max-sm:items-center">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-[#3b82f6] hover:bg-[#2563eb] text-white px-7 py-3.5 text-base hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all"
            )}
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-[#2a2a3a] bg-transparent text-[#e4e4e7] hover:bg-[#16161f] hover:border-[#52525b] px-7 py-3.5 text-base"
            )}
          >
            See Features
          </a>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn className="flex items-center gap-8 w-full max-w-[960px] max-lg:flex-col max-lg:gap-6 max-lg:max-w-[500px]">
        {/* Chaos Container */}
        <div className="flex-1 min-w-0 max-lg:w-full">
          <div className="text-[0.8125rem] font-semibold text-[#71717a] uppercase tracking-wider mb-3 text-center">
            Your knowledge today...
          </div>
          <div
            ref={containerRef}
            className="relative w-full h-80 bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden max-sm:h-64"
          >
            {CHAOS_ICONS.map((icon, i) => (
              <div
                key={icon.key}
                ref={(el) => { iconRefs.current[i] = el; }}
                className="chaos-icon"
              >
                {icon.svg}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="shrink-0 flex items-center justify-center text-[#3b82f6] animate-[pulse-arrow_2s_ease-in-out_infinite] max-lg:rotate-90">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>

        {/* Dashboard Preview */}
        <div className="flex-1 min-w-0 max-lg:w-full">
          <div className="text-[0.8125rem] font-semibold text-[#71717a] uppercase tracking-wider mb-3 text-center">
            ...with CodeShelf
          </div>
          <div className="h-80 bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden flex flex-col max-sm:h-64">
            <div className="flex gap-1.5 px-3.5 py-2.5 bg-[#16161f] border-b border-[#1e1e2e]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="w-12 p-3 px-2 border-r border-[#1e1e2e] flex flex-col gap-2">
                <div className="h-2 rounded bg-[#3b82f6]" />
                <div className="h-2 rounded bg-[#2a2a3a]" />
                <div className="h-2 rounded bg-[#2a2a3a]" />
                <div className="h-2 rounded bg-[#2a2a3a]" />
                <div className="h-2 rounded bg-[#2a2a3a]" />
              </div>
              <div className="flex-1 p-3 flex flex-col gap-2.5">
                <div className="h-7 bg-[#0a0a0f] border border-[#1e1e2e] rounded-md shrink-0" />
                <div className="grid grid-cols-2 gap-2">
                  {PREVIEW_CARD_COLORS.map((color) => (
                    <div key={color} className="h-12 bg-[#16161f] rounded-md p-2 flex flex-col gap-1.5 overflow-hidden preview-card" style={{ "--card-color": color } as React.CSSProperties}>
                      <div className="h-1.5 w-3/5 bg-[#2a2a3a] rounded" />
                      <div className="h-1 w-[90%] bg-[#1e1e2e] rounded" />
                      <div className="h-1 w-1/2 bg-[#1e1e2e] rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollFadeIn>
    </section>
  );
}
