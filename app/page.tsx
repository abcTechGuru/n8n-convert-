"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainApp from "@/components/Main";
import { User } from "@supabase/supabase-js";

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
      <div className="flex items-center justify-center min-h-screen bg-muted px-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Sign in to access Apollo Scraper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
            >
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
  );
}
