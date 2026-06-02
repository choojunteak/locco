begin;

insert into profiles (id, username, display_name, avatar_initials, is_demo)
values
  ('user_you', 'you', 'You', 'You', true),
  ('user_annj', 'annj', 'Annj', 'AN', true),
  ('user_ryan', 'ryan', 'Ryan', 'RY', true),
  ('user_isabella', 'isabella', 'Isabella', 'IZ', true),
  ('user_josh', 'josh', 'Josh', 'JO', true)
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_initials = excluded.avatar_initials,
  is_demo = excluded.is_demo;

insert into friendships (id, requester_id, addressee_id, status)
values
  ('friend_you_annj', 'user_you', 'user_annj', 'accepted'),
  ('friend_you_ryan', 'user_you', 'user_ryan', 'accepted'),
  ('friend_you_isabella', 'user_you', 'user_isabella', 'accepted'),
  ('friend_you_josh', 'user_you', 'user_josh', 'accepted')
on conflict (id) do update set
  requester_id = excluded.requester_id,
  addressee_id = excluded.addressee_id,
  status = excluded.status;

insert into food_lists (id, owner_id, name, description, color, privacy)
values
  ('list_my', 'user_you', 'My Food List', 'Personal saves for weekday meals and weekend plans.', '#f36b4f', 'private'),
  ('list_annj', 'user_annj', 'Annj Noms Cafes', 'Aesthetic cafes, pastries, matcha, and study spots.', '#7bdcb5', 'friends'),
  ('list_ryan', 'user_ryan', 'Ryan''s Date Spots', 'Low-pressure dinner spots that feel a little special.', '#a78bfa', 'friends'),
  ('list_isabella', 'user_isabella', 'Isabella''s Dessert List', 'Desserts worth making a stop for.', '#ffb84d', 'friends'),
  ('list_josh', 'user_josh', 'Josh''s Cheap Eats', 'Good value meals near MRT stations.', '#60a5fa', 'friends')
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  privacy = excluded.privacy;

