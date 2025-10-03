import { useRef, useEffect, useState, useCallback } from "react";
import { PowerUp } from "./PowerUp";

interface Microbe {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "basic" | "fast" | "tank" | "golden";
  health: number;
  maxHealth: number;
  size: number;
  color: string;
  angle: number;
  rotationSpeed: number;
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

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onComboUpdate: (combo: number) => void;
  onMicrobesEliminatedUpdate: (count: number) => void;
  onTotalClicksUpdate: (count: number) => void;
  onGameOver: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_AREA_RADIUS = 280;

export const GameCanvas = ({
  onScoreUpdate,
  onLivesUpdate,
  onComboUpdate,
  onMicrobesEliminatedUpdate,
  onTotalClicksUpdate,
  onGameOver,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpType[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [microbesEliminated, setMicrobesEliminated] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [nextMicrobeId, setNextMicrobeId] = useState(0);
  const [nextPowerUpId, setNextPowerUpId] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerUpEndTime, setPowerUpEndTime] = useState(0);

  const comboTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const lastPowerUpSpawnRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const getMicrobeType = useCallback((time: number): Microbe["type"] => {
    const rand = Math.random();
    if (rand < 0.05) return "golden";
    if (time > 120 && rand < 0.25) return "tank";
    if (time > 60 && rand < 0.4) return "fast";
    return "basic";
  }, []);

  const createMicrobe = useCallback((type: Microbe["type"], id: number): Microbe => {
    const angle = Math.random() * Math.PI * 2;
    const distance = GAME_AREA_RADIUS - 30;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    const config = {
      basic: { health: 1, size: 25, color: "#22c55e", speed: 0.8, points: 10 },
      fast: { health: 1, size: 20, color: "#3b82f6", speed: 1.8, points: 25 },
      tank: { health: 3, size: 35, color: "#ef4444", speed: 0.5, points: 50 },
      golden: { health: 1, size: 22, color: "#fbbf24", speed: 2.2, points: 100 },
    }[type];

    const directionAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;

    return {
      id,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      vx: Math.cos(directionAngle) * config.speed,
      vy: Math.sin(directionAngle) * config.speed,
      type,
      health: config.health,
      maxHealth: config.health,
      size: config.size,
      color: config.color,
      angle: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    };
  }, []);

  const spawnMicrobe = useCallback(() => {
    const type = getMicrobeType(gameTime);
    const newMicrobe = createMicrobe(type, nextMicrobeId);
    setMicrobes((prev) => [...prev, newMicrobe]);
    setNextMicrobeId((prev) => prev + 1);
  }, [gameTime, nextMicrobeId, getMicrobeType, createMicrobe]);

  const spawnPowerUp = useCallback(() => {
    const types: PowerUpType["type"][] = ["freeze", "rapid", "double", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    const icons = { freeze: "❄️", rapid: "⚡", double: "✨", shield: "🛡️" };
    
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (GAME_AREA_RADIUS - 100);

    const powerUp: PowerUpType = {
      id: nextPowerUpId,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
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
      const duration = hitPowerUp.type === "double" ? 10000 : 5000;
      setPowerUpEndTime(Date.now() + duration);
      createParticles(hitPowerUp.x, hitPowerUp.y, "#fbbf24", 12);
      return;
    }

    const isRapidFire = activePowerUp === "rapid";

    setMicrobes((prevMicrobes) => {
      let hitMicrobe: Microbe | undefined;
      
      if (isRapidFire) {
        hitMicrobe = prevMicrobes[0];
      } else {
        hitMicrobe = prevMicrobes.find((microbe) => {
          const dx = clickX - microbe.x;
          const dy = clickY - microbe.y;
          return Math.sqrt(dx * dx + dy * dy) < microbe.size;
        });
      }

      if (hitMicrobe) {
        const newHealth = hitMicrobe.health - 1;
        
        if (newHealth <= 0) {
          createParticles(hitMicrobe.x, hitMicrobe.y, hitMicrobe.color);
          
          const basePoints = {
            basic: 10,
            fast: 25,
            tank: 50,
            golden: 100,
          }[hitMicrobe.type];

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

          setMicrobesEliminated((prev) => {
            const newCount = prev + 1;
            onMicrobesEliminatedUpdate(newCount);
            return newCount;
          });

          return prevMicrobes.filter((m) => m.id !== hitMicrobe.id);
        } else {
          return prevMicrobes.map((m) =>
            m.id === hitMicrobe.id ? { ...m, health: newHealth } : m
          );
        }
      }

      setCombo(0);
      onComboUpdate(0);
      return prevMicrobes;
    });
  }, [powerUps, activePowerUp, onScoreUpdate, onComboUpdate, onMicrobesEliminatedUpdate, onTotalClicksUpdate, createParticles]);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    setGameTime(elapsed);

    // Check if power-up expired
    if (activePowerUp && now > powerUpEndTime) {
      setActivePowerUp(null);
    }

    // Spawn microbes
    const spawnRate = Math.max(800 - elapsed * 10, 300);
    if (now - lastSpawnRef.current > spawnRate) {
      const maxMicrobes = Math.min(5 + Math.floor(elapsed / 30), 15);
      if (microbes.length < maxMicrobes) {
        spawnMicrobe();
      }
      lastSpawnRef.current = now;
    }

    // Spawn power-ups
    if (now - lastPowerUpSpawnRef.current > 30000 + Math.random() * 15000) {
      if (powerUps.length < 2) {
        spawnPowerUp();
      }
      lastPowerUpSpawnRef.current = now;
    }

    // Update microbes
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const isFrozen = activePowerUp === "freeze";

    setMicrobes((prev) => {
      const escapedMicrobes: Microbe[] = [];
      const remainingMicrobes = prev.filter((microbe) => {
        if (!isFrozen) {
          microbe.x += microbe.vx;
          microbe.y += microbe.vy;
          microbe.angle += microbe.rotationSpeed;
        }

        const dx = microbe.x - centerX;
        const dy = microbe.y - centerY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distanceFromCenter > GAME_AREA_RADIUS + microbe.size) {
          escapedMicrobes.push(microbe);
          return false;
        }
        return true;
      });

      if (escapedMicrobes.length > 0 && activePowerUp !== "shield") {
        setLives((prevLives) => {
          const newLives = Math.max(0, prevLives - escapedMicrobes.length);
          onLivesUpdate(newLives);
          if (newLives === 0) {
            onGameOver();
          }
          return newLives;
        });
      }

      return remainingMicrobes;
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
  }, [microbes, powerUps, activePowerUp, powerUpEndTime, spawnMicrobe, spawnPowerUp, onLivesUpdate, onGameOver]);

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

    // Draw petri dish background
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Get computed CSS colors
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--border')
      .trim();

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, GAME_AREA_RADIUS);
    gradient.addColorStop(0, `hsl(${primaryColor} / 0.05)`);
    gradient.addColorStop(1, `hsl(${primaryColor} / 0.15)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, GAME_AREA_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `hsl(${borderColor})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw microbes
    microbes.forEach((microbe) => {
      ctx.save();
      ctx.translate(microbe.x, microbe.y);
      ctx.rotate(microbe.angle);

      // Draw microbe body
      ctx.fillStyle = microbe.color;
      ctx.beginPath();
      ctx.arc(0, 0, microbe.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw spots
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.arc(-microbe.size * 0.3, -microbe.size * 0.2, microbe.size * 0.2, 0, Math.PI * 2);
      ctx.arc(microbe.size * 0.2, microbe.size * 0.3, microbe.size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Draw health bar for tanks
      if (microbe.type === "tank") {
        const healthBarWidth = microbe.size * 1.5;
        const healthBarHeight = 4;
        const healthPercentage = microbe.health / microbe.maxHealth;

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(-healthBarWidth / 2, microbe.size + 5, healthBarWidth, healthBarHeight);

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-healthBarWidth / 2, microbe.size + 5, healthBarWidth * healthPercentage, healthBarHeight);
      }

      ctx.restore();
    });

    // Draw power-ups
    powerUps.forEach((powerUp) => {
      ctx.save();
      ctx.translate(powerUp.x, powerUp.y);

      ctx.fillStyle = "hsl(var(--primary))";
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
  }, [microbes, particles, powerUps]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="w-full cursor-crosshair rounded-lg border-2 border-border bg-background"
        style={{ maxWidth: "100%", height: "auto" }}
      />
      {activePowerUp && (
        <PowerUp type={activePowerUp} endTime={powerUpEndTime} />
      )}
    </div>
  );
};
