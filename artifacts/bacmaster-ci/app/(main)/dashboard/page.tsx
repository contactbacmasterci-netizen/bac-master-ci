"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, CheckCircle, Lock, PlayCircle, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);

      const { data: crs } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (crs) setCourses(crs);
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Salut, {profile?.full_name?.split(" ")[0] || "Champion"} !
          </h1>
          <p className="text-gray-500 mt-1">Prêt à dominer le Bac ?</p>
        </div>
        
        <div className="flex gap-4">
          <Card className="bg-[#fff4ed] border-[#e65c00]/20 flex-1 md:flex-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-[#e65c00]/10 p-3 rounded-xl">
                <Star className="h-6 w-6 text-[#e65c00]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Points</p>
                <p className="text-2xl font-bold text-[#e65c00]">{profile?.points || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${profile?.is_premium ? "bg-[#f0fdf4] border-[#008033]/20" : "bg-gray-50"} flex-1 md:flex-none`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${profile?.is_premium ? "bg-[#008033]/10" : "bg-gray-200"} p-3 rounded-xl`}>
                {profile?.is_premium ? (
                  <CheckCircle className="h-6 w-6 text-[#008033]" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Statut</p>
                <p className={`text-lg font-bold ${profile?.is_premium ? "text-[#008033]" : "text-gray-700"}`}>
                  {profile?.is_premium ? "Premium" : "Gratuit"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Methodology Section (Free) */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PlayCircle className="text-[#e65c00]" /> Méthodologie & Astuces
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-[#e65c00] transition-colors cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg group-hover:text-[#e65c00] transition-colors">La dissertation Philo</CardTitle>
              <CardDescription>Les 3 étapes clés pour réussir.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:border-[#e65c00] transition-colors cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg group-hover:text-[#e65c00] transition-colors">Gérer son temps</CardTitle>
              <CardDescription>Pendant l'examen de Maths.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:border-[#e65c00] transition-colors cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg group-hover:text-[#e65c00] transition-colors">Fiches de lecture</CardTitle>
              <CardDescription>Comment les faire efficacement.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Courses List */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="text-[#e65c00]" /> Cours Disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.length === 0 ? (
            <p className="text-gray-500">Aucun cours pour le moment.</p>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-[#e65c00] uppercase tracking-wider mb-1">{course.subject}</p>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                      {course.level}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  {profile?.is_premium && course.pdf_url ? (
                    <Button className="w-full" asChild>
                      <a href={course.pdf_url} target="_blank" rel="noreferrer">
                        Télécharger le PDF
                      </a>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      <span className="flex items-center gap-2"><Lock className="w-4 h-4"/> Premium requis</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
