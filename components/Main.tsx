"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { DownloadButton } from "@/components/DownloadButton";
import type { Lead } from "@/types/Lead";
import ThemeProvider, { ThemeToggleButton } from "@/components/ThemeProvider";
import { supabase } from "@/utils/supabaseClient";
import LoadingModal from "@/components/LoadingModal";
import APIKeysSection from "@/components/APIKeysSection";
import ApolloFormSection from "@/components/ApolloFormSection";
import LeadsTableSection from "@/components/LeadsTableSection";

export default function MainApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loadingStep, setLoadingStep] = useState<string | undefined>();
  const [scrapedLeadsCount, setScrapedLeadsCount] = useState<number | undefined>();
  const [verifiedLeadsCount, setVerifiedLeadsCount] = useState<number | undefined>();
  const [apifyKey, setApifyKey] = useState("");
  const [reoonKey, setReoonKey] = useState("");
  const [apifyInput, setApifyInput] = useState("");
  const [reoonInput, setReoonInput] = useState("");
  const [showApify, setShowApify] = useState(false);
  const [showReoon, setShowReoon] = useState(false);

  // Save handler
  const handleSaveKeys = () => {
    setApifyKey(apifyInput);
    setReoonKey(reoonInput);
  };

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
    setTableLoading(true);
    try {
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
    } catch {
      setError("Failed to fetch leads");
      setLeads([]);
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.id) {
      fetchUserLeads(user.id);
    } else {
      setLeads([]);
      setTableLoading(false);
    }
  }, [user]);

  async function handleScrape(apolloUrl: string) {
    setError("");
    setLoading(true);
    setLoadingStep("Scraping leads from Apollo...");
    setLeads([]);
    setScrapedLeadsCount(undefined);
    setVerifiedLeadsCount(undefined);

    // Require user-provided keys before proceeding
    if (!apifyKey) {
      setError("Please input your Apify API key.");
      setLoading(false);
      setLoadingStep(undefined);
      return;
    }
    if (!reoonKey) {
      setError("Please input your Reoon API key.");
      setLoading(false);
      setLoadingStep(undefined);
      return;
    }

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apolloUrl,
          userId: user?.id,
          apifyKey,
          reoonKey,
        }),
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
      {/* <div className="fixed top-4 right-4 z-50">
        <AuthButton />
      </div> */}
      <div className="flex flex-col items-center w-full">
        {/* Top row: API keys and Apollo form side by side on desktop, stacked on mobile */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 justify-center items-center lg:items-stretch h-full">
          <div className="flex-1 flex flex-col h-full w-full max-w-xl mx-auto">
            <ApolloFormSection
              handleScrape={handleScrape}
              loading={loading}
              error={error}
            />
          </div>
          <div className="flex-1 flex flex-col h-full w-full max-w-xl mx-auto">
            <APIKeysSection
              apifyInput={apifyInput}
              setApifyInput={setApifyInput}
              showApify={showApify}
              setShowApify={setShowApify}
              reoonInput={reoonInput}
              setReoonInput={setReoonInput}
              showReoon={showReoon}
              setShowReoon={setShowReoon}
              handleSaveKeys={handleSaveKeys}
            />
          </div>
        </div>
        {/* Table section: always below, same max-width */}
        <div className="w-full max-w-6xl">
          <LeadsTableSection 
            leads={leads} 
            loading={tableLoading}
            DownloadButton={<DownloadButton leads={leads} />} 
          />
        </div>
      </div>
    </ThemeProvider>
  );
}