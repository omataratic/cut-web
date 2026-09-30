"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectKitButton } from "connectkit";

export function Nav() {
  const pathname = usePathname();
  const isHot = pathname === "/" || pathname === "/hot";
  const isNew = pathname === "/new";

  return (
    <header className="border-b border-cut-border bg-cut-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-serif text-xl tracking-tight text-cut-charcoal"
          aria-label="Cut home"
        >
          <img
            src="/cut-logo.png"
            alt="Cut"
            className="h-8 w-8 object-contain"
            width={32}
            height={32}
          />
          <span>Cut</span>
          <span className="ml-1 hidden font-sans text-xs font-normal text-cut-muted sm:inline">
            $CUT
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className={
              isHot
                ? "border-b border-cut-charcoal pb-0.5 text-cut-charcoal"
                : "text-cut-muted hover:text-cut-charcoal"
            }
          >
            Hot
          </Link>
          <Link
            href="/#new"
            className={
              isNew
                ? "border-b border-cut-charcoal pb-0.5 text-cut-charcoal"
                : "text-cut-muted hover:text-cut-charcoal"
            }
          >
            New
          </Link>
          <a
            href="/CUT-whitepaper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cut-muted hover:text-cut-charcoal"
          >
            White paper
          </a>
        </nav>

        <div className="order-last w-full grow sm:order-none sm:w-auto sm:flex-1">
          <label className="relative block">
            <span className="sr-only">Search</span>
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cut-muted"
              aria-hidden
            >
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search films, creators, keywords..."
              className="w-full rounded border border-cut-border bg-cut-mist py-2 pl-9 pr-3 text-sm text-cut-charcoal placeholder:text-cut-muted focus:border-cut-charcoal focus:outline-none"
              disabled
              title="Search coming later"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 rounded border border-cut-charcoal px-3 py-1.5 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
          >
            <span aria-hidden>↑</span>
            Upload
          </Link>
          <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, truncatedAddress, ensName }) => (
              <button
                type="button"
                onClick={show}
                className="inline-flex items-center gap-1.5 rounded border border-cut-charcoal bg-cut-cream px-3 py-1.5 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
              >
                <span aria-hidden>◻</span>
                {isConnecting
                  ? "Connecting…"
                  : isConnected
                    ? (ensName ?? truncatedAddress)
                    : "Connect Wallet"}
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </div>
    </header>
  );
}
