"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, Check, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (!prof?.is_admin) {
        router.replace("/dashboard");
        return;
      }

      fetchPending();
    };
    checkAdminAndFetch();
  }, [router]);

  const fetchPending = async () => {
    const { data } = await supabase!
      .from("profiles")
      .select("*")
      .not("payment_screenshot_url", "is", null)
      .eq("is_premium", false);
    if (data) setPendingProfiles(data);
  };

  const handleValidate = async (id: string, validate: boolean) => {
    try {
      const updateData = validate 
        ? { is_premium: true, payment_screenshot_url: null }
        : { payment_screenshot_url: null };

      const { error } = await supabase!.from("profiles").update(updateData).eq("id", id);
      if (error) throw error;
      
      toast({ title: "Succès", description: validate ? "Compte passé en Premium" : "Preuve rejetée" });
      fetchPending();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gray-900 rounded-xl text-white">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500">Validation des paiements Premium</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes en attente ({pendingProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingProfiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune demande en attente.</p>
          ) : (
            pendingProfiles.map(profile => (
              <div key={profile.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-xl bg-gray-50">
                <div className="flex-1">
                  <p className="font-bold">{profile.full_name}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
                
                {profile.payment_screenshot_url && (
                  <div className="w-full md:w-48 space-y-2">
                    <img
                      src={profile.payment_screenshot_url}
                      alt={`Preuve de paiement de ${profile.full_name || "l'élève"}`}
                      className="h-32 w-full rounded-xl border object-cover"
                    />
                    <a 
                      href={profile.payment_screenshot_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-[#e65c00] hover:underline"
                    >
                      Ouvrir la capture <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleValidate(profile.id, false)}>
                    <X className="h-4 w-4 mr-1" /> Rejeter
                  </Button>
                  <Button className="bg-[#008033] hover:bg-[#006629]" onClick={() => handleValidate(profile.id, true)}>
                    <Check className="h-4 w-4 mr-1" /> Valider Premium
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
