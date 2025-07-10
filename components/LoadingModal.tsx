import React from "react";

export default function LoadingModal({ show, message = "Scraping and verifying leads, please wait...", details }: { show: boolean, message?: string, details?: React.ReactNode }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 rounded-2xl w-[420px] h-[340px] max-w-[95vw] flex flex-col items-center justify-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in p-8">
        <svg className="animate-spin h-14 w-14 text-blue-500 mb-8" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <div className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">{message}</div>
        <div className="mt-1 text-base text-gray-500 dark:text-gray-400 text-center">This may take up to a minute for large lists.</div>
        {details && (
          <div className="mt-6 w-full flex flex-col items-center text-base text-gray-700 dark:text-gray-200">
            {details}
          </div>
        )}
      </div>
    </div>
  );
} 