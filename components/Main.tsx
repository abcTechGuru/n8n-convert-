"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { ApolloForm } from "@/components/AopolloForm";
import { LeadsTable } from "@/components/LeadsTable";
import { DownloadButton } from "@/components/DownloadButton";
import type { Lead } from "@/types/Lead";
import ThemeProvider, { ThemeToggleButton } from "@/components/ThemeProvider";
import { supabase } from "@/utils/supabaseClient";
import LoadingModal from "@/components/LoadingModal";
import AuthButton from "@/components/AuthButton";

export default function MainApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loadingStep, setLoadingStep] = useState<string | undefined>();
  const [scrapedLeadsCount, setScrapedLeadsCount] = useState<number | undefined>();
  const [verifiedLeadsCount, setVerifiedLeadsCount] = useState<number | undefined>();
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function fetchUserLeads(userId: string) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false });
    if (error instanceof Error) {
      setError(error.message);
      setLeads([]);
    } else {
      setLeads(data || []);
    }
  }

  useEffect(() => {
    if (user && user.id) {
      fetchUserLeads(user.id);
    } else {
      setLeads([]);
    }
  }, [user]);

  async function handleScrape(apolloUrl: string) {
    setError("");
    setLoading(true);
    setLoadingStep("Scraping leads from Apollo...");
    setLeads([]);
    setScrapedLeadsCount(undefined);
    setVerifiedLeadsCount(undefined);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apolloUrl, userId: user?.id }),
      });
      setLoadingStep("Verifying emails...");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setLoadingStep("Saving verified leads...");
      setScrapedLeadsCount(data.leads ? data.leads.length : 0);
      setVerifiedLeadsCount(data.leads ? data.leads.filter((l: Lead) => l.email_valid).length : 0);
      // After scraping, re-fetch all leads for the user to ensure UI is up to date
      if (user && user.id) {
        await fetchUserLeads(user.id);
      } else {
        setLeads(data.leads || []);
      }
      setLoadingStep(undefined);
      // Show results for 2 seconds before hiding modal
      await new Promise((r) => setTimeout(r, 2000));
      setScrapedLeadsCount(undefined);
      setVerifiedLeadsCount(undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoadingStep(undefined);
      setScrapedLeadsCount(undefined);
      setVerifiedLeadsCount(undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider>
      <LoadingModal
        show={loading || scrapedLeadsCount !== undefined}
        message={loadingStep || "Scraping and verifying leads, please wait..."}
        details={
          scrapedLeadsCount !== undefined ? (
            <div className="flex flex-col items-center gap-1">
              <div><span className="font-semibold">Total scraped leads:</span> {scrapedLeadsCount}</div>
              <div><span className="font-semibold">Verified leads:</span> {verifiedLeadsCount}</div>
            </div>
          ) : undefined
        }
      />
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      {/* Show only landing page if not signed in */}
      {!user ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 pt-20 pb-10">
          {/* Landing Content */}
          <div className="max-w-xl w-full flex flex-col items-center text-center mb-10">
            <svg className="h-16 w-16 text-blue-600 mb-4" fill="none" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" />
              <path d="M24 14v10l7 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">Apollo Lead Scraper</h1>
            <p className="text-lg text-gray-200 mb-6">
              Effortlessly scrape, verify, and manage your business leads from Apollo.io.<br/>
              Fast, secure, and privacy-focused. No manual copy-paste, no hassle.
            </p>
            <ul className="text-gray-300 text-base mb-8 space-y-2">
              <li>✔️ Bulk scrape and verify up to 500 leads at once</li>
              <li>✔️ Download clean CSVs for your CRM or outreach</li>
              <li>✔️ Your data is never shared or sold</li>
            </ul>
            
          </div>
          {/* Sign In Modal */}
          {showSignIn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-10 flex flex-col items-center w-full max-w-md animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-4">
                  Sign in to access <span className="text-blue-600">Apollo Scraper</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-300 text-center mb-6">
                  Securely manage and verify your leads with one click.
                </p>
                <AuthButton />
                <button
                  onClick={() => setShowSignIn(false)}
                  className="mt-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
                >
                  Cancel
                </button>
                <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                  We never share your data. Authentication is handled securely via Google.
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Main app for authenticated users
        <div className="min-h-screen bg-transparent">
          
          <div className="flex flex-col items-center">
            {/* Input Section */}
            <section className="w-full max-w-2xl bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 rounded-2xl shadow-2xl mt-10 mb-8 p-10 flex flex-col items-center border border-gray-200 dark:border-gray-800">
              <h1 className="text-4xl font-extrabold mb-3 text-center text-gray-800 dark:text-gray-100 tracking-tight">Apollo Lead Scraper</h1>
              <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-8">
                Welcome! Please enter your Apollo search URL below to begin scraping and verifying your leads.<br/>
                We will process your data securely and efficiently. Thank you for using our service.
              </p>
              <ApolloForm onScrape={handleScrape} loading={loading} />
              {error && <div className="text-red-600 mt-4 text-center font-medium">{error}</div>}
            </section>
            {/* Table Section */}
            <section className="w-full max-w-5xl mb-10  flex flex-col items-center bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
              <LeadsTable leads={leads} DownloadButton={<DownloadButton leads={leads} />} />
            </section>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}