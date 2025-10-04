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
  
  // Try Gyroscope API first (best for Android Chrome) - returns refs to avoid re-renders
  const { gyroStateRef: gyro, permissionGranted: gyroPermission, sensorAvailable: gyroAvailable, requestPermission: requestGyroPermission } = useGyroscope();
  // Fallback to DeviceOrientation - returns refs to avoid re-renders
  const { orientationRef: orientation, permissionGranted: orientationPermission, requestPermission: requestOrientationPermission } = useDeviceOrientation();
  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; endTime: number } | null>(null);
  const [laserFiring, setLaserFiring] = useState<number>(0); // Timestamp of laser fire
  const [showDebug, setShowDebug] = useState(false); // Hidden by default
  const [sensorMode, setSensorMode] = useState<'gyroscope' | 'orientation' | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showPermissionOverlay, setShowPermissionOverlay] = useState(true); // Show on game start
  const [permissionStatus, setPermissionStatus] = useState("Sensors needed for best experience");
  const cameraWorldPosRef = useRef({ x: 0, y: 0, z: 0 }); // Camera stays at origin
  const lastComboTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(Date.now());
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const orientationCheckRef = useRef<number>(Date.now());
  const lastDataCheckRef = useRef<number>(Date.now());
  const comboRef = useRef(0);
  const activePowerUpRef = useRef<{ type: string; endTime: number } | null>(null);

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
    let speed = 6; // Base speed for 13-20 second approach from 80-120 units
    let size = 40;

    if (gameTime > 90 && rand < 5) {
      type = "boss";
      health = 10;
      points = 250;
      speed = 6; // Menacing but faster approach (13-20 seconds)
      size = 80;
    } else if (rand < 5) {
      type = "golden";
      health = 1;
      points = 100;
      speed = 12; // Very quick reward opportunity (6-10 seconds)
      size = 35;
    } else if (gameTime > 60 && rand < 15) {
      type = "tank";
      health = 3;
      points = 50;
      speed = 5; // Slow but tanky approach (16-24 seconds)
      size = 60;
    } else if (gameTime > 30 && rand < 30) {
      type = "fast";
      health = 1;
      points = 25;
      speed = 10; // Very quick threat (8-12 seconds)
      size = 30;
    }

    // Spawn microbes biased toward camera's current view (within ±90° of yaw)
    const angleOffset = (Math.random() - 0.5) * Math.PI; // ±90° from camera direction
    const worldAngle = cameraYaw + angleOffset;
    const elevation = (Math.random() - 0.5) * Math.PI; // Full 180° vertical
    const distance = 20 + Math.random() * 200; // Spawn 20-220 units away

    // Convert to world coordinates (biased toward camera's front hemisphere)
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
    
    const gyroGranted = await requestGyroPermission();
    const orientationGranted = await requestOrientationPermission();

    console.log('🔐 Canvas permission results:', { gyroGranted, orientationGranted });

    // Hide overlay immediately after permission handling
    setShowPermissionOverlay(false);
    
    if (gyroGranted || orientationGranted) {
      toast.success("Sensors active! Look around to see microbes.");
      // Spawn initial microbes immediately
      const initialYaw = gyro.current.alpha ? (gyro.current.alpha * Math.PI) / 180 : 0;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnMicrobe(initialYaw + (Math.random() - 0.5) * Math.PI), i * 100);
      }
    } else {
      toast.error("Sensors required to play AR Microbe Shooter");
    }
  };

  // Determine which sensor mode to use - CHECK REFS instead of permission state
  useEffect(() => {
    // Check every 100ms if we have sensor data flowing in the refs
    const checkInterval = setInterval(() => {
      // Check if orientation data is flowing
      if (orientation.current.alpha !== null && orientation.current.beta !== null) {
        if (sensorMode !== 'orientation') {
          console.log('✅ SENSOR MODE SET: orientation (data detected in ref)');
          setSensorMode('orientation');
        }
      }
      // Fallback to gyroscope if available
      else if (gyro.current.alpha !== null && gyro.current.beta !== null && gyroAvailable) {
        if (sensorMode !== 'gyroscope') {
          console.log('✅ SENSOR MODE SET: gyroscope (data detected in ref)');
          setSensorMode('gyroscope');
        }
      }
      // No sensor data
      else {
        if (sensorMode !== null) {
          console.log('❌ SENSOR MODE SET: null (no data in refs)');
          setSensorMode(null);
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [sensorMode, gyroAvailable]);

  // Refs to access current sensor values without causing re-renders
  const sensorDataRef = useRef({ yaw: 0, pitch: 0 });
  const microbeCountRef = useRef(0);
  const removedMicrobesRef = useRef<Set<string>>(new Set());


  // Update microbe count ref
  useEffect(() => {
    microbeCountRef.current = microbes.length;
  }, [microbes.length]);

  // Spawn logic - stable interval that doesn't recreate constantly
  useEffect(() => {
    if (isPaused) return;

    const spawnInterval = 2000;
    console.log('🎯 Spawn interval STARTED');
    
    const interval = setInterval(() => {
      console.log('🔴 SPAWN CHECK - Count:', microbeCountRef.current, 'isPaused:', isPaused);
      // Use ref to get current count without closure issues
      if (microbeCountRef.current < 10) {
        const cameraYaw = sensorDataRef.current.yaw || 0;
        console.log('🎯 Spawning at count:', microbeCountRef.current, 'yaw:', cameraYaw);
        spawnMicrobe(cameraYaw);
      }
    }, spawnInterval);

    return () => {
      console.log('🎯 Spawn interval STOPPED');
      clearInterval(interval);
    };
  }, [isPaused]);

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

  // Keep combo ref in sync
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  // Keep activePowerUp ref in sync
  useEffect(() => {
    activePowerUpRef.current = activePowerUp;
  }, [activePowerUp]);

  // Microbe Update Loop (SEPARATE from render loop)
  useEffect(() => {
    if (isPaused) return;

    const updateInterval = setInterval(() => {
      const now = Date.now();

      setMicrobes((prev) => {
        return prev
          .filter(m => !removedMicrobesRef.current.has(m.id)) // Skip removed microbes
          .map((microbe) => {
            const age = (now - microbe.spawnTime) / 1000;
            const newWobble = microbe.wobble + 0.02;

            // Calculate distance to camera in world space
            const dx = microbe.worldX - cameraWorldPosRef.current.x;
            const dy = microbe.worldY - cameraWorldPosRef.current.y;
            const dz = microbe.worldZ - cameraWorldPosRef.current.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Check if reached camera or despawned
            if (distance < 0.5 || age > 25) {
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

            return { ...microbe, worldX: newWorldX, worldY: newWorldY, worldZ: newWorldZ, wobble: newWobble, opacity };
          })
          .filter(Boolean) as Microbe[];
      });
    }, 16); // 60fps update rate

    // Clear removed microbes set every 5 seconds to prevent memory leak
    const cleanupInterval = setInterval(() => {
      removedMicrobesRef.current.clear();
    }, 5000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(cleanupInterval);
    };
  }, [isPaused, onLifeLost]);

  // Set canvas dimensions IMMEDIATELY on mount and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('📐 Canvas resized to:', canvas.width, 'x', canvas.height);
    };

    // Set immediately
    updateCanvasSize();

    // Handle window resize
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

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

      // 🔍 COMPREHENSIVE SENSOR DIAGNOSTIC
      console.log('🔍 SENSOR CHECK:', {
        sensorMode,
        orientationAlpha: orientation.current.alpha,
        orientationBeta: orientation.current.beta,
        orientationGamma: orientation.current.gamma,
        gyroAlpha: gyro.current.alpha,
        gyroBeta: gyro.current.beta,
        gyroGamma: gyro.current.gamma,
        sensorDataRefYaw: sensorDataRef.current.yaw,
        sensorDataRefPitch: sensorDataRef.current.pitch,
        orientationPermission,
        gyroPermission,
        gyroAvailable
      });

      // One-time initialization: if we have a sensor mode but sensorDataRef is still zero, initialize it
      if (sensorMode && sensorDataRef.current.yaw === 0 && sensorDataRef.current.pitch === 0) {
        if (sensorMode === 'orientation' && orientation.current.alpha !== null) {
          sensorDataRef.current.yaw = ((orientation.current.alpha || 0) * Math.PI) / 180;
          sensorDataRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, ((orientation.current.beta || 0) * Math.PI) / 180));
          console.log('🎬 INITIALIZED sensorDataRef from orientation:', orientation.current.alpha, orientation.current.beta);
        } else if (sensorMode === 'gyroscope' && gyro.current.alpha !== null) {
          sensorDataRef.current.yaw = ((gyro.current.alpha || 0) * Math.PI) / 180;
          sensorDataRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, ((gyro.current.beta || 0) * Math.PI) / 180));
          console.log('🎬 INITIALIZED sensorDataRef from gyroscope:', gyro.current.alpha, gyro.current.beta);
        }
      }

      // Update sensorDataRef with latest sensor values - PRIORITIZE DeviceOrientation
      if (sensorMode === 'orientation' && orientation.current.alpha !== null && orientation.current.beta !== null) {
        const newYaw = ((orientation.current.alpha || 0) * Math.PI) / 180;
        const newPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, ((orientation.current.beta || 0) * Math.PI) / 180));
        console.log('🔄 UPDATING sensorDataRef from ORIENTATION:', {
          alpha: orientation.current.alpha,
          beta: orientation.current.beta,
          oldYaw: sensorDataRef.current.yaw,
          newYaw,
          oldPitch: sensorDataRef.current.pitch,
          newPitch
        });
        sensorDataRef.current.yaw = newYaw;
        sensorDataRef.current.pitch = newPitch;
      } else if (sensorMode === 'gyroscope' && gyro.current.alpha !== null && gyro.current.beta !== null) {
        const newYaw = ((gyro.current.alpha || 0) * Math.PI) / 180;
        const newPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, ((gyro.current.beta || 0) * Math.PI) / 180));
        console.log('🔄 UPDATING sensorDataRef from GYROSCOPE:', {
          alpha: gyro.current.alpha,
          beta: gyro.current.beta,
          oldYaw: sensorDataRef.current.yaw,
          newYaw,
          oldPitch: sensorDataRef.current.pitch,
          newPitch
        });
        sensorDataRef.current.yaw = newYaw;
        sensorDataRef.current.pitch = newPitch;
      }

      // Camera control - use sensor data from ref for consistency
      const cameraYaw = sensorDataRef.current.yaw;
      const cameraPitch = sensorDataRef.current.pitch;
      let activeSensorData: any = null;

      if (sensorMode === 'gyroscope' && gyro.current.alpha !== null) {
        activeSensorData = { type: 'Gyroscope', alpha: gyro.current.alpha, beta: gyro.current.beta, gamma: gyro.current.gamma };
      } else if (sensorMode === 'orientation' && orientation.current.alpha !== null) {
        activeSensorData = { type: 'DeviceOrientation', alpha: orientation.current.alpha, beta: orientation.current.beta, gamma: orientation.current.gamma };
      }

      // Camera stays at origin (0, 0, 0) - only rotation changes
      cameraWorldPosRef.current.x = 0;
      cameraWorldPosRef.current.y = 0;
      cameraWorldPosRef.current.z = 0;

      // Render loop verification logging (reduced frequency)
      if (now % 3000 < 16) { // Log every 3 seconds
        console.log('🎨 Render loop active - Microbes:', microbes.length, 'Visible on canvas');
      }

      // Render microbes (READ-ONLY - no state updates!)
      microbes.forEach((microbe) => {
        // Transform world position to camera-relative view space
        const viewX = microbe.worldX - cameraWorldPosRef.current.x;
        const viewY = microbe.worldY - cameraWorldPosRef.current.y;
        const viewZ = microbe.worldZ - cameraWorldPosRef.current.z;

        // Rotate world space to camera view space (at yaw=0, camera looks toward -Z)
        const cosYaw = Math.cos(cameraYaw);
        const sinYaw = Math.sin(cameraYaw);
        const rotatedX = viewX * cosYaw - viewZ * sinYaw;
        const rotatedZ = viewX * sinYaw + viewZ * cosYaw;
        
        // Apply pitch rotation (around X axis)
        const cosPitch = Math.cos(cameraPitch);
        const sinPitch = Math.sin(cameraPitch);
        const finalY = viewY * cosPitch - rotatedZ * sinPitch;
        const finalZ = rotatedZ * cosPitch + viewY * sinPitch;

        // Add wobble for realism
        const wobbleOffset = Math.sin(microbe.wobble) * 0.05;

        // Project to screen with perspective (negative Z = in front of camera)
        const depth = Math.abs(finalZ);
        const fov = 1200; // Narrower FOV for better sizing
        const screenX = centerX + (rotatedX / depth) * fov + wobbleOffset * 50;
        const screenY = centerY + (finalY / depth) * fov;
        
        // Size based on camera-relative depth
        const scale = 300 / Math.max(0.1, depth);
        const size = microbe.size * scale;

        // Only render microbes in FRONT of camera (negative Z = in front)
        if (finalZ < 0) {
          // Debug: Draw hit detection circle around microbe
          const distanceFromCrosshair = Math.hypot(screenX - centerX, screenY - centerY);
          if (distanceFromCrosshair < 150) {
            ctx.strokeStyle = distanceFromCrosshair < 120 ? '#00ff00' : '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Render microbe
          ctx.save();
          ctx.globalAlpha = microbe.opacity;
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

      // Update and render particles in-place (no reassignment!)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;

        if (particle.life <= 0) {
          // Remove dead particle
          particlesRef.current.splice(i, 1);
        } else {
          // Render live particle
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.life;
          ctx.fillRect(particle.x, particle.y, 4, 4);
          ctx.globalAlpha = 1;
        }
      }

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
      
      // Debug: Draw hit detection zone (120px radius)
      ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

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
          ctx.fillText(`α=${activeSensorData.alpha?.toFixed(1) ?? 'null'} β=${activeSensorData.beta?.toFixed(1) ?? 'null'} γ=${activeSensorData.gamma?.toFixed(1) ?? 'null'}`, 20, 75);
        }
        
        const visibleCount = microbes.filter(m => {
          const viewZ = m.worldZ - cameraWorldPosRef.current.z;
          const viewX = m.worldX - cameraWorldPosRef.current.x;
          const cosYaw = Math.cos(-cameraYaw);
          const sinYaw = Math.sin(-cameraYaw);
          const rotatedZ = viewZ * cosYaw + viewX * sinYaw;
          return rotatedZ < 0;
        }).length;
        
        ctx.fillText(`Microbes: ${microbes.length} (${visibleCount} visible)`, 20, 95);
        ctx.fillText(`Gyro: ${gyroAvailable ? '✅' : '❌'} | Orient: ${orientationPermission ? '✅' : '❌'}`, 20, 115);
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
  }, [isPaused]); // ONLY isPaused - everything else uses refs or fresh reads

  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      console.log('🔴 handleTap CALLED!', 'isPaused:', isPaused, 'canvas:', !!canvasRef.current);
      
      if (isPaused || !canvasRef.current) {
        console.log('🔴 EARLY RETURN:', isPaused ? 'PAUSED' : 'NO CANVAS');
        return;
      }

      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Fire laser beam
      setLaserFiring(Date.now());
      console.log('🔫 LASER FIRED! Checking for hits...');

      // Use sensor data from ref (FRESH absolute values from DeviceOrientation!)
      const cameraYaw = sensorDataRef.current.yaw;
      const cameraPitch = sensorDataRef.current.pitch;

      // DEFENSIVE LOGGING - verify we have real sensor data
      if (cameraYaw === 0 && cameraPitch === 0) {
        console.error('🚨 SENSOR DATA IS ZERO! Sensor not initialized!');
      }
      console.log('📐 Camera angles from ref - Yaw:', (cameraYaw * 180 / Math.PI).toFixed(1), '° Pitch:', (cameraPitch * 180 / Math.PI).toFixed(1), '°');
      console.log('📱 Raw sensor - Alpha:', orientation.current.alpha, 'Beta:', orientation.current.beta);

      // Track state changes to apply AFTER setMicrobes completes
      let pointsToAdd = 0;
      let newComboValue = comboRef.current;
      let microbeDied = false;
      let currentScoreValue = 0;

      // Use setMicrobes with callback to get FRESH microbe data
      setMicrobes((currentMicrobes) => {
        console.log('🔴 TAP DETECTED! Checking', currentMicrobes.length, 'microbes for hits...');
        console.log('📐 Camera state - Yaw:', (cameraYaw * 180 / Math.PI).toFixed(1), '° Pitch:', (cameraPitch * 180 / Math.PI).toFixed(1), '° Crosshair at center:', centerX, centerY);
        
        let hitMicrobe = false;
        let closestMicrobe: { microbe: Microbe; screenX: number; screenY: number; size: number } | null = null;
        let minDistance = Infinity;

        // Find closest microbe to crosshair using CURRENT microbe data
        currentMicrobes.forEach((microbe) => {
          // Transform world position to camera-relative view space
          const viewX = microbe.worldX - cameraWorldPosRef.current.x;
          const viewY = microbe.worldY - cameraWorldPosRef.current.y;
          const viewZ = microbe.worldZ - cameraWorldPosRef.current.z;

          // Rotate world space to camera view space (at yaw=0, camera looks toward -Z)
          const cosYaw = Math.cos(cameraYaw);
          const sinYaw = Math.sin(cameraYaw);
          const rotatedX = viewX * cosYaw - viewZ * sinYaw;
          const rotatedZ = viewX * sinYaw + viewZ * cosYaw;
          
          // Apply pitch rotation (around X axis)
          const cosPitch = Math.cos(cameraPitch);
          const sinPitch = Math.sin(cameraPitch);
          const finalY = viewY * cosPitch - rotatedZ * sinPitch;
          const finalZ = rotatedZ * cosPitch + viewY * sinPitch;

          // Use finalZ with correct sign convention (negative = in front, positive = behind)
          const depth = Math.abs(finalZ);
          if (finalZ >= 0) {
            console.log('⏭️ Skipping microbe - behind camera, finalZ:', finalZ.toFixed(1));
            return;
          }
          
          console.log('✅ Microbe IN RANGE - Type:', microbe.type, 'Depth:', depth.toFixed(1), 'World pos:', microbe.worldX.toFixed(1), microbe.worldY.toFixed(1), microbe.worldZ.toFixed(1));

          const wobbleOffset = Math.sin(microbe.wobble) * 0.05;
          const fov = 1200; // Match rendering FOV
          const screenX = centerX + (rotatedX / depth) * fov + wobbleOffset * 50;
          const screenY = centerY + (finalY / depth) * fov;
          
          console.log('🔍 Microbe projection - screen:', screenX.toFixed(0), screenY.toFixed(0), 'depth:', depth.toFixed(1));
          
          // Use depth-based scale like rendering
          const scale = 300 / Math.max(0.1, depth);
          const size = microbe.size * scale;

          const distance = Math.hypot(screenX - centerX, screenY - centerY);
          
          // Log near misses for debugging
          if (distance < 150 && distance >= 120) {
            console.log('🔸 Near miss! Microbe type:', microbe.type, 'Distance:', distance.toFixed(0), 'px');
          }
          
          // Check if within crosshair area (120px radius - doubled for easier hits)
          if (distance < 120 && distance < minDistance) {
            minDistance = distance;
            closestMicrobe = { microbe, screenX, screenY, size };
          }
        });

        if (closestMicrobe) {
          hitMicrobe = true;
          const { microbe, screenX, screenY } = closestMicrobe;
          console.log('🎯 HIT! Microbe:', microbe.type, 'at screen:', screenX.toFixed(0), screenY.toFixed(0), 'Distance from crosshair:', minDistance.toFixed(1), 'px');
          
          const newHealth = microbe.health - 1;
          
          // Calculate particles BEFORE state updates
          const particlesToAdd: Particle[] = [];
          
          // Always add hit particles (10)
          particlesToAdd.push(...Array.from({ length: 10 }, () => ({
            x: screenX,
            y: screenY,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: getMicrobeColor(microbe.type),
          })));
          
          // If microbe will die, add BIG explosion particles (40 more)
          if (newHealth <= 0) {
            particlesToAdd.push(...Array.from({ length: 40 }, () => ({
              x: screenX,
              y: screenY,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 1.5,
              color: getMicrobeColor(microbe.type),
            })));
            
            // Mark for removal IMMEDIATELY, before map operation starts
            removedMicrobesRef.current.add(microbe.id);
            console.log('🗑️ Marked for removal BEFORE map:', microbe.id);
          }
          
          console.log('💥 Prepared', particlesToAdd.length, 'particles!', newHealth <= 0 ? '(BIG EXPLOSION!)' : '(hit)');
          
          // Add particles directly to ref (no state batching!)
          particlesRef.current.push(...particlesToAdd);
          console.log('✅ Particles now:', particlesRef.current.length);
          
          // Update microbe state with CURRENT data
          const updatedMicrobes = currentMicrobes.map((m) => {
            if (m.id !== microbe.id) return m;

            if (newHealth <= 0) {
              // Microbe eliminated - CALCULATE changes but DON'T apply yet
              microbeDied = true;
              newComboValue = comboRef.current + 1;
              const comboMultiplier = 1 + Math.floor(newComboValue / 5) * 0.5;
              pointsToAdd = Math.floor(
                m.points * comboMultiplier * (activePowerUpRef.current?.type === "double" ? 2 : 1)
              );

              // Decrement microbe count!
              microbeCountRef.current = Math.max(0, microbeCountRef.current - 1);
              console.log('🗑️ Microbe removed, count now:', microbeCountRef.current);

              // Already marked for removal before map operation
              return null; // Remove microbe
            }

            return { ...m, health: newHealth };
          }).filter(Boolean) as Microbe[];
          
          console.log('🔄 After hit - remaining microbes:', updatedMicrobes.length);
          return updatedMicrobes; // Return the updated array
        } else {
          console.log('❌ NO HIT - Microbes:', currentMicrobes.length, 'Center:', centerX, centerY, 'Yaw:', (cameraYaw * 180 / Math.PI).toFixed(1), '° Pitch:', (cameraPitch * 180 / Math.PI).toFixed(1), '°');
          return currentMicrobes; // No hit, no change
        }
      });

      // Apply score/combo changes AFTER setMicrobes completes (no nested setState!)
      if (microbeDied) {
        setScore((prev) => {
          currentScoreValue = prev + pointsToAdd;
          return currentScoreValue;
        });
        setCombo(newComboValue);
        
        // Call callbacks after state is set
        setTimeout(() => {
          onScoreChange(currentScoreValue);
          onComboChange(newComboValue);
          onMicrobeEliminated();
        }, 0);
        
        lastComboTimeRef.current = Date.now();
      }
    },
    [isPaused, sensorMode, onScoreChange, onComboChange, onMicrobeEliminated]
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
                  {gyroAvailable ? "✅" : "❌"} Gyroscope
                </p>
                <p>
                  {orientationPermission ? "✅" : "❌"} Orientation
                </p>
              </div>
            </div>
            
            {permissionStatus && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs">
                {permissionStatus}
              </div>
            )}
            
            <Button onClick={handleRequestPermissions} className="w-full" size="lg">
              Grant Permissions
            </Button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onTouchEnd={handleTap}
        className="absolute inset-0 w-full h-full z-10"
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
