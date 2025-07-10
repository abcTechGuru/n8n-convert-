"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { ApolloForm } from "@/components/AopolloForm";
import { LeadsTable } from "@/components/LeadsTable";
import { DownloadButton } from "@/components/DownloadButton";
import type { Lead } from "@/types/Lead";
import ThemeProvider, { ThemeToggleButton } from "@/components/ThemeProvider";
import { supabase } from "@/utils/supabaseClient";

export default function MainApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

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
    setLeads([]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apolloUrl, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      // After scraping, re-fetch all leads for the user to ensure UI is up to date
      if (user && user.id) {
        await fetchUserLeads(user.id);
      } else {
        setLeads(data.leads || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider>
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      <div className="flex flex-col items-center min-h-screen bg-transparent">
        {/* Input Section */}
        <section className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-md mt-10 mb-8 p-8 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800 dark:text-gray-100">Apollo Lead Scraper</h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Welcome! Please enter your Apollo search URL below to begin scraping and verifying your leads.<br/>
            We will process your data securely and efficiently. Thank you for using our service.
          </p>
          <ApolloForm onScrape={handleScrape} loading={loading} />
          {error && <div className="text-red-600 mt-4 text-center font-medium">{error}</div>}
        </section>
        {/* Table Section */}
        <section className="w-full max-w-5xl mb-10 p-6 flex flex-col items-center">
          <LeadsTable leads={leads} DownloadButton={<DownloadButton leads={leads} />} />
        </section>
      </div>
    </ThemeProvider>
  );
}