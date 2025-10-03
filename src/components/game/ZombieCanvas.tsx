import { useRef, useEffect, useState, useCallback } from "react";
import { PowerUp } from "./PowerUp";

interface Zombie {
  id: number;
  x: number;
  y: number;
  type: "walker" | "runner" | "tank" | "golden";
  health: number;
  maxHealth: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface PowerUpType {
  id: number;
  x: number;
  y: number;
  type: "freeze" | "rapid" | "double" | "shield";
  icon: string;
}

interface ZombieCanvasProps {
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onComboUpdate: (combo: number) => void;
  onZombiesKilledUpdate: (count: number) => void;
  onTotalClicksUpdate: (count: number) => void;
  onGameOver: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;
const LUNCH_BAG_SIZE = 40;

export const ZombieCanvas = ({
  onScoreUpdate,
  onLivesUpdate,
  onComboUpdate,
  onZombiesKilledUpdate,
  onTotalClicksUpdate,
  onGameOver,
}: ZombieCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpType[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [zombiesKilled, setZombiesKilled] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [nextZombieId, setNextZombieId] = useState(0);
  const [nextPowerUpId, setNextPowerUpId] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerUpEndTime, setPowerUpEndTime] = useState(0);

  const comboTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const lastPowerUpSpawnRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const getZombieType = useCallback((time: number): Zombie["type"] => {
    const rand = Math.random();
    if (rand < 0.05) return "golden";
    if (time > 120 && rand < 0.25) return "tank";
    if (time > 60 && rand < 0.4) return "runner";
    return "walker";
  }, []);

  const createZombie = useCallback((type: Zombie["type"], id: number): Zombie => {
    const config = {
      walker: { health: 1, size: 30, color: "#22c55e", speed: 0.6, points: 10 },
      runner: { health: 1, size: 25, color: "#3b82f6", speed: 1.4, points: 25 },
      tank: { health: 3, size: 40, color: "#ef4444", speed: 0.3, points: 50 },
      golden: { health: 2, size: 28, color: "#fbbf24", speed: 1.0, points: 100 },
    }[type];

    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    
    switch (edge) {
      case 0: // top
        x = Math.random() * CANVAS_WIDTH;
        y = 0;
        break;
      case 1: // right
        x = CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
        break;
      case 2: // bottom
        x = Math.random() * CANVAS_WIDTH;
        y = CANVAS_HEIGHT;
        break;
      case 3: // left
        x = 0;
        y = Math.random() * CANVAS_HEIGHT;
        break;
    }

    const angle = Math.atan2(CENTER_Y - y, CENTER_X - x);

    return {
      id,
      x,
      y,
      type,
      health: config.health,
      maxHealth: config.health,
      size: config.size,
      color: config.color,
      speed: config.speed,
      angle,
    };
  }, []);

  const spawnZombie = useCallback(() => {
    const type = getZombieType(gameTime);
    const newZombie = createZombie(type, nextZombieId);
    setZombies((prev) => [...prev, newZombie]);
    setNextZombieId((prev) => prev + 1);
  }, [gameTime, nextZombieId, getZombieType, createZombie]);

  const spawnPowerUp = useCallback(() => {
    const types: PowerUpType["type"][] = ["freeze", "rapid", "double", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    const icons = { freeze: "❄️", rapid: "⚡", double: "✨", shield: "🛡️" };
    
    const powerUp: PowerUpType = {
      id: nextPowerUpId,
      x: 100 + Math.random() * (CANVAS_WIDTH - 200),
      y: 100 + Math.random() * (CANVAS_HEIGHT - 200),
      type,
      icon: icons[type],
    };

    setPowerUps((prev) => [...prev, powerUp]);
    setNextPowerUpId((prev) => prev + 1);
  }, [nextPowerUpId]);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        color,
        size: 4 + Math.random() * 4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    setTotalClicks((prev) => {
      const newTotal = prev + 1;
      onTotalClicksUpdate(newTotal);
      return newTotal;
    });

    // Check power-up collision
    const hitPowerUp = powerUps.find((powerUp) => {
      const dx = clickX - powerUp.x;
      const dy = clickY - powerUp.y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });

    if (hitPowerUp) {
      setPowerUps((prev) => prev.filter((p) => p.id !== hitPowerUp.id));
      setActivePowerUp(hitPowerUp.type);
      const duration = hitPowerUp.type === "double" ? 12000 : hitPowerUp.type === "freeze" ? 10000 : 8000;
      setPowerUpEndTime(Date.now() + duration);
      createParticles(hitPowerUp.x, hitPowerUp.y, "#fbbf24", 12);
      return;
    }

    const isRapidFire = activePowerUp === "rapid";

    setZombies((prevZombies) => {
      let hitZombie: Zombie | undefined;
      
      if (isRapidFire) {
        // Rapid fire hits closest zombie
        hitZombie = prevZombies.reduce((closest, zombie) => {
          const dx = clickX - zombie.x;
          const dy = clickY - zombie.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const closestDx = clickX - closest.x;
          const closestDy = clickY - closest.y;
          const closestDist = Math.sqrt(closestDx * closestDx + closestDy * closestDy);
          return dist < closestDist ? zombie : closest;
        }, prevZombies[0]);
      } else {
        hitZombie = prevZombies.find((zombie) => {
          const dx = clickX - zombie.x;
          const dy = clickY - zombie.y;
          return Math.sqrt(dx * dx + dy * dy) < zombie.size;
        });
      }

      if (hitZombie) {
        const newHealth = hitZombie.health - 1;
        
        if (newHealth <= 0) {
          createParticles(hitZombie.x, hitZombie.y, hitZombie.color);
          
          const basePoints = {
            walker: 10,
            runner: 25,
            tank: 50,
            golden: 100,
          }[hitZombie.type];

          setCombo((prevCombo) => {
            const newCombo = prevCombo + 1;
            const multiplier = Math.min(Math.floor(newCombo / 5) + 1, 5);
            const points = basePoints * multiplier * (activePowerUp === "double" ? 2 : 1);
            
            setScore((prevScore) => {
              const newScore = prevScore + points;
              onScoreUpdate(newScore);
              return newScore;
            });

            onComboUpdate(newCombo);

            if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
            comboTimeoutRef.current = setTimeout(() => {
              setCombo(0);
              onComboUpdate(0);
            }, 2000);

            return newCombo;
          });

          setZombiesKilled((prev) => {
            const newCount = prev + 1;
            onZombiesKilledUpdate(newCount);
            return newCount;
          });

          return prevZombies.filter((z) => z.id !== hitZombie.id);
        } else {
          return prevZombies.map((z) =>
            z.id === hitZombie.id ? { ...z, health: newHealth } : z
          );
        }
      }

      setCombo(0);
      onComboUpdate(0);
      return prevZombies;
    });
  }, [powerUps, activePowerUp, onScoreUpdate, onComboUpdate, onZombiesKilledUpdate, onTotalClicksUpdate, createParticles]);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    setGameTime(elapsed);

    // Check if power-up expired
    if (activePowerUp && now > powerUpEndTime) {
      setActivePowerUp(null);
    }

    // Spawn zombies
    const spawnRate = Math.max(1500 - elapsed * 20, 600);
    if (now - lastSpawnRef.current > spawnRate) {
      const maxZombies = Math.min(4 + Math.floor(elapsed / 30), 12);
      if (zombies.length < maxZombies) {
        spawnZombie();
      }
      lastSpawnRef.current = now;
    }

    // Spawn power-ups
    if (now - lastPowerUpSpawnRef.current > 25000 + Math.random() * 15000) {
      if (powerUps.length < 2) {
        spawnPowerUp();
      }
      lastPowerUpSpawnRef.current = now;
    }

    const isFrozen = activePowerUp === "freeze";

    setZombies((prev) => {
      const reachedLunch: Zombie[] = [];
      const remainingZombies = prev.filter((zombie) => {
        if (!isFrozen) {
          // Update angle to always face lunch bag
          zombie.angle = Math.atan2(CENTER_Y - zombie.y, CENTER_X - zombie.x);
          zombie.x += Math.cos(zombie.angle) * zombie.speed;
          zombie.y += Math.sin(zombie.angle) * zombie.speed;
        }

        const dx = zombie.x - CENTER_X;
        const dy = zombie.y - CENTER_Y;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distanceFromCenter < LUNCH_BAG_SIZE) {
          reachedLunch.push(zombie);
          return false;
        }
        return true;
      });

      if (reachedLunch.length > 0 && activePowerUp !== "shield") {
        setLives((prevLives) => {
          const newLives = Math.max(0, prevLives - reachedLunch.length);
          onLivesUpdate(newLives);
          if (newLives === 0) {
            onGameOver();
          }
          return newLives;
        });
      }

      return remainingZombies;
    });

    // Update particles
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 1,
          vy: p.vy + 0.1,
        }))
        .filter((p) => p.life > 0)
    );

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [zombies, powerUps, activePowerUp, powerUpEndTime, spawnZombie, spawnPowerUp, onLivesUpdate, onGameOver]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw dark spooky background
    const gradient = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, CANVAS_WIDTH / 2);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#0f0f1e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw distance rings
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    [100, 200, 300].forEach(radius => {
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw lunch bag at center
    ctx.save();
    ctx.translate(CENTER_X, CENTER_Y);
    
    // Lunch bag glow
    const lunchGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, LUNCH_BAG_SIZE * 1.5);
    lunchGlow.addColorStop(0, "rgba(251, 191, 36, 0.3)");
    lunchGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = lunchGlow;
    ctx.beginPath();
    ctx.arc(0, 0, LUNCH_BAG_SIZE * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🍱", 0, 0);
    ctx.restore();

    // Draw zombies
    zombies.forEach((zombie) => {
      ctx.save();
      ctx.translate(zombie.x, zombie.y);

      // Draw zombie body
      ctx.fillStyle = zombie.color;
      ctx.beginPath();
      ctx.arc(0, 0, zombie.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw zombie emoji
      ctx.font = `${zombie.size * 1.5}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const zombieEmoji = {
        walker: "🧟",
        runner: "🧟‍♂️",
        tank: "🧟‍♀️",
        golden: "👻",
      }[zombie.type];
      ctx.fillText(zombieEmoji, 0, 0);

      // Draw health bar for tanks
      if (zombie.type === "tank") {
        const healthBarWidth = zombie.size * 1.5;
        const healthBarHeight = 4;
        const healthPercentage = zombie.health / zombie.maxHealth;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(-healthBarWidth / 2, zombie.size + 5, healthBarWidth, healthBarHeight);

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-healthBarWidth / 2, zombie.size + 5, healthBarWidth * healthPercentage, healthBarHeight);
      }

      ctx.restore();
    });

    // Draw power-ups
    powerUps.forEach((powerUp) => {
      ctx.save();
      ctx.translate(powerUp.x, powerUp.y);

      const powerUpGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      powerUpGlow.addColorStop(0, "rgba(251, 191, 36, 0.5)");
      powerUpGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = powerUpGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(powerUp.icon, 0, 0);

      ctx.restore();
    });

    // Draw particles
    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 30;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [zombies, particles, powerUps]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="w-full cursor-crosshair rounded-lg border-2 border-border"
        style={{ maxWidth: "100%", height: "auto", backgroundColor: "#0f0f1e" }}
      />
      {activePowerUp && (
        <PowerUp type={activePowerUp} endTime={powerUpEndTime} />
      )}
    </div>
  );
};