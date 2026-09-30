import { Hero } from "@/components/Hero";
import { FilmGrid } from "@/components/FilmGrid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <FilmGrid />
      </div>
    </>
  );
}
