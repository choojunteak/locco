begin;

-- Demo/test fixture users for local and staging/testing only.
-- Do not run this seed against production.
--
-- profiles.id references auth.users(id), so matching demo/test Auth users
-- with these exact UUIDs must exist before this seed inserts profiles.
-- This seed intentionally does not insert into auth.users directly.
--
-- Deterministic demo/test Auth user IDs:
-- You:      11111111-1111-4111-8111-111111111111
-- Annj:     22222222-2222-4222-8222-222222222222
-- Ryan:     33333333-3333-4333-8333-333333333333
-- Isabella: 44444444-4444-4444-8444-444444444444
-- Josh:     55555555-5555-4555-8555-555555555555

insert into profiles (id, username, display_name, avatar_initials, is_demo)
values
  ('11111111-1111-4111-8111-111111111111', 'you', 'You', 'You', true),
  ('22222222-2222-4222-8222-222222222222', 'annj', 'Annj', 'AN', true),
  ('33333333-3333-4333-8333-333333333333', 'ryan', 'Ryan', 'RY', true),
  ('44444444-4444-4444-8444-444444444444', 'isabella', 'Isabella', 'IZ', true),
  ('55555555-5555-4555-8555-555555555555', 'josh', 'Josh', 'JO', true)
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_initials = excluded.avatar_initials,
  is_demo = excluded.is_demo;

with friendship_seed (id, requester_id, addressee_id, status) as (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'accepted'),
    ('30000000-0000-4000-8000-000000000002'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'accepted'),
    ('30000000-0000-4000-8000-000000000003'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'accepted'),
    ('30000000-0000-4000-8000-000000000004'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'accepted')
)
insert into friendships (id, requester_id, addressee_id, status)
select id, requester_id, addressee_id, status
from friendship_seed
on conflict (requester_id, addressee_id) do update set
  status = excluded.status;

with list_seed (list_key, id, owner_id, name, description, color, privacy) as (
  values
    ('list_my', '10000000-0000-4000-8000-000000000001'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'My Food List', 'Personal saves for weekday meals and weekend plans.', '#f36b4f', 'private'),
    ('list_annj', '10000000-0000-4000-8000-000000000002'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'Annj Noms Cafes', 'Aesthetic cafes, pastries, matcha, and study spots.', '#7bdcb5', 'friends'),
    ('list_ryan', '10000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Ryan''s Date Spots', 'Low-pressure dinner spots that feel a little special.', '#a78bfa', 'friends'),
    ('list_isabella', '10000000-0000-4000-8000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Isabella''s Dessert List', 'Desserts worth making a stop for.', '#ffb84d', 'friends'),
    ('list_josh', '10000000-0000-4000-8000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Josh''s Cheap Eats', 'Good value meals near MRT stations.', '#60a5fa', 'friends')
)
insert into food_lists (id, owner_id, name, description, color, privacy)
select id, owner_id, name, description, color, privacy
from list_seed
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  privacy = excluded.privacy;

