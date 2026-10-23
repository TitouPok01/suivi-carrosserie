-- Suivi Carrosserie : base de données Supabase
-- À coller une seule fois dans Supabase → SQL Editor → New query → Run.

-- 1) Les tables (une ligne = une voiture, une urgence, un message, une photo)
create table if not exists public.vehicles (id uuid primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());
create table if not exists public.tasks    (id uuid primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());
create table if not exists public.messages (id uuid primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());
create table if not exists public.photos   (id uuid primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());
create table if not exists public.config   (id text primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());

-- 2) Sécurité : seules les personnes connectées (compte de l'atelier) lisent et écrivent
alter table public.vehicles enable row level security;
alter table public.tasks    enable row level security;
alter table public.messages enable row level security;
alter table public.photos   enable row level security;
alter table public.config   enable row level security;

drop policy if exists atelier_all on public.vehicles;
drop policy if exists atelier_all on public.tasks;
drop policy if exists atelier_all on public.messages;
drop policy if exists atelier_all on public.photos;
drop policy if exists atelier_all on public.config;
create policy atelier_all on public.vehicles for all to authenticated using (true) with check (true);
create policy atelier_all on public.tasks    for all to authenticated using (true) with check (true);
create policy atelier_all on public.messages for all to authenticated using (true) with check (true);
create policy atelier_all on public.photos   for all to authenticated using (true) with check (true);
create policy atelier_all on public.config   for all to authenticated using (true) with check (true);

-- 3) Temps réel : chaque tablette voit les changements des autres tout de suite
alter table public.vehicles replica identity full;
alter table public.tasks    replica identity full;
alter table public.messages replica identity full;
alter table public.photos   replica identity full;
alter table public.config   replica identity full;
do $$
declare t text;
begin
  foreach t in array array['vehicles','tasks','messages','photos','config'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 4) Photos : un espace privé "photos" (visible uniquement une fois connecté)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 20971520, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists photos_read   on storage.objects;
drop policy if exists photos_insert on storage.objects;
drop policy if exists photos_delete on storage.objects;
create policy photos_read   on storage.objects for select to authenticated using (bucket_id = 'photos');
create policy photos_insert on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy photos_delete on storage.objects for delete to authenticated using (bucket_id = 'photos');
