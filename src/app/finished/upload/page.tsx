import type { Metadata } from "next";
import Link from "next/link";
import { FinishedUploadForm } from "@/components/FinishedUploadForm";

export const metadata: Metadata = {
  title: "Add a finished film — Cut",
  description: "List a finished film. The movie file is not stored or played.",
};

export default function FinishedUploadPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="mb-4 text-sm">
        <Link href="/finished" className="text-cut-muted hover:text-cut-charcoal">
          ← Finished films
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-cut-charcoal">Add a finished film</h1>
      <p className="mt-3 text-sm leading-relaxed text-cut-muted">
        This is not the YouTube preview upload. A finished movie is listed by
        title, creator, and synopsis. The movie file is not kept on this public
        site, and it cannot be played or downloaded yet.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-cut-muted">
        Watching is meant for the creator, subscribers, and backer NFT holders
        at $3.99/month. Checkout is off until a finished film can actually play.
        The check is not live, so the film stays locked.
      </p>
      <div className="mt-6">
        <FinishedUploadForm />
      </div>
    </div>
  );
}