insert into places (
  id,
  name,
  address,
  postal_code,
  latitude,
  longitude,
  price_range,
  notes,
  normalized_key
)
values
  ('wild-honey', 'Wild Honey Mandarin Gallery', '333A Orchard Road, Mandarin Gallery, Singapore 238897', '238897', 1.30214, 103.83637, '$$$', 'Reliable brunch when Orchard plans get vague.', 'wild-honey-mandarin-gallery-238897'),
  ('matchaya-takashimaya', 'Matchaya Takashimaya', '391 Orchard Road, Ngee Ann City, Singapore 238872', '238872', 1.30257, 103.83459, '$$', 'Matcha soft serve is the move after dinner.', 'matchaya-takashimaya-238872'),
  ('surrey-hills-313', 'Surrey Hills Grocer 313', '313 Orchard Road, Singapore 238895', '238895', 1.30131, 103.83846, '$$$', 'Bright space, easier for groups than tiny cafes.', 'surrey-hills-grocer-313-238895'),
  ('five-guys-plaza-sing', 'Five Guys Plaza Singapura', '68 Orchard Road, Plaza Singapura, Singapore 238839', '238839', 1.3007, 103.84562, '$$', 'Not hawker-cheap, but easy and filling near Dhoby.', 'five-guys-plaza-singapura-238839'),
  ('bearded-bella', 'Bearded Bella', '8 Craig Road, Singapore 089668', '089668', 1.27826, 103.8424, '$$', 'Tanjong Pagar cafe with a cosy brunch feel.', 'bearded-bella-089668'),
  ('keisuke-tonkotsu', 'Ramen Keisuke Tonkotsu King', '1 Tras Link, Orchid Hotel, Singapore 078867', '078867', 1.27655, 103.8438, '$$', 'Strong ramen option right by Tanjong Pagar.', 'ramen-keisuke-tonkotsu-king-078867'),
  ('dumpling-darlings', 'Dumpling Darlings Amoy', '86 Amoy Street, Singapore 069905', '069905', 1.28099, 103.84704, '$$', 'Fun share plates and noodles around Telok Ayer.', 'dumpling-darlings-amoy-069905'),
  ('maxwell-tian-tian', 'Tian Tian Hainanese Chicken Rice', '1 Kadayanallur Street, Maxwell Food Centre, Singapore 069184', '069184', 1.2804, 103.84485, '$', 'Touristy, but still useful when someone asks for chicken rice.', 'tian-tian-hainanese-chicken-rice-069184'),
  ('apiary', 'Apiary', '84 Neil Road, Singapore 088844', '088844', 1.27914, 103.84151, '$$', 'Good ice cream after dinner around Chinatown/Tanjong Pagar.', 'apiary-088844'),
  ('brotherbird-bugis', 'Brotherbird Coffeehouse', '32 Bali Lane, Singapore 189868', '189868', 1.30062, 103.85937, '$$', 'Croissants and coffee near Bugis.', 'brotherbird-coffeehouse-189868'),
  ('zam-zam', 'Singapore Zam Zam', '697 North Bridge Road, Singapore 198675', '198675', 1.30218, 103.85919, '$', 'Murtabak near Bugis that handles groups well.', 'singapore-zam-zam-198675'),
  ('twenty-grammes', 'Twenty Grammes Bugis', '753 North Bridge Road, Singapore 198721', '198721', 1.30439, 103.85856, '$$', 'Dessert cafe for waffles and ice cream.', 'twenty-grammes-bugis-198721'),
  ('tongue-tip', 'Tongue Tip Lanzhou Beef Noodles Chinatown Point', '133 New Bridge Road, Chinatown Point, Singapore 059413', '059413', 1.28576, 103.84454, '$', 'Fast, warm, and close to Chinatown MRT.', 'tongue-tip-lanzhou-beef-noodles-chinatown-point-059413'),
  ('mei-heong-yuen', 'Mei Heong Yuen Dessert', '65-67 Temple Street, Singapore 058611', '058611', 1.28337, 103.84369, '$', 'Classic snow ice in Chinatown.', 'mei-heong-yuen-dessert-058611'),
  ('two-men-bagel', 'Two Men Bagel House Holland Village', '17D Lorong Liput, Singapore 277731', '277731', 1.31107, 103.79649, '$$', 'Big bagels when Holland Village plans need substance.', 'two-men-bagel-house-holland-village-277731'),
  ('project-acai-hv', 'Project Acai Holland Village', '27 Lorong Liput, Singapore 277738', '277738', 1.31143, 103.79677, '$$', 'Easy dessert near Holland Village MRT.', 'project-acai-holland-village-277738'),
  ('keong-saik-bakery', 'Keong Saik Bakery Chip Bee', '44 Jalan Merah Saga, Singapore 278116', '278116', 1.31187, 103.79479, '$$', 'Pastry stop slightly away from the loud part of HV.', 'keong-saik-bakery-chip-bee-278116'),
  ('obba-bbq-serangoon', 'Obba BBQ Serangoon Garden', '19 Maju Avenue, Singapore 556691', '556691', 1.36422, 103.86682, '$$$', 'Korean BBQ for group dinners.', 'obba-bbq-serangoon-garden-556691'),
  ('nex-food-republic', 'Food Republic NEX', '23 Serangoon Central, NEX, Singapore 556083', '556083', 1.35053, 103.87239, '$', 'Practical meetup point when people are coming from different lines.', 'food-republic-nex-556083'),
  ('hatter-street', 'Hatter Street Bakehouse', '212 Hougang Street 21, Singapore 530212', '530212', 1.35942, 103.88737, '$$', 'Dessert option near the Serangoon/Hougang side.', 'hatter-street-bakehouse-530212'),
  ('tamjai-tampines', 'TamJai SamGor Tampines Mall', '4 Tampines Central 5, Tampines Mall, Singapore 529510', '529510', 1.35245, 103.94482, '$', 'Fast spicy noodles by Tampines MRT.', 'tamjai-samgor-tampines-mall-529510'),
  ('fluff-stack-tampines', 'Fluff Stack Tampines 1', '10 Tampines Central 1, Tampines 1, Singapore 529536', '529536', 1.35409, 103.94515, '$$', 'Souffle pancakes when east-side dessert is needed.', 'fluff-stack-tampines-1-529536'),
  ('paris-baguette-tampines', 'Paris Baguette Tampines Mall', '4 Tampines Central 5, Tampines Mall, Singapore 529510', '529510', 1.35285, 103.94508, '$$', 'Simple bakery/cafe fallback.', 'paris-baguette-tampines-mall-529510')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  postal_code = excluded.postal_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  price_range = excluded.price_range,
  notes = excluded.notes,
  normalized_key = excluded.normalized_key;

