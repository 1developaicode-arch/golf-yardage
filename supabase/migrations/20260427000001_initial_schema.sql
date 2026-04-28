-- Master clubs list
CREATE TABLE clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('wood', 'hybrid', 'iron', 'wedge')),
  sort_order integer NOT NULL
);

-- User's bag
CREATE TABLE bag (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  club_id uuid REFERENCES clubs(id) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Shot history
CREATE TABLE shots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  club_id uuid REFERENCES clubs(id) NOT NULL,
  shot_type text NOT NULL CHECK (shot_type IN ('full', '3/4', '1/2', '1/4')),
  distance_yards numeric NOT NULL,
  dispersion_left numeric,
  dispersion_right numeric,
  created_at timestamptz DEFAULT now()
);

-- User settings (single row per user)
CREATE TABLE settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  units text DEFAULT 'yards' CHECK (units IN ('yards', 'meters')),
  track_dispersion boolean DEFAULT false,
  averaging_method text DEFAULT 'all' CHECK (averaging_method IN ('all', 'last_n', 'longest_n')),
  averaging_count integer DEFAULT 10,
  min_shots_threshold integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed master clubs list
INSERT INTO clubs (name, type, sort_order) VALUES
  ('Driver',    'wood',   1),
  ('3 Wood',    'wood',   2),
  ('5 Wood',    'wood',   3),
  ('7 Wood',    'wood',   4),
  ('2 Hybrid',  'hybrid', 5),
  ('3 Hybrid',  'hybrid', 6),
  ('4 Hybrid',  'hybrid', 7),
  ('5 Hybrid',  'hybrid', 8),
  ('3 Iron',    'iron',   9),
  ('4 Iron',    'iron',   10),
  ('5 Iron',    'iron',   11),
  ('6 Iron',    'iron',   12),
  ('7 Iron',    'iron',   13),
  ('8 Iron',    'iron',   14),
  ('9 Iron',    'iron',   15),
  ('PW',        'wedge',  16),
  ('GW',        'wedge',  17),
  ('SW',        'wedge',  18),
  ('LW',        'wedge',  19);
