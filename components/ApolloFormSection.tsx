import React from "react";
import { ApolloForm } from "@/components/AopolloForm";

interface ApolloFormSectionProps {
  handleScrape: (apolloUrl: string) => void;
  loading: boolean;
  error: string;
}

export default function ApolloFormSection({ handleScrape, loading, error }: ApolloFormSectionProps) {
  return (
        <section className="w-full max-w-2xl bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 md:rounded-2xl rounded-none shadow-2xl mt-10 mb-8 p-10 flex flex-col items-center border border-gray-200 dark:border-gray-800">
      <h1 className="text-4xl font-extrabold mb-3 text-center text-gray-800 dark:text-gray-100 tracking-tight">Apollo Lead Scraper</h1>
      <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-8">
        Welcome! Please enter your Apollo search URL below to begin scraping and verifying your leads.<br/>
        We will process your data securely and efficiently. Thank you for using our service.
      </p>
      <ApolloForm onScrape={handleScrape} loading={loading} />
      {error && <div className="text-red-600 mt-4 text-center font-medium">{error}</div>}
    </section>
  );
} 