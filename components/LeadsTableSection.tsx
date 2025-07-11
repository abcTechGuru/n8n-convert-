import React from "react";
import { LeadsTable } from "@/components/LeadsTable";
import type { Lead } from "@/types/Lead";

interface LeadsTableSectionProps {
  leads: Lead[];
  DownloadButton: React.ReactNode;
}

export default function LeadsTableSection({ leads, DownloadButton }: LeadsTableSectionProps) {
  return (
    <section className="w-full max-w-6xl mb-10 flex flex-col items-center bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 md:rounded-2xl rounded-none shadow-2xl border border-gray-200 dark:border-gray-800">
      <LeadsTable leads={leads} DownloadButton={DownloadButton} />
    </section>
  );
} 