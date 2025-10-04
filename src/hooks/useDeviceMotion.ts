import { useEffect, useState, useCallback, useRef } from "react";

interface DeviceMotionState {
  acceleration: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  isShaking: boolean;
  shakeIntensity: number;
}

export const useDeviceMotion = (threshold: number = 15) => {
  const [motionState, setMotionState] = useState<DeviceMotionState>({
    acceleration: { x: null, y: null, z: null },
    isShaking: false,
    shakeIntensity: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const lastShakeTimeRef = useRef<number>(0);

  const requestPermission = useCallback(async () => {
    // Check if DeviceMotionEvent is available
    if (typeof DeviceMotionEvent === "undefined") {
      setPermissionGranted(false);
      return false;
    }

    // For iOS 13+ devices, need explicit permission
    if (
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        const granted = permission === "granted";
        setPermissionGranted(granted);
        return granted;
      } catch (error) {
        console.error("Device motion permission error:", error);
        setPermissionGranted(false);
        return false;
      }
    } else {
      // For other devices, permission is automatically granted
      setPermissionGranted(true);
      return true;
    }
  }, []);

  useEffect(() => {
    if (permissionGranted !== true) return;

    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};

      if (x === null || y === null || z === null) return;

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;
      const now = Date.now();
      
      // If we detect shake motion, update the last shake time
      if (totalDelta > threshold) {
        lastShakeTimeRef.current = now;
      }
      
      // Keep isShaking true for 200ms after last shake detected
      const isShaking = (now - lastShakeTimeRef.current) < 200;

      setMotionState({
        acceleration: { x, y, z },
        isShaking,
        shakeIntensity: totalDelta,
      });

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [permissionGranted, threshold]);

  return {
    ...motionState,
    permissionGranted,
    requestPermission,
  };
};
