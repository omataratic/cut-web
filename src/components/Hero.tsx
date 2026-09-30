export function Hero() {
  return (
    <section className="border-b border-cut-border bg-cut-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="mb-2 text-xs font-semibold tracking-widest text-cut-muted uppercase">
          $CUT · Robinhood Chain
        </p>
        <h1 className="max-w-2xl font-serif text-3xl leading-tight text-cut-charcoal sm:text-4xl">
          Hollywood failed, now it&apos;s your turn.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-cut-muted sm:text-base">
          Cut is a crowdfunding surface for film makers of all kinds to secure
          funding for their projects. Users can invest in projects they believe
          in and receive a portion of that film&apos;s revenue upon release.
        </p>
        <p className="mt-5">
          <a
            href="/CUT-whitepaper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-cut-charcoal px-3 py-1.5 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
          >
            Read the white paper
          </a>
        </p>
      </div>
    </section>
  );
}
