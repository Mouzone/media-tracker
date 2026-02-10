-- Drop table if exists
drop table if exists public.media_items cascade;

-- Create a table for media items
create table public.media_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null check (type in ('movie', 'tv', 'book')),
  status text not null check (status in ('finished', 'dropped')) default 'finished',
  seasons integer null check (seasons >= 0),
  language text null,
  cover_url text null,
  date_finished date null,
  review text null,
  tags text[] null,
  rating integer null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone not null default now(),
  constraint media_items_pkey primary key (id)
) tablespace pg_default;

-- Enable RLS
alter table public.media_items enable row level security;

-- Create policies
create policy "Users can view their own items" on public.media_items
  for select using (auth.uid() = user_id);

create policy "Users can insert their own items" on public.media_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own items" on public.media_items
  for update using (auth.uid() = user_id);

create policy "Users can delete their own items" on public.media_items
  for delete using (auth.uid() = user_id);

-- Create storage bucket for covers
insert into storage.buckets (id, name)
values ('covers', 'covers')
on conflict (id) do nothing;

-- Set up storage policies
drop policy if exists "Cover images are publicly accessible" on storage.objects;
create policy "Cover images are publicly accessible" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "Users can upload cover images" on storage.objects;
create policy "Users can upload cover images" on storage.objects
  for insert with check (bucket_id = 'covers' and auth.uid() = owner);

drop policy if exists "Users can update their own cover images" on storage.objects;
create policy "Users can update their own cover images" on storage.objects
  for update using (bucket_id = 'covers' and auth.uid() = owner);
