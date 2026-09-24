import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

export default async function main(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const Stripe = (await import("https://esm.sh/stripe@14?dts")).default;
    const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature")!;
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          client_reference_id: string;
          customer_email: string;
          metadata?: { plan_id?: string };
        };
        const userId = session.client_reference_id;
        const planId = session.metadata?.plan_id || "premium_monthly";
        if (userId) {
          const now = new Date();
          const expires = new Date(now);
          if (planId === "premium_yearly") expires.setFullYear(expires.getFullYear() + 1);
          else expires.setMonth(expires.getMonth() + 1);

          await supabase.from("profiles").update({
            subscription_tier: planId,
            is_premium: true,
            premium_expires_at: expires.toISOString(),
            premium_product_id: planId,
          }).eq("id", userId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as {
          metadata?: { user_id?: string };
          status: string;
          current_period_end: number;
        };
        const userId = sub.metadata?.user_id;
        if (userId) {
          if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
            await supabase.from("profiles").update({
              subscription_tier: "free_trial",
              is_premium: false,
              premium_expires_at: null,
              premium_product_id: null,
            }).eq("id", userId);
          } else {
            const expires = new Date(sub.current_period_end * 1000).toISOString();
            await supabase.from("profiles").update({
              is_premium: true,
              premium_expires_at: expires,
            }).eq("id", userId);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
