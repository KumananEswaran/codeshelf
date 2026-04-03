import { Code2, Lightbulb, Search, Terminal, FileText, LayoutGrid } from "lucide-react";
import { ScrollFadeIn } from "./ScrollFadeIn";

const FEATURES = [
  {
    icon: Code2,
    color: "#3b82f6",
    title: "Code Snippets",
    description: "Save and organize code with syntax highlighting. Search by language, tag, or content.",
  },
  {
    icon: Lightbulb,
    color: "#f59e0b",
    title: "AI Prompts",
    description: "Store, refine, and reuse your best AI prompts. Never lose a working prompt again.",
  },
  {
    icon: Search,
    color: "#6366f1",
    title: "Instant Search",
    description: "Find anything in milliseconds. Full-text search across all your items, tags, and collections.",
  },
  {
    icon: Terminal,
    color: "#06b6d4",
    title: "Commands",
    description: "Never grep your bash history again. Save terminal commands with descriptions and tags.",
  },
  {
    icon: FileText,
    color: "#64748b",
    title: "Files & Docs",
    description: "Upload templates, configs, and documents. Keep your boilerplates ready to go.",
  },
  {
    icon: LayoutGrid,
    color: "#22c55e",
    title: "Collections",
    description: "Group related items into collections. Mix types freely — snippets, links, notes, all together.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-30">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollFadeIn className="text-center">
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
            Everything You Need,<br />
            <span className="gradient-text">One Place</span>
          </h2>
          <p className="text-lg text-[#71717a] max-w-[540px] mx-auto mb-16">
            Stop context-switching between tools. CodeShelf organizes all your developer knowledge.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <ScrollFadeIn key={feature.title}>
              <div
                className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-7 transition-all duration-300 hover:bg-[#1c1c28] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] group h-full"
                style={{ "--accent": feature.color } as React.CSSProperties}
              >
                <div className="w-12 h-12 flex items-center justify-center bg-white/[0.04] rounded-[10px] mb-4">
                  <feature.icon className="size-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-[0.9375rem] text-[#71717a] leading-relaxed">{feature.description}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
