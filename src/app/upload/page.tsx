import type { Metadata } from "next";
import { UploadForm } from "@/components/UploadForm";

export const metadata: Metadata = {
  title: "Upload — Cut",
  description: "Submit a film preview with a YouTube link.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-serif text-3xl text-cut-charcoal">Add a film</h1>
      <p className="mt-3 text-sm leading-relaxed text-cut-muted">
        Submit a film title, your name, a short synopsis, and a YouTube preview.
        The funding goal is shown on the page. No payment is taken, and a wallet
        is not required.
      </p>
      <div className="mt-6">
        <UploadForm />
      </div>
    </div>
  );
}
