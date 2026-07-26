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
  /** Spawn time on the accumulated ACTIVE-play clock, used for expiry. */
  spawnActiveTime: number;
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
  /** Fired on every shot, hit or miss. Needed for a real accuracy figure. */
  onTap?: () => void;
  lives: number;
  isPaused: boolean;
}

/** Microbes in a wave. Grows steadily rather than exploding. */
const WAVE_SIZE = (wave: number) => 4 + wave * 2;

/** Gap between spawns, tightening with the wave but never below ~0.9s. */
const WAVE_SPAWN_INTERVAL_MS = (wave: number) => Math.max(900, 2400 - (wave - 1) * 140);

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
  
  // Horizontal FOV, derived from canvas WIDTH.
  //
  // This used to divide canvasHeight by tan(30deg) and apply that scale to X as well. On
  // a portrait phone (390x844) that produced a horizontal field of view of only about
  // +/-15 degrees, while microbes spawn across +/-30 - so half of every wave began
  // outside the frustum as an off-screen arrow you had no time to turn towards.
  // Deriving from width gives a camera-like ~65 degrees across, and keeps square pixels.
  const fov = 65 * Math.PI / 180;
  const scale = canvasWidth / (2 * Math.tan(fov / 2));
  
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
  onTap,
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
  const lastComboTimeRef = useRef<number>(0);
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const activePowerUpRef = useRef<{ type: string; endTime: number } | null>(null);
  
  const [currentWave, setCurrentWave] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [waveMicrobesSpawned, setWaveMicrobesSpawned] = useState(0);
  const waveActiveRef = useRef(false);
  const currentWaveRef = useRef(1);
  const waveMicrobesSpawnedRef = useRef(0);
  const sensorDataRef = useRef({ yaw: 0, pitch: 0 });
  // Logical (CSS px) drawing size. The canvas backing store is this multiplied by the
  // device pixel ratio, so all game maths stays in CSS pixels while the render is sharp.
  const viewRef = useRef({ w: 0, h: 0 });
  const dprRef = useRef(1);
  // Timestamp of the last life lost, used for the damage flash.
  const damageFlashRef = useRef(0);
  // Escapes counted inside the setMicrobes updater, drained on the next tick.
  const pendingEscapesRef = useRef(0);
  const waveBreakTimerRef = useRef<number | null>(null);
  // Ids already resolved by a tap this frame, so a second tap cannot double-score them.
  const claimedRef = useRef<Set<string>>(new Set());
  // Accumulated ACTIVE play time in ms, and the timestamp of the last movement tick.
  //
  // Everything used to key off wall-clock Date.now(): microbe expiry (age > 10) kept
  // advancing while the game was paused, so pausing for more than 10 seconds killed every
  // microbe alive the instant you resumed and drained all three lives. Separately, motion
  // advanced a fixed amount per setInterval tick with no elapsed-time integration, so on a
  // slower phone the ticks fell behind the wall clock and microbes hit the timeout while
  // still far away. Both are fixed by driving movement AND expiry from the same
  // accumulated active-time clock.
  const activeTimeRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("🦠 AR Microbe Shooter V2");
  }, []);

  // Activate this component's OWN sensor hooks.
  //
  // useDeviceOrientation/useGyroscope gate their event listeners on a per-instance
  // permissionGranted flag. ARMicrobeShooter requests permission on ITS instances, but the
  // canvas creates fresh ones and never did - so their listeners were never attached,
  // orientation.alpha stayed null, sensorMode never became non-null, and the AR camera
  // could not turn. Every sensor-mode branch in this file was unreachable.
  useEffect(() => {
    orientation.requestPermission().catch(() => {});
    gyro.requestPermission().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bootstrap wave 1.
  // waveActive starts false and the only caller of startNewWave() is the wave-complete
  // checker, which returns early while waveActive is false - so no wave ever began and
  // not a single microbe ever spawned. This kicks off the first wave on mount.
  // It does not call startNewWave() because that increments the counter, which would
  // start the game on wave 2.
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    setWaveActive(true);
    waveActiveRef.current = true;
    setWaveMicrobesSpawned(0);
    waveMicrobesSpawnedRef.current = 0;
    toast.success("Wave 1 Starting!", {
      description: `${WAVE_SIZE(currentWaveRef.current)} microbes incoming!`,
    });
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
    // Approach speed, in world units per 16ms tick (~62.5 ticks/sec).
    //
    // Previously 0.088/tick at wave 1 = 5.5 units/sec, and microbes spawned 8-15 units
    // out - a 1.5 to 2.7 second window from spawn to escape on the EASIEST wave, before
    // you have even located them. Spotting, turning and tapping on a phone eats most of a
    // second by itself. 0.055 + wave*0.005 gives ~3.4 u/s at wave 1, which against the
    // new 14-22 unit spawn range is a 4-6 second window, tightening as waves progress.
    let speed = 0.055 + (wave * 0.005);
    // FIXED: Larger base size - 50 instead of 30
    let size = 50;

    if (wave > 5 && rand < 5) {
      type = "boss";
      health = 8 + wave;
      points = 250;
      speed = 0.048 + (wave * 0.004);
      size = 80;
    } else if (rand < 5) {
      type = "golden";
      health = 1;
      points = 100;
      speed = 0.078 + (wave * 0.006);
      size = 45;
    } else if (wave > 3 && rand < 20) {
      type = "tank";
      health = 2 + Math.floor(wave / 2);
      points = 50;
      speed = 0.042 + (wave * 0.0035);
      size = 65;
    } else if (wave > 2 && rand < 35) {
      type = "fast";
      health = 1;
      points = 25;
      speed = 0.072 + (wave * 0.006);
      size = 40;
    }

    // Spawn far enough away to be seen and reacted to. Paired with the slower approach
    // speeds above this is the single biggest fairness change in the game.
    const spawnDistance = 14 + Math.random() * 8;

    // Keep the spawn arc inside what the player can actually reach.
    //
    // projectToScreen derives `scale` from canvas HEIGHT and applies it to X as well, so
    // the horizontal field of view is atan((width/2)/scale) - on a portrait phone that is
    // only about +/-15 degrees. Spawning across a fixed +/-30 degrees therefore put half
    // the microbes outside the frustum. With working sensors that is fine (you turn to
    // face them), but in touch mode the camera never turns and they are unkillable.
    // Spawn arc. With the corrected ~65 degree horizontal FOV a +/-30 degree arc now sits
    // just inside the visible cone, so in sensor mode a small turn brings anything into
    // view. In touch mode the camera cannot turn at all, so keep every spawn on-screen.
    const arc = sensorMode ? (Math.PI / 3) : (55 * Math.PI / 180);
    const angleOffset = (Math.random() - 0.5) * arc;
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
      size, speed, points, spawnTime: Date.now(), spawnActiveTime: activeTimeRef.current,
      opacity: 1, wobble: 0,
      shapePoints,
      tentacleAngles,
    }]);
    setWaveMicrobesSpawned(prev => {
      const newCount = prev + 1;
      waveMicrobesSpawnedRef.current = newCount;
      return newCount;
    });
  }, [sensorMode]);

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
    // Expiry on the active-play clock, not the wall clock. Pausing for 30s used to
    // silently burn a 10s power-up and reset the combo.
    const endTime = activeTimeRef.current + duration;
    setActivePowerUp({ type, endTime });
    activePowerUpRef.current = { type, endTime };
    
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
      description: `${WAVE_SIZE(nextWave)} microbes incoming!`
    });
  }, []);

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

  useEffect(() => {
    microbesRef.current = microbes;
    // Ids that no longer exist cannot be re-claimed; keep the set from growing forever.
    if (claimedRef.current.size > 0) {
      const live = new Set(microbes.map((m) => m.id));
      claimedRef.current.forEach((id) => { if (!live.has(id)) claimedRef.current.delete(id); });
    }
  }, [microbes]);
  useEffect(() => { powerUpsRef.current = powerUps; }, [powerUps]);
  useEffect(() => { currentWaveRef.current = currentWave; }, [currentWave]);
  useEffect(() => { waveActiveRef.current = waveActive; }, [waveActive]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { activePowerUpRef.current = activePowerUp; }, [activePowerUp]);
  useEffect(() => { waveMicrobesSpawnedRef.current = waveMicrobesSpawned; }, [waveMicrobesSpawned]);

  useEffect(() => {
    if (isPaused) return;
    
    const checkInterval = setInterval(() => {
      if (!waveActiveRef.current) return;
      
      const allSpawned = waveMicrobesSpawnedRef.current > 0 && 
                        waveMicrobesSpawnedRef.current >= WAVE_SIZE(currentWaveRef.current);
      const noneRemaining = microbesRef.current.length === 0;
      
      if (allSpawned && noneRemaining) {
        setWaveActive(false);
        waveActiveRef.current = false;
        toast.success(`Wave ${currentWaveRef.current} Complete!`);
        
        // Tracked so unmounting during the break cannot fire a "Wave N Starting!" toast
        // (and a setState) on a dead component.
        waveBreakTimerRef.current = window.setTimeout(() => {
          waveBreakTimerRef.current = null;
          startNewWave();
        }, 3000);
      }
    }, 500);
    
    return () => {
      clearInterval(checkInterval);
      if (waveBreakTimerRef.current !== null) {
        clearTimeout(waveBreakTimerRef.current);
        waveBreakTimerRef.current = null;
      }
    };
  }, [isPaused, startNewWave]);

  useEffect(() => {
    if (isPaused || !waveActive) return;
    // Wave pacing.
    //
    // The old curve was a cliff: wave 1 was 8 microbes over 20s (one every 2500ms) but
    // wave 5 was 20 over 12s (one every 600ms) - a 4x density jump - and waveDuration
    // bottomed out at 10s by wave 6 while the count kept climbing, so wave 8 was 29
    // microbes in 10 seconds. Now the count grows more slowly and the interval tightens
    // gradually with a floor, so difficulty ramps instead of falling off a shelf.
    const targetMicrobes = WAVE_SIZE(currentWave);
    const spawnInterval = WAVE_SPAWN_INTERVAL_MS(currentWave);
    
    const interval = setInterval(() => {
      if (waveMicrobesSpawnedRef.current < targetMicrobes) {
        spawnMicrobe(sensorDataRef.current.yaw);
      }
    }, spawnInterval);
    
    return () => clearInterval(interval);
  }, [isPaused, waveActive, currentWave, spawnMicrobe]);

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
      // 4s, not 2s. Wave 1 spawns one microbe every ~2.4s, so a 2s combo window was
      // shorter than the gap between targets - combos were mathematically impossible
      // early on and trivial later, exactly backwards.
      if (activeTimeRef.current - lastComboTimeRef.current > 4000 && comboRef.current > 0) {
        setCombo(0);
        onComboChange(0);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPaused, onComboChange]);

  useEffect(() => {
    if (isPaused) {
      // Drop the anchor so the paused span is not counted as elapsed play time.
      lastTickRef.current = null;
      return;
    }
    const interval = setInterval(() => {
      const wall = Date.now();
      // Elapsed ACTIVE milliseconds since the previous tick. Clamped so a backgrounded
      // tab or a long stall cannot teleport every microbe into the player at once.
      const deltaMs = lastTickRef.current === null ? 16 : Math.min(wall - lastTickRef.current, 100);
      lastTickRef.current = wall;
      activeTimeRef.current += deltaMs;
      const nowActive = activeTimeRef.current;

      // Drain escapes recorded by a previous tick's updater.
      //
      // These cannot be reported from inside the updater (that is a parent setState
      // during React's render phase) and they cannot be read immediately after calling
      // setMicrobes either - React defers updaters to the next render, so the count is
      // still zero on the line after. Recording into a ref and draining it on the next
      // tick sidesteps both.
      if (pendingEscapesRef.current > 0) {
        let n = pendingEscapesRef.current;
        pendingEscapesRef.current = 0;
        // shield absorbs escapes while active, which is what its toast claims.
        if (activePowerUpRef.current?.type === "shield" && n > 0) {
          n -= 1;
          toast.info("Shield absorbed a hit!");
        }
        if (n === 0) return;
        damageFlashRef.current = Date.now();
        if ('vibrate' in navigator) navigator.vibrate([120, 60, 120]);
        for (let i = 0; i < n; i++) onLifeLost();
      }

      setMicrobes((prev) => prev.map((microbe) => {
        // Age in ACTIVE seconds, not wall-clock seconds.
        const age = (nowActive - microbe.spawnActiveTime) / 1000;
        const newWobble = microbe.wobble + 0.05 * (deltaMs / 16);
        const distance = Math.sqrt(microbe.x ** 2 + microbe.y ** 2 + microbe.z ** 2);

        // Escaped once it passes the camera plane. The generous age cap is a safety net
        // for anything that somehow never converges, not the normal removal path.
        if (microbe.z >= 0 || distance < 0.5 || age > 30) {
          pendingEscapesRef.current += 1;
          return null;
        }

        // speed is authored per 16ms tick, so scale by real elapsed time.
        // freeze halts approach entirely; without this the toast promised an effect the
        // game never applied. Only "double" was ever consulted for gameplay.
        const frozen = activePowerUpRef.current?.type === "freeze";
        const step = frozen ? 0 : microbe.speed * (deltaMs / 16);
        const newZ = microbe.z + step;

        // Converge on the camera instead of translating along a fixed world x.
        // Projected screenX is x*scale/|z|, so holding x constant while |z| shrinks made
        // microbes slide off the edge of the screen well before they reached the player -
        // unkillable, and then charged as an escape.
        const shrink = Math.abs(newZ) > 0.001 ? Math.abs(newZ) / Math.abs(microbe.z || newZ) : 1;
        const newX = microbe.x * shrink;
        const newY = microbe.y * shrink;

        return {
          ...microbe,
          x: newX,
          y: newY,
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
      if (activePowerUpRef.current && activeTimeRef.current > activePowerUpRef.current.endTime) {
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
      // Cap at 3x: beyond that the fill-rate cost outweighs any visible gain.
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = window.innerWidth;
      const h = window.innerHeight;
      dprRef.current = dpr;
      viewRef.current = { w, h };
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      // Previously the backing store was set to CSS pixels, so on a 3x phone everything
      // was drawn at a third of the screen's real resolution and upscaled - the whole
      // scene looked soft, which is especially costly for an AR overlay.
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
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

      // Re-apply every frame: assigning canvas.width resets context state, so doing this
      // in the resize handler alone would be order-dependent.
      const VW = viewRef.current.w || canvas.width;
      const VH = viewRef.current.h || canvas.height;
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      ctx.clearRect(0, 0, VW, VH);
      const now = Date.now();
      const centerX = VW / 2;
      const centerY = VH / 2;
      const cameraYaw = sensorDataRef.current.yaw;
      const cameraPitch = sensorDataRef.current.pitch;

      microbesRef.current.forEach((microbe) => {
        const projection = projectToScreen(microbe.x, microbe.y, microbe.z, cameraYaw, cameraPitch, VW, VH);
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
        const projection = projectToScreen(microbe.x, microbe.y, microbe.z, cameraYaw, cameraPitch, VW, VH);
        if (projection.isVisible || projection.distance > 24) return;

        const indicatorDistance = Math.min(VW, VH) / 2 - 60;
        const indicatorX = centerX + Math.sin(projection.angle) * indicatorDistance;
        const indicatorY = centerY - Math.cos(projection.angle) * indicatorDistance;

        // Urgency: an arrow for something 3 units away should not look like one for
        // something 20 units away. Closer microbes get a bigger, brighter, pulsing arrow
        // so "turn NOW" reads at a glance instead of every arrow looking identical.
        const closeness = Math.max(0, Math.min(1, 1 - (projection.distance - 3) / 17));
        const pulse = 1 + Math.sin(now / 120) * 0.18 * closeness;
        const arrowScale = (0.85 + closeness * 1.15) * pulse;

        ctx.save();
        ctx.translate(indicatorX, indicatorY);
        ctx.rotate(projection.angle);
        ctx.scale(arrowScale, arrowScale);
        ctx.fillStyle = getMicrobeColor(microbe.type);
        ctx.globalAlpha = 0.55 + closeness * 0.45;
        if (closeness > 0.55) {
          ctx.shadowColor = getMicrobeColor(microbe.type);
          ctx.shadowBlur = 14 * closeness;
        }
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ctx.restore();
      });

      // Radar
      const radarSize = 100;
      const radarX = VW - radarSize - 20;
      const radarY = VH - radarSize - 20;
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
        const projection = projectToScreen(powerUp.x, powerUp.y, powerUp.z, cameraYaw, cameraPitch, VW, VH);
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
        const gradient = ctx.createLinearGradient(centerX, VH, centerX, centerY);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${laserAlpha})`);
        gradient.addColorStop(1, `rgba(255, 150, 150, ${laserAlpha * 0.3})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, VH);
        ctx.lineTo(centerX - 2, centerY);
        ctx.lineTo(centerX + 2, centerY);
        ctx.lineTo(centerX + 15, VH);
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

      // Damage flash - drawn last so it sits over the whole scene.
      const sinceDamage = now - damageFlashRef.current;
      if (damageFlashRef.current > 0 && sinceDamage < 450) {
        const t = 1 - sinceDamage / 450;
        const edge = ctx.createRadialGradient(
          centerX, centerY, Math.min(VW, VH) * 0.25,
          centerX, centerY, Math.max(VW, VH) * 0.75
        );
        edge.addColorStop(0, "rgba(255, 0, 0, 0)");
        edge.addColorStop(1, `rgba(255, 0, 0, ${0.55 * t})`);
        ctx.fillStyle = edge;
        ctx.fillRect(0, 0, VW, VH);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused]);

  const handleTap = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // React attaches onTouchStart passively, so preventDefault() here is a no-op that
    // logs "Unable to preventDefault inside passive event listener invocation" on every
    // shot. touch-action: none on the canvas suppresses the gesture instead.
    if (isPaused || !canvasRef.current) return;

    const canvas = canvasRef.current;

    // Where the shot lands.
    //
    // With working motion sensors this is a crosshair shooter: you aim by pointing the
    // phone, so every tap fires at the centre of the screen. But in touch mode (sensors
    // unavailable or denied) the camera never turns, so microbes that spawn behind or
    // beside you are permanently unreachable and the game is unwinnable. When there is
    // no sensor, aim at the point actually touched instead.
    const VW = viewRef.current.w || canvas.width;
    const VH = viewRef.current.h || canvas.height;
    let centerX = VW / 2;
    let centerY = VH / 2;

    if (!sensorMode) {
      const touch = e.touches?.[0] ?? e.changedTouches?.[0];
      if (touch) {
        const rect = canvas.getBoundingClientRect();
        // Both the touch and our drawing space are CSS pixels now, so no scaling needed.
        centerX = touch.clientX - rect.left;
        centerY = touch.clientY - rect.top;
      }
    }

    // Report the shot before we know whether it hit, so accuracy means something.
    onTap?.();

    if ('vibrate' in navigator) navigator.vibrate(50);
    laserFiringRef.current = Date.now();

    const cameraYaw = sensorDataRef.current.yaw;
    const cameraPitch = sensorDataRef.current.pitch;

    // Decide against the current ref synchronously. Reading a flag set inside a
    // setState updater never worked: the updater runs on the next render, long after
    // this check below had already evaluated to false.
    let collectedPowerUp: PowerUpItem | null = null;
    {
      let minDistance = Infinity;
      powerUpsRef.current.forEach((powerUp) => {
        const projection = projectToScreen(powerUp.x, powerUp.y, powerUp.z, cameraYaw, cameraPitch, VW, VH);
        if (!projection.isVisible) return;
        const screenDistance = Math.hypot(projection.screenX - centerX, projection.screenY - centerY);
        if (screenDistance < 100 && projection.distance < minDistance) {
          minDistance = projection.distance;
          collectedPowerUp = powerUp;
        }
      });
    }

    if (collectedPowerUp) {
      const picked = collectedPowerUp as PowerUpItem;
      setPowerUps((current) => current.filter(p => p.id !== picked.id));
      activatePowerUp(picked.type);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      return;
    }


    // Resolve the hit synchronously against the ref, then apply state changes and parent
    // callbacks OUTSIDE any updater.
    //
    // Previously setScore/setCombo/onScoreChange/onComboChange/onMicrobeEliminated all
    // ran inside the setMicrobes updater. React executes updaters during the render
    // phase, which produced "Cannot update a component while rendering a different
    // component" and - worse - meant a re-invoked updater double-counted the kill,
    // awarding points and combo twice for one tap.
    let hit: { microbe: Microbe; screenX: number; screenY: number } | null = null;
    {
      let minDistance = Infinity;
      microbesRef.current.forEach((microbe) => {
        const projection = projectToScreen(microbe.x, microbe.y, microbe.z, cameraYaw, cameraPitch, VW, VH);
        if (!projection.isVisible) return;
        const screenDistance = Math.hypot(projection.screenX - centerX, projection.screenY - centerY);
        // rapid widens the effective hit radius, giving the power-up a real effect.
        const hitRadius = activePowerUpRef.current?.type === "rapid" ? 240 : 150;
        if (screenDistance < hitRadius && projection.distance < minDistance) {
          minDistance = projection.distance;
          hit = { microbe, screenX: projection.screenX, screenY: projection.screenY };
        }
      });
    }

    if (!hit) return;

    const { microbe: target, screenX, screenY } = hit as { microbe: Microbe; screenX: number; screenY: number };

    // microbesRef is synced by a passive effect that React defers, so two touchstart
    // events in the same frame could both resolve the SAME microbe and score it twice.
    // Claim it synchronously; a second tap on an already-claimed id is ignored.
    if (claimedRef.current.has(target.id)) return;
    const newHealth = target.health - 1;
    const killed = newHealth <= 0;

    if ('vibrate' in navigator) navigator.vibrate(killed ? [100, 50, 100] : [50, 30, 50]);

    particlesRef.current.push(
      ...Array.from({ length: killed ? 33 : 8 }, () => ({
        x: screenX,
        y: screenY,
        vx: (Math.random() - 0.5) * (killed ? 12 : 5),
        vy: (Math.random() - 0.5) * (killed ? 12 : 5),
        life: killed ? 1.5 : 1,
        color: getMicrobeColor(target.type),
      }))
    );

    if (killed) {
      claimedRef.current.add(target.id);
      const newCombo = comboRef.current + 1;
      // Every 3 kills rather than 5, so the mechanic pays off within a single wave.
      const comboMultiplier = 1 + Math.floor(newCombo / 3) * 0.5;
      const pointsEarned = Math.floor(
        target.points * comboMultiplier * (activePowerUpRef.current?.type === "double" ? 2 : 1)
      );

      setMicrobes((current) => current.filter((m) => m.id !== target.id));

      comboRef.current = newCombo;
      lastComboTimeRef.current = activeTimeRef.current;
      setCombo(newCombo);
      scoreRef.current += pointsEarned;
      setScore(scoreRef.current);
      onScoreChange(scoreRef.current);
      onComboChange(newCombo);
      onMicrobeEliminated();
    } else {
      setMicrobes((current) =>
        current.map((m) => (m.id === target.id ? { ...m, health: newHealth } : m))
      );
    }
  }, [isPaused, sensorMode, onScoreChange, onComboChange, onMicrobeEliminated, activatePowerUp, onTap]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onTouchStart={handleTap}
        onContextMenu={(e) => e.preventDefault()}
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
