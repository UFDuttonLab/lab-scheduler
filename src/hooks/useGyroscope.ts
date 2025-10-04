import { useEffect, useState, useCallback, useRef } from "react";

interface GyroscopeState {
  alpha: number | null; // Calculated from gyroscope
  beta: number | null;
  gamma: number | null;
  rotationRateAlpha: number | null;
  rotationRateBeta: number | null;
  rotationRateGamma: number | null;
}

export const useGyroscope = () => {
  const gyroStateRef = useRef<GyroscopeState>({
    alpha: null,
    beta: null,
    gamma: null,
    rotationRateAlpha: null,
    rotationRateBeta: null,
    rotationRateGamma: null,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(false);

  const requestPermission = useCallback(async () => {
    // Check if Gyroscope API is available
    if (!('Gyroscope' in window)) {
      console.log('❌ Gyroscope API not available in this browser');
      setPermissionGranted(false);
      setSensorAvailable(false);
      return false;
    }

    try {
      // Try to request permission if needed
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'gyroscope' as PermissionName });
        console.log('🔐 Gyroscope permission status:', result.state);
        
        if (result.state === 'denied') {
          setPermissionGranted(false);
          return false;
        }
      }

      setSensorAvailable(true);
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Gyroscope permission error:', error);
      setPermissionGranted(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (permissionGranted !== true || !sensorAvailable) return;

    let gyroscope: any = null;
    let accumulatedAlpha = 0;
    let accumulatedBeta = 0;
    let accumulatedGamma = 0;
    let lastUpdateTime = Date.now();
    let isInitialized = false;

    // Try to get initial compass heading from DeviceOrientation
    const initializeFromOrientation = (event: DeviceOrientationEvent) => {
      if (!isInitialized && event.alpha !== null) {
        accumulatedAlpha = event.alpha;
        isInitialized = true;
        console.log('✅ Gyroscope initialized from compass heading:', event.alpha);
        window.removeEventListener('deviceorientation', initializeFromOrientation);
      }
    };
    
    window.addEventListener('deviceorientation', initializeFromOrientation);

    try {
      gyroscope = new (window as any).Gyroscope({ frequency: 60 });
      
      gyroscope.addEventListener('reading', () => {
        const now = Date.now();
        const dt = (now - lastUpdateTime) / 1000; // Convert to seconds
        lastUpdateTime = now;

        // Gyroscope gives rotation rate in rad/s
        const rotationRateAlpha = gyroscope.z; // Z axis (yaw)
        const rotationRateBeta = gyroscope.x;  // X axis (pitch)
        const rotationRateGamma = gyroscope.y; // Y axis (roll)

        // Integrate rotation rates to get angles (in degrees)
        accumulatedAlpha += (rotationRateAlpha * 180 / Math.PI) * dt;
        accumulatedBeta += (rotationRateBeta * 180 / Math.PI) * dt;
        accumulatedGamma += (rotationRateGamma * 180 / Math.PI) * dt;

        // Normalize alpha to 0-360
        accumulatedAlpha = ((accumulatedAlpha % 360) + 360) % 360;
        
        // Clamp beta to -180 to 180
        accumulatedBeta = Math.max(-180, Math.min(180, accumulatedBeta));
        
        // Clamp gamma to -90 to 90
        accumulatedGamma = Math.max(-90, Math.min(90, accumulatedGamma));

        gyroStateRef.current = {
          alpha: accumulatedAlpha,
          beta: accumulatedBeta,
          gamma: accumulatedGamma,
          rotationRateAlpha,
          rotationRateBeta,
          rotationRateGamma,
        };
      });

      gyroscope.addEventListener('error', (event: any) => {
        console.error('❌ Gyroscope sensor error:', event.error);
        setPermissionGranted(false);
      });

      gyroscope.start();
      console.log('✅ Gyroscope sensor started successfully');
    } catch (error) {
      console.error('Failed to start gyroscope:', error);
      setPermissionGranted(false);
    }

    return () => {
      window.removeEventListener('deviceorientation', initializeFromOrientation);
      if (gyroscope) {
        try {
          gyroscope.stop();
        } catch (e) {
          console.error('Error stopping gyroscope:', e);
        }
      }
    };
  }, [permissionGranted, sensorAvailable]);

  return {
    gyroStateRef,
    permissionGranted,
    sensorAvailable,
    requestPermission,
  };
};
