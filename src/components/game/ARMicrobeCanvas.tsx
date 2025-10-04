import { useEffect, useRef, useState, useCallback } from "react";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useGyroscope } from "@/hooks/useGyroscope";
import { PowerUp } from "./PowerUp";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Microbe {
  id: string;
  worldX: number; // World position X
  worldY: number; // World position Y
  worldZ: number; // World position Z (negative = in front)
  type: "basic" | "fast" | "tank" | "golden" | "boss";
  health: number;
  maxHealth: number;
  size: number;
  speed: number;
  points: number;
  spawnTime: number;
  opacity: number;
  wobble: number;
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
  
  // Try Gyroscope API first (best for Android Chrome)
  const gyro = useGyroscope();
  // Fallback to DeviceOrientation
  const orientation = useDeviceOrientation();
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
  const [showDebug, setShowDebug] = useState(false); // Hidden by default
  const [sensorMode, setSensorMode] = useState<'gyroscope' | 'orientation' | 'touch'>('touch');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showPermissionOverlay, setShowPermissionOverlay] = useState(true); // Show on game start
  const [permissionStatus, setPermissionStatus] = useState("Sensors needed for best experience");
  const [cameraWorldPos] = useState({ x: 0, y: 0, z: 0 }); // Camera stays at origin
  const lastComboTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(Date.now());
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const orientationCheckRef = useRef<number>(Date.now());
  const lastDataCheckRef = useRef<number>(Date.now());

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
    let speed = 1.5; // Increased for 50-80 unit spawn distance
    let size = 40;

    if (gameTime > 90 && rand < 5) {
      type = "boss";
      health = 10;
      points = 250;
      speed = 0.9; // Increased for 50-80 unit spawn distance
      size = 80;
    } else if (rand < 5) {
      type = "golden";
      health = 1;
      points = 100;
      speed = 2.2; // Increased for 50-80 unit spawn distance
      size = 35;
    } else if (gameTime > 60 && rand < 15) {
      type = "tank";
      health = 3;
      points = 50;
      speed = 0.8; // Increased for 50-80 unit spawn distance
      size = 60;
    } else if (gameTime > 30 && rand < 30) {
      type = "fast";
      health = 1;
      points = 25;
      speed = 3.0; // Increased for 50-80 unit spawn distance
      size = 30;
    }

    // Generate spawn position in forward-facing cone relative to current camera direction
    const relativeAngle = (Math.random() - 0.5) * Math.PI * 0.8; // -72° to +72°
    const elevation = (Math.random() - 0.5) * Math.PI * 0.5; // -45° to +45°
    const distance = 50 + Math.random() * 30; // Spawn 50-80 units away

    // Convert to world coordinates (spawn in front of where camera is currently pointing)
    const worldAngle = cameraYaw + relativeAngle;
    const worldX = Math.sin(worldAngle) * Math.cos(elevation) * distance;
    const worldY = Math.sin(elevation) * distance;
    const worldZ = -Math.cos(worldAngle) * Math.cos(elevation) * distance;

    const microbe: Microbe = {
      id: `microbe-${Date.now()}-${Math.random()}`,
      worldX,
      worldY,
      worldZ,
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

  // Handle permission request from canvas
  const handleRequestPermissions = async () => {
    setPermissionStatus("Requesting sensor permissions...");
    console.log('🔐 Requesting permissions from canvas...');
    
    const gyroGranted = await gyro.requestPermission();
    const orientationGranted = await orientation.requestPermission();

    console.log('🔐 Canvas permission results:', { gyroGranted, orientationGranted });

    // Hide overlay immediately after permission handling
    setShowPermissionOverlay(false);
    
    if (gyroGranted || orientationGranted) {
      toast.success("Sensors active! Look around to see microbes.");
      // Spawn initial microbes immediately
      const initialYaw = gyro.alpha ? (gyro.alpha * Math.PI) / 180 : 0;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnMicrobe(initialYaw + (Math.random() - 0.5) * Math.PI), i * 100);
      }
    } else {
      toast.info("Using touch controls - drag to look around");
    }
  };

  // Determine which sensor mode to use with smart fallback
  useEffect(() => {
    const now = Date.now();
    
    // Check Gyroscope API first (best for Android)
    if (gyro.permissionGranted && gyro.sensorAvailable && gyro.alpha !== null) {
      setSensorMode('gyroscope');
      setUseTouchMode(false);
      console.log('✅ Using GYROSCOPE API mode - alpha:', gyro.alpha);
      lastDataCheckRef.current = now;
      return;
    }
    
    // Fallback to DeviceOrientation if data is flowing
    if (orientation.permissionGranted && orientation.alpha !== null) {
      setSensorMode('orientation');
      setUseTouchMode(false);
      console.log('✅ Using DEVICE ORIENTATION mode - alpha:', orientation.alpha);
      lastDataCheckRef.current = now;
      return;
    }
    
    // If no sensor data after 2 seconds, switch to touch mode
    if (now - lastDataCheckRef.current > 2000) {
      setSensorMode('touch');
      setUseTouchMode(true);
      console.log('⚠️ No sensor data available, using TOUCH mode');
    }
  }, [gyro.permissionGranted, gyro.sensorAvailable, gyro.alpha, orientation.permissionGranted, orientation.alpha]);

  // Refs to access current sensor values without causing re-renders
  const sensorDataRef = useRef({ yaw: 0, pitch: 0 });
  const microbeCountRef = useRef(0);

  // Update refs when sensor data changes
  useEffect(() => {
    if (sensorMode === 'gyroscope' && gyro.alpha !== null) {
      sensorDataRef.current.yaw = (gyro.alpha * Math.PI) / 180;
    } else if (sensorMode === 'orientation' && orientation.alpha !== null) {
      sensorDataRef.current.yaw = (orientation.alpha * Math.PI) / 180;
    } else {
      sensorDataRef.current.yaw = touchRotation.yaw;
      sensorDataRef.current.pitch = touchRotation.pitch;
    }
  }, [gyro.alpha, orientation.alpha, touchRotation, sensorMode]);

  // Update microbe count ref
  useEffect(() => {
    microbeCountRef.current = microbes.length;
  }, [microbes.length]);

  // Spawn logic - stable interval that doesn't recreate constantly
  useEffect(() => {
    if (isPaused) return;

    const spawnInterval = useTouchMode ? 1500 : 2000;
    console.log('🎯 Spawn interval STARTED');
    
    const interval = setInterval(() => {
      // Use ref to get current count without closure issues
      if (microbeCountRef.current < 10) {
        const cameraYaw = sensorDataRef.current.yaw;
        console.log('🎯 Spawning at count:', microbeCountRef.current, 'yaw:', cameraYaw);
        spawnMicrobe(cameraYaw);
      }
    }, spawnInterval);

    return () => {
      console.log('🎯 Spawn interval STOPPED');
      clearInterval(interval);
    };
  }, [isPaused, useTouchMode, spawnMicrobe]);

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

    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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

      // Camera control with smart sensor selection
      let cameraYaw = 0;
      let cameraPitch = 0;
      let activeSensorData: any = null;

      if (sensorMode === 'gyroscope' && gyro.alpha !== null) {
        // Use Gyroscope API (best for Android)
        cameraYaw = (gyro.alpha * Math.PI) / 180;
        cameraPitch = Math.max(-45, Math.min(45, ((gyro.beta || 0) - 90) * Math.PI / 180));
        activeSensorData = { type: 'Gyroscope', alpha: gyro.alpha, beta: gyro.beta, gamma: gyro.gamma };
      } else if (sensorMode === 'orientation' && orientation.alpha !== null) {
        // Use DeviceOrientation
        cameraYaw = (orientation.alpha * Math.PI) / 180;
        cameraPitch = Math.max(-45, Math.min(45, ((orientation.beta || 0) - 90) * Math.PI / 180));
        activeSensorData = { type: 'DeviceOrientation', alpha: orientation.alpha, beta: orientation.beta, gamma: orientation.gamma };
      } else {
        // Fallback to touch mode
        cameraYaw = touchRotation.yaw;
        cameraPitch = touchRotation.pitch;
        activeSensorData = { type: 'Touch', yaw: touchRotation.yaw, pitch: touchRotation.pitch };
      }

      // Update camera world position based on rotation
      cameraWorldPos.x = Math.sin(cameraYaw) * 0.1;
      cameraWorldPos.z = -Math.cos(cameraYaw) * 0.1;

      // Render loop verification logging (reduced frequency)
      if (now % 3000 < 16) { // Log every 3 seconds
        console.log('🎨 Render loop active - Microbes:', microbes.length, 'Visible on canvas');
      }

      // Update and render microbes with world-space movement
      setMicrobes((prev) => {
        return prev
          .map((microbe) => {
            const age = (now - microbe.spawnTime) / 1000;
            const newWobble = microbe.wobble + 0.02;

            // Calculate distance to camera in world space
            const dx = microbe.worldX - cameraWorldPos.x;
            const dy = microbe.worldY - cameraWorldPos.y;
            const dz = microbe.worldZ - cameraWorldPos.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Check if reached camera or despawned
            if (distance < 0.5 || age > 20) {
              onLifeLost();
              return null;
            }

            // Move microbe toward camera in world space
            const dirX = -dx / distance;
            const dirY = -dy / distance;
            const dirZ = -dz / distance;
            const moveAmount = microbe.speed * 0.016;
            
            const newWorldX = microbe.worldX + dirX * moveAmount;
            const newWorldY = microbe.worldY + dirY * moveAmount;
            const newWorldZ = microbe.worldZ + dirZ * moveAmount;

            // Camouflage effect for tank/boss
            let opacity = microbe.opacity;
            if ((microbe.type === "tank" || microbe.type === "boss") && Math.floor(age) % 5 === 0 && age % 1 < 0.5) {
              opacity = 0.5;
            }

            // Multiplication for basic microbes
            if (microbe.type === "basic" && age > 15 && Math.random() < 0.001) {
              const offsetAngle = (Math.random() - 0.5) * 0.5;
              const offsetDist = 0.3;
              const clone: Microbe = {
                ...microbe,
                id: `microbe-clone-${Date.now()}-${Math.random()}`,
                worldX: newWorldX + Math.sin(offsetAngle) * offsetDist,
                worldY: newWorldY + (Math.random() - 0.5) * 0.2,
                worldZ: newWorldZ + Math.cos(offsetAngle) * offsetDist,
                spawnTime: now,
              };
              setTimeout(() => setMicrobes((m) => [...m, clone]), 0);
            }

            // Transform world position to camera-relative view space
            const viewX = newWorldX - cameraWorldPos.x;
            const viewY = newWorldY - cameraWorldPos.y;
            const viewZ = newWorldZ - cameraWorldPos.z;

            // Rotate by camera yaw (around Y axis)
            const cosYaw = Math.cos(cameraYaw);
            const sinYaw = Math.sin(cameraYaw);
            const rotatedX = viewX * cosYaw - viewZ * sinYaw;
            const rotatedZ = viewZ * cosYaw + viewX * sinYaw;
            
            // Apply pitch rotation (around X axis)
            const cosPitch = Math.cos(cameraPitch);
            const sinPitch = Math.sin(cameraPitch);
            const finalY = viewY * cosPitch - rotatedZ * sinPitch;
            const finalZ = rotatedZ * cosPitch + viewY * sinPitch;

            
            // Add wobble for realism
            const wobbleOffset = Math.sin(newWobble) * 0.05;

            // Project to screen with perspective using absolute depth
            const depth = Math.abs(finalZ);
            const fov = 1200; // Narrower FOV for better sizing
            const screenX = centerX + (rotatedX / depth) * fov + wobbleOffset * 50;
            const screenY = centerY + (finalY / depth) * fov;
            
            // Size based on camera-relative depth
            const scale = 300 / depth;
            const size = microbe.size * scale;

            // Only render microbes in front of camera AND not too close
            if (finalZ < 0 && depth >= 8) {
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
            }

            return { ...microbe, worldX: newWorldX, worldY: newWorldY, worldZ: newWorldZ, wobble: newWobble, opacity };
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

      // Render laser beam if firing - red with tapered effect
      if (laserFiring > 0 && now - laserFiring < 150) {
        const laserAlpha = 1 - (now - laserFiring) / 150;
        
        // Create tapered laser beam (wider at bottom)
        ctx.save();
        ctx.globalAlpha = laserAlpha * 0.8;
        
        // Main beam as a filled polygon (cone shape)
        const gradient = ctx.createLinearGradient(centerX, canvas.height, centerX, centerY);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${laserAlpha})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 100, ${laserAlpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 150, 150, ${laserAlpha * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, canvas.height); // Wide at bottom (left)
        ctx.lineTo(centerX - 2, centerY); // Narrow at center (left)
        ctx.lineTo(centerX + 2, centerY); // Narrow at center (right)
        ctx.lineTo(centerX + 15, canvas.height); // Wide at bottom (right)
        ctx.closePath();
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = "red";
        ctx.fill();
        
        ctx.restore();
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

      // Enhanced debug overlay
      if (showDebug) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(10, 10, 320, 180);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 16px monospace";
        ctx.fillText(`🎮 Sensor: ${activeSensorData?.type || 'None'}`, 20, 30);
        
        ctx.font = "14px monospace";
        ctx.fillStyle = "white";
        ctx.fillText(`Camera: yaw=${(cameraYaw * 180 / Math.PI).toFixed(1)}° pitch=${(cameraPitch * 180 / Math.PI).toFixed(1)}°`, 20, 55);
        
        if (activeSensorData) {
          if (activeSensorData.type === 'Touch') {
            ctx.fillText(`Touch Δ: ${activeSensorData.yaw.toFixed(1)}°, ${activeSensorData.pitch.toFixed(1)}°`, 20, 75);
          } else {
            ctx.fillText(`α=${activeSensorData.alpha?.toFixed(1) ?? 'null'} β=${activeSensorData.beta?.toFixed(1) ?? 'null'} γ=${activeSensorData.gamma?.toFixed(1) ?? 'null'}`, 20, 75);
          }
        }
        
        const visibleCount = microbes.filter(m => {
          const viewZ = m.worldZ - cameraWorldPos.z;
          const viewX = m.worldX - cameraWorldPos.x;
          const cosYaw = Math.cos(-cameraYaw);
          const sinYaw = Math.sin(-cameraYaw);
          const rotatedZ = viewZ * cosYaw + viewX * sinYaw;
          return rotatedZ < 0;
        }).length;
        
        ctx.fillText(`Microbes: ${microbes.length} (${visibleCount} visible)`, 20, 95);
        ctx.fillText(`Gyro: ${gyro.sensorAvailable ? '✅' : '❌'} | Orient: ${orientation.permissionGranted ? '✅' : '❌'}`, 20, 115);
        ctx.fillText(`Score: ${score} | Combo: ${combo}x`, 20, 135);
        ctx.fillText(`Lives: ${lives}`, 20, 155);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [microbes, powerUps, particles, lives, isPaused, combo, activePowerUp, useTouchMode, touchRotation, sensorMode, gyro, orientation, showDebug, score, onLifeLost, onScoreChange, onComboChange, onMicrobeEliminated]);

  // Handle touch drag for camera control (primary when orientation unavailable)
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const shouldUseTouchControl = sensorMode === 'touch' || useTouchMode;
    if (!shouldUseTouchControl) return;
    
    const touch = e.touches[0];
    if (!lastTouch) {
      setLastTouch({ x: touch.clientX, y: touch.clientY });
      return;
    }

    const deltaX = touch.clientX - lastTouch.x;
    const deltaY = touch.clientY - lastTouch.y;

    setTouchRotation(prev => ({
      yaw: prev.yaw + (deltaX * 0.01), // Increased sensitivity from 0.005
      pitch: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.pitch + (deltaY * 0.01)))
    }));

    setLastTouch({ x: touch.clientX, y: touch.clientY });
  }, [sensorMode, useTouchMode, lastTouch]);

  const handleTouchEnd = useCallback(() => {
    setLastTouch(null);
  }, []);

  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (isPaused || !canvasRef.current) return;
      
      // If it's a drag (touch move), don't shoot
      if (lastTouch && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        const moved = Math.abs(touch.clientX - lastTouch.x) > 30 || 
                     Math.abs(touch.clientY - lastTouch.y) > 30;
        if (moved) return;
      }

      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Fire laser beam
      setLaserFiring(Date.now());
      console.log('🔫 LASER FIRED! Checking', microbes.length, 'microbes for hits...');

      // Use sensor data based on current mode
      let cameraYaw = touchRotation.yaw;
      let cameraPitch = touchRotation.pitch;
      
      if (sensorMode === 'gyroscope' && gyro.alpha !== null) {
        cameraYaw = (gyro.alpha * Math.PI) / 180;
        cameraPitch = Math.max(-45, Math.min(45, ((gyro.beta || 0) - 90) * Math.PI / 180));
      } else if (sensorMode === 'orientation' && orientation.alpha !== null) {
        cameraYaw = (orientation.alpha * Math.PI) / 180;
        cameraPitch = Math.max(-45, Math.min(45, ((orientation.beta || 0) - 90) * Math.PI / 180));
      }

      // Check microbe collision at crosshair (center of screen)
      let hitMicrobe = false;
      let closestMicrobe: { microbe: Microbe; screenX: number; screenY: number; size: number } | null = null;
      let minDistance = Infinity;

      // Find closest microbe to crosshair using world coordinates
      microbes.forEach((microbe) => {
        // Transform world position to camera-relative view space
        const viewX = microbe.worldX - cameraWorldPos.x;
        const viewY = microbe.worldY - cameraWorldPos.y;
        const viewZ = microbe.worldZ - cameraWorldPos.z;

        // Rotate by camera yaw (around Y axis)
        const cosYaw = Math.cos(cameraYaw);
        const sinYaw = Math.sin(cameraYaw);
        const rotatedX = viewX * cosYaw - viewZ * sinYaw;
        const rotatedZ = viewZ * cosYaw + viewX * sinYaw;
        
        // Apply pitch rotation (around X axis)
        const cosPitch = Math.cos(cameraPitch);
        const sinPitch = Math.sin(cameraPitch);
        const finalY = viewY * cosPitch - rotatedZ * sinPitch;
        const finalZ = rotatedZ * cosPitch + viewY * sinPitch;

        // Skip if behind camera
        if (finalZ >= 0) return;

        // Skip if too close (same culling as rendering)
        const depth = Math.abs(finalZ);
        if (depth < 8) {
          console.log('⏭️ Skipping microbe - too close, depth:', depth.toFixed(1));
          return;
        }

        const wobbleOffset = Math.sin(microbe.wobble) * 0.05;
        const fov = 1200; // Match rendering FOV
        const screenX = centerX + (rotatedX / depth) * fov + wobbleOffset * 50;
        const screenY = centerY + (finalY / depth) * fov;
        
        console.log('🔍 Microbe projection - screen:', screenX.toFixed(0), screenY.toFixed(0), 'depth:', depth.toFixed(1));
        
        // Use depth-based scale like rendering
        const scale = 300 / depth;
        const size = microbe.size * scale;

        const distance = Math.hypot(screenX - centerX, screenY - centerY);
        
        // Check if within crosshair area (60px radius)
        if (distance < 60 && distance < minDistance) {
          minDistance = distance;
          closestMicrobe = { microbe, screenX, screenY, size };
        }
      });

      if (closestMicrobe) {
        hitMicrobe = true;
        const { microbe, screenX, screenY } = closestMicrobe;
        console.log('🎯 HIT! Microbe:', microbe.type, 'at screen:', screenX.toFixed(0), screenY.toFixed(0), 'Distance from crosshair:', minDistance.toFixed(1), 'px');
        
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
      } else {
        console.log('❌ NO HIT - Microbes:', microbes.length, 'Center:', centerX, centerY, 'Yaw:', (cameraYaw * 180 / Math.PI).toFixed(1), '° Pitch:', (cameraPitch * 180 / Math.PI).toFixed(1), '°');
      }
    },
    [isPaused, gyro.alpha, gyro.beta, orientation.alpha, orientation.beta, touchRotation, lastTouch, microbes, combo, activePowerUp, sensorMode, onScoreChange, onComboChange, onMicrobeEliminated, cameraWorldPos]
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
      {/* Pre-Mission Check Overlay */}
      {showPermissionOverlay && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-background/95 rounded-lg p-6 max-w-sm mx-4 text-center space-y-4">
            <h2 className="text-2xl font-bold">🎯 Pre-Mission Check</h2>
            <p className="text-sm text-muted-foreground">
              Grant sensor permissions for the best AR experience
            </p>
            
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-left space-y-2">
              <p className="font-semibold">📱 Sensor Status:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  {gyro.sensorAvailable ? "✅" : "❌"} Gyroscope
                </p>
                <p>
                  {orientation.permissionGranted ? "✅" : "❌"} Orientation
                </p>
              </div>
            </div>
            
            {permissionStatus && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs">
                {permissionStatus}
              </div>
            )}
            
            <div className="space-y-2">
              <Button onClick={handleRequestPermissions} className="w-full" size="lg">
                Grant Permissions
              </Button>
              <Button 
                onClick={() => {
                  setShowPermissionOverlay(false);
                  setUseTouchMode(true);
                  setSensorMode('touch');
                  toast.info("Using touch controls - drag to look around");
                  // Spawn initial microbes immediately
                  for (let i = 0; i < 5; i++) {
                    setTimeout(() => spawnMicrobe(0), i * 100);
                  }
                }} 
                variant="outline" 
                className="w-full"
              >
                Use Touch Controls
              </Button>
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd();
          handleTap(e);
        }}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Microbe Counter HUD - Always visible */}
      <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-bold z-40 pointer-events-none">
        🦠 Microbes Active: {microbes.length}
      </div>
      
      {activePowerUp && <PowerUp type={activePowerUp.type} endTime={activePowerUp.endTime} />}
    </>
  );
};
