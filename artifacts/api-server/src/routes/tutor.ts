import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";

type TutorRequest = {
  message?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  is_premium: boolean | null;
  ai_messages_count: number | null;
};

const router: IRouter = Router();

const freeMessageLimit = 3;

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

router.post("/tutor", async (req, res) => {
  const body = req.body as TutorRequest;
  const message = body.message?.trim();

  if (!message) {
    res.status(400).json({ error: "Le message est requis." });
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openAiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const openAiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const token = getBearerToken(req.headers.authorization);

  if (!supabaseUrl || !supabaseKey || !openAiBaseUrl || !openAiKey || !token) {
    res.status(503).json({
      error:
        "La configuration Supabase ou IA est incomplète. Ajoutez les variables d'environnement nécessaires.",
    });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    res.status(401).json({ error: "Session invalide. Veuillez vous reconnecter." });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, is_premium, ai_messages_count")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError || !profile) {
    req.log.error({ err: profileError, userId: user.id }, "Tutor profile lookup failed");
    res.status(404).json({ error: "Profil introuvable." });
    return;
  }

  const count = profile.ai_messages_count ?? 0;
  const premium = Boolean(profile.is_premium);

  if (!premium && count >= freeMessageLimit) {
    res.status(402).json({
      error:
        "Vous avez utilisé vos 3 messages gratuits. Passez Premium pour continuer avec le tuteur IA.",
    });
    return;
  }

  const aiResponse = await fetch(`${openAiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
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
    req.log.error({ status: aiResponse.status, errorText }, "AI tutor request failed");
    res.status(502).json({ error: "Le tuteur IA est momentanément indisponible." });
    return;
  }

  const aiData = (await aiResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = aiData.choices?.[0]?.message?.content;

  if (!answer) {
    res.status(502).json({ error: "Le tuteur IA n'a pas retourné de réponse." });
    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ ai_messages_count: count + 1 })
    .eq("id", user.id);

  if (updateError) {
    req.log.error({ err: updateError, userId: user.id }, "Tutor usage update failed");
  }

  res.json({
    answer,
    remainingFreeMessages: premium
      ? null
      : Math.max(0, freeMessageLimit - (count + 1)),
  });
});

export default router;