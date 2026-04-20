"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
type Message = { role: "user" | "assistant", content: string };

export default function TutorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salut ! Je suis ton tuteur IA BacMaster. Pose-moi une question sur tes cours !" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProf = async () => {
      if (!supabase) {
        setInitializing(false);
        return;
      }
      const { data: { session: sess } } = await supabase.auth.getSession();
      if (!sess) {
        router.replace("/auth");
        return;
      }
      setSession(sess);
      const { data } = await supabase.from("profiles").select("*").eq("id", sess.user.id).single();
      setProfile(data || {
        id: sess.user.id,
        full_name: sess.user.user_metadata?.full_name || null,
        is_premium: false,
        ai_messages_count: 0,
      });
      setInitializing(false);
    };
    fetchProf();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!profile || !session) {
      toast({ title: "Connexion requise", description: "Connecte-toi pour utiliser le tuteur IA.", variant: "destructive" });
      router.replace("/auth");
      return;
    }

    if (!profile.is_premium && profile.ai_messages_count >= 3) {
      toast({ title: "Limite atteinte", description: "Tu as utilisé tes 3 messages gratuits. Passe Premium pour continuer !", variant: "destructive" });
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "L'IA est momentanément indisponible.");
      }
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);

      if (!profile.is_premium) {
        const usedMessages = 3 - (data.remainingFreeMessages ?? 0);
        setProfile({ ...profile, ai_messages_count: usedMessages });
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion avec le tuteur. Veuillez réessayer plus tard." }]);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const messagesLeft = profile?.is_premium ? "Illimité" : Math.max(0, 3 - (profile?.ai_messages_count || 0));
  const inputDisabled = initializing || !session || !profile || (!profile?.is_premium && messagesLeft === 0) || loading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] bg-white max-w-3xl mx-auto shadow-sm border-x border-gray-100">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white z-10 sticky top-0 md:top-16">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#e65c00]/10 rounded-full flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#e65c00]" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">Tuteur IA</h2>
            <p className="text-xs font-medium text-gray-500">
              {profile?.is_premium ? (
                <span className="text-[#008033]">Premium • Illimité</span>
              ) : (
                <span>Messages restants: <span className="text-[#e65c00] font-bold">{messagesLeft}</span>/3</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === "user" 
                  ? "bg-[#e65c00] text-white rounded-tr-none" 
                  : "bg-white border text-gray-800 rounded-tl-none"
              }`}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {msg.content}
  </ReactMarkdown>
</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Input 
            className="flex-1 h-12 bg-gray-50 border-gray-200"
            placeholder={initializing ? "Chargement..." : (!profile?.is_premium && messagesLeft === 0) ? "Passe Premium pour continuer" : "Pose ta question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={inputDisabled}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-12 w-12 shrink-0 rounded-xl"
            disabled={inputDisabled || !input.trim()}
          >
            {(!profile?.is_premium && messagesLeft === 0) ? <Lock className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
