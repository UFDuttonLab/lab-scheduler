-- Add game_type column to game_scores table
ALTER TABLE game_scores 
ADD COLUMN game_type text NOT NULL DEFAULT 'microbe_blaster';