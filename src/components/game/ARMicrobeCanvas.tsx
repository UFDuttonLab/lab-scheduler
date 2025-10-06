import { useEffect, useRef, useState, useCallback } from "react";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useGyroscope } from "@/hooks/useGyroscope";
import { PowerUp } from "./PowerUp";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  wobble: number;
  shapePoints: number[];
  tentacleAngles: number[];
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

const projectToScreen = (
  worldX: number,
  worldY: number,
  worldZ: number,
  cameraYaw: number,
  cameraPitch: number,
  canvasWidth: number,
  canvasHeight: number
): { screenX: number; screenY: number; isVisible: boolean; distance: number; angle: number } => {
  
  const cosYaw = Math.cos(-cameraYaw);
  const sinYaw = Math.sin(-cameraYaw);
  const rotatedX = worldX * cosYaw - worldZ * sinYaw;
  const rotatedZ = worldX * sinYaw + worldZ * cosYaw;
  
  const cosPitch = Math.cos(-cameraPitch);
  const sinPitch = Math.sin(-cameraPitch);
  const rotatedY = worldY * cosPitch - rotatedZ * sinPitch;
  const finalZ = worldY * sinPitch + rotatedZ * cosPitch;
  
  const angle = Math.atan2(rotatedX, -finalZ);
  
  if (finalZ >= -0.1) {
    const distance = Math.sqrt(worldX ** 2 + worldY ** 2 + worldZ ** 2);
    return { screenX: 0, screenY: 0, isVisible: false, distance, angle };
  }
  
  const fov = 60 * Math.PI / 180;
  const scale = canvasHeight / (2 * Math.tan(fov / 2));
  
  const screenX = (canvasWidth / 2) + (rotatedX / -finalZ) * scale;
  const screenY = (canvasHeight / 2) - (rotatedY / -finalZ) * scale;
  
  const distance = Math.sqrt(worldX ** 2 + worldY ** 2 + worldZ ** 2);
  
  const margin = 200;
  const isVisible = screenX > -margin && screenX < canvasWidth + margin &&
                    screenY > -margin && screenY < canvasHeight + margin;
  
  return { screenX, screenY, isVisible, distance, angle };
};

