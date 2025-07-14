import { useState, ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Lead } from "@/types/Lead";
import "../app/globals.css";

const COLUMN_CONFIG = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email Address" },
  { key: "company", label: "Company" },
];

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
  DownloadButton?: ReactNode;
}

// Loading skeleton component
function LoadingSkeleton() {
  // 5 skeleton rows, 5 columns
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow
          key={i}
          className={
            `transition border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'}`
          }
        >
          {COLUMN_CONFIG.map((col, j) => (
            <TableCell
              key={j}
              className="px-2 md:px-5 py-2 md:py-3"
            >
              <div className="h-4 md:h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function LeadsTable({ leads, loading = false, DownloadButton }: LeadsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Lead>("first_name");
  const [sortAsc, setSortAsc] = useState(true);

  // Filter and sort
  const filtered = leads.filter(
    l =>
      (l.first_name?.toLowerCase().includes(search.toLowerCase()) || "") ||
      (l.last_name?.toLowerCase().includes(search.toLowerCase()) || "") ||
      (l.email?.toLowerCase().includes(search.toLowerCase()) || "") ||
      (l.company?.toLowerCase().includes(search.toLowerCase()) || "")
  );
  const sorted = [...filtered].sort((a, b) => {
    const aVal = (a[sortKey] || "").toString().toLowerCase();
    const bVal = (b[sortKey] || "").toString().toLowerCase();
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className="overflow-x-auto rounded-none md:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 w-full max-w-full table-scrollbar"
    >
      {/* Search, Download, and page size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 md:px-6 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 rounded-t-none sm:rounded-t-2xl ">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 md:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 w-full sm:w-60 md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm md:text-base"
            disabled={loading}
          />
          {DownloadButton}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded-lg px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs md:text-base"
            disabled={loading}
          >
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="min-h-[400px] flex flex-col">
          <Table className="min-w-[400px] md:min-w-[1200px] text-xs md:text-base">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10 rounded-t-2xl">
                {COLUMN_CONFIG.map(({ key, label }) => (
                  <TableHead
                    key={key}
                    className="font-semibold text-xs md:text-base text-gray-700 dark:text-gray-200 px-2 md:px-5 py-2 md:py-4 cursor-pointer select-none whitespace-normal md:whitespace-nowrap break-words"
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <LoadingSkeleton />
            </TableBody>
          </Table>
        </div>
      ) : (
        <>
          <Table className="min-w-[400px] md:min-w-[1200px] text-xs md:text-base">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10 rounded-t-2xl">
                {COLUMN_CONFIG.map(({ key, label }) => (
                  <TableHead
                    key={key}
                    className="font-semibold text-xs md:text-base text-gray-700 dark:text-gray-200 px-2 md:px-5 py-2 md:py-4 cursor-pointer select-none whitespace-normal md:whitespace-nowrap break-words"
                    onClick={() => {
                      if (sortKey === key) setSortAsc(!sortAsc);
                      else { setSortKey(key as keyof Lead); setSortAsc(true); }
                    }}
                    aria-sort={sortKey === key ? (sortAsc ? "ascending" : "descending") : "none"}
                  >
                    {label}
                    {sortKey === key && (sortAsc ? " ▲" : " ▼")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_CONFIG.length} className="text-center py-8 md:py-12 text-gray-400 dark:text-gray-500 text-base md:text-lg">
                    No leads found. Please adjust your search or scrape new leads.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((lead, i) => (
                  <TableRow
                    key={i}
                    className={
                      `transition border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} hover:bg-blue-50 dark:hover:bg-blue-900/40`
                    }
                  >
                    <TableCell className="px-2 md:px-5 py-2 md:py-3">{lead.first_name}</TableCell>
                    <TableCell className="px-2 md:px-5 py-2 md:py-3">{lead.last_name}</TableCell>
                    <TableCell className="px-2 md:px-5 py-2 md:py-3 font-mono text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      {lead.email}
                      <button
                        onClick={() => navigator.clipboard.writeText(lead.email)}
                        className="ml-1 text-xs text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                        title="Copy email"
                        aria-label="Copy email"
                      >📋</button>
                    </TableCell>
                    <TableCell className="px-2 md:px-5 py-2 md:py-3">{lead.company}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-row items-center justify-between px-2 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 rounded-b-none md:rounded-b-2xl gap-2 md:gap-0">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 md:px-4 py-2 rounded-lg disabled:opacity-50 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs md:text-base cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 md:px-4 py-2 rounded-lg disabled:opacity-50 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs md:text-base cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
