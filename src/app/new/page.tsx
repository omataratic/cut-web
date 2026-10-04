import type { Metadata } from "next";
import { HomeView } from "@/components/HomeView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New — Cut",
  description: "Newest film previews on Cut, including submitted films.",
};

type NewPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function NewPage({ searchParams }: NewPageProps) {
  const { q } = await searchParams;
  return <HomeView sort="new" query={queryValue(q)} />;
}
