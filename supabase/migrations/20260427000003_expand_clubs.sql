-- Renumber sort orders to allow gaps for future insertions
UPDATE clubs SET sort_order = sort_order * 10;

-- Add 9 Wood (between 7 Wood=40 and 2 Hybrid=50 → use 45)
INSERT INTO clubs (name, type, sort_order) VALUES
  ('9 Wood', 'wood', 45);

-- Add degree wedges (after LW=190)
INSERT INTO clubs (name, type, sort_order) VALUES
  ('46°', 'wedge', 200),
  ('48°', 'wedge', 210),
  ('50°', 'wedge', 220),
  ('52°', 'wedge', 230),
  ('54°', 'wedge', 240),
  ('56°', 'wedge', 250),
  ('58°', 'wedge', 260),
  ('60°', 'wedge', 270);

-- Custom clubs table
CREATE TABLE custom_clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'iron' CHECK (type IN ('wood', 'hybrid', 'iron', 'wedge')),
  created_at timestamptz DEFAULT now()
);
