import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard — Cut",
  description: "Projects added from this browser.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