export const ARMicrobeCanvas = ({
  onScoreChange,
  onLifeLost,
  onMicrobeEliminated,
  onComboChange,
  lives,
  isPaused,
}: ARMicrobeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const gyro = useGyroscope();
  const orientation = useDeviceOrientation();
  const [microbes, setMicrobes] = useState<Microbe[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const microbesRef = useRef<Microbe[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; endTime: number } | null>(null);
  const laserFiringRef = useRef<number>(0);
  const [showDebug, setShowDebug] = useState(false);
  const [sensorMode, setSensorMode] = useState<'gyroscope' | 'orientation' | null>(null);
  const [showPermissionOverlay, setShowPermissionOverlay] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState("");
  const lastComboTimeRef = useRef<number>(Date.now());
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const comboRef = useRef(0);
  const activePowerUpRef = useRef<{ type: string; endTime: number } | null>(null);
  
  const [currentWave, setCurrentWave] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [waveMicrobesSpawned, setWaveMicrobesSpawned] = useState(0);
  const waveActiveRef = useRef(false);
  const currentWaveRef = useRef(1);
  const waveMicrobesSpawnedRef = useRef(0);
  const sensorDataRef = useRef({ yaw: 0, pitch: 0 });
  const [isIOS, setIsIOS] = useState(false);
  const [browserWarning, setBrowserWarning] = useState("");

  useEffect(() => {
    console.log("🦠 AR Microbe Shooter V2 - LARGE microbes, close spawn, fast movement");
  }, []);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    if (iOS) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!isSafari) {
        setBrowserWarning("iOS detected: Please use Safari browser for best results");
      }
      setPermissionStatus("iOS detected - Safari required for motion sensors");
    } else {
      setPermissionStatus("Android detected - sensors will activate automatically");
    }
  }, []);

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
    const wave = currentWaveRef.current;
    const rand = Math.random() * 100;
    let type: Microbe["type"] = "basic";
    let health = 1;
    let points = 10;
    // FIXED: Faster speed - 0.08 base instead of 0.042
    let speed = 0.08 + (wave * 0.008);
    // FIXED: Larger base size - 50 instead of 30
    let size = 50;

    if (wave > 5 && rand < 5) {
      type = "boss";
      health = 8 + wave;
      points = 250;
      speed = 0.07 + (wave * 0.007);
      size = 80;
    } else if (rand < 5) {
      type = "golden";
      health = 1;
      points = 100;
      speed = 0.12 + (wave * 0.01);
      size = 45;
    } else if (wave > 3 && rand < 20) {
      type = "tank";
      health = 2 + Math.floor(wave / 2);
      points = 50;
      speed = 0.06 + (wave * 0.006);
      size = 65;
    } else if (wave > 2 && rand < 35) {
      type = "fast";
      health = 1;
      points = 25;
      speed = 0.11 + (wave * 0.01);
      size = 40;
    }

    // FIXED: Spawn MUCH closer - 8-15 units instead of 20-30
    const spawnDistance = 8 + Math.random() * 7;
    const angleOffset = (Math.random() - 0.5) * (Math.PI / 3);
    const heightOffset = (Math.random() - 0.5) * 3;
    
    const spawnYaw = cameraYaw + angleOffset;
    const x = Math.sin(spawnYaw) * spawnDistance;
    const z = -Math.cos(spawnYaw) * spawnDistance;
    const y = heightOffset;

    const numPoints = 8 + Math.floor(Math.random() * 5);
    const shapePoints = [];
    for (let i = 0; i < numPoints; i++) {
      const radius = 0.7 + Math.random() * 0.4;
      shapePoints.push(radius);
    }

    const numTentacles = type === "boss" ? 16 : type === "fast" ? 12 : 10;
    const tentacleAngles = [];
    for (let i = 0; i < numTentacles; i++) {
      tentacleAngles.push((i / numTentacles) * Math.PI * 2);
    }

    console.log(`🦠 Spawning ${type} at distance ${spawnDistance.toFixed(1)}, speed ${speed.toFixed(3)}`);

    setMicrobes((prev) => [...prev, {
      id: `microbe-${Date.now()}-${Math.random()}`,
      x, y, z, type, health, maxHealth: health,
      size, speed, points, spawnTime: Date.now(),
      opacity: 1, wobble: 0,
      shapePoints,
      tentacleAngles,
    }]);
    setWaveMicrobesSpawned(prev => {
      const newCount = prev + 1;
      waveMicrobesSpawnedRef.current = newCount;
      return newCount;
    });
  }, []);

  const spawnPowerUp = useCallback((cameraYaw: number) => {
    const types: PowerUpItem["type"][] = ["freeze", "rapid", "double", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    const spawnDistance = 3 + Math.random() * 2;
    const angleOffset = (Math.random() - 0.5) * (Math.PI / 4);
    const heightOffset = (Math.random() - 0.5) * 2;
    const spawnYaw = cameraYaw + angleOffset;
    const x = Math.sin(spawnYaw) * spawnDistance;
    const z = -Math.cos(spawnYaw) * spawnDistance;
    const y = heightOffset;
    setPowerUps((prev) => [...prev, { id: `powerup-${Date.now()}`, type, x, y, z, spawnTime: Date.now() }]);
  }, []);

  const activatePowerUp = useCallback((type: PowerUpItem["type"]) => {
    const duration = 10000;
    setActivePowerUp({ type, endTime: Date.now() + duration });
    activePowerUpRef.current = { type, endTime: Date.now() + duration };
    
    toast.success(`Power-up activated!`, {
      description: {
        freeze: "Enemies frozen for 10 seconds!",
        rapid: "Rapid fire for 10 seconds!",
        double: "Double points for 10 seconds!",
        shield: "Shield active for 10 seconds!"
      }[type]
    });
  }, []);

  const startNewWave = useCallback(() => {
    const nextWave = currentWaveRef.current + 1;
    setCurrentWave(nextWave);
    currentWaveRef.current = nextWave;
    setWaveActive(true);
    waveActiveRef.current = true;
    setWaveMicrobesSpawned(0);
    waveMicrobesSpawnedRef.current = 0;
    toast.success(`Wave ${nextWave} Starting!`, {
      description: `${5 + nextWave * 3} microbes incoming!`
    });
  }, []);

  const handleRequestPermissions = async () => {
    setPermissionStatus("Activating sensors...");
    
    if (isIOS) {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permissionState = await (DeviceOrientationEvent as any).requestPermission();
          
          if (permissionState === 'granted') {
            setPermissionStatus("Waiting for sensor data...");
            
            const startTime = Date.now();
            while (Date.now() - startTime < 3000) {
              if (orientation.alpha !== null && orientation.beta !== null) {
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (orientation.alpha !== null && orientation.beta !== null) {
              toast.success("Sensors active! Hold phone upright and look around!");
              setPermissionStatus("Sensors active");
              setShowPermissionOverlay(false);
              setWaveActive(true);
              waveActiveRef.current = true;
            } else {
              toast.error("Sensors not responding - please reload");
              setPermissionStatus("Sensor initialization failed");
            }
          } else {
            toast.error("Motion sensor permission required");
            setPermissionStatus("Permission denied - game cannot work without sensors");
          }
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        toast.error("Failed to enable sensors - ensure you're using Safari");
        setPermissionStatus("Error: Use Safari browser on iOS");
      }
    } else {
      await gyro.requestPermission();
      await orientation.requestPermission();
      
      setPermissionStatus("Waiting for sensor data...");
      
      const startTime = Date.now();
      while (Date.now() - startTime < 3000) {
        if (orientation.alpha !== null || (gyro.alpha !== null && gyro.sensorAvailable)) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (orientation.alpha !== null || (gyro.alpha !== null && gyro.sensorAvailable)) {
        toast.success("Sensors active! Hold phone upright and look around!");
        setPermissionStatus("Sensors active");
        setShowPermissionOverlay(false);
        setWaveActive(true);
        waveActiveRef.current = true;
      } else {
        toast.error("Sensors not responding - please reload and try again");
        setPermissionStatus("No sensor data detected");
      }
    }
  };

  useEffect(() => {
    if (orientation.alpha !== null && orientation.beta !== null) {
      setSensorMode('orientation');
      const adjustedBeta = (orientation.beta || 0) - 90;
      sensorDataRef.current.yaw = ((orientation.alpha || 0) * Math.PI) / 180;
      sensorDataRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, (adjustedBeta * Math.PI) / 180));
      return;
    }
    
    if (gyro.permissionGranted && gyro.sensorAvailable && gyro.alpha !== null && gyro.beta !== null) {
      setSensorMode('gyroscope');
      const adjustedBeta = (gyro.beta || 0) - 90;
      sensorDataRef.current.yaw = ((gyro.alpha || 0) * Math.PI) / 180;
      sensorDataRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, (adjustedBeta * Math.PI) / 180));
      return;
    }
  }, [gyro.permissionGranted, gyro.sensorAvailable, gyro.alpha, gyro.beta, orientation.alpha, orientation.beta]);

  useEffect(() => {
    if (sensorMode === 'orientation' && orientation.alpha !== null && orientation.beta !== null) {
      const adjustedBeta = (orientation.beta || 0) - 90;
      sensorDataRef.current.yaw = ((orientation.alpha || 0) * Math.PI) / 180;
      sensorDataRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, (adjustedBeta * Math.PI) / 180));
    } else if (sensorMode === 'gyroscope' && gyro.alpha !== null && gyro.beta !== null) {
      const adjustedBeta = (gyro.beta || 0) - 90;
      sensorDataRef.current.yaw = ((gyro.alpha || 0) * Math.PI) / 180;
      sensorDataRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, (adjustedBeta * Math.PI) / 180));
    }
  }, [orientation.alpha, orientation.beta, gyro.alpha, gyro.beta, sensorMode]);

  useEffect(() => { microbesRef.current = microbes; }, [microbes]);
  useEffect(() => { powerUpsRef.current = powerUps; }, [powerUps]);
  useEffect(() => { currentWaveRef.current = currentWave; }, [currentWave]);
  useEffect(() => { waveActiveRef.current = waveActive; }, [waveActive]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { activePowerUpRef.current = activePowerUp; }, [activePowerUp]);
  useEffect(() => { waveMicrobesSpawnedRef.current = waveMicrobesSpawned; }, [waveMicrobesSpawned]);

  useEffect(() => {
    if (isPaused) return;
    
    const checkInterval = setInterval(() => {
      if (!waveActiveRef.current) return;
      
      const allSpawned = waveMicrobesSpawnedRef.current > 0 && 
                        waveMicrobesSpawnedRef.current >= (5 + currentWaveRef.current * 3);
      const noneRemaining = microbesRef.current.length === 0;
      
      if (allSpawned && noneRemaining) {
        setWaveActive(false);
        waveActiveRef.current = false;
        toast.success(`Wave ${currentWaveRef.current} Complete!`);
        
        setTimeout(() => {
          startNewWave();
        }, 3000);
      }
    }, 500);
    
    return () => clearInterval(checkInterval);
  }, [isPaused, startNewWave]);

  useEffect(() => {
    if (isPaused || !sensorMode || !waveActive) return;
    const targetMicrobes = 5 + (currentWave * 3);
    const waveDuration = Math.max(10, 22 - (currentWave * 2));
    const spawnInterval = Math.floor((waveDuration * 1000) / targetMicrobes);
    
    const interval = setInterval(() => {
      if (waveMicrobesSpawnedRef.current < targetMicrobes) {
        spawnMicrobe(sensorDataRef.current.yaw);
      }
    }, spawnInterval);
    
    return () => clearInterval(interval);
  }, [isPaused, sensorMode, waveActive, currentWave, spawnMicrobe]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (Date.now() - lastPowerUpSpawnRef.current > 25000 && powerUps.length < 2 && Math.random() < 0.3) {
        spawnPowerUp(sensorDataRef.current.yaw);
        lastPowerUpSpawnRef.current = Date.now();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, powerUps.length, spawnPowerUp]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setPowerUps((prev) => prev.filter(p => (now - p.spawnTime) / 1000 < 15));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      if (Date.now() - lastComboTimeRef.current > 2000 && comboRef.current > 0) {
        setCombo(0);
        onComboChange(0);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPaused, onComboChange]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMicrobes((prev) => prev.map((microbe) => {
        const age = (now - microbe.spawnTime) / 1000;
        const newWobble = microbe.wobble + 0.05;
        const distance = Math.sqrt(microbe.x ** 2 + microbe.y ** 2 + microbe.z ** 2);
        
        if (distance < 0.5 || age > 10) {
          onLifeLost();
          return null;
        }

        const moveSpeed = microbe.speed;
        const newZ = microbe.z + moveSpeed;
        
        return {
          ...microbe,
          z: newZ,
          wobble: newWobble,
          opacity: (microbe.type === "tank" || microbe.type === "boss") && Math.floor(age) % 5 === 0 && age % 1 < 0.5 ? 0.5 : 1.0,
        };
      }).filter(Boolean) as Microbe[]);
    }, 16);
    return () => clearInterval(interval);
  }, [isPaused, onLifeLost]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (activePowerUpRef.current && Date.now() > activePowerUpRef.current.endTime) {
        setActivePowerUp(null);
        activePowerUpRef.current = null;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const cameraYaw = sensorDataRef.current.yaw;
      const cameraPitch = sensorDataRef.current.pitch;

      microbesRef.current.forEach((microbe) => {
        const projection = projectToScreen(microbe.x, microbe.y, microbe.z, cameraYaw, cameraPitch, canvas.width, canvas.height);
        if (!projection.isVisible) return;
        
        const screenX = projection.screenX;
        const screenY = projection.screenY;
        
        // FIXED: Better size scaling - much more visible at all distances
        // Old: max(0.3, min(3, 8/distance)) gave 9px at distance 25
        // New: 1.5 + (15-distance)/15 * 3 gives better range
        // Distance 15: 1.5 scale = 75px
        // Distance 10: 2.5 scale = 125px
        // Distance 5: 3.5 scale = 175px
        // Distance 2: 4.3 scale = 215px
        const scaleFactor = Math.max(1.2, Math.min(5, 1.5 + (15 - projection.distance) / 15 * 3.5));
        const size = microbe.size * scaleFactor;
        
        const distanceFromCrosshair = Math.hypot(screenX - centerX, screenY - centerY);
        const baseColor = getMicrobeColor(microbe.type);
        const targetColor = distanceFromCrosshair < 150 ? '#00ff00' : baseColor;
        
        ctx.globalAlpha = microbe.opacity;
        
        // Draw tentacles
        microbe.tentacleAngles.forEach((baseAngle, i) => {
          const wobbleOffset = Math.sin(microbe.wobble * 2 + i * 0.5) * 0.3;
          const angle = baseAngle + wobbleOffset;
          const length = size * (0.35 + Math.sin(microbe.wobble + i) * 0.15);
          
          const startX = screenX + Math.cos(angle) * (size * 0.45);
          const startY = screenY + Math.sin(angle) * (size * 0.45);
          const endX = screenX + Math.cos(angle) * (size * 0.45 + length);
          const endY = screenY + Math.sin(angle) * (size * 0.45 + length);
          
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = Math.max(2, size * 0.05);
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
        
        // Draw blob body
        ctx.fillStyle = targetColor;
        ctx.beginPath();
        for (let i = 0; i < microbe.shapePoints.length; i++) {
          const angle = (i / microbe.shapePoints.length) * Math.PI * 2;
          const wobbleOffset = Math.sin(microbe.wobble * 3 + i) * 0.08;
          const radius = (size / 2) * (microbe.shapePoints[i] + wobbleOffset);
          const x = screenX + Math.cos(angle) * radius;
          const y = screenY + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        
        // Nucleus
        const nucleusColors: { [key: string]: string } = {
          basic: "#166534",
          fast: "#1e40af", 
          tank: "#991b1b",
          golden: "#d97706",
          boss: "#6b21a8"
        };
        ctx.fillStyle = nucleusColors[microbe.type] || "#166534";
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < microbe.shapePoints.length; i++) {
          const angle = (i / microbe.shapePoints.length) * Math.PI * 2;
          const wobbleOffset = Math.sin(microbe.wobble * 3 + i) * 0.08;
          const radius = (size / 2) * (microbe.shapePoints[i] + wobbleOffset);
          const x = screenX + Math.cos(angle) * radius;
          const y = screenY + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Distance indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${projection.distance.toFixed(1)}m`, screenX, screenY - size / 2 - 25);
        
        ctx.globalAlpha = 1.0;

        // Health bar
        if (microbe.health < microbe.maxHealth) {
          const barWidth = size;
          const barHeight = 6;
          const barX = screenX - barWidth / 2;
          const barY = screenY - size / 2 - 12;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          const healthPercent = microbe.health / microbe.maxHealth;
          ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
          ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
      });

      // Off-screen indicators
      microbesRef.current.forEach((microbe) => {
        const projection = projectToScreen(microbe.x, microbe.y, microbe.z, cameraYaw, cameraPitch, canvas.width, canvas.height);
        if (projection.isVisible || projection.distance > 15) return;
        
        const indicatorDistance = Math.min(canvas.width, canvas.height) / 2 - 60;
        const indicatorX = centerX + Math.sin(projection.angle) * indicatorDistance;
        const indicatorY = centerY - Math.cos(projection.angle) * indicatorDistance;
        
        ctx.save();
        ctx.translate(indicatorX, indicatorY);
        ctx.rotate(projection.angle);
        ctx.fillStyle = getMicrobeColor(microbe.type);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();
      });

      // Radar
      const radarSize = 100;
      const radarX = canvas.width - radarSize - 20;
      const radarY = canvas.height - radarSize - 20;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(radarX + radarSize / 2, radarY + radarSize / 2, radarSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(radarX + radarSize / 2, radarY + radarSize / 2, radarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      microbesRef.current.forEach((microbe) => {
        const distance = Math.sqrt(microbe.x ** 2 + microbe.z ** 2);
        if (distance > 15) return;
        const radarScale = (radarSize / 2) / 15;
        const dotX = radarX + radarSize / 2 + microbe.x * radarScale;
        const dotY = radarY + radarSize / 2 + microbe.z * radarScale;
        ctx.fillStyle = getMicrobeColor(microbe.type);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Power-ups
      powerUpsRef.current.forEach((powerUp) => {
        const age = (now - powerUp.spawnTime) / 1000;
        if (age > 15) return;
        const projection = projectToScreen(powerUp.x, powerUp.y, powerUp.z, cameraYaw, cameraPitch, canvas.width, canvas.height);
        if (!projection.isVisible) return;
        
        const pulse = 1 + Math.sin(now / 200) * 0.2;
        ctx.font = `${40 * pulse}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const emoji = { freeze: "❄️", rapid: "⚡", double: "✨", shield: "🛡️" }[powerUp.type];
        ctx.fillText(emoji, projection.screenX, projection.screenY);
      });

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x, p.y, 4, 4);
          ctx.globalAlpha = 1;
        }
      }

      // Laser
      if (laserFiringRef.current > 0 && now - laserFiringRef.current < 150) {
        const laserAlpha = 1 - (now - laserFiringRef.current) / 150;
        ctx.save();
        ctx.globalAlpha = laserAlpha * 0.8;
        const gradient = ctx.createLinearGradient(centerX, canvas.height, centerX, centerY);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${laserAlpha})`);
        gradient.addColorStop(1, `rgba(255, 150, 150, ${laserAlpha * 0.3})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, canvas.height);
        ctx.lineTo(centerX - 2, centerY);
        ctx.lineTo(centerX + 2, centerY);
        ctx.lineTo(centerX + 15, canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Crosshair
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused]);

  const handleTap = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPaused || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if ('vibrate' in navigator) navigator.vibrate(50);
    laserFiringRef.current = Date.now();

    const cameraYaw = sensorDataRef.current.yaw;
    const cameraPitch = sensorDataRef.current.pitch;

    let powerUpCollected = false;
    setPowerUps((currentPowerUps) => {
      let closestPowerUp: { powerUp: PowerUpItem; distance: number } | null = null;
      let minDistance = Infinity;

      currentPowerUps.forEach((powerUp) => {
        const projection = projectToScreen(powerUp.x, powerUp.y, powerUp.z, cameraYaw, cameraPitch, canvas.width, canvas.height);
        if (!projection.isVisible) return;
        
        const screenDistance = Math.hypot(projection.screenX - centerX, projection.screenY - centerY);
        
        if (screenDistance < 100 && projection.distance < minDistance) {
          minDistance = projection.distance;
          closestPowerUp = { powerUp, distance: projection.distance };
        }
      });

      if (closestPowerUp) {
        powerUpCollected = true;
        activatePowerUp(closestPowerUp.powerUp.type);
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        return currentPowerUps.filter(p => p.id !== closestPowerUp!.powerUp.id);
      }
      
      return currentPowerUps;
    });

    if (powerUpCollected) return;

    setMicrobes((currentMicrobes) => {
      let closestMicrobe: { microbe: Microbe; distance: number; projection: any } | null = null;
      let minDistance = Infinity;

      currentMicrobes.forEach((microbe) => {
        const projection = projectToScreen(microbe.x, microbe.y, microbe.z, cameraYaw, cameraPitch, canvas.width, canvas.height);
        if (!projection.isVisible) return;
        
        const screenDistance = Math.hypot(projection.screenX - centerX, projection.screenY - centerY);
        
        if (screenDistance < 150 && projection.distance < minDistance) {
          minDistance = projection.distance;
          closestMicrobe = { microbe, distance: projection.distance, projection: { screenX: projection.screenX, screenY: projection.screenY } };
        }
      });

      if (closestMicrobe) {
        const { microbe, projection } = closestMicrobe;
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
        
        const newHealth = microbe.health - 1;
        const particlesToAdd: Particle[] = Array.from({ length: 8 }, () => ({
          x: projection.screenX, y: projection.screenY,
          vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
          life: 1, color: getMicrobeColor(microbe.type),
        }));
        
        if (newHealth <= 0) {
          particlesToAdd.push(...Array.from({ length: 25 }, () => ({
            x: projection.screenX, y: projection.screenY,
            vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
            life: 1.5, color: getMicrobeColor(microbe.type),
          })));
          if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        }
        
        particlesRef.current.push(...particlesToAdd);
        
        return currentMicrobes.map((m) => {
          if (m.id !== microbe.id) return m;
          if (newHealth <= 0) {
            const newCombo = comboRef.current + 1;
            const comboMultiplier = 1 + Math.floor(newCombo / 5) * 0.5;
            const pointsEarned = Math.floor(m.points * comboMultiplier * (activePowerUpRef.current?.type === "double" ? 2 : 1));
            
            console.log(`💥 Killed ${m.type}, earned ${pointsEarned} points, combo: ${newCombo}`);
            
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
      }
      return currentMicrobes;
    });
  }, [isPaused, onScoreChange, onComboChange, onMicrobeEliminated, activatePowerUp]);

  return (
    <>
      {showPermissionOverlay && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-background/95 rounded-lg p-6 max-w-sm mx-4 text-center space-y-4">
            <h2 className="text-2xl font-bold">AR Microbe Shooter</h2>
            
            {browserWarning && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
                {browserWarning}
              </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-left space-y-2">
              <p className="font-semibold">Platform:</p>
              <p className="text-muted-foreground">{permissionStatus}</p>
              <div className="mt-2 space-y-1">
                <p className="text-muted-foreground">
                  {orientation.alpha !== null ? "✅" : "❌"} Device Orientation
                </p>
                <p className="text-muted-foreground">
                  {isIOS ? "📱 iOS Device" : "🤖 Android Device"}
                </p>
              </div>
            </div>
            
            <Button onClick={handleRequestPermissions} className="w-full" size="lg">
              {isIOS ? "Grant Permission & Start" : "Start Game"}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              {isIOS ? "Safari required on iOS" : "Works on any browser"}
            </p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onTouchStart={handleTap}
        className="absolute inset-0 w-full h-full z-10 touch-action-none"
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />

      <div className="absolute bottom-32 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold z-40 pointer-events-none">
        Microbes: {microbesRef.current.length}
      </div>

      {/* ADDED: Local score display to debug scoring */}
      <div className="absolute bottom-44 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold z-40 pointer-events-none">
        Local Score: {score}
      </div>

      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-bold z-40 pointer-events-none">
        Wave {currentWave} {!waveActive && '- Break'}
      </div>

      {showDebug && (
        <button
          onClick={() => setShowDebug(false)}
          className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-2 rounded-lg text-xs z-40"
        >
          Hide
        </button>
      )}
      
      {activePowerUp && <PowerUp type={activePowerUp.type} endTime={activePowerUp.endTime} />}
    </>
  );
};
