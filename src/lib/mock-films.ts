export type Film = {
  id: string;
  title: string;
  director: string;
  upvotes: number;
  fundedPercent: number;
  raisedUsd: number;
  goalUsd: number;
  pledges: number;
};

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
  },
];

export const trendingFilms = mockFilms
  .slice()
  .sort((a, b) => b.upvotes - a.upvotes)
  .slice(0, 5);
