"use client";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

export default function AuthButton({ user }: { user?: any }) {
  const router = useRouter();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  if (user) {
    return (
      <button
        onClick={signOut}
        className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full shadow hover:bg-gray-300 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Sign out"
        type="button"
      >
        <FiLogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button onClick={signInWithGoogle} className="bg-green-600 text-white px-4 py-2 rounded">
      Sign In with Google
    </button>
  );
}
