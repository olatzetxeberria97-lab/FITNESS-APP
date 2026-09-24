import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRICE_MAP: Record<string, string> = {
  premium_monthly: "price_1UIlvKPDxz1APjLbMucFmyaz",
  premium_yearly: "price_1UIlv1PDxz1APjLbymWFyF5P",
};

export default async function main(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const planId = body.planId as string;
    const mappedValue = PRICE_MAP[planId];
    if (!mappedValue) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const Stripe = (await import("https://esm.sh/stripe@14?dts")).default;
    const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

    let priceId: string;
    if (mappedValue.startsWith("price_")) {
      priceId = mappedValue;
    } else {
      const prices = await stripe.prices.list({ product: mappedValue, active: true, limit: 1 });
      if (prices.data.length === 0) {
        return new Response(JSON.stringify({ error: "No active price found for product" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      priceId = prices.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://bolt.new";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
      payment_method_types: ["card"],
      payment_method_options: {},
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
