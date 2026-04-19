"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Upload, Star } from "lucide-react";

export default function PremiumPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !supabase) return;
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non connecté");

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('paiements-captures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('paiements-captures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ payment_screenshot_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      toast({ 
        title: "Capture envoyée !", 
        description: "Un administrateur va valider ton accès Premium très bientôt." 
      });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-[#e65c00]/10 rounded-2xl mb-4">
          <Star className="h-8 w-8 text-[#e65c00]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Passe au niveau Supérieur</h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">Débloque tous les cours PDF et pose des questions illimitées à ton Tuteur IA.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-[#008033]/20 bg-[#f0fdf4] shadow-md">
          <CardHeader>
            <CardTitle className="text-[#008033]">1. Paiement Mobile</CardTitle>
            <CardDescription className="text-gray-600">Effectue un dépôt de 5000 FCFA sur l'un de ces numéros :</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-medium text-gray-800">
            <div className="p-3 bg-white rounded-xl border border-[#008033]/10 shadow-sm flex justify-between items-center">
              <span>Wave</span>
              <span className="font-bold text-lg">01 02 03 04 05</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#008033]/10 shadow-sm flex justify-between items-center">
              <span>MTN Money</span>
              <span className="font-bold text-lg">05 04 03 02 01</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e65c00]/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-[#e65c00]">2. Preuve de paiement</CardTitle>
            <CardDescription>Uploade la capture d'écran du message de confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#e65c00] transition-colors bg-gray-50">
              <input 
                type="file" 
                id="receipt" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="receipt" className="cursor-pointer flex flex-col items-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {file ? file.name : "Clique pour choisir une image"}
                </span>
              </label>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleUpload} 
              disabled={!file || uploading}
            >
              {uploading ? "Envoi en cours..." : "Envoyer la preuve"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-white">
        <CardHeader>
          <CardTitle>Avantages Premium</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-gray-700"><CheckCircle2 className="text-[#008033] h-5 w-5"/> Téléchargement de toutes les fiches PDF</li>
            <li className="flex items-center gap-3 text-gray-700"><CheckCircle2 className="text-[#008033] h-5 w-5"/> Tuteur IA illimité 24h/24</li>
            <li className="flex items-center gap-3 text-gray-700"><CheckCircle2 className="text-[#008033] h-5 w-5"/> Correction de dissertations par IA</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
