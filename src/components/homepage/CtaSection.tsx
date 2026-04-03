import Link from "next/link";
import { ScrollFadeIn } from "./ScrollFadeIn";

export function CtaSection() {
  return (
    <section className="py-30 text-center">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollFadeIn>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4 mx-auto">
            Ready to Organize Your<br />
            <span className="gradient-text">Knowledge?</span>
          </h2>
          <p className="text-lg text-[#71717a] max-w-[540px] mx-auto mb-8">
            Join developers who stopped losing their best work.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-base font-semibold bg-[#3b82f6] hover:bg-[#2563eb] text-white hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all"
          >
            Get Started Free
          </Link>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
