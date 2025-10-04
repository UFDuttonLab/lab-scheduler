import { useEffect, useRef, useState, useCallback } from "react";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { PowerUp } from "./PowerUp";

interface Microbe {
  id: string;
  angle: number; // Horizontal angle relative to camera (radians)
  elevation: number; // Vertical angle relative to camera (radians)
  distance: number; // Distance from camera
  spawnCameraYaw: number; // Camera yaw when microbe spawned
  type: "basic" | "fast" | "tank" | "golden" | "boss";
  health: number;
  maxHealth: number;
  size: number;
  speed: number;
  points: number;
  spawnTime: number;
  opacity: number;
  wobble: number; // For slight movement
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
  const { alpha, beta, gamma, permissionGranted } = useDeviceOrientation();
  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; endTime: number } | null>(null);
  const [laserFiring, setLaserFiring] = useState<number>(0); // Timestamp of laser fire
  const [touchRotation, setTouchRotation] = useState({ yaw: 0, pitch: 0 });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);
  const [useTouchMode, setUseTouchMode] = useState(false);
  const lastComboTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(Date.now());
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const orientationCheckRef = useRef<number>(Date.now());

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

  const spawnMicrobe = useCallback((cameraYaw: number) => {
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

    // Generate spawn position in forward-facing cone (-60° to +60°)
    const angle = (Math.random() - 0.5) * Math.PI * 2/3;
    const elevation = (Math.random() - 0.5) * Math.PI * 0.6;
    const distance = 3 + Math.random() * 2;

    const microbe: Microbe = {
      id: `microbe-${Date.now()}-${Math.random()}`,
      angle,
      elevation,
      distance,
      spawnCameraYaw: cameraYaw,
      type,
      health,
      maxHealth: health,
      size,
      speed,
      points,
      spawnTime: Date.now(),
      opacity: 1,
      wobble: 0,
    };

    console.log('🎯 Spawning microbe:', {
      angle: (angle * 180 / Math.PI).toFixed(1) + '°',
      elevation: (elevation * 180 / Math.PI).toFixed(1) + '°',
      distance: distance.toFixed(2),
      cameraYaw: (cameraYaw * 180 / Math.PI).toFixed(1) + '°',
      type
    });

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
        const cameraYaw = ((alpha || 0) * Math.PI) / 180;
        spawnMicrobe(cameraYaw);
      }
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [isPaused, microbes.length, spawnMicrobe, alpha]);

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

  // Runtime check: if orientation permission granted but no data after 2 seconds, switch to touch
  useEffect(() => {
    if (permissionGranted === true && !useTouchMode) {
      const checkTimeout = setTimeout(() => {
        if (alpha === null || beta === null) {
          console.warn("⚠️ Orientation permission granted but no data received - switching to touch mode");
          setUseTouchMode(true);
        }
      }, 2000);

      return () => clearTimeout(checkTimeout);
    }
  }, [permissionGranted, alpha, beta, useTouchMode]);

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

      // Determine control mode: orientation works if permission granted AND data is available AND not forced touch mode
      const useOrientation = (permissionGranted === true) && (alpha !== null && beta !== null) && !useTouchMode;
      const cameraYaw = useOrientation 
        ? ((alpha || 0) * Math.PI) / 180 
        : touchRotation.yaw; // Fallback to touch rotation
      const cameraPitch = useOrientation 
        ? ((beta ? beta - 90 : 0) * Math.PI) / 180 
        : touchRotation.pitch;

      // Debug logging every 60 frames (~1 second)
      if (now % 1000 < 16) {
        console.log('📊 AR Debug:', {
          mode: useOrientation ? 'Orientation' : 'Touch',
          orientation: {
            alpha: alpha?.toFixed(1) || 'null',
            beta: beta?.toFixed(1) || 'null',
            gamma: gamma?.toFixed(1) || 'null'
          },
          touchRotation: {
            yaw: (touchRotation.yaw * 180 / Math.PI).toFixed(1) + '°',
            pitch: (touchRotation.pitch * 180 / Math.PI).toFixed(1) + '°'
          },
          cameraYaw: (cameraYaw * 180 / Math.PI).toFixed(1) + '°',
          microbeCount: microbes.length,
          visibleMicrobes: microbes.filter(m => {
            const deltaYaw = cameraYaw - m.spawnCameraYaw;
            const adjustedAngle = m.angle + deltaYaw;
            const relZ = -Math.cos(adjustedAngle) * Math.cos(m.elevation) * m.distance;
            return relZ < 0;
          }).length
        });
      }

      // Update and render microbes
      setMicrobes((prev) => {
        return prev
          .map((microbe) => {
            const age = (now - microbe.spawnTime) / 1000;

            const newWobble = microbe.wobble + 0.02;

            // Check if reached camera or despawned
            if (microbe.distance < 0.5 || age > 20) {
              onLifeLost();
              return null;
            }

            // Move microbe toward camera - just decrease distance
            const newDistance = microbe.distance - microbe.speed * 0.016;

            // Camouflage effect for tank/boss
            let opacity = microbe.opacity;
            if ((microbe.type === "tank" || microbe.type === "boss") && Math.floor(age) % 5 === 0 && age % 1 < 0.5) {
              opacity = 0.5;
            }

            // Multiplication for basic microbes
            if (microbe.type === "basic" && age > 15 && Math.random() < 0.001) {
              // Clone slightly offset in angle
              const clone: Microbe = {
                ...microbe,
                id: `microbe-clone-${Date.now()}-${Math.random()}`,
                angle: microbe.angle + (Math.random() - 0.5) * 0.3,
                elevation: microbe.elevation + (Math.random() - 0.5) * 0.2,
                spawnCameraYaw: microbe.spawnCameraYaw,
                spawnTime: now,
              };
              setTimeout(() => setMicrobes((m) => [...m, clone]), 0);
            }

            // Adjust angle based on camera rotation since spawn
            const deltaYaw = cameraYaw - microbe.spawnCameraYaw;
            const adjustedAngle = microbe.angle + deltaYaw;
            
            // Convert to camera-relative Cartesian with adjusted angle
            const relX = Math.sin(adjustedAngle) * Math.cos(microbe.elevation) * newDistance;
            const relY = Math.sin(microbe.elevation) * newDistance;
            const relZ = -Math.cos(adjustedAngle) * Math.cos(microbe.elevation) * newDistance;

            // These are now in camera-relative view space
            const viewX = relX;
            const viewY = relY;
            const viewZ = relZ;

            // Only render if in front of camera (negative Z in view space)
            if (viewZ > 0) {
              // Keep microbe but don't render (behind camera)
              return { ...microbe, distance: newDistance, wobble: newWobble, opacity };
            }

            // Add wobble for realism
            const wobbleOffset = Math.sin(newWobble) * 0.05;

            // Project to screen with perspective
            const fov = 800; // Field of view factor
            const screenX = centerX + (viewX / -viewZ) * fov + wobbleOffset * 50;
            const screenY = centerY + (viewY / -viewZ) * fov;
            
            // Size based on distance
            const scale = 3 / newDistance;
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

            return { ...microbe, distance: newDistance, wobble: newWobble, opacity };
          })
          .filter(Boolean) as Microbe[];
      });

      // Update and render power-ups (keep simple fixed positioning for now)
      setPowerUps((prev) => {
        return prev.filter((powerUp) => {
          const age = (now - powerUp.spawnTime) / 1000;
          if (age > 15) return false;

          const scale = 1 / -powerUp.z;
          const screenX = centerX + powerUp.x * scale * 300;
          const screenY = centerY + powerUp.y * scale * 300;

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

      // Render laser beam if firing
      if (laserFiring > 0 && now - laserFiring < 150) {
        const laserAlpha = 1 - (now - laserFiring) / 150;
        const gradient = ctx.createLinearGradient(centerX, canvas.height, centerX, centerY);
        gradient.addColorStop(0, `rgba(0, 255, 255, ${laserAlpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${laserAlpha})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${laserAlpha * 0.3})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "cyan";
        ctx.beginPath();
        ctx.moveTo(centerX, canvas.height);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

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

      // Draw debug info
      const useOrientationDisplay = alpha !== null && beta !== null;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, canvas.height - 80, 200, 70);
      ctx.fillStyle = useOrientationDisplay ? "#00ff00" : "#ffaa00";
      ctx.font = "12px monospace";
      ctx.fillText(useOrientationDisplay ? "📱 Orientation Mode" : "👆 Touch Mode", 20, canvas.height - 60);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Yaw: ${(cameraYaw * 180 / Math.PI).toFixed(0)}°`, 20, canvas.height - 40);
      ctx.fillText(`Microbes: ${microbes.length}`, 20, canvas.height - 20);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, alpha, beta, gamma, touchRotation, microbes, onLifeLost, permissionGranted, useTouchMode]);

  // Handle touch drag for camera control (primary when orientation unavailable)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // Use touch controls if: permission denied, no orientation data, or forced touch mode
    const shouldUseTouchControl = permissionGranted === false || alpha === null || beta === null || useTouchMode;
    if (!shouldUseTouchControl) return;
    
    const touch = e.touches[0];
    if (!lastTouch) {
      setLastTouch({ x: touch.clientX, y: touch.clientY });
      return;
    }

    const deltaX = touch.clientX - lastTouch.x;
    const deltaY = touch.clientY - lastTouch.y;

    setTouchRotation(prev => ({
      yaw: prev.yaw + (deltaX * 0.005), // Sensitivity
      pitch: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.pitch + (deltaY * 0.005)))
    }));

    setLastTouch({ x: touch.clientX, y: touch.clientY });
  }, [permissionGranted, alpha, beta, useTouchMode, lastTouch]);

  const handleTouchEnd = useCallback(() => {
    setLastTouch(null);
  }, []);

  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (isPaused || !canvasRef.current) return;
      
      // If it's a drag (touch move), don't shoot
      if (lastTouch && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        const moved = Math.abs(touch.clientX - lastTouch.x) > 10 || 
                     Math.abs(touch.clientY - lastTouch.y) > 10;
        if (moved) return;
      }

      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Fire laser beam
      setLaserFiring(Date.now());

      // Use device orientation OR touch fallback (same logic as render loop)
      const useOrientation = (permissionGranted === true) && (alpha !== null && beta !== null) && !useTouchMode;
      const cameraYaw = useOrientation ? ((alpha || 0) * Math.PI) / 180 : touchRotation.yaw;
      const cameraPitch = useOrientation ? ((beta ? beta - 90 : 0) * Math.PI) / 180 : touchRotation.pitch;

      // Check microbe collision at crosshair (center of screen)
      let hitMicrobe = false;
      let closestMicrobe: { microbe: Microbe; screenX: number; screenY: number; size: number } | null = null;
      let minDistance = Infinity;

      // Find closest microbe to crosshair
      microbes.forEach((microbe) => {
        // Adjust angle based on camera rotation since spawn
        const deltaYaw = cameraYaw - microbe.spawnCameraYaw;
        const adjustedAngle = microbe.angle + deltaYaw;
        
        // Convert to camera-relative Cartesian with adjusted angle
        const relX = Math.sin(adjustedAngle) * Math.cos(microbe.elevation) * microbe.distance;
        const relY = Math.sin(microbe.elevation) * microbe.distance;
        const relZ = -Math.cos(adjustedAngle) * Math.cos(microbe.elevation) * microbe.distance;

        // These are now in camera-relative view space
        const viewX = relX;
        const viewY = relY;
        const viewZ = relZ;

        // Skip if behind camera
        if (viewZ > 0) return;

        const wobbleOffset = Math.sin(microbe.wobble) * 0.05;
        const fov = 800;
        const screenX = centerX + (viewX / -viewZ) * fov + wobbleOffset * 50;
        const screenY = centerY + (viewY / -viewZ) * fov;
        
        const scale = 3 / microbe.distance;
        const size = microbe.size * scale;

        const distance = Math.hypot(screenX - centerX, screenY - centerY);
        
        // Check if within crosshair area (40px radius)
        if (distance < 40 && distance < minDistance) {
          minDistance = distance;
          closestMicrobe = { microbe, screenX, screenY, size };
        }
      });

      if (closestMicrobe) {
        hitMicrobe = true;
        const { microbe, screenX, screenY } = closestMicrobe;
        
        setMicrobes((prev) => {
          return prev.map((m) => {
            if (m.id !== microbe.id) return m;

            const newHealth = m.health - 1;

            // Create hit particles
            const newParticles: Particle[] = Array.from({ length: 10 }, () => ({
              x: screenX,
              y: screenY,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 1,
              color: getMicrobeColor(m.type),
            }));
            setParticles((prev) => [...prev, ...newParticles]);

            if (newHealth <= 0) {
              // Microbe eliminated
              const newCombo = combo + 1;
              const comboMultiplier = 1 + Math.floor(newCombo / 5) * 0.5;
              const pointsEarned = Math.floor(
                m.points * comboMultiplier * (activePowerUp?.type === "double" ? 2 : 1)
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

            return { ...m, health: newHealth };
          }).filter(Boolean) as Microbe[];
        });
      }
    },
    [isPaused, alpha, beta, touchRotation, lastTouch, microbes, combo, activePowerUp, permissionGranted, useTouchMode, onScoreChange, onComboChange, onMicrobeEliminated]
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
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd();
          handleTap(e);
        }}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ width: "100%", height: "100%" }}
      />
      {activePowerUp && <PowerUp type={activePowerUp.type} endTime={activePowerUp.endTime} />}
    </>
  );
};
