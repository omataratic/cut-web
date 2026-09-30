import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Upload — Cut",
  description: "Upload placeholder — coming in a later phase.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl text-cut-charcoal">Upload</h1>
      <p className="mt-3 text-sm text-cut-muted">
        Trailer upload and campaign creation land in a later phase. This route
        is a Phase 0 placeholder.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded border border-cut-charcoal px-4 py-2 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
      >
        Back to front page
      </Link>
    </div>
  );
}
