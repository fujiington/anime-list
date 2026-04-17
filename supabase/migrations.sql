-- Run this in the Supabase SQL Editor (all-in-one)
-- https://supabase.com/dashboard/project/vtstknbmrlkhpqzwokgp/sql/new

-- ── 0. Watchlist table ─────────────────────────────────────────────────────────
create table if not exists public.watchlist (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  mal_id      integer     not null,
  title       text        not null,
  image_url   text,
  score       numeric,
  added_at    timestamptz default now() not null,
  constraint watchlist_user_anime unique (user_id, mal_id)
);

alter table public.watchlist enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='watchlist' and policyname='Users can read their own watchlist') then
    create policy "Users can read their own watchlist" on public.watchlist for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='watchlist' and policyname='Users can insert into their own watchlist') then
    create policy "Users can insert into their own watchlist" on public.watchlist for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='watchlist' and policyname='Users can delete from their own watchlist') then
    create policy "Users can delete from their own watchlist" on public.watchlist for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ── 1. Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique check (char_length(username) between 2 and 30),
  avatar_url  text,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create empty profile row on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. Extend watchlist ─────────────────────────────────────────────────────────
alter table public.watchlist
  add column if not exists status text not null default 'plan_to_watch'
    check (status in ('watching','completed','plan_to_watch','on_hold','dropped')),
  add column if not exists user_rating integer
    check (user_rating is null or (user_rating >= 1 and user_rating <= 10)),
  add column if not exists episodes_watched integer not null default 0,
  add column if not exists total_episodes integer;

-- Allow users to UPDATE their own watchlist entries
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'watchlist' and policyname = 'Users can update their own watchlist'
  ) then
    execute $policy$
      create policy "Users can update their own watchlist"
        on public.watchlist for update
        using (auth.uid() = user_id)
    $policy$;
  end if;
end $$;

-- ── 3. Manga reading list ───────────────────────────────────────────────────────
create table if not exists public.manga_list (
  id              uuid        default gen_random_uuid() primary key,
  user_id         uuid        references auth.users(id) on delete cascade not null,
  mal_id          integer     not null,
  title           text        not null,
  image_url       text,
  score           numeric,
  status          text        not null default 'plan_to_read'
                    check (status in ('reading','completed','plan_to_read','on_hold','dropped')),
  user_rating     integer
                    check (user_rating is null or (user_rating >= 1 and user_rating <= 10)),
  chapters_read   integer     not null default 0,
  total_chapters  integer,
  added_at        timestamptz default now() not null,
  constraint manga_list_user_manga unique (user_id, mal_id)
);

alter table public.manga_list enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='manga_list' and policyname='Users can read their own manga list') then
    create policy "Users can read their own manga list" on public.manga_list for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='manga_list' and policyname='Users can insert into their own manga list') then
    create policy "Users can insert into their own manga list" on public.manga_list for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='manga_list' and policyname='Users can update their own manga list') then
    create policy "Users can update their own manga list" on public.manga_list for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='manga_list' and policyname='Users can delete from their own manga list') then
    create policy "Users can delete from their own manga list" on public.manga_list for delete using (auth.uid() = user_id);
  end if;
end $$;
