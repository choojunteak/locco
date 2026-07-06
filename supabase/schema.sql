create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_initials text not null,
  avatar_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists food_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  list_key text,
  name text not null,
  description text not null default '',
  color text not null default '#f36b4f',
  privacy text not null default 'friends' check (privacy in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  postal_code text,
  latitude double precision not null,
  longitude double precision not null,
  price_range text not null check (price_range in ('$', '$$', '$$$', '$$$$')),
  notes text not null default '',
  place_key text unique not null,
  normalized_key text unique,
  source text,
  source_place_id text,
  created_at timestamptz not null default now(),
  unique (source, source_place_id)
);

create table if not exists saved_places (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references food_lists(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  note text,
  status text not null default 'want_to_try' check (status in ('want_to_try', 'tried', 'favourite')),
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  created_at timestamptz not null default now(),
  unique (list_id, place_id)
);

create table if not exists place_tags (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  tag text not null,
  tag_type text not null check (tag_type in ('category', 'mood')),
  unique (place_id, tag, tag_type)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  source_type text not null check (source_type in ('tiktok', 'instagram', 'website', 'manual', 'other')),
  url text not null,
  created_at timestamptz not null default now(),
  unique (place_id, url)
);

create index if not exists idx_places_lat_lng on places(latitude, longitude);
create index if not exists idx_food_lists_owner_id on food_lists(owner_id);
alter table food_lists add column if not exists list_key text;
create unique index if not exists idx_food_lists_owner_list_key
on food_lists(owner_id, list_key)
where list_key is not null;
create index if not exists idx_saved_places_list_id on saved_places(list_id);
create index if not exists idx_saved_places_place_id on saved_places(place_id);
create index if not exists idx_saved_places_user_id on saved_places(user_id);
create index if not exists idx_place_tags_place_id on place_tags(place_id);
create index if not exists idx_place_tags_tag on place_tags(tag);
create index if not exists idx_comments_place_id on comments(place_id);
create index if not exists idx_place_sources_place_id on place_sources(place_id);

grant usage on schema public to anon, authenticated;

grant select on table
  profiles,
  food_lists,
  places,
  saved_places,
  place_tags,
  comments,
  place_sources
to anon, authenticated;

grant insert, update on table profiles to authenticated;
grant insert on table food_lists, places, saved_places to authenticated;
grant delete on table saved_places to authenticated;

alter table profiles enable row level security;
alter table food_lists enable row level security;
alter table places enable row level security;
alter table saved_places enable row level security;
alter table place_tags enable row level security;
alter table comments enable row level security;
alter table place_sources enable row level security;

drop policy if exists "Demo profiles are readable" on profiles;
create policy "Demo profiles are readable"
on profiles
for select
to anon, authenticated
using (is_demo = true);

drop policy if exists "Users can read their own profile" on profiles;
create policy "Users can read their own profile"
on profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
on profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
on profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Demo food lists are readable" on food_lists;
create policy "Demo food lists are readable"
on food_lists
for select
to anon, authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = food_lists.owner_id
      and profiles.is_demo = true
  )
);

drop policy if exists "Users can read their own food lists" on food_lists;
create policy "Users can read their own food lists"
on food_lists
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can insert their default food list" on food_lists;
create policy "Users can insert their default food list"
on food_lists
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and list_key = 'default-saved-places'
);

drop policy if exists "Demo places are readable" on places;
create policy "Demo places are readable"
on places
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert visible canonical places" on places;
create policy "Authenticated users can insert visible canonical places"
on places
for insert
to authenticated
with check (
  source = 'locco_visible_place'
  and source_place_id = place_key
);

drop policy if exists "Demo saved places are readable" on saved_places;
create policy "Demo saved places are readable"
on saved_places
for select
to anon, authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = saved_places.user_id
      and profiles.is_demo = true
  )
);

drop policy if exists "Users can read their own saved places" on saved_places;
create policy "Users can read their own saved places"
on saved_places
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert saves into their own lists" on saved_places;
create policy "Users can insert saves into their own lists"
on saved_places
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from food_lists
    where food_lists.id = saved_places.list_id
      and food_lists.owner_id = auth.uid()
  )
);

drop policy if exists "Users can delete saves from their own lists" on saved_places;
create policy "Users can delete saves from their own lists"
on saved_places
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from food_lists
    where food_lists.id = saved_places.list_id
      and food_lists.owner_id = auth.uid()
  )
);

drop policy if exists "Demo place tags are readable" on place_tags;
create policy "Demo place tags are readable"
on place_tags
for select
to anon, authenticated
using (true);

drop policy if exists "Demo comments are readable" on comments;
create policy "Demo comments are readable"
on comments
for select
to anon, authenticated
using (true);

drop policy if exists "Demo place sources are readable" on place_sources;
create policy "Demo place sources are readable"
on place_sources
for select
to anon, authenticated
using (true);

-- No insert, update, or delete policies are included for the read-only MVP.
-- Add authenticated write policies later, after auth and RLS rules are designed.