insert into saved_places (id, list_id, place_id, user_id, status, rating)
values
  ('save_wild_honey_list_my', 'list_my', 'wild-honey', 'user_you', 'tried', 4.2),
  ('save_wild_honey_list_ryan', 'list_ryan', 'wild-honey', 'user_ryan', 'tried', 4.2),
  ('save_matchaya_takashimaya_list_isabella', 'list_isabella', 'matchaya-takashimaya', 'user_isabella', 'favourite', 4.6),
  ('save_matchaya_takashimaya_list_my', 'list_my', 'matchaya-takashimaya', 'user_you', 'favourite', 4.6),
  ('save_surrey_hills_313_list_annj', 'list_annj', 'surrey-hills-313', 'user_annj', 'want_to_try', 4.0),
  ('save_five_guys_plaza_sing_list_josh', 'list_josh', 'five-guys-plaza-sing', 'user_josh', 'tried', 3.9),
  ('save_bearded_bella_list_annj', 'list_annj', 'bearded-bella', 'user_annj', 'favourite', 4.5),
  ('save_bearded_bella_list_ryan', 'list_ryan', 'bearded-bella', 'user_ryan', 'favourite', 4.5),
  ('save_keisuke_tonkotsu_list_my', 'list_my', 'keisuke-tonkotsu', 'user_you', 'tried', 4.3),
  ('save_keisuke_tonkotsu_list_josh', 'list_josh', 'keisuke-tonkotsu', 'user_josh', 'tried', 4.3),
  ('save_dumpling_darlings_list_ryan', 'list_ryan', 'dumpling-darlings', 'user_ryan', 'favourite', 4.4),
  ('save_dumpling_darlings_list_my', 'list_my', 'dumpling-darlings', 'user_you', 'favourite', 4.4),
  ('save_maxwell_tian_tian_list_josh', 'list_josh', 'maxwell-tian-tian', 'user_josh', 'tried', 4.1),
  ('save_apiary_list_isabella', 'list_isabella', 'apiary', 'user_isabella', 'favourite', 4.7),
  ('save_apiary_list_ryan', 'list_ryan', 'apiary', 'user_ryan', 'favourite', 4.7),
  ('save_brotherbird_bugis_list_annj', 'list_annj', 'brotherbird-bugis', 'user_annj', 'favourite', 4.6),
  ('save_brotherbird_bugis_list_isabella', 'list_isabella', 'brotherbird-bugis', 'user_isabella', 'favourite', 4.6),
  ('save_zam_zam_list_josh', 'list_josh', 'zam-zam', 'user_josh', 'tried', 4.2),
  ('save_zam_zam_list_my', 'list_my', 'zam-zam', 'user_you', 'tried', 4.2),
  ('save_twenty_grammes_list_isabella', 'list_isabella', 'twenty-grammes', 'user_isabella', 'want_to_try', 4.0),
  ('save_tongue_tip_list_josh', 'list_josh', 'tongue-tip', 'user_josh', 'tried', 4.0),
  ('save_mei_heong_yuen_list_isabella', 'list_isabella', 'mei-heong-yuen', 'user_isabella', 'tried', 4.2),
  ('save_mei_heong_yuen_list_my', 'list_my', 'mei-heong-yuen', 'user_you', 'tried', 4.2),
  ('save_two_men_bagel_list_annj', 'list_annj', 'two-men-bagel', 'user_annj', 'favourite', 4.5),
  ('save_two_men_bagel_list_josh', 'list_josh', 'two-men-bagel', 'user_josh', 'favourite', 4.5),
  ('save_project_acai_hv_list_isabella', 'list_isabella', 'project-acai-hv', 'user_isabella', 'tried', 4.1),
  ('save_keong_saik_bakery_list_annj', 'list_annj', 'keong-saik-bakery', 'user_annj', 'want_to_try', 4.0),
  ('save_obba_bbq_serangoon_list_ryan', 'list_ryan', 'obba-bbq-serangoon', 'user_ryan', 'tried', 4.2),
  ('save_nex_food_republic_list_josh', 'list_josh', 'nex-food-republic', 'user_josh', 'tried', 3.8),
  ('save_nex_food_republic_list_my', 'list_my', 'nex-food-republic', 'user_you', 'tried', 3.8),
  ('save_hatter_street_list_isabella', 'list_isabella', 'hatter-street', 'user_isabella', 'favourite', 4.3),
  ('save_hatter_street_list_annj', 'list_annj', 'hatter-street', 'user_annj', 'favourite', 4.3),
  ('save_tamjai_tampines_list_josh', 'list_josh', 'tamjai-tampines', 'user_josh', 'tried', 4.0),
  ('save_fluff_stack_tampines_list_isabella', 'list_isabella', 'fluff-stack-tampines', 'user_isabella', 'want_to_try', 4.1),
  ('save_fluff_stack_tampines_list_annj', 'list_annj', 'fluff-stack-tampines', 'user_annj', 'want_to_try', 4.1),
  ('save_paris_baguette_tampines_list_annj', 'list_annj', 'paris-baguette-tampines', 'user_annj', 'tried', 3.7)
