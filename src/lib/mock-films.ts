export type Film = {
  id: string;
  title: string;
  director: string;
  upvotes: number;
  fundedPercent: number;
  raisedUsd: number;
  goalUsd: number;
  pledges: number;
  /** Filmmaker / campaign owner wallet (mock). Local claim can override in BTS. */
  ownerWallet: string;
  synopsis: string;
  /**
   * YouTube video id when the film has a real preview.
   * Leave unset for fictional demos — do not borrow unrelated trailers.
   */
  youtubeId?: string;
};

/** Demo filmmaker for "A Place Between" — claim locally to post from any wallet. */
export const DEMO_FILM_OWNER =
  "0x1111111111111111111111111111111111111111";

export const mockFilms: Film[] = [
  {
    id: "1",
    title: "A Place Between",
    director: "Lena Morrow",
    upvotes: 124,
    fundedPercent: 72,
    raisedUsd: 3620,
    goalUsd: 5000,
    pledges: 156,
    ownerWallet: DEMO_FILM_OWNER,
    synopsis:
      "A quiet drama about two strangers who share a layover and the year that follows. Shot on location with a lean crew.",
  },
  {
    id: "2",
    title: "Night Shift",
    director: "Jonah Hale",
    upvotes: 89,
    fundedPercent: 41,
    raisedUsd: 2050,
    goalUsd: 5000,
    pledges: 78,
    ownerWallet: "0x2222222222222222222222222222222222222222",
    synopsis:
      "A neon-soaked thriller set over one night in a hospital loading dock.",
  },
  {
    id: "3",
    title: "Threads",
    director: "Mira Solis",
    upvotes: 203,
    fundedPercent: 91,
    raisedUsd: 9100,
    goalUsd: 10000,
    pledges: 312,
    ownerWallet: "0x3333333333333333333333333333333333333333",
    synopsis:
      "Documentary portrait of a garment workers' collective stitching survival and solidarity.",
  },
  {
    id: "4",
    title: "Small Light",
    director: "Eli Vaughn",
    upvotes: 56,
    fundedPercent: 28,
    raisedUsd: 840,
    goalUsd: 3000,
    pledges: 41,
    ownerWallet: "0x4444444444444444444444444444444444444444",
    synopsis:
      "A short about a lighthouse keeper and the last letter that never arrived.",
  },
  {
    id: "5",
    title: "Far Away",
    director: "Ada Kemp",
    upvotes: 167,
    fundedPercent: 63,
    raisedUsd: 5040,
    goalUsd: 8000,
    pledges: 198,
    ownerWallet: "0x5555555555555555555555555555555555555555",
    synopsis:
      "Road movie across the high plains — found family, broken radio, endless sky.",
  },
  {
    id: "6",
    title: "The Last Summer",
    director: "Nico Ruiz",
    upvotes: 45,
    fundedPercent: 15,
    raisedUsd: 750,
    goalUsd: 5000,
    pledges: 29,
    ownerWallet: "0x6666666666666666666666666666666666666666",
    synopsis:
      "Coming-of-age comedy set in a dying resort town before the condo towers arrive.",
  },
  {
    id: "7",
    title: "In Passing",
    director: "Tess Quinn",
    upvotes: 112,
    fundedPercent: 55,
    raisedUsd: 2750,
    goalUsd: 5000,
    pledges: 134,
    ownerWallet: "0x7777777777777777777777777777777777777777",
    synopsis:
      "Three vignettes on a subway line — glances that almost become stories.",
  },
  {
    id: "8",
    title: "Old Roads",
    director: "Sam Okafor",
    upvotes: 78,
    fundedPercent: 38,
    raisedUsd: 2280,
    goalUsd: 6000,
    pledges: 67,
    ownerWallet: "0x8888888888888888888888888888888888888888",
    synopsis:
      "A father and daughter drive a restored sedan back to a village neither fully remembers.",
  },
  {
    id: "9",
    title: "Paper Year",
    director: "Rae Chen",
    upvotes: 134,
    fundedPercent: 80,
    raisedUsd: 4000,
    goalUsd: 5000,
    pledges: 189,
    ownerWallet: "0x9999999999999999999999999999999999999999",
    synopsis:
      "An animator rebuilds a year of lost frames after a studio fire — part memoir, part myth.",
  },
];

export const trendingFilms = mockFilms
  .slice()
  .sort((a, b) => b.upvotes - a.upvotes)
  .slice(0, 5);

export function getFilmById(id: string): Film | undefined {
  return mockFilms.find((f) => f.id === id);
}
