"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RemoveProjectButton } from "@/components/RemoveProjectButton";
import { getOrCreateCreatorId } from "@/lib/creator";
import {
  loadDashboardProjects,
  type DashboardProject,
} from "@/lib/dashboard-projects";

function addedOn(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function editHref(project: DashboardProject): string {
  return project.kind === "preview"
    ? `/dashboard/preview/${project.id}`
    : `/dashboard/finished/${project.id}`;
}

function viewHref(project: DashboardProject): string {
  return project.kind === "preview" ? `/film/${project.id}` : `/finished/${project.id}`;
}

export function DashboardView() {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    let creatorId: string;
    try {
      creatorId = getOrCreateCreatorId();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "This browser cannot store a creator id.",
      );
      setLoading(false);
      return;
    }
    const result = await loadDashboardProjects(creatorId);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setProjects(result.projects);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-cut-charcoal">Dashboard</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cut-muted">
        Projects added from this browser. Older listings with no creator id stay
        public and are not listed here.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cut-charcoal">
        This browser&apos;s creator id is not a password: anyone who has it can edit
        these projects.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-cut-muted">Loading your projects…</p>
      ) : null}
      {error ? <p className="mt-8 text-sm text-red-400">{error}</p> : null}

      {!loading && !error && projects.length === 0 ? (
        <div className="mt-8 rounded border border-cut-border bg-cut-mist p-6">
          <p className="font-serif text-xl text-cut-charcoal">
            No projects in this browser yet.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cut-muted">
            Upload a preview or list a finished film. They will show up here.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center rounded border border-cut-charcoal px-3 py-1.5 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
            >
              Upload a preview
            </Link>
            <Link
              href="/finished/upload"
              className="inline-flex items-center rounded border border-cut-charcoal px-3 py-1.5 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
            >
              List a finished film
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const when = addedOn(project.createdAt);
            return (
              <li
                key={`${project.kind}-${project.id}`}
                className="flex h-full flex-col rounded border border-cut-border bg-cut-mist p-4"
              >
                <p className="text-xs tracking-widest text-cut-muted uppercase">
                  {project.kind === "preview" ? "Preview" : "Finished film"}
                  {project.localOnly ? " · this browser only" : ""}
                </p>
                <h2 className="mt-2 font-serif text-lg leading-tight text-cut-charcoal">
                  {project.title}
                </h2>
                <p className="mt-1 text-sm text-cut-muted">Creator {project.creator}</p>
                {when ? (
                  <p className="mt-1 text-sm text-cut-muted">Added {when}</p>
                ) : null}
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cut-muted">
                  {project.synopsis}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link href={viewHref(project)} className="text-cut-charcoal underline">
                    View
                  </Link>
                  <Link href={editHref(project)} className="text-cut-charcoal underline">
                    Edit
                  </Link>
                </div>
                <div className="mt-4">
                  <RemoveProjectButton
                    kind={project.kind}
                    id={project.id}
                    onRemoved={() => {
                      void load();
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
