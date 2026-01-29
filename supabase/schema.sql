-- Users Table (입소자 명단)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Praises Table (칭찬 기록)
create table public.praises (
  id uuid default gen_random_uuid() primary key,
  receiver_id uuid references public.users(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete set null, -- Nullable for anonymous
  sender_name text default '익명의 제보자'::text,
  keyword text not null,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Policies
alter table public.users enable row level security;
alter table public.praises enable row level security;

-- Users: Public read, User update
create policy "Public profiles are viewable by everyone." on public.users
  for select using (true);

create policy "Users can insert their own profile." on public.users
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on public.users
  for update using ((select auth.uid()) = id);

-- Praises: Public read, Public insert (for viral praises)
create policy "Praises are viewable by everyone." on public.praises
  for select using (true);

create policy "Anyone can insert praises." on public.praises
  for insert with check (true);
