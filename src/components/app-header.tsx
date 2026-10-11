"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();

  const isFeed = pathname === "/feed" || pathname === "/";
  const isRepurpose = pathname === "/repurpose";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/80 px-4 flex items-center justify-between select-none">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-4">
        <Link href="/feed" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-container to-secondary-container flex items-center justify-center font-bold text-white text-xs shadow-md group-hover:scale-105 transition-transform">
            S
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-sm uppercase tracking-wider text-on-surface font-bold">
              SIKATSOON
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-tertiary font-data-badge text-[11px] border border-surface-container-high">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse" />
              <span>Live Feed: Connected</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center gap-1.5">
        <Link
          href="/feed"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            isFeed
              ? "bg-primary-container text-on-primary font-semibold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">grid_view</span>
          <span>Live Matrix</span>
        </Link>
        <Link
          href="/repurpose"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            isRepurpose
              ? "bg-primary-container text-on-primary font-semibold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">bookmark_manager</span>
          <span>Repurposing Lab</span>
        </Link>
      </nav>

      {/* Right Controls: Quick Switch & Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant font-data-badge text-[11px] border border-surface-container-highest/60">
          <span className="material-symbols-outlined text-xs">keyboard</span>
          <span>⌘K Quick Switch</span>
        </div>
        <div className="flex items-center gap-2 pl-1 border-l border-surface-container-high">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-on-surface leading-none">Samjie</span>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              Lead Scout
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-surface-container-high ring-1 ring-primary/40 flex items-center justify-center text-xs font-semibold text-primary">
            S
          </div>
        </div>
      </div>
    </header>
  );
}
