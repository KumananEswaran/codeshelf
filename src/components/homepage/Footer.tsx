import Link from "next/link";
import { BookOpenText } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#1e1e2e] pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12 max-md:grid-cols-2 max-md:gap-8">
          {/* Brand */}
          <div className="max-md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-[#e4e4e7] mb-3">
              <BookOpenText className="size-6" />
              CodeShelf
            </Link>
            <p className="text-[0.9375rem] text-[#71717a]">Store Smarter. Build Faster.</p>
          </div>

          {/* Link Columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#e4e4e7] mb-1">
                {col.title}
              </h4>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[0.9375rem] text-[#71717a] hover:text-[#e4e4e7] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-[#1e1e2e] pt-6 text-center">
          <p className="text-sm text-[#52525b]">
            &copy; {new Date().getFullYear()} CodeShelf. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
