/*
# Add Premium subscription tiers and tracking

1. Changes to profiles table
- Add `subscription_tier` new value: 'premium_monthly' and 'premium_yearly' (existing enum or text column)
- Add `premium_expires_at` (timestamptz, nullable) — when the premium subscription expires
- Add `premium_product_id` (text, nullable) — App Store / Play Store product ID
- Add `premium_receipt` (text, nullable) — last receipt verification reference
- Add `is_premium` (boolean, default false) — convenience flag for quick checks
2. Security
- No new tables, only column additions to existing profiles table
- RLS already enabled on profiles, existing policies cover new columns
3. Notes
- The app uses subscription_tier to determine access. New tiers:
  - 'premium_monthly' → paid monthly subscription
  - 'premium_yearly' → paid yearly subscription (with discount)
  - Existing tiers remain: 'free_trial', 'beta', 'standard'
- is_premium is a derived boolean: true when tier is premium_monthly or premium_yearly
- premium_expires_at lets the app check if the subscription is still active
*/

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_product_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_receipt text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill is_premium for existing rows
UPDATE profiles
SET is_premium = true
WHERE subscription_tier IN ('premium_monthly', 'premium_yearly');