import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal / Disclaimer — Cut",
  description: "Experimental product disclaimer for Cut ($CUT).",
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="mb-2 text-xs font-semibold tracking-widest text-cut-muted uppercase">
        Legal
      </p>
      <h1 className="font-serif text-3xl text-cut-charcoal">
        Disclaimer
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-cut-muted">
        <p>
          <strong className="text-cut-charcoal">Cut</strong> ($CUT) is an{" "}
          <strong className="text-cut-charcoal">experimental product</strong>.
          Features, contracts, and economics may change or fail. Software may
          contain bugs. Do not rely on Cut for anything critical.
        </p>
        <p>
          Nothing on this site is{" "}
          <strong className="text-cut-charcoal">financial advice</strong>,
          investment advice, or a solicitation to buy or sell any token,
          security, or other instrument. Cryptocurrency and crowdfunding involve
          risk of total loss.
        </p>
        <p>
          Campaign pledges, refunds, and any future revenue-sharing mechanics
          (if shipped) are subject to on-chain contract behavior and network
          conditions on Robinhood Chain (chain ID 4663). Always verify contract
          addresses and do your own research.
        </p>
        <p>
          By using Cut you acknowledge that you use it at your own risk and that
          the builders provide no warranties of any kind.
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-sm text-cut-charcoal underline">
          ← Back to front page
        </Link>
      </p>
    </div>
  );
}
