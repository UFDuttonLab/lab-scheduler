## Goal
Clean up the AR Microbe Shooter: drop the on-screen bullseye (you can tap anywhere to shoot) and wipe the old, incorrectly-scored leaderboard entries.

## 1. Remove the crosshair
In `src/components/game/ARMicrobeCanvas.tsx` the render loop draws a white circle plus four tick marks at screen centre (the "Crosshair" block, lines ~911-926). Delete that block. Everything else stays: shooting already uses the tap coordinates, and the muzzle-flash beam still converges on the tap point (falling back to centre only when a tap position is unavailable).

## 2. Delete old AR scores
Confirmed in the database: `game_scores` holds 251 rows with `game_type = 'ar_microbe'`, of which 250 were created before today (2026-07-30 UTC); the newest is from today at 20:05 UTC.

Run a migration that deletes AR rows created before today:

```sql
DELETE FROM public.game_scores
WHERE game_type = 'ar_microbe'
  AND created_at < '2026-07-30T00:00:00Z';
```

This leaves the 1 score recorded today, and does not touch `microbe_blaster` or `zombie_lunch` scores. The deletion is permanent — there is no undo.

## Note
"Before today" is interpreted as before midnight UTC on 2026-07-30. Say the word if you want a different cutoff (e.g. delete every AR score including today's, or use US Eastern time).
