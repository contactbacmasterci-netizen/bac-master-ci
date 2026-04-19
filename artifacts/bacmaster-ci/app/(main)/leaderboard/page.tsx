"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Medal, Trophy, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LeaderboardPage() {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, points, is_premium")
        .order("points", { ascending: false })
        .limit(50);
      if (data) setProfiles(data);
    };
    fetchProfiles();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="font-bold text-gray-400 w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-100 rounded-full mb-4">
          <Trophy className="h-10 w-10 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Classement National</h1>
        <p className="text-gray-500 mt-2">Mesure-toi aux autres candidats du Bac.</p>
      </div>

      <div className="space-y-3">
        {profiles.map((profile, index) => (
          <Card 
            key={profile.id} 
            className={`border-none shadow-sm transition-transform hover:scale-[1.01] ${
              index < 3 ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 flex justify-center shrink-0">
                {getRankIcon(index)}
              </div>
              
              <div className="h-12 w-12 rounded-full bg-[#e65c00]/10 flex items-center justify-center text-[#e65c00] font-bold text-lg shrink-0">
                {profile.full_name?.charAt(0).toUpperCase() || "?"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                  {profile.full_name || "Candidat anonyme"}
                  {profile.is_premium && <span className="text-[10px] uppercase tracking-wider bg-[#008033]/10 text-[#008033] px-2 py-0.5 rounded-full">Pro</span>}
                </p>
                <p className="text-sm text-gray-500">Lycéen(ne)</p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-black text-xl text-[#e65c00]">{profile.points}</p>
                <p className="text-xs font-medium text-gray-400">pts</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
