ALTER TABLE settings
  ADD COLUMN shot_label_full text NOT NULL DEFAULT 'Full',
  ADD COLUMN shot_label_3q   text NOT NULL DEFAULT '3/4',
  ADD COLUMN shot_label_half text NOT NULL DEFAULT '1/2',
  ADD COLUMN shot_label_1q   text NOT NULL DEFAULT '1/4';
