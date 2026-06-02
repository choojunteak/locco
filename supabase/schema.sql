create extension if not exists "pgcrypto";

create table if not exists profiles (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  display_name text not null,
  avatar_initials text not null,
  avatar_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists friendships (
  id text primary key default gen_random_uuid()::text,
  requester_id text not null references profiles(id) on delete cascade,
  addressee_id text not null references profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists food_lists (
  id text primary key default gen_random_uuid()::text,
  owner_id text not null references profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#f36b4f',
  privacy text not null default 'friends' check (privacy in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);

create table if not exists places (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  address text not null,
  postal_code text,
  latitude double precision not null,
  longitude double precision not null,
  price_range text not null check (price_range in ('$', '$$', '$$$', '$$$$')),
  notes text not null default '',
  normalized_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists saved_places (
  id text primary key default gen_random_uuid()::text,
  list_id text not null references food_lists(id) on delete cascade,
  place_id text not null references places(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  note text,
  status text not null default 'want_to_try' check (status in ('want_to_try', 'tried', 'favourite')),
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  created_at timestamptz not null default now(),
  unique (list_id, place_id)
);

create table if not exists place_tags (
  id text primary key default gen_random_uuid()::text,
  place_id text not null references places(id) on delete cascade,
  tag text not null,
  tag_type text not null check (tag_type in ('category', 'mood')),
  unique (place_id, tag, tag_type)
);

create table if not exists comments (
  id text primary key default gen_random_uuid()::text,
  place_id text not null references places(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists place_sources (
  id text primary key default gen_random_uuid()::text,
  place_id text not null references places(id) on delete cascade,
  source_type text not null check (source_type in ('tiktok', 'instagram', 'website', 'manual', 'other')),
  url text not null,
  created_at timestamptz not null default now(),
  unique (place_id, url)
);

create index if not exists idx_places_lat_lng on places(latitude, longitude);
create index if not exists idx_food_lists_owner_id on food_lists(owner_id);
create index if not exists idx_saved_places_list_id on saved_places(list_id);
create index if not exists idx_saved_places_place_id on saved_places(place_id);
create index if not exists idx_saved_places_user_id on saved_places(user_id);
create index if not exists idx_place_tags_place_id on place_tags(place_id);
create index if not exists idx_place_tags_tag on place_tags(tag);
create index if not exists idx_comments_place_id on comments(place_id);
create index if not exists idx_place_sources_place_id on place_sources(place_id);

-- Suggested RLS direction for later, after authentication is connected:
-- alter table profiles enable row level security;
-- alter table friendships enable row level security;
-- alter table food_lists enable row level security;
-- alter table places enable row level security;
-- alter table saved_places enable row level security;
-- alter table place_tags enable row level security;
-- alter table comments enable row level security;
-- alter table place_sources enable row level security;
--
-- Policy ideas:
-- 1. Users can read public lists.
-- 2. Users can read friends-only lists when an accepted friendship exists.
-- 3. Users can insert/update/delete their own lists and saved_places rows.
-- 4. Places, place_tags, and place_sources can be read by authenticated users.
-- 5. Comments can be managed by their author.
-- 6. Service-role-only maintenance should stay server-side and never use the anon key.
