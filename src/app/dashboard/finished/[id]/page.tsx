import type { Metadata } from "next";
import { FinishedEditForm } from "@/components/FinishedEditForm";

export const metadata: Metadata = {
  title: "Edit finished film — Cut",
  description: "Edit a finished-film listing added from this browser. Playback stays locked.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FinishedEditPage({ params }: PageProps) {
  const { id } = await params;
  return <FinishedEditForm id={id} />;
}
