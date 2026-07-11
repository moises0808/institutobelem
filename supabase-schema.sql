-- SQL para criar as tabelas no Supabase e permitir envio via cliente anônimo

create extension if not exists pgcrypto;

create table if not exists public.voluntarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.beneficiarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.voluntarios
  add column if not exists vol_nome text,
  add column if not exists vol_email text,
  add column if not exists vol_foto_nome text,
  add column if not exists vol_foto_url text,
  add column if not exists vol_data_nasc date,
  add column if not exists vol_cpf text,
  add column if not exists vol_rg text,
  add column if not exists vol_tel_principal text,
  add column if not exists vol_tel_alternativo text,
  add column if not exists vol_whatsapp text,
  add column if not exists vol_cep text,
  add column if not exists vol_rua text,
  add column if not exists vol_numero text,
  add column if not exists vol_bairro text,
  add column if not exists vol_cidade text,
  add column if not exists vol_estado text,
  add column if not exists tipo_membro text,
  add column if not exists area text,
  add column if not exists area_outro text,
  add column if not exists dias_disponiveis text,
  add column if not exists horarios_disponiveis text,
  add column if not exists frequencia_vol text,
  add column if not exists formacao text,
  add column if not exists cursos text,
  add column if not exists experiencia text,
  add column if not exists habilidades text,
  add column if not exists data_entrada date,
  add column if not exists projetos text,
  add column if not exists part_anteriores text,
  add column if not exists avaliacao text,
  add column if not exists termo_vol boolean,
  add column if not exists codigo_conduta boolean,
  add column if not exists confidencialidade boolean,
  add column if not exists uso_imagem boolean;

alter table public.beneficiarios
  add column if not exists ben_nome text,
  add column if not exists ben_email text,
  add column if not exists ben_data_nasc date,
  add column if not exists ben_cpf text,
  add column if not exists ben_telefone text,
  add column if not exists ben_foto_nome text,
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
  add column if not exists termo boolean;

alter table public.voluntarios enable row level security;
alter table public.beneficiarios enable row level security;

grant select, insert, update on public.voluntarios to anon;
grant select, insert on public.beneficiarios to anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'voluntarios'
      and policyname = 'Allow anon insert on voluntarios'
  ) then
    create policy "Allow anon insert on voluntarios"
      on public.voluntarios
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'voluntarios'
      and policyname = 'Allow anon update on voluntarios'
  ) then
    create policy "Allow anon update on voluntarios"
      on public.voluntarios
      for update
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'beneficiarios'
      and policyname = 'Allow anon insert on beneficiarios'
  ) then
    create policy "Allow anon insert on beneficiarios"
      on public.beneficiarios
      for insert
      to anon
      with check (true);
  end if;
end $$;
