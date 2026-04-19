import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";

type ValidatePaymentBody = {
  profileId?: string;
  validate?: boolean;
};

type AdminProfile = {
  is_admin: boolean | null;
};

const router: IRouter = Router();

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

router.post("/admin/validate-payment", async (req, res) => {
  const { profileId, validate } = req.body as ValidatePaymentBody;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = getBearerToken(req.headers.authorization);

  if (!profileId || typeof validate !== "boolean") {
    res.status(400).json({ error: "La demande de validation est incomplète." });
    return;
  }

  if (!supabaseUrl || !serviceRoleKey || !token) {
    res.status(503).json({
      error:
        "La clé Supabase Service Role est requise pour valider les paiements.",
    });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    res.status(401).json({ error: "Session invalide. Veuillez vous reconnecter." });
    return;
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<AdminProfile>();

  if (adminError || !adminProfile?.is_admin) {
    res.status(403).json({ error: "Accès administrateur requis." });
    return;
  }

  const updateData = validate
    ? { is_premium: true, payment_screenshot_url: null }
    : { payment_screenshot_url: null };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profileId);

  if (updateError) {
    req.log.error({ err: updateError, profileId }, "Payment validation failed");
    res.status(500).json({ error: "Impossible de valider ce paiement." });
    return;
  }

  res.json({ success: true });
});

export default router;