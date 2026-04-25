-- Secure marketplace core:
-- - Promote products to bots
-- - Move payments into server-created orders/transactions
-- - Add per-buyer licenses

DO $$
BEGIN
  IF to_regclass('public.bots') IS NULL AND to_regclass('public.products') IS NOT NULL THEN
    ALTER TABLE public.products RENAME TO bots;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'bot_id'
  ) THEN
    ALTER TABLE public.order_items RENAME COLUMN product_id TO bot_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'product_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'bot_name'
  ) THEN
    ALTER TABLE public.order_items RENAME COLUMN product_name TO bot_name;
  END IF;
END $$;

ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS release_notes TEXT,
  ADD COLUMN IF NOT EXISTS supported_exchanges TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS license_max_activations INT NOT NULL DEFAULT 1 CHECK (license_max_activations > 0),
  ADD COLUMN IF NOT EXISTS license_expires_days INT CHECK (license_expires_days IS NULL OR license_expires_days > 0);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_currency TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(24, 12),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

UPDATE public.orders
SET order_number = 'CB-' || upper(substr(replace(id::text, '-', ''), 1, 10))
WHERE order_number IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT ('CB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));

DO $$
BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending', 'confirming', 'confirmed', 'failed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  network TEXT,
  pay_currency TEXT NOT NULL,
  pay_amount NUMERIC(24, 12),
  pay_address TEXT,
  expected_usd NUMERIC(12, 2) NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  confirmations INT NOT NULL DEFAULT 0,
  tx_hash TEXT,
  provider_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS transactions_order_id_idx ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_provider_payment_id_idx
  ON public.transactions(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE TYPE public.license_status AS ENUM ('active', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  license_key TEXT NOT NULL UNIQUE,
  status public.license_status NOT NULL DEFAULT 'active',
  max_activations INT NOT NULL DEFAULT 1 CHECK (max_activations > 0),
  activations_count INT NOT NULL DEFAULT 0 CHECK (activations_count >= 0),
  activated_devices JSONB NOT NULL DEFAULT '[]',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, bot_id, order_id)
);

CREATE INDEX IF NOT EXISTS licenses_user_id_idx ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS licenses_bot_id_idx ON public.licenses(bot_id);
CREATE INDEX IF NOT EXISTS licenses_order_id_idx ON public.licenses(order_id);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Anyone views published products" ON public.bots;
DROP POLICY IF EXISTS "Admins view all products" ON public.bots;
DROP POLICY IF EXISTS "Admins manage products" ON public.bots;

CREATE POLICY "Anyone views published bots" ON public.bots
FOR SELECT USING (is_published = true);

CREATE POLICY "Users view purchased bots" ON public.bots
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.bot_id = bots.id
      AND o.user_id = auth.uid()
      AND o.status = 'paid'
  )
);

CREATE POLICY "Admins view all bots" ON public.bots
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage bots" ON public.bots
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create own order items" ON public.order_items;

CREATE POLICY "Users view own transactions" ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all transactions" ON public.transactions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own licenses" ON public.licenses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all licenses" ON public.licenses
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update licenses" ON public.licenses
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP VIEW IF EXISTS public.my_purchases;
CREATE VIEW public.my_purchases
WITH (security_invoker = true)
AS
SELECT DISTINCT
  b.id AS bot_id,
  b.id AS product_id,
  b.name,
  b.slug,
  b.cover_image_url,
  b.short_description,
  b.version,
  b.file_path,
  o.id AS order_id,
  o.order_number,
  o.paid_at,
  o.user_id,
  l.id AS license_id,
  l.license_key,
  l.status AS license_status,
  l.activations_count,
  l.max_activations,
  l.expires_at AS license_expires_at
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.bots b ON b.id = oi.bot_id
LEFT JOIN public.licenses l ON l.order_id = o.id AND l.bot_id = b.id AND l.user_id = o.user_id
WHERE o.status = 'paid';

DROP VIEW IF EXISTS public.products;
CREATE VIEW public.products
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  slug,
  short_description,
  description,
  price_usd,
  category_id,
  cover_image_url,
  gallery_urls,
  features,
  performance,
  file_path,
  is_published,
  is_featured,
  total_sales,
  rating,
  created_by,
  created_at,
  updated_at
FROM public.bots;

CREATE OR REPLACE FUNCTION public.increment_bot_sales(_bot_id UUID, _quantity INT DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bots
  SET total_sales = total_sales + GREATEST(_quantity, 0)
  WHERE id = _bot_id;
END;
$$;
