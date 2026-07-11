-- SQL específico para o formulário de beneficiário
-- Execute este script no editor SQL do Supabase

create extension if not exists pgcrypto;

create table if not exists public.beneficiarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.beneficiarios
  add column if not exists ben_nome text,
  add column if not exists ben_email text,
  add column if not exists ben_data_nasc date,
  add column if not exists ben_cpf text,
  add column if not exists ben_telefone text,
  add column if not exists ben_foto_nome text,
  add column if not exists ben_foto_url text,
  add column if not exists ben_cep text,
  add column if not exists ben_rua text,
  add column if not exists ben_numero text,
  add column if not exists ben_bairro text,
  add column if not exists ben_cidade text,
  add column if not exists ben_estado text,
  add column if not exists necessidade text,
  add column if not exists ben_renda text,
  add column if not exists ben_familiares text,
  add column if not exists observacoes text,
  add column if not exists termo boolean,
  add column if not exists nome text,
  add column if not exists email text,
  add column if not exists telefone text;

alter table public.beneficiarios enable row level security;

grant select, insert, update on public.beneficiarios to anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'beneficiarios'
      and policyname = 'Allow anon insert on beneficiaries'
  ) then
    create policy "Allow anon insert on beneficiaries"
      on public.beneficiarios
      for insert
      to anon
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'beneficiarios'
      and policyname = 'Allow anon select on beneficiaries'
  ) then
    create policy "Allow anon select on beneficiaries"
      on public.beneficiarios for select to anon using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'beneficiarios'
      and policyname = 'Allow anon update on beneficiaries'
  ) then
    create policy "Allow anon update on beneficiaries"
      on public.beneficiarios for update to anon using (true) with check (true);
  end if;
end $$;
