-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/vtstknbmrlkhpqzwokgp/sql)

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

create policy "Users can read their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);
