import { useEffect, useRef, useState, useCallback } from "react";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { PowerUp } from "./PowerUp";

interface Microbe {
  id: string;
  x: number;
  y: number;
  z: number;
  type: "basic" | "fast" | "tank" | "golden" | "boss";
  health: number;
  maxHealth: number;
  size: number;
  speed: number;
  points: number;
  spawnTime: number;
  opacity: number;
  angle: number;
}

interface PowerUpItem {
  id: string;
  type: "freeze" | "rapid" | "double" | "shield";
  x: number;
  y: number;
  z: number;
  spawnTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface ARMicrobeCanvasProps {
  onScoreChange: (score: number) => void;
  onLifeLost: () => void;
  onMicrobeEliminated: () => void;
  onComboChange: (combo: number) => void;
  lives: number;
  isPaused: boolean;
}

export const ARMicrobeCanvas = ({
  onScoreChange,
  onLifeLost,
  onMicrobeEliminated,
  onComboChange,
  lives,
  isPaused,
}: ARMicrobeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { alpha, beta, gamma } = useDeviceOrientation();
  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; endTime: number } | null>(null);
  const lastComboTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(Date.now());
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();

  const getMicrobeEmoji = (type: string): string => {
    switch (type) {
      case "basic": return "🦠";
      case "fast": return "🔵";
      case "tank": return "🔴";
      case "golden": return "✨";
      case "boss": return "👾";
      default: return "🦠";
    }
  };

  const getMicrobeColor = (type: string): string => {
    switch (type) {
      case "basic": return "#22c55e";
      case "fast": return "#3b82f6";
      case "tank": return "#ef4444";
      case "golden": return "#fbbf24";
      case "boss": return "#a855f7";
      default: return "#22c55e";
    }
  };

  const spawnMicrobe = useCallback(() => {
    const gameTime = (Date.now() - gameStartTimeRef.current) / 1000;
    
    // Determine microbe type based on spawn rate and game time
    const rand = Math.random() * 100;
    let type: Microbe["type"] = "basic";
    let health = 1;
    let points = 10;
    let speed = 0.5;
    let size = 40;

    if (gameTime > 90 && rand < 5) {
      type = "boss";
      health = 10;
      points = 250;
      speed = 0.3;
      size = 80;
    } else if (rand < 5) {
      type = "golden";
      health = 1;
      points = 100;
      speed = 0.8;
      size = 35;
    } else if (gameTime > 60 && rand < 15) {
      type = "tank";
      health = 3;
      points = 50;
      speed = 0.2;
      size = 60;
    } else if (gameTime > 30 && rand < 30) {
      type = "fast";
      health = 1;
      points = 25;
      speed = 1.2;
      size = 30;
    }

    const microbe: Microbe = {
      id: `microbe-${Date.now()}-${Math.random()}`,
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 3,
      z: -3 - Math.random() * 2,
      type,
      health,
      maxHealth: health,
      size,
      speed,
      points,
      spawnTime: Date.now(),
      opacity: 1,
      angle: Math.random() * Math.PI * 2,
    };

    setMicrobes((prev) => [...prev, microbe]);
  }, []);

