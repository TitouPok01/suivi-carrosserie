-- Suivi Carrosserie : notifications
-- À coller dans Supabase → SQL Editor → Run, APRÈS avoir créé l'Edge Function "notify".
-- Remplacer METTRE-LE-SECRET-ICI par la même valeur que le secret WEBHOOK_SECRET de la fonction.

-- 1) Les appareils abonnés (un par téléphone / tablette)
create table if not exists public.push_subs (
  endpoint text primary key,
  sub jsonb not null,
  name text not null default '',
  role text not null default 'atelier',
  updated_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists atelier_all on public.push_subs;
create policy atelier_all on public.push_subs for all to authenticated using (true) with check (true);

-- 2) Appel automatique de la fonction "notify"
create extension if not exists pg_net with schema extensions;
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create or replace function private.notify_push() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://lhbufaoiumslovbdxesm.supabase.co/functions/v1/notify',
    body := jsonb_build_object(
      'type', TG_OP, 'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW),
      'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'METTRE-LE-SECRET-ICI')
  );
  return NEW;
end $$;

drop trigger if exists push_tasks on public.tasks;
create trigger push_tasks after insert on public.tasks
  for each row execute function private.notify_push();

drop trigger if exists push_messages on public.messages;
create trigger push_messages after insert on public.messages
  for each row execute function private.notify_push();

drop trigger if exists push_vehicles_new on public.vehicles;
create trigger push_vehicles_new after insert on public.vehicles
  for each row execute function private.notify_push();

drop trigger if exists push_vehicles_stage on public.vehicles;
create trigger push_vehicles_stage after update on public.vehicles
  for each row when (old.data->>'stage' is distinct from new.data->>'stage')
  execute function private.notify_push();