on conflict (list_id, place_id) do update set
  user_id = excluded.user_id,
  status = excluded.status,
  rating = excluded.rating;

with place_seed (place_id, categories, moods) as (
  values
    ('wild-honey', array['Cafe', 'Brunch'], array['Date Spot', 'Aesthetic', 'Near MRT']),
    ('matchaya-takashimaya', array['Dessert', 'Drinks'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('surrey-hills-313', array['Cafe', 'Brunch'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('five-guys-plaza-sing', array['Cheap Eats'], array['Good for Groups', 'Near MRT']),
    ('bearded-bella', array['Cafe', 'Brunch'], array['Aesthetic', 'Chill', 'Date Spot']),
    ('keisuke-tonkotsu', array['Japanese'], array['Comfort Food', 'Near MRT', 'Worth Queueing']),
    ('dumpling-darlings', array['Local'], array['Date Spot', 'Good for Groups', 'Comfort Food']),
    ('maxwell-tian-tian', array['Local', 'Cheap Eats'], array['Worth Queueing', 'Comfort Food', 'Near MRT']),
    ('apiary', array['Dessert', 'Ice Cream'], array['Chill', 'Date Spot', 'Hidden Gem']),
    ('brotherbird-bugis', array['Cafe', 'Bakery', 'Dessert'], array['Aesthetic', 'Worth Queueing', 'Chill']),
    ('zam-zam', array['Local', 'Cheap Eats'], array['Comfort Food', 'Late Night', 'Good for Groups']),
    ('twenty-grammes', array['Dessert', 'Ice Cream', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Chill']),
    ('tongue-tip', array['Local', 'Cheap Eats'], array['Solo Meal', 'Comfort Food', 'Near MRT']),
    ('mei-heong-yuen', array['Dessert', 'Local'], array['Comfort Food', 'Near MRT', 'Takeaway Friendly']),
    ('two-men-bagel', array['Cafe', 'Bakery', 'Brunch'], array['Good for Groups', 'Comfort Food', 'Near MRT']),
    ('project-acai-hv', array['Dessert'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('keong-saik-bakery', array['Cafe', 'Bakery'], array['Aesthetic', 'Study Cafe', 'Chill']),
    ('obba-bbq-serangoon', array['Korean'], array['Good for Groups', 'Date Spot', 'Comfort Food']),
    ('nex-food-republic', array['Local', 'Cheap Eats'], array['Good for Groups', 'Near MRT', 'Solo Meal']),
    ('hatter-street', array['Dessert', 'Bakery', 'Ice Cream'], array['Hidden Gem', 'Chill', 'Comfort Food']),
    ('tamjai-tampines', array['Cheap Eats'], array['Comfort Food', 'Solo Meal', 'Near MRT']),
    ('fluff-stack-tampines', array['Dessert', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('paris-baguette-tampines', array['Cafe', 'Bakery'], array['Study Cafe', 'Takeaway Friendly', 'Near MRT'])
)
insert into place_tags (id, place_id, tag, tag_type)
select
  'tag_' || place_id || '_category_' || regexp_replace(lower(tag), '[^a-z0-9]+', '_', 'g'),
  place_id,
  tag,
  'category'
from place_seed
cross join lateral unnest(categories) as tag
on conflict (place_id, tag, tag_type) do update set tag = excluded.tag;

with place_seed (place_id, categories, moods) as (
  values
    ('wild-honey', array['Cafe', 'Brunch'], array['Date Spot', 'Aesthetic', 'Near MRT']),
    ('matchaya-takashimaya', array['Dessert', 'Drinks'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('surrey-hills-313', array['Cafe', 'Brunch'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('five-guys-plaza-sing', array['Cheap Eats'], array['Good for Groups', 'Near MRT']),
    ('bearded-bella', array['Cafe', 'Brunch'], array['Aesthetic', 'Chill', 'Date Spot']),
    ('keisuke-tonkotsu', array['Japanese'], array['Comfort Food', 'Near MRT', 'Worth Queueing']),
    ('dumpling-darlings', array['Local'], array['Date Spot', 'Good for Groups', 'Comfort Food']),
    ('maxwell-tian-tian', array['Local', 'Cheap Eats'], array['Worth Queueing', 'Comfort Food', 'Near MRT']),
    ('apiary', array['Dessert', 'Ice Cream'], array['Chill', 'Date Spot', 'Hidden Gem']),
    ('brotherbird-bugis', array['Cafe', 'Bakery', 'Dessert'], array['Aesthetic', 'Worth Queueing', 'Chill']),
    ('zam-zam', array['Local', 'Cheap Eats'], array['Comfort Food', 'Late Night', 'Good for Groups']),
    ('twenty-grammes', array['Dessert', 'Ice Cream', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Chill']),
    ('tongue-tip', array['Local', 'Cheap Eats'], array['Solo Meal', 'Comfort Food', 'Near MRT']),
    ('mei-heong-yuen', array['Dessert', 'Local'], array['Comfort Food', 'Near MRT', 'Takeaway Friendly']),
    ('two-men-bagel', array['Cafe', 'Bakery', 'Brunch'], array['Good for Groups', 'Comfort Food', 'Near MRT']),
    ('project-acai-hv', array['Dessert'], array['Chill', 'Takeaway Friendly', 'Near MRT']),
    ('keong-saik-bakery', array['Cafe', 'Bakery'], array['Aesthetic', 'Study Cafe', 'Chill']),
    ('obba-bbq-serangoon', array['Korean'], array['Good for Groups', 'Date Spot', 'Comfort Food']),
    ('nex-food-republic', array['Local', 'Cheap Eats'], array['Good for Groups', 'Near MRT', 'Solo Meal']),
    ('hatter-street', array['Dessert', 'Bakery', 'Ice Cream'], array['Hidden Gem', 'Chill', 'Comfort Food']),
    ('tamjai-tampines', array['Cheap Eats'], array['Comfort Food', 'Solo Meal', 'Near MRT']),
    ('fluff-stack-tampines', array['Dessert', 'Cafe'], array['Aesthetic', 'Good for Groups', 'Near MRT']),
    ('paris-baguette-tampines', array['Cafe', 'Bakery'], array['Study Cafe', 'Takeaway Friendly', 'Near MRT'])
)
insert into place_tags (id, place_id, tag, tag_type)
select
  'tag_' || place_id || '_mood_' || regexp_replace(lower(tag), '[^a-z0-9]+', '_', 'g'),
  place_id,
  tag,
  'mood'
from place_seed
cross join lateral unnest(moods) as tag
on conflict (place_id, tag, tag_type) do update set tag = excluded.tag;

insert into comments (id, place_id, user_id, comment)
values
  ('comment_wild_honey_ryan', 'wild-honey', 'user_ryan', 'Feels casual but still date-safe.'),
  ('comment_matchaya_takashimaya_isabella', 'matchaya-takashimaya', 'user_isabella', 'Good Orchard dessert fallback.'),
  ('comment_surrey_hills_313_annj', 'surrey-hills-313', 'user_annj', 'Good when everyone wants cafe food.'),
  ('comment_five_guys_plaza_sing_josh', 'five-guys-plaza-sing', 'user_josh', 'Good when you need a zero-brain dinner.'),
  ('comment_bearded_bella_annj', 'bearded-bella', 'user_annj', 'Coffee and brunch plates are consistent.'),
  ('comment_keisuke_tonkotsu_you', 'keisuke-tonkotsu', 'user_you', 'Queue moves faster than expected.'),
  ('comment_dumpling_darlings_ryan', 'dumpling-darlings', 'user_ryan', 'Better for a casual date than formal dinner.'),
  ('comment_maxwell_tian_tian_josh', 'maxwell-tian-tian', 'user_josh', 'Go slightly off-peak.'),
  ('comment_apiary_isabella', 'apiary', 'user_isabella', 'Blue milk and pistachio are dependable.'),
  ('comment_brotherbird_bugis_annj', 'brotherbird-bugis', 'user_annj', 'Peak pastry list energy.'),
  ('comment_zam_zam_josh', 'zam-zam', 'user_josh', 'Best when everyone is hungry.'),
  ('comment_twenty_grammes_isabella', 'twenty-grammes', 'user_isabella', 'Good for late dessert cravings.'),
  ('comment_tongue_tip_josh', 'tongue-tip', 'user_josh', 'Good solo dinner.'),
  ('comment_mei_heong_yuen_isabella', 'mei-heong-yuen', 'user_isabella', 'Mango snow ice when the weather is rude.'),
  ('comment_two_men_bagel_annj', 'two-men-bagel', 'user_annj', 'Messy in the correct way.'),
  ('comment_project_acai_hv_isabella', 'project-acai-hv', 'user_isabella', 'Good when everyone wants something cold.'),
  ('comment_keong_saik_bakery_annj', 'keong-saik-bakery', 'user_annj', 'Nice for a slow afternoon.'),
  ('comment_obba_bbq_serangoon_ryan', 'obba-bbq-serangoon', 'user_ryan', 'Works when the date becomes a double date.'),
  ('comment_nex_food_republic_josh', 'nex-food-republic', 'user_josh', 'The reliable budget option.'),
  ('comment_hatter_street_isabella', 'hatter-street', 'user_isabella', 'Waffles are the reason to go.'),
  ('comment_tamjai_tampines_josh', 'tamjai-tampines', 'user_josh', 'Good after class or work.'),
  ('comment_fluff_stack_tampines_isabella', 'fluff-stack-tampines', 'user_isabella', 'Share pancakes unless everyone is committed.'),
  ('comment_paris_baguette_tampines_annj', 'paris-baguette-tampines', 'user_annj', 'Not special, but useful.')
on conflict (id) do update set
  place_id = excluded.place_id,
  user_id = excluded.user_id,
  comment = excluded.comment;

insert into place_sources (id, place_id, source_type, url)
values
  ('source_wild_honey_instagram', 'wild-honey', 'instagram', 'https://www.instagram.com/wildhoneysg/'),
  ('source_matchaya_takashimaya_instagram', 'matchaya-takashimaya', 'instagram', 'https://www.instagram.com/matchayasg/'),
  ('source_surrey_hills_313_manual', 'surrey-hills-313', 'manual', 'https://www.google.com/search?q=Surrey+Hills+Grocer+313'),
  ('source_five_guys_plaza_sing_manual', 'five-guys-plaza-sing', 'manual', 'https://www.google.com/search?q=Five+Guys+Plaza+Singapura'),
  ('source_bearded_bella_instagram', 'bearded-bella', 'instagram', 'https://www.instagram.com/beardedbella/'),
  ('source_keisuke_tonkotsu_manual', 'keisuke-tonkotsu', 'manual', 'https://www.google.com/search?q=Ramen+Keisuke+Tonkotsu+King'),
  ('source_dumpling_darlings_instagram', 'dumpling-darlings', 'instagram', 'https://www.instagram.com/dumpling.darlings/'),
  ('source_maxwell_tian_tian_manual', 'maxwell-tian-tian', 'manual', 'https://www.google.com/search?q=Tian+Tian+Chicken+Rice'),
  ('source_apiary_instagram', 'apiary', 'instagram', 'https://www.instagram.com/apiary.sg/'),
  ('source_brotherbird_bugis_instagram', 'brotherbird-bugis', 'instagram', 'https://www.instagram.com/brotherbird_bakehouse/'),
  ('source_zam_zam_manual', 'zam-zam', 'manual', 'https://www.google.com/search?q=Singapore+Zam+Zam'),
  ('source_twenty_grammes_instagram', 'twenty-grammes', 'instagram', 'https://www.instagram.com/twentygrammes/'),
  ('source_tongue_tip_manual', 'tongue-tip', 'manual', 'https://www.google.com/search?q=Tongue+Tip+Lanzhou+Beef+Noodles+Chinatown+Point'),
  ('source_mei_heong_yuen_manual', 'mei-heong-yuen', 'manual', 'https://www.google.com/search?q=Mei+Heong+Yuen+Dessert'),
  ('source_two_men_bagel_instagram', 'two-men-bagel', 'instagram', 'https://www.instagram.com/twomenbagelhouse/'),
  ('source_project_acai_hv_instagram', 'project-acai-hv', 'instagram', 'https://www.instagram.com/projectacai/'),
  ('source_keong_saik_bakery_instagram', 'keong-saik-bakery', 'instagram', 'https://www.instagram.com/keongsaikbakery/'),
  ('source_obba_bbq_serangoon_instagram', 'obba-bbq-serangoon', 'instagram', 'https://www.instagram.com/obbabbq.sg/'),
  ('source_nex_food_republic_manual', 'nex-food-republic', 'manual', 'https://www.google.com/search?q=Food+Republic+NEX'),
  ('source_hatter_street_instagram', 'hatter-street', 'instagram', 'https://www.instagram.com/hatterstreet/'),
  ('source_tamjai_tampines_manual', 'tamjai-tampines', 'manual', 'https://www.google.com/search?q=TamJai+SamGor+Tampines+Mall'),
  ('source_fluff_stack_tampines_instagram', 'fluff-stack-tampines', 'instagram', 'https://www.instagram.com/fluffstack/'),
  ('source_paris_baguette_tampines_manual', 'paris-baguette-tampines', 'manual', 'https://www.google.com/search?q=Paris+Baguette+Tampines+Mall')
on conflict (place_id, url) do update set
  source_type = excluded.source_type;

commit;
