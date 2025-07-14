import { toCSV } from "@/utils/csv";
import type { Lead } from "@/types/Lead";

export function DownloadButton({ leads }: { leads: Lead[] }) {
  function download() {
    if (!leads.length) return;
    const csv = toCSV(leads);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button
      className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer"
      onClick={download}
    >
      Download CSV
    </button>
  );
}
