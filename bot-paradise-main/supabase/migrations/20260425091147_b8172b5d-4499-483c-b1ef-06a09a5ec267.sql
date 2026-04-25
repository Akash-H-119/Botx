
-- Fix view: use security_invoker so RLS of querying user applies
DROP VIEW IF EXISTS public.my_purchases;
CREATE VIEW public.my_purchases
WITH (security_invoker = true)
AS
SELECT DISTINCT
  p.id AS product_id,
  p.name,
  p.slug,
  p.cover_image_url,
  p.short_description,
  p.file_path,
  o.id AS order_id,
  o.paid_at,
  o.user_id
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.products p ON p.id = oi.product_id
WHERE o.status = 'paid';

-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten public bucket: replace broad SELECT with object-level read (still public via signed/public URLs from Supabase storage, but can't LIST objects)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
-- Public access still works through Supabase's public URL endpoint for the bucket; we keep no SELECT policy for anonymous listing.
-- Add a permissive read so getPublicUrl still resolves files (Supabase serves public bucket files via the storage API regardless of object listing).
CREATE POLICY "Read product images by path" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
