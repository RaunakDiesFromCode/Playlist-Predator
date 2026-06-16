"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const CHANGELOG_URL = "/CHANGELOG.md";

export default function VersionBadge() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [changelogMd, setChangelogMd] = useState<string | null>(null);

  useEffect(() => {
    fetch("/version.json")
      .then((r) => r.json())
      .then((data: { version: string }) => setVersion(data.version))
      .catch(() => setVersion(null));
  }, []);

  useEffect(() => {
    if (open && !changelogMd) {
      fetch(CHANGELOG_URL)
        .then((r) => r.text())
        .then((text) => setChangelogMd(text))
        .catch(() => setChangelogMd("# Changelog\n\nUnable to load."));
    }
  }, [open, changelogMd]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 border bg-background px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-none"
        aria-label="View changelog"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {version ? `v${version}` : "v0.0.0"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Changelog"
        >
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-mono text-sm font-semibold">Changelog</span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {changelogMd ? (
                <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-mono prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-hr:border-border prose-strong:font-semibold prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5">
                  <ReactMarkdown>{changelogMd}</ReactMarkdown>
                </article>
              ) : (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Loading…
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