  const spawnPowerUp = useCallback(() => {
    const types: PowerUpItem["type"][] = ["freeze", "rapid", "double", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerUp: PowerUpItem = {
      id: `powerup-${Date.now()}`,
      type,
      x: (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * 2,
      z: -2.5,
      spawnTime: Date.now(),
    };

    setPowerUps((prev) => [...prev, powerUp]);
  }, []);

  // Spawn logic
  useEffect(() => {
    if (isPaused) return;

    const spawnInterval = setInterval(() => {
      if (microbes.length < 10) {
        spawnMicrobe();
      }
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [isPaused, microbes.length, spawnMicrobe]);

  // Power-up spawn logic
  useEffect(() => {
    if (isPaused) return;

    const checkPowerUpSpawn = setInterval(() => {
      const timeSinceLastPowerUp = Date.now() - lastPowerUpSpawnRef.current;
      const shouldSpawn = timeSinceLastPowerUp > 20000 + Math.random() * 20000;

      if (shouldSpawn && powerUps.length < 2) {
        spawnPowerUp();
        lastPowerUpSpawnRef.current = Date.now();
      }
    }, 5000);

    return () => clearInterval(checkPowerUpSpawn);
  }, [isPaused, powerUps.length, spawnPowerUp]);

  // Combo reset logic
  useEffect(() => {
    const comboResetInterval = setInterval(() => {
      const timeSinceLastHit = Date.now() - lastComboTimeRef.current;
      if (timeSinceLastHit > 2000 && combo > 0) {
        setCombo(0);
        onComboChange(0);
      }
    }, 100);

    return () => clearInterval(comboResetInterval);
  }, [combo, onComboChange]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Calculate camera offset from device orientation
      const offsetX = (gamma || 0) * 5;
      const offsetY = (beta ? beta - 45 : 0) * 5;

      // Update and render microbes
      setMicrobes((prev) => {
        return prev
          .map((microbe) => {
            const age = (now - microbe.spawnTime) / 1000;

            // Move microbe
            let newZ = microbe.z + microbe.speed * 0.016;
            microbe.angle += 0.02;
            const newX = microbe.x + Math.sin(microbe.angle) * 0.01;
            const newY = microbe.y + Math.cos(microbe.angle) * 0.01;

            // Check if reached camera or despawned
            if (newZ > -0.5 || age > 10) {
              onLifeLost();
              return null;
            }

            // Camouflage effect for tank/boss
            let opacity = microbe.opacity;
            if ((microbe.type === "tank" || microbe.type === "boss") && Math.floor(age) % 5 === 0 && age % 1 < 0.5) {
              opacity = 0.5;
            }

            // Multiplication for basic microbes
            if (microbe.type === "basic" && age > 15 && Math.random() < 0.001) {
              const clone: Microbe = {
                ...microbe,
                id: `microbe-clone-${Date.now()}-${Math.random()}`,
                x: microbe.x + (Math.random() - 0.5) * 0.5,
                y: microbe.y + (Math.random() - 0.5) * 0.5,
                spawnTime: now,
              };
              setTimeout(() => setMicrobes((m) => [...m, clone]), 0);
            }

            // Project to screen space
            const scale = 1 / -newZ;
            const screenX = centerX + (newX - offsetX * 0.01) * scale * 300;
            const screenY = centerY + (newY - offsetY * 0.01) * scale * 300;
            const size = microbe.size * scale;

            // Render microbe
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.font = `${size}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(getMicrobeEmoji(microbe.type), screenX, screenY);

            // Health bar for tank/boss
            if ((microbe.type === "tank" || microbe.type === "boss") && microbe.health < microbe.maxHealth) {
              const barWidth = size * 1.5;
              const barHeight = 5;
              ctx.fillStyle = "#333";
              ctx.fillRect(screenX - barWidth / 2, screenY + size / 2 + 5, barWidth, barHeight);
              ctx.fillStyle = getMicrobeColor(microbe.type);
              ctx.fillRect(
                screenX - barWidth / 2,
                screenY + size / 2 + 5,
                (barWidth * microbe.health) / microbe.maxHealth,
                barHeight
              );
            }

            ctx.restore();

            return { ...microbe, x: newX, y: newY, z: newZ, opacity };
          })
          .filter(Boolean) as Microbe[];
      });

      // Update and render power-ups
      setPowerUps((prev) => {
        return prev.filter((powerUp) => {
          const age = (now - powerUp.spawnTime) / 1000;
          if (age > 15) return false;

          const scale = 1 / -powerUp.z;
          const screenX = centerX + (powerUp.x - offsetX * 0.01) * scale * 300;
          const screenY = centerY + (powerUp.y - offsetY * 0.01) * scale * 300;

          ctx.font = "40px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const emoji = { freeze: "❄️", rapid: "⚡", double: "✨", shield: "🛡️" }[powerUp.type];
          ctx.fillText(emoji, screenX, screenY);

          return true;
        });
      });

      // Update and render particles
      setParticles((prev) => {
        return prev
          .map((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;

            if (particle.life <= 0) return null;

            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life;
            ctx.fillRect(particle.x, particle.y, 4, 4);
            ctx.globalAlpha = 1;

            return particle;
          })
          .filter(Boolean) as Particle[];
      });

      // Render crosshair
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 25);
      ctx.lineTo(centerX, centerY - 15);
      ctx.moveTo(centerX, centerY + 25);
      ctx.lineTo(centerX, centerY + 15);
      ctx.moveTo(centerX - 25, centerY);
      ctx.lineTo(centerX - 15, centerY);
      ctx.moveTo(centerX + 25, centerY);
      ctx.lineTo(centerX + 15, centerY);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, alpha, beta, gamma, onLifeLost]);

  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (isPaused || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];
      const tapX = touch.clientX - rect.left;
      const tapY = touch.clientY - rect.top;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const offsetX = (gamma || 0) * 5;
      const offsetY = (beta ? beta - 45 : 0) * 5;

      // Check power-up collision
      for (const powerUp of powerUps) {
        const scale = 1 / -powerUp.z;
        const screenX = centerX + (powerUp.x - offsetX * 0.01) * scale * 300;
        const screenY = centerY + (powerUp.y - offsetY * 0.01) * scale * 300;
        const distance = Math.hypot(tapX - screenX, tapY - screenY);

        if (distance < 40) {
          setPowerUps((prev) => prev.filter((p) => p.id !== powerUp.id));
          const duration = powerUp.type === "double" ? 10000 : powerUp.type === "shield" ? 8000 : 5000;
          setActivePowerUp({ type: powerUp.type, endTime: Date.now() + duration });
          return;
        }
      }

      // Check microbe collision
      let hitMicrobe = false;
      setMicrobes((prev) => {
        return prev.map((microbe) => {
          const scale = 1 / -microbe.z;
          const screenX = centerX + (microbe.x - offsetX * 0.01) * scale * 300;
          const screenY = centerY + (microbe.y - offsetY * 0.01) * scale * 300;
          const size = microbe.size * scale;
          const distance = Math.hypot(tapX - screenX, tapY - screenY);

          if (distance < size / 2 && !hitMicrobe) {
            hitMicrobe = true;
            const newHealth = microbe.health - 1;

            // Create hit particles
            const newParticles: Particle[] = Array.from({ length: 10 }, () => ({
              x: screenX,
              y: screenY,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 1,
              color: getMicrobeColor(microbe.type),
            }));
            setParticles((prev) => [...prev, ...newParticles]);

            if (newHealth <= 0) {
              // Microbe eliminated
              const newCombo = combo + 1;
              const comboMultiplier = 1 + Math.floor(newCombo / 5) * 0.5;
              const pointsEarned = Math.floor(
                microbe.points * comboMultiplier * (activePowerUp?.type === "double" ? 2 : 1)
              );

              setScore((prev) => {
                const newScore = prev + pointsEarned;
                onScoreChange(newScore);
                return newScore;
              });

              setCombo(newCombo);
              onComboChange(newCombo);
              lastComboTimeRef.current = Date.now();
              onMicrobeEliminated();

              return null;
            }

            return { ...microbe, health: newHealth };
          }

          return microbe;
        }).filter(Boolean) as Microbe[];
      });
    },
    [isPaused, gamma, beta, powerUps, combo, activePowerUp, onScoreChange, onComboChange, onMicrobeEliminated]
  );

  // Handle active power-up expiration
  useEffect(() => {
    if (!activePowerUp) return;

    const checkExpiration = setInterval(() => {
      if (Date.now() > activePowerUp.endTime) {
        setActivePowerUp(null);
      }
    }, 100);

    return () => clearInterval(checkExpiration);
  }, [activePowerUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onTouchStart={handleTap}
      />
      {activePowerUp && <PowerUp type={activePowerUp.type} endTime={activePowerUp.endTime} />}
    </>
  );
};
