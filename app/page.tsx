"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import MainApp from "@/components/Main";
import { User } from "@supabase/supabase-js";
import { ThemeToggleButton } from "@/components/ThemeProvider";
import ThemeProvider from "@/components/ThemeProvider";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  if (!user) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-20 pb-10 transition-colors">
          <ThemeToggleButton />
          {/* Landing Content */}
          <div className="max-w-xl w-full flex flex-col items-center text-center mb-10">
            <svg className="h-16 w-16 text-blue-600 mb-4" fill="none" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" />
              <path d="M24 14v10l7 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 drop-shadow-lg">Apollo Lead Scraper</h1>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-6">
              Effortlessly scrape, verify, and manage your business leads from Apollo.io.<br/>
              Fast, secure, and privacy-focused. No manual copy-paste, no hassle.
            </p>
            <ul className="text-gray-600 dark:text-gray-300 text-base mb-8 space-y-2">
              <li>✔️ Bulk scrape and verify up to 500 leads at once</li>
              <li>✔️ Download clean CSVs for your CRM or outreach</li>
              <li>✔️ Your data is never shared or sold</li>
            </ul>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition text-lg dark:bg-blue-500 dark:hover:bg-blue-600"
              size="lg"
              onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
            >
              Sign In to Get Started
            </Button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div>
        <div className="flex justify-end p-4">
          <Button
            variant="destructive"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </Button>
        </div>
        <MainApp />
      </div>
    </ThemeProvider>
  );
}
