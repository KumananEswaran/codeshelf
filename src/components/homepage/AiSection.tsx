import { Check } from "lucide-react";
import { ScrollFadeIn } from "./ScrollFadeIn";

const AI_FEATURES = [
  "Auto-tag items based on content",
  "Generate summaries for long items",
  "Explain code in plain English",
  "Optimize and improve prompts",
];

export function AiSection() {
  return (
    <section id="ai" className="py-30 bg-[#12121a] border-y border-[#1e1e2e]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Info */}
          <ScrollFadeIn>
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-black text-xs font-bold uppercase tracking-wider rounded-full mb-5">
              Pro Feature
            </span>
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4 text-left max-md:text-center">
              AI-Powered<br />
              <span className="gradient-text">Superpowers</span>
            </h2>
            <p className="text-lg text-[#71717a] max-w-[540px] mb-8 max-md:mx-auto">
              Let AI handle the busywork so you can focus on building.
            </p>
            <ul className="flex flex-col gap-4">
              {AI_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-base text-[#e4e4e7]">
                  <Check className="size-5 text-[#22c55e] shrink-0" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </ScrollFadeIn>

          {/* Code Mockup */}
          <ScrollFadeIn>
            <div className="code-mockup bg-[#16161f] border border-[#1e1e2e] rounded-xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0a0a0f] border-b border-[#1e1e2e]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <span className="ml-2 font-mono text-[0.8125rem] text-[#71717a]">useDebounce.ts</span>
              </div>
              {/* Code */}
              <div className="p-5 overflow-x-auto">
                <pre className="font-mono text-[0.8125rem] leading-relaxed">
                  <code>
                    <span className="kw">import</span>{" "}
                    {"{ useState, useEffect }"}{" "}
                    <span className="kw">from</span>{" "}
                    <span className="str">&apos;react&apos;</span>;{"\n\n"}
                    <span className="kw">export function</span>{" "}
                    <span className="fn">useDebounce</span>
                    {"<"}<span className="type">T</span>{">("}{"\n"}
                    {"  value: "}<span className="type">T</span>,{"\n"}
                    {"  delay: "}<span className="type">number</span>{"\n"}
                    {"): "}<span className="type">T</span>{" {"}{"\n"}
                    {"  "}<span className="kw">const</span>{" [debounced, setDebounced] ="}{"\n"}
                    {"    "}<span className="fn">useState</span>{"<"}<span className="type">T</span>{">"}{`(value);`}{"\n\n"}
                    {"  "}<span className="fn">useEffect</span>{"(() => {"}{"\n"}
                    {"    "}<span className="kw">const</span>{" timer = "}<span className="fn">setTimeout</span>{"("}{"\n"}
                    {"      () => "}<span className="fn">setDebounced</span>{"(value),"}{"\n"}
                    {"      delay"}{"\n"}
                    {"    );"}{"\n"}
                    {"    "}<span className="kw">return</span>{" () => "}<span className="fn">clearTimeout</span>{"(timer);"}{"\n"}
                    {"  }, [value, delay]);"}{"\n\n"}
                    {"  "}<span className="kw">return</span>{" debounced;"}{"\n"}
                    {"}"}
                  </code>
                </pre>
              </div>
              {/* AI Tags */}
              <div className="px-5 py-4 border-t border-[#1e1e2e] bg-[#f59e0b]/[0.04]">
                <div className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[#f59e0b] mb-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M12 2a4 4 0 0 0-4 4c0 2 1 3 2 4l-5 9h14l-5-9c1-1 2-2 2-4a4 4 0 0 0-4-4z" />
                    <path d="M12 18v4" />
                  </svg>
                  AI Generated Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {["react", "hooks", "typescript", "debounce", "performance"].map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-white/[0.06] border border-[#2a2a3a] rounded-md font-mono text-xs text-[#71717a]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}
