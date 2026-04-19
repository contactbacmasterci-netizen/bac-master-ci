"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/auth");
      }
    };
    checkSession();
  }, [router]);

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#fdfaf6] text-center">
        <h1 className="text-3xl font-bold text-[#e65c00] mb-4">BacMaster CI</h1>
        <p className="text-gray-700 max-w-md mx-auto p-4 bg-white shadow rounded-xl border border-red-200">
          Supabase n'est pas encore configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY pour activer la connexion.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf6]">
      <div className="w-10 h-10 border-4 border-[#e65c00] border-t-transparent rounded-full animate-spin"></div>
    </main>
  );
}
