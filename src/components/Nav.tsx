"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConnectKitButton } from "connectkit";
import { Suspense, useEffect, useRef, useState } from "react";

function withQuery(path: string, query: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function Nav() {
  return (
    <Suspense fallback={<NavBar query="" onSearch={() => {}} />}>
      <NavBarLive />
    </Suspense>
  );
}

function NavBarLive() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const pendingQuery = useRef<string | null>(null);

  useEffect(() => {
    if (pendingQuery.current !== null && pendingQuery.current !== urlQuery) return;
    pendingQuery.current = null;
    setQuery(urlQuery);
  }, [urlQuery]);

  const onSearch = (value: string) => {
    pendingQuery.current = value;
    setQuery(value);
    const path = pathname === "/new" ? "/new" : "/";
    router.replace(withQuery(path, value), { scroll: false });
  };

  return <NavBar query={query} onSearch={onSearch} />;
}

function NavBar({
  query,
  onSearch,
}: {
  query: string;
  onSearch: (value: string) => void;
}) {
  const pathname = usePathname();
  const isHot = pathname === "/" || pathname === "/hot";
  const isNew = pathname === "/new";
  const isFinished = pathname === "/finished" || pathname.startsWith("/finished/");

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
            href={withQuery("/", query)}
            className={
              isHot
                ? "border-b border-cut-charcoal pb-0.5 text-cut-charcoal"
                : "text-cut-muted hover:text-cut-charcoal"
            }
          >
            Hot
          </Link>
          <Link
            href={withQuery("/new", query)}
            className={
              isNew
                ? "border-b border-cut-charcoal pb-0.5 text-cut-charcoal"
                : "text-cut-muted hover:text-cut-charcoal"
            }
          >
            New
          </Link>
          <Link
            href="/finished"
            className={
              isFinished
                ? "border-b border-cut-charcoal pb-0.5 text-cut-charcoal"
                : "text-cut-muted hover:text-cut-charcoal"
            }
          >
            Finished
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
              value={query}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search films, creators, keywords..."
              className="w-full rounded border border-cut-border bg-cut-mist py-2 pl-9 pr-3 text-sm text-cut-charcoal placeholder:text-cut-muted focus:border-cut-charcoal focus:outline-none"
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
