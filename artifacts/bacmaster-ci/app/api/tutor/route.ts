import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  is_premium: boolean | null;
  ai_messages_count: number | null;
};

type TutorRequest = {
  message?: string;
};

const freeMessageLimit = 3;
const fallbackUsageCounts = new Map<string, number>();

function getBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as TutorRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Le message est requis." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openAiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const openAiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const token = getBearerToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: "Session invalide. Veuillez vous reconnecter." }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseKey || !openAiBaseUrl || !openAiKey) {
    return NextResponse.json({ error: "La configuration Supabase ou IA est incomplète." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Session invalide. Veuillez vous reconnecter." }, { status: 401 });
  }

  let usesPersistentCounter = true;
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, is_premium, ai_messages_count")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError?.code === "42703") {
    usesPersistentCounter = false;
    const fallbackResult = await supabase
      .from("profiles")
      .select("id, full_name, is_premium")
      .eq("id", user.id)
      .single<Omit<Profile, "ai_messages_count">>();

    profile = fallbackResult.data
      ? { ...fallbackResult.data, ai_messages_count: fallbackUsageCounts.get(user.id) ?? 0 }
      : null;
    profileError = fallbackResult.error;
  }

  if (profileError?.code === "PGRST116") {
    const newProfile = {
      id: user.id,
      full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      email: user.email,
      is_premium: false,
      points: 0,
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(newProfile)
      .select("id, full_name, is_premium")
      .single<Omit<Profile, "ai_messages_count">>();

    profile = insertedProfile
      ? { ...insertedProfile, ai_messages_count: fallbackUsageCounts.get(user.id) ?? 0 }
      : null;
    profileError = insertError;
    usesPersistentCounter = false;
  }

  if (profileError || !profile) {
    console.error("Tutor profile lookup failed", profileError);
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  const count = profile.ai_messages_count ?? 0;
  const premium = Boolean(profile.is_premium);

  if (!premium && count >= freeMessageLimit) {
    return NextResponse.json(
      { error: "Vous avez utilisé vos 3 messages gratuits. Passez Premium pour continuer avec le tuteur IA." },
      { status: 402 },
    );
  }

  const aiResponse = await fetch(`${openAiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Tu es BacMaster CI, un tuteur pédagogique expert du Baccalauréat ivoirien pour élèves de Terminale. Réponds en français clair, explique étape par étape, adapte les exemples au contexte de Côte d'Ivoire, encourage l'élève, et refuse de faire un devoir complet sans explication pédagogique.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("AI tutor request failed", aiResponse.status, errorText);
    return NextResponse.json({ error: "Le tuteur IA est momentanément indisponible." }, { status: 502 });
  }

  const aiData = (await aiResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = aiData.choices?.[0]?.message?.content;

  if (!answer) {
    return NextResponse.json({ error: "Le tuteur IA n'a pas retourné de réponse." }, { status: 502 });
  }

  if (usesPersistentCounter) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ ai_messages_count: count + 1 })
      .eq("id", user.id);

    if (updateError) {
      console.error("Tutor usage update failed", updateError);
      fallbackUsageCounts.set(user.id, count + 1);
    }
  } else {
    fallbackUsageCounts.set(user.id, count + 1);
  }

  return NextResponse.json({
    answer,
    remainingFreeMessages: premium ? null : Math.max(0, freeMessageLimit - (count + 1)),
  });
}