with place_seed (
  id,
  place_key,
  name,
  address,
  postal_code,
  latitude,
  longitude,
  price_range,
  notes
) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'wild-honey-mandarin-gallery-238897', 'Wild Honey Mandarin Gallery', '333A Orchard Road, Mandarin Gallery, Singapore 238897', '238897', 1.30214, 103.83637, '$$$', 'Reliable brunch when Orchard plans get vague.'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'matchaya-takashimaya-238872', 'Matchaya Takashimaya', '391 Orchard Road, Ngee Ann City, Singapore 238872', '238872', 1.30257, 103.83459, '$$', 'Matcha soft serve is the move after dinner.'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'surrey-hills-grocer-313-238895', 'Surrey Hills Grocer 313', '313 Orchard Road, Singapore 238895', '238895', 1.30131, 103.83846, '$$$', 'Bright space, easier for groups than tiny cafes.'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'five-guys-plaza-singapura-238839', 'Five Guys Plaza Singapura', '68 Orchard Road, Plaza Singapura, Singapore 238839', '238839', 1.3007, 103.84562, '$$', 'Not hawker-cheap, but easy and filling near Dhoby.'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'bearded-bella-089668', 'Bearded Bella', '8 Craig Road, Singapore 089668', '089668', 1.27826, 103.8424, '$$', 'Tanjong Pagar cafe with a cosy brunch feel.'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'ramen-keisuke-tonkotsu-king-078867', 'Ramen Keisuke Tonkotsu King', '1 Tras Link, Orchid Hotel, Singapore 078867', '078867', 1.27655, 103.8438, '$$', 'Strong ramen option right by Tanjong Pagar.'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'dumpling-darlings-amoy-069905', 'Dumpling Darlings Amoy', '86 Amoy Street, Singapore 069905', '069905', 1.28099, 103.84704, '$$', 'Fun share plates and noodles around Telok Ayer.'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'tian-tian-hainanese-chicken-rice-069184', 'Tian Tian Hainanese Chicken Rice', '1 Kadayanallur Street, Maxwell Food Centre, Singapore 069184', '069184', 1.2804, 103.84485, '$', 'Touristy, but still useful when someone asks for chicken rice.'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'apiary-088844', 'Apiary', '84 Neil Road, Singapore 088844', '088844', 1.27914, 103.84151, '$$', 'Good ice cream after dinner around Chinatown/Tanjong Pagar.'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'brotherbird-coffeehouse-189868', 'Brotherbird Coffeehouse', '32 Bali Lane, Singapore 189868', '189868', 1.30062, 103.85937, '$$', 'Croissants and coffee near Bugis.'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'singapore-zam-zam-198675', 'Singapore Zam Zam', '697 North Bridge Road, Singapore 198675', '198675', 1.30218, 103.85919, '$', 'Murtabak near Bugis that handles groups well.'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'twenty-grammes-bugis-198721', 'Twenty Grammes Bugis', '753 North Bridge Road, Singapore 198721', '198721', 1.30439, 103.85856, '$$', 'Dessert cafe for waffles and ice cream.'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'tongue-tip-lanzhou-beef-noodles-chinatown-point-059413', 'Tongue Tip Lanzhou Beef Noodles Chinatown Point', '133 New Bridge Road, Chinatown Point, Singapore 059413', '059413', 1.28576, 103.84454, '$', 'Fast, warm, and close to Chinatown MRT.'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'mei-heong-yuen-dessert-058611', 'Mei Heong Yuen Dessert', '65-67 Temple Street, Singapore 058611', '058611', 1.28337, 103.84369, '$', 'Classic snow ice in Chinatown.'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'two-men-bagel-house-holland-village-277731', 'Two Men Bagel House Holland Village', '17D Lorong Liput, Singapore 277731', '277731', 1.31107, 103.79649, '$$', 'Big bagels when Holland Village plans need substance.'),
    ('20000000-0000-4000-8000-000000000016'::uuid, 'project-acai-holland-village-277738', 'Project Acai Holland Village', '27 Lorong Liput, Singapore 277738', '277738', 1.31143, 103.79677, '$$', 'Easy dessert near Holland Village MRT.'),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'keong-saik-bakery-chip-bee-278116', 'Keong Saik Bakery Chip Bee', '44 Jalan Merah Saga, Singapore 278116', '278116', 1.31187, 103.79479, '$$', 'Pastry stop slightly away from the loud part of HV.'),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'obba-bbq-serangoon-garden-556691', 'Obba BBQ Serangoon Garden', '19 Maju Avenue, Singapore 556691', '556691', 1.36422, 103.86682, '$$$', 'Korean BBQ for group dinners.'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'food-republic-nex-556083', 'Food Republic NEX', '23 Serangoon Central, NEX, Singapore 556083', '556083', 1.35053, 103.87239, '$', 'Practical meetup point when people are coming from different lines.'),
    ('20000000-0000-4000-8000-000000000020'::uuid, 'hatter-street-bakehouse-530212', 'Hatter Street Bakehouse', '212 Hougang Street 21, Singapore 530212', '530212', 1.35942, 103.88737, '$$', 'Dessert option near the Serangoon/Hougang side.'),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'tamjai-samgor-tampines-mall-529510', 'TamJai SamGor Tampines Mall', '4 Tampines Central 5, Tampines Mall, Singapore 529510', '529510', 1.35245, 103.94482, '$', 'Fast spicy noodles by Tampines MRT.'),
    ('20000000-0000-4000-8000-000000000022'::uuid, 'fluff-stack-tampines-1-529536', 'Fluff Stack Tampines 1', '10 Tampines Central 1, Tampines 1, Singapore 529536', '529536', 1.35409, 103.94515, '$$', 'Souffle pancakes when east-side dessert is needed.'),
    ('20000000-0000-4000-8000-000000000023'::uuid, 'paris-baguette-tampines-mall-529510', 'Paris Baguette Tampines Mall', '4 Tampines Central 5, Tampines Mall, Singapore 529510', '529510', 1.35285, 103.94508, '$$', 'Simple bakery/cafe fallback.')
)
insert into places (
  id,
  name,
  address,
  postal_code,
  latitude,
  longitude,
  price_range,
  notes,
  place_key,
  normalized_key,
  source,
  source_place_id
)
select
  id,
  name,
  address,
  postal_code,
  latitude,
  longitude,
  price_range,
  notes,
  place_key,
  place_key,
  'seed',
  place_key
from place_seed
on conflict (place_key) do update set
  name = excluded.name,
  address = excluded.address,
  postal_code = excluded.postal_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  price_range = excluded.price_range,
  notes = excluded.notes,
  normalized_key = excluded.normalized_key,
  source = excluded.source,
  source_place_id = excluded.source_place_id;

with
  list_seed (list_key, id) as (
    values
      ('list_my', '10000000-0000-4000-8000-000000000001'::uuid),
      ('list_annj', '10000000-0000-4000-8000-000000000002'::uuid),
      ('list_ryan', '10000000-0000-4000-8000-000000000003'::uuid),
      ('list_isabella', '10000000-0000-4000-8000-000000000004'::uuid),
      ('list_josh', '10000000-0000-4000-8000-000000000005'::uuid)
  ),
  save_seed (list_key, place_key, user_id, status, rating) as (
    values
      ('list_my', 'wild-honey-mandarin-gallery-238897', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 4.2),
      ('list_ryan', 'wild-honey-mandarin-gallery-238897', '33333333-3333-4333-8333-333333333333'::uuid, 'visited', 4.2),
      ('list_isabella', 'matchaya-takashimaya-238872', '44444444-4444-4444-8444-444444444444'::uuid, 'visited', 4.6),
      ('list_my', 'matchaya-takashimaya-238872', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 4.6),
      ('list_annj', 'surrey-hills-grocer-313-238895', '22222222-2222-4222-8222-222222222222'::uuid, 'want_to_try', 4.0),
      ('list_josh', 'five-guys-plaza-singapura-238839', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 3.9),
      ('list_annj', 'bearded-bella-089668', '22222222-2222-4222-8222-222222222222'::uuid, 'visited', 4.5),
      ('list_ryan', 'bearded-bella-089668', '33333333-3333-4333-8333-333333333333'::uuid, 'visited', 4.5),
      ('list_my', 'ramen-keisuke-tonkotsu-king-078867', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 4.3),
      ('list_josh', 'ramen-keisuke-tonkotsu-king-078867', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 4.3),
      ('list_ryan', 'dumpling-darlings-amoy-069905', '33333333-3333-4333-8333-333333333333'::uuid, 'visited', 4.4),
      ('list_my', 'dumpling-darlings-amoy-069905', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 4.4),
      ('list_josh', 'tian-tian-hainanese-chicken-rice-069184', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 4.1),
      ('list_isabella', 'apiary-088844', '44444444-4444-4444-8444-444444444444'::uuid, 'visited', 4.7),
      ('list_ryan', 'apiary-088844', '33333333-3333-4333-8333-333333333333'::uuid, 'visited', 4.7),
      ('list_annj', 'brotherbird-coffeehouse-189868', '22222222-2222-4222-8222-222222222222'::uuid, 'visited', 4.6),
      ('list_isabella', 'brotherbird-coffeehouse-189868', '44444444-4444-4444-8444-444444444444'::uuid, 'visited', 4.6),
      ('list_josh', 'singapore-zam-zam-198675', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 4.2),
      ('list_my', 'singapore-zam-zam-198675', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 4.2),
      ('list_isabella', 'twenty-grammes-bugis-198721', '44444444-4444-4444-8444-444444444444'::uuid, 'want_to_try', 4.0),
      ('list_josh', 'tongue-tip-lanzhou-beef-noodles-chinatown-point-059413', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 4.0),
      ('list_isabella', 'mei-heong-yuen-dessert-058611', '44444444-4444-4444-8444-444444444444'::uuid, 'visited', 4.2),
      ('list_my', 'mei-heong-yuen-dessert-058611', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 4.2),
      ('list_annj', 'two-men-bagel-house-holland-village-277731', '22222222-2222-4222-8222-222222222222'::uuid, 'visited', 4.5),
      ('list_josh', 'two-men-bagel-house-holland-village-277731', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 4.5),
      ('list_isabella', 'project-acai-holland-village-277738', '44444444-4444-4444-8444-444444444444'::uuid, 'visited', 4.1),
      ('list_annj', 'keong-saik-bakery-chip-bee-278116', '22222222-2222-4222-8222-222222222222'::uuid, 'want_to_try', 4.0),
      ('list_ryan', 'obba-bbq-serangoon-garden-556691', '33333333-3333-4333-8333-333333333333'::uuid, 'visited', 4.2),
      ('list_josh', 'food-republic-nex-556083', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 3.8),
      ('list_my', 'food-republic-nex-556083', '11111111-1111-4111-8111-111111111111'::uuid, 'visited', 3.8),
      ('list_isabella', 'hatter-street-bakehouse-530212', '44444444-4444-4444-8444-444444444444'::uuid, 'visited', 4.3),
      ('list_annj', 'hatter-street-bakehouse-530212', '22222222-2222-4222-8222-222222222222'::uuid, 'visited', 4.3),
      ('list_josh', 'tamjai-samgor-tampines-mall-529510', '55555555-5555-4555-8555-555555555555'::uuid, 'visited', 4.0),
      ('list_isabella', 'fluff-stack-tampines-1-529536', '44444444-4444-4444-8444-444444444444'::uuid, 'want_to_try', 4.1),
      ('list_annj', 'fluff-stack-tampines-1-529536', '22222222-2222-4222-8222-222222222222'::uuid, 'want_to_try', 4.1),
      ('list_annj', 'paris-baguette-tampines-mall-529510', '22222222-2222-4222-8222-222222222222'::uuid, 'visited', 3.7)
  )
insert into saved_places (list_id, place_id, user_id, status, rating)
select lists.id, places.id, save_seed.user_id, save_seed.status, save_seed.rating
from save_seed
join list_seed lists on lists.list_key = save_seed.list_key
join places on places.place_key = save_seed.place_key
on conflict (list_id, place_id) do update set
  user_id = excluded.user_id,
  status = excluded.status,
  rating = excluded.rating;

with place_seed (place_key, categories, moods) as (
  values
    ('wild-honey-mandarin-gallery-238897', array['Cafe', 'Brunch'], array['Date Spot', 'Aesthetic', 'Near MRT']),
    ('matchaya-takashimaya-238872', array['Dessert', 'Drinks'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('surrey-hills-grocer-313-238895', array['Cafe', 'Brunch'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('five-guys-plaza-singapura-238839', array['Cheap Eats'], array['Good for Groups', 'Near MRT']),
    ('bearded-bella-089668', array['Cafe', 'Brunch'], array['Aesthetic', 'Chill', 'Date Spot']),
    ('ramen-keisuke-tonkotsu-king-078867', array['Japanese'], array['Comfort Food', 'Near MRT', 'Worth Queueing']),
    ('dumpling-darlings-amoy-069905', array['Local'], array['Date Spot', 'Good for Groups', 'Comfort Food']),
    ('tian-tian-hainanese-chicken-rice-069184', array['Local', 'Cheap Eats'], array['Worth Queueing', 'Comfort Food', 'Near MRT']),
    ('apiary-088844', array['Dessert', 'Ice Cream'], array['Chill', 'Date Spot', 'Hidden Gem']),
    ('brotherbird-coffeehouse-189868', array['Cafe', 'Bakery', 'Dessert'], array['Aesthetic', 'Worth Queueing', 'Chill']),
    ('singapore-zam-zam-198675', array['Local', 'Cheap Eats'], array['Comfort Food', 'Late Night', 'Good for Groups']),
    ('twenty-grammes-bugis-198721', array['Dessert', 'Ice Cream', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Chill']),
    ('tongue-tip-lanzhou-beef-noodles-chinatown-point-059413', array['Local', 'Cheap Eats'], array['Solo Meal', 'Comfort Food', 'Near MRT']),
    ('mei-heong-yuen-dessert-058611', array['Dessert', 'Local'], array['Comfort Food', 'Near MRT', 'Takeaway Friendly']),
    ('two-men-bagel-house-holland-village-277731', array['Cafe', 'Bakery', 'Brunch'], array['Good for Groups', 'Comfort Food', 'Near MRT']),
    ('project-acai-holland-village-277738', array['Dessert'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('keong-saik-bakery-chip-bee-278116', array['Cafe', 'Bakery'], array['Aesthetic', 'Study Cafe', 'Chill']),
    ('obba-bbq-serangoon-garden-556691', array['Korean'], array['Good for Groups', 'Date Spot', 'Comfort Food']),
    ('food-republic-nex-556083', array['Local', 'Cheap Eats'], array['Good for Groups', 'Near MRT', 'Solo Meal']),
    ('hatter-street-bakehouse-530212', array['Dessert', 'Bakery', 'Ice Cream'], array['Hidden Gem', 'Chill', 'Comfort Food']),
    ('tamjai-samgor-tampines-mall-529510', array['Cheap Eats'], array['Comfort Food', 'Solo Meal', 'Near MRT']),
    ('fluff-stack-tampines-1-529536', array['Dessert', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('paris-baguette-tampines-mall-529510', array['Cafe', 'Bakery'], array['Study Cafe', 'Takeaway Friendly', 'Near MRT'])
)
insert into place_tags (place_id, tag, tag_type)
select
  places.id,
  tag,
  'category'
from place_seed
join places on places.place_key = place_seed.place_key
cross join lateral unnest(categories) as tag
on conflict (place_id, tag, tag_type) do update set tag = excluded.tag;

with place_seed (place_key, categories, moods) as (
  values
    ('wild-honey-mandarin-gallery-238897', array['Cafe', 'Brunch'], array['Date Spot', 'Aesthetic', 'Near MRT']),
    ('matchaya-takashimaya-238872', array['Dessert', 'Drinks'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('surrey-hills-grocer-313-238895', array['Cafe', 'Brunch'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('five-guys-plaza-singapura-238839', array['Cheap Eats'], array['Good for Groups', 'Near MRT']),
    ('bearded-bella-089668', array['Cafe', 'Brunch'], array['Aesthetic', 'Chill', 'Date Spot']),
    ('ramen-keisuke-tonkotsu-king-078867', array['Japanese'], array['Comfort Food', 'Near MRT', 'Worth Queueing']),
    ('dumpling-darlings-amoy-069905', array['Local'], array['Date Spot', 'Good for Groups', 'Comfort Food']),
    ('tian-tian-hainanese-chicken-rice-069184', array['Local', 'Cheap Eats'], array['Worth Queueing', 'Comfort Food', 'Near MRT']),
    ('apiary-088844', array['Dessert', 'Ice Cream'], array['Chill', 'Date Spot', 'Hidden Gem']),
    ('brotherbird-coffeehouse-189868', array['Cafe', 'Bakery', 'Dessert'], array['Aesthetic', 'Worth Queueing', 'Chill']),
    ('singapore-zam-zam-198675', array['Local', 'Cheap Eats'], array['Comfort Food', 'Late Night', 'Good for Groups']),
    ('twenty-grammes-bugis-198721', array['Dessert', 'Ice Cream', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Chill']),
    ('tongue-tip-lanzhou-beef-noodles-chinatown-point-059413', array['Local', 'Cheap Eats'], array['Solo Meal', 'Comfort Food', 'Near MRT']),
    ('mei-heong-yuen-dessert-058611', array['Dessert', 'Local'], array['Comfort Food', 'Near MRT', 'Takeaway Friendly']),
    ('two-men-bagel-house-holland-village-277731', array['Cafe', 'Bakery', 'Brunch'], array['Good for Groups', 'Comfort Food', 'Near MRT']),
    ('project-acai-holland-village-277738', array['Dessert'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('keong-saik-bakery-chip-bee-278116', array['Cafe', 'Bakery'], array['Aesthetic', 'Study Cafe', 'Chill']),
    ('obba-bbq-serangoon-garden-556691', array['Korean'], array['Good for Groups', 'Date Spot', 'Comfort Food']),
    ('food-republic-nex-556083', array['Local', 'Cheap Eats'], array['Good for Groups', 'Near MRT', 'Solo Meal']),
    ('hatter-street-bakehouse-530212', array['Dessert', 'Bakery', 'Ice Cream'], array['Hidden Gem', 'Chill', 'Comfort Food']),
    ('tamjai-samgor-tampines-mall-529510', array['Cheap Eats'], array['Comfort Food', 'Solo Meal', 'Near MRT']),
    ('fluff-stack-tampines-1-529536', array['Dessert', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('paris-baguette-tampines-mall-529510', array['Cafe', 'Bakery'], array['Study Cafe', 'Takeaway Friendly', 'Near MRT'])
)
insert into place_tags (place_id, tag, tag_type)
select
  places.id,
  tag,
  'mood'
from place_seed
join places on places.place_key = place_seed.place_key
cross join lateral unnest(moods) as tag
on conflict (place_id, tag, tag_type) do update set tag = excluded.tag;

with comment_seed (id, place_key, user_id, comment) as (
  values
    ('40000000-0000-4000-8000-000000000001'::uuid, 'wild-honey-mandarin-gallery-238897', '33333333-3333-4333-8333-333333333333'::uuid, 'Feels casual but still date-safe.'),
    ('40000000-0000-4000-8000-000000000002'::uuid, 'matchaya-takashimaya-238872', '44444444-4444-4444-8444-444444444444'::uuid, 'Good Orchard dessert fallback.'),
    ('40000000-0000-4000-8000-000000000003'::uuid, 'surrey-hills-grocer-313-238895', '22222222-2222-4222-8222-222222222222'::uuid, 'Good when everyone wants cafe food.'),
    ('40000000-0000-4000-8000-000000000004'::uuid, 'five-guys-plaza-singapura-238839', '55555555-5555-4555-8555-555555555555'::uuid, 'Good when you need a zero-brain dinner.'),
    ('40000000-0000-4000-8000-000000000005'::uuid, 'bearded-bella-089668', '22222222-2222-4222-8222-222222222222'::uuid, 'Coffee and brunch plates are consistent.'),
    ('40000000-0000-4000-8000-000000000006'::uuid, 'ramen-keisuke-tonkotsu-king-078867', '11111111-1111-4111-8111-111111111111'::uuid, 'Queue moves faster than expected.'),
    ('40000000-0000-4000-8000-000000000007'::uuid, 'dumpling-darlings-amoy-069905', '33333333-3333-4333-8333-333333333333'::uuid, 'Better for a casual date than formal dinner.'),
    ('40000000-0000-4000-8000-000000000008'::uuid, 'tian-tian-hainanese-chicken-rice-069184', '55555555-5555-4555-8555-555555555555'::uuid, 'Go slightly off-peak.'),
    ('40000000-0000-4000-8000-000000000009'::uuid, 'apiary-088844', '44444444-4444-4444-8444-444444444444'::uuid, 'Blue milk and pistachio are dependable.'),
    ('40000000-0000-4000-8000-000000000010'::uuid, 'brotherbird-coffeehouse-189868', '22222222-2222-4222-8222-222222222222'::uuid, 'Peak pastry list energy.'),
    ('40000000-0000-4000-8000-000000000011'::uuid, 'singapore-zam-zam-198675', '55555555-5555-4555-8555-555555555555'::uuid, 'Best when everyone is hungry.'),
    ('40000000-0000-4000-8000-000000000012'::uuid, 'twenty-grammes-bugis-198721', '44444444-4444-4444-8444-444444444444'::uuid, 'Good for late dessert cravings.'),
    ('40000000-0000-4000-8000-000000000013'::uuid, 'tongue-tip-lanzhou-beef-noodles-chinatown-point-059413', '55555555-5555-4555-8555-555555555555'::uuid, 'Good solo dinner.'),
    ('40000000-0000-4000-8000-000000000014'::uuid, 'mei-heong-yuen-dessert-058611', '44444444-4444-4444-8444-444444444444'::uuid, 'Mango snow ice when the weather is rude.'),
    ('40000000-0000-4000-8000-000000000015'::uuid, 'two-men-bagel-house-holland-village-277731', '22222222-2222-4222-8222-222222222222'::uuid, 'Messy in the correct way.'),
    ('40000000-0000-4000-8000-000000000016'::uuid, 'project-acai-holland-village-277738', '44444444-4444-4444-8444-444444444444'::uuid, 'Good when everyone wants something cold.'),
    ('40000000-0000-4000-8000-000000000017'::uuid, 'keong-saik-bakery-chip-bee-278116', '22222222-2222-4222-8222-222222222222'::uuid, 'Nice for a slow afternoon.'),
    ('40000000-0000-4000-8000-000000000018'::uuid, 'obba-bbq-serangoon-garden-556691', '33333333-3333-4333-8333-333333333333'::uuid, 'Works when the date becomes a double date.'),
    ('40000000-0000-4000-8000-000000000019'::uuid, 'food-republic-nex-556083', '55555555-5555-4555-8555-555555555555'::uuid, 'The reliable budget option.'),
    ('40000000-0000-4000-8000-000000000020'::uuid, 'hatter-street-bakehouse-530212', '44444444-4444-4444-8444-444444444444'::uuid, 'Waffles are the reason to go.'),
    ('40000000-0000-4000-8000-000000000021'::uuid, 'tamjai-samgor-tampines-mall-529510', '55555555-5555-4555-8555-555555555555'::uuid, 'Good after class or work.'),
    ('40000000-0000-4000-8000-000000000022'::uuid, 'fluff-stack-tampines-1-529536', '44444444-4444-4444-8444-444444444444'::uuid, 'Share pancakes unless everyone is committed.'),
    ('40000000-0000-4000-8000-000000000023'::uuid, 'paris-baguette-tampines-mall-529510', '22222222-2222-4222-8222-222222222222'::uuid, 'Not special, but useful.')
)
insert into comments (id, place_id, user_id, comment)
select comment_seed.id, places.id, comment_seed.user_id, comment_seed.comment
from comment_seed
join places on places.place_key = comment_seed.place_key
on conflict (id) do update set
  place_id = excluded.place_id,
  user_id = excluded.user_id,
  comment = excluded.comment;

with source_seed (place_key, source_type, url) as (
  values
    ('wild-honey-mandarin-gallery-238897', 'instagram', 'https://www.instagram.com/wildhoneysg/'),
    ('matchaya-takashimaya-238872', 'instagram', 'https://www.instagram.com/matchayasg/'),
    ('surrey-hills-grocer-313-238895', 'manual', 'https://www.google.com/search?q=Surrey+Hills+Grocer+313'),
    ('five-guys-plaza-singapura-238839', 'manual', 'https://www.google.com/search?q=Five+Guys+Plaza+Singapura'),
    ('bearded-bella-089668', 'instagram', 'https://www.instagram.com/beardedbella/'),
    ('ramen-keisuke-tonkotsu-king-078867', 'manual', 'https://www.google.com/search?q=Ramen+Keisuke+Tonkotsu+King'),
    ('dumpling-darlings-amoy-069905', 'instagram', 'https://www.instagram.com/dumpling.darlings/'),
    ('tian-tian-hainanese-chicken-rice-069184', 'manual', 'https://www.google.com/search?q=Tian+Tian+Chicken+Rice'),
    ('apiary-088844', 'instagram', 'https://www.instagram.com/apiary.sg/'),
    ('brotherbird-coffeehouse-189868', 'instagram', 'https://www.instagram.com/brotherbird_bakehouse/'),
    ('singapore-zam-zam-198675', 'manual', 'https://www.google.com/search?q=Singapore+Zam+Zam'),
    ('twenty-grammes-bugis-198721', 'instagram', 'https://www.instagram.com/twentygrammes/'),
    ('tongue-tip-lanzhou-beef-noodles-chinatown-point-059413', 'manual', 'https://www.google.com/search?q=Tongue+Tip+Lanzhou+Beef+Noodles+Chinatown+Point'),
    ('mei-heong-yuen-dessert-058611', 'manual', 'https://www.google.com/search?q=Mei+Heong+Yuen+Dessert'),
    ('two-men-bagel-house-holland-village-277731', 'instagram', 'https://www.instagram.com/twomenbagelhouse/'),
    ('project-acai-holland-village-277738', 'instagram', 'https://www.instagram.com/projectacai/'),
    ('keong-saik-bakery-chip-bee-278116', 'instagram', 'https://www.instagram.com/keongsaikbakery/'),
    ('obba-bbq-serangoon-garden-556691', 'instagram', 'https://www.instagram.com/obbabbq.sg/'),
    ('food-republic-nex-556083', 'manual', 'https://www.google.com/search?q=Food+Republic+NEX'),
    ('hatter-street-bakehouse-530212', 'instagram', 'https://www.instagram.com/hatterstreet/'),
    ('tamjai-samgor-tampines-mall-529510', 'manual', 'https://www.google.com/search?q=TamJai+SamGor+Tampines+Mall'),
    ('fluff-stack-tampines-1-529536', 'instagram', 'https://www.instagram.com/fluffstack/'),
    ('paris-baguette-tampines-mall-529510', 'manual', 'https://www.google.com/search?q=Paris+Baguette+Tampines+Mall')
)
insert into place_sources (place_id, source_type, url)
select places.id, source_seed.source_type, source_seed.url
from source_seed
join places on places.place_key = source_seed.place_key
on conflict (place_id, url) do update set
  source_type = excluded.source_type;

commit;
