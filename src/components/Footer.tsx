import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cut-border bg-cut-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-cut-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Cut ($CUT) — experimental product on Robinhood Chain. Not financial
          advice.
        </p>
        <nav className="flex gap-4">
          <a
            href="/CUT-whitepaper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cut-charcoal"
          >
            White paper
          </a>
          <Link href="/legal" className="hover:text-cut-charcoal">
            Legal / Disclaimer
          </Link>
          <a
            href="https://robinhoodchain.blockscout.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cut-charcoal"
          >
            Explorer
          </a>
        </nav>
      </div>
    </footer>
  );
}
