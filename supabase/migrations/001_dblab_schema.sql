create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  institution text,
  total_xp integer not null default 0 check (total_xp >= 0),
  exercises_completed integer not null default 0 check (exercises_completed >= 0),
  average_accuracy numeric(5,2) not null default 0.00 check (average_accuracy >= 0 and average_accuracy <= 100),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_ranking
  on public.profiles (total_xp desc, average_accuracy desc);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  level smallint not null check (level between 1 and 4),
  domain text not null,
  title text not null,
  statement text not null,
  source text not null default 'ai' check (source in ('static', 'ai')),
  payload jsonb not null,
  times_served integer not null default 1 check (times_served >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_exercises_level_domain
  on public.exercises (level, domain, created_at desc);

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  accuracy_pct numeric(5,2) not null check (accuracy_pct >= 0 and accuracy_pct <= 100),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  error_breakdown jsonb not null default '{}'::jsonb,
  submitted_answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create index if not exists idx_attempts_user_date
  on public.exercise_attempts (user_id, completed_at desc);

create index if not exists idx_attempts_exercise
  on public.exercise_attempts (exercise_id);

create or replace function public.handle_new_exercise_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    total_xp = total_xp + new.score,
    exercises_completed = exercises_completed + 1,
    average_accuracy = (
      select round(coalesce(avg(accuracy_pct), 0)::numeric, 2)
      from public.exercise_attempts
      where user_id = new.user_id
    ),
    updated_at = now()
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists trg_after_attempt_insert on public.exercise_attempts;
create trigger trg_after_attempt_insert
after insert on public.exercise_attempts
for each row
execute function public.handle_new_exercise_attempt();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, institution)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'institution'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace view public.leaderboard as
select
  p.id as user_id,
  p.display_name,
  p.institution,
  p.total_xp,
  p.exercises_completed,
  p.average_accuracy,
  rank() over (order by p.total_xp desc, p.average_accuracy desc, p.exercises_completed desc) as position
from public.profiles p
where p.exercises_completed > 0;

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_attempts enable row level security;

create policy "Perfis visíveis para leitura"
  on public.profiles for select
  using (true);

create policy "Usuário pode inserir próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuário pode atualizar próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Exercícios disponíveis para leitura"
  on public.exercises for select
  using (true);

create policy "Usuários autenticados podem salvar exercícios gerados"
  on public.exercises for insert
  with check (auth.role() = 'authenticated');

create policy "Aluno lê apenas suas tentativas"
  on public.exercise_attempts for select
  using (auth.uid() = user_id);

create policy "Aluno registra sua própria tentativa"
  on public.exercise_attempts for insert
  with check (auth.uid() = user_id);
