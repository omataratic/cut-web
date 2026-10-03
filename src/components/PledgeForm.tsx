"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { truncateWallet } from "@/lib/bts";
import { saveLocalPledge, type LocalPledge } from "@/lib/pledges";

type PledgeFormProps = {
  filmId: string;
  filmTitle: string;
};

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1) return null;
  return value;
}

export function PledgeForm({ filmId, filmTitle }: PledgeFormProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<LocalPledge | null>(null);

  if (saved) {
    return (
      <div
        role="status"
        className="rounded border border-cut-border bg-cut-mist p-4 sm:p-5"
      >
        <p className="text-xs font-semibold tracking-widest text-cut-muted uppercase">
          Saved on this device
        </p>
        <h2 className="mt-2 font-serif text-2xl text-cut-charcoal">
          Pledge recorded
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-cut-muted">Film</dt>
            <dd className="text-right text-cut-charcoal">{filmTitle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-cut-muted">Amount</dt>
            <dd className="tabular-nums text-cut-charcoal">
              {saved.amountCut.toLocaleString("en-US")} $CUT
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-cut-muted">Wallet</dt>
            <dd className="font-mono text-cut-charcoal">
              {truncateWallet(saved.wallet)}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-cut-muted">
          Nothing was sent on-chain and no funds moved. Escrow is not live, so
          this confirmation only lives in this browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/film/${filmId}`}
            className="inline-flex rounded border border-cut-charcoal bg-cut-charcoal px-4 py-2 text-sm text-cut-cream hover:opacity-90"
          >
            Back to film
          </Link>
          <button
            type="button"
            onClick={() => setSaved(null)}
            className="inline-flex rounded border border-cut-border px-4 py-2 text-sm text-cut-charcoal hover:border-cut-charcoal"
          >
            Pledge again
          </button>
        </div>
      </div>
    );
  }

  const submit = (event: FormEvent, openConnect?: () => void) => {
    event.preventDefault();
    setError(null);
    if (!isConnected || !address) {
      openConnect?.();
      return;
    }
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Enter a whole number of $CUT, at least 1.");
      return;
    }
    try {
      setSaved(
        saveLocalPledge({
          filmId,
          wallet: address,
          amountCut: parsed,
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this pledge.",
      );
    }
  };

  return (
    <ConnectKitButton.Custom>
      {({ show }) => (
        <form
          onSubmit={(event) => submit(event, show)}
          className="space-y-4 rounded border border-cut-border bg-cut-mist p-4 sm:p-5"
        >
          <div>
            <h2 className="font-serif text-xl text-cut-charcoal">
              Pledge with $CUT
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cut-muted">
              1 $CUT is the pledge unit for now. The USD figures on the campaign
              are the funding goal display, not a live price conversion.
            </p>
          </div>

          <label className="block text-sm text-cut-charcoal">
            Amount
            <span className="mt-1 flex overflow-hidden rounded border border-cut-border bg-cut-cream focus-within:border-cut-charcoal">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm tabular-nums text-cut-charcoal outline-none placeholder:text-cut-muted"
                aria-describedby="pledge-unit-note"
              />
              <span className="flex items-center border-l border-cut-border px-3 text-xs tracking-wide text-cut-muted">
                $CUT
              </span>
            </span>
          </label>
          <p id="pledge-unit-note" className="text-sm leading-relaxed text-cut-muted">
            A pledge is held until the goal is met. If the goal is missed, it is
            refunded in full. This screen is a preview: it does not send a
            transaction or take funds, because escrow is not live.
          </p>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded border border-cut-charcoal bg-cut-charcoal px-4 py-2.5 text-sm text-cut-cream hover:opacity-90"
          >
            {isConnected ? "Confirm pledge" : "Connect wallet to pledge"}
          </button>
        </form>
      )}
    </ConnectKitButton.Custom>
  );
}
