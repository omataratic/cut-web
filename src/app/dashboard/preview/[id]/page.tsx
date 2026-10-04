import type { Metadata } from "next";
import { PreviewEditForm } from "@/components/PreviewEditForm";

export const metadata: Metadata = {
  title: "Edit preview — Cut",
  description: "Edit a YouTube preview added from this browser.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PreviewEditPage({ params }: PageProps) {
  const { id } = await params;
  return <PreviewEditForm id={id} />;
}
