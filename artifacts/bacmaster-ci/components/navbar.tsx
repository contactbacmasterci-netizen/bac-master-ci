"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Medal, MessageSquare, Shield, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session) {
        const { data } = await supabase!.from('profiles').select('is_admin').eq('id', session.user.id).single();
        if (data?.is_admin) setIsAdmin(true);
      }
    };
    if (supabase) checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.push("/auth");
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Tableau" },
    { href: "/tutor", icon: MessageSquare, label: "Tuteur" },
    { href: "/leaderboard", icon: Medal, label: "Classement" },
    { href: "/premium", icon: Star, label: "Premium" },
  ];

  if (isAdmin) {
    navItems.push({ href: "/admin-control", icon: Shield, label: "Admin" });
  }

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe md:top-0 md:bottom-auto md:border-t-0 md:border-b md:h-16 z-50">
      <div className="flex justify-between items-center h-16 px-4 max-w-5xl mx-auto md:justify-start md:gap-8">
        <div className="hidden md:flex items-center gap-2 text-[#e65c00] font-bold text-xl mr-8">
          <GraduationCap className="h-6 w-6" />
          <span>BacMaster CI</span>
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full md:w-auto md:flex-row md:gap-2 transition-colors ${
                isActive ? "text-[#e65c00]" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="h-5 w-5 mb-1 md:mb-0" />
              <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button 
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-900 ml-auto"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
