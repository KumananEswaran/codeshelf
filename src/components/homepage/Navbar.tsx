"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpenText, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-100 backdrop-blur-2xl transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0f]/90 border-b border-[#1e1e2e]"
          : "bg-[#0a0a0f]/60 border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-[#e4e4e7]">
          <BookOpenText className="size-7" />
          CodeShelf
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-8">
          <a href="#features" className="text-[#71717a] text-[0.9375rem] font-medium hover:text-[#e4e4e7] transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-[#71717a] text-[0.9375rem] font-medium hover:text-[#e4e4e7] transition-colors">
            Pricing
          </a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost" }), "text-[#71717a] hover:text-[#e4e4e7]")}>
            Sign In
          </Link>
          <Link href="/register" className={cn(buttonVariants(), "bg-[#3b82f6] hover:bg-[#2563eb] text-white")}>
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#e4e4e7] p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-2 px-6 pb-5 border-t border-[#1e1e2e]">
          <a
            href="#features"
            className="text-[#71717a] text-[0.9375rem] font-medium py-2 hover:text-[#e4e4e7]"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-[#71717a] text-[0.9375rem] font-medium py-2 hover:text-[#e4e4e7]"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </a>
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-[#71717a]")}
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants(), "bg-[#3b82f6] hover:bg-[#2563eb] text-white")}
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
