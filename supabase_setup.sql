-- ============================================
-- CLOTHIX — Supabase Setup Script
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. PRODUCTS TABLE
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  sizes text[] default '{}',          -- e.g. {"XS","S","M","L","XL"}
  stock_status text default 'in_stock' check (stock_status in ('in_stock', 'low_stock', 'out_of_stock')),
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update `updated_at` on row change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on products
  for each row execute function update_updated_at_column();

-- 2. ROW LEVEL SECURITY
alter table products enable row level security;

-- Public can READ all products
create policy "Public can view products"
  on products for select
  using (true);

-- Only authenticated users (admin) can INSERT / UPDATE / DELETE
create policy "Admin can insert products"
  on products for insert
  with check (auth.role() = 'authenticated');

create policy "Admin can update products"
  on products for update
  using (auth.role() = 'authenticated');

create policy "Admin can delete products"
  on products for delete
  using (auth.role() = 'authenticated');

-- 3. STORAGE BUCKET
-- Run this in the Supabase dashboard → Storage → New bucket
-- Name: cloth-images | Public: true
-- OR via SQL:
insert into storage.buckets (id, name, public)
values ('cloth-images', 'cloth-images', true)
on conflict do nothing;

-- Allow public to read images
create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'cloth-images');

-- Only authenticated users can upload/delete images
create policy "Admin can upload images"
  on storage.objects for insert
  with check (bucket_id = 'cloth-images' and auth.role() = 'authenticated');

create policy "Admin can delete images"
  on storage.objects for delete
  using (bucket_id = 'cloth-images' and auth.role() = 'authenticated');

-- 4. SEED DATA (optional — remove if not needed)
insert into products (name, description, price, sizes, stock_status, image_url) values
  ('Silk Noir Blazer', 'Italian silk blazer with structured shoulders. Effortlessly sharp.', 289.00, '{"XS","S","M","L","XL"}', 'in_stock', null),
  ('Onyx Linen Trousers', 'Wide-leg linen trousers with a fluid, tailored drape.', 149.00, '{"XS","S","M","L"}', 'in_stock', null),
  ('Ivory Crepe Dress', 'Bias-cut crepe midi dress with a subtle cowl neck.', 219.00, '{"XS","S","M","L","XL"}', 'low_stock', null),
  ('Charcoal Wool Coat', 'Double-breasted wool-cashmere blend overcoat.', 449.00, '{"S","M","L","XL"}', 'in_stock', null);
