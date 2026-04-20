import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ValidatePaymentBody = {
  profileId?: string;
  validate?: boolean;
};

type AdminProfile = {
  is_admin: boolean | null;
};

function getBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  const { profileId, validate } = (await request.json().catch(() => ({}))) as ValidatePaymentBody;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = getBearerToken(request.headers.get("authorization"));

  if (!profileId || typeof validate !== "boolean") {
    return NextResponse.json({ error: "La demande de validation est incomplète." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "Session invalide. Veuillez vous reconnecter." }, { status: 401 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "La clé Supabase Service Role est requise pour valider les paiements." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Session invalide. Veuillez vous reconnecter." }, { status: 401 });
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<AdminProfile>();

  if (adminError || !adminProfile?.is_admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const updateData = validate
    ? { is_premium: true, payment_screenshot_url: null }
    : { payment_screenshot_url: null };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profileId);

  if (updateError) {
    console.error("Payment validation failed", updateError);
    return NextResponse.json({ error: "Impossible de valider ce paiement." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
