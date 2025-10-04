import { useEffect, useState, useCallback, useRef } from "react";

interface DeviceOrientationState {
  alpha: number | null; // Rotation around z-axis (0-360)
  beta: number | null;  // Rotation around x-axis (-180 to 180)
  gamma: number | null; // Rotation around y-axis (-90 to 90)
}

export const useDeviceOrientation = () => {
  const orientationRef = useRef<DeviceOrientationState>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const hasDetectedDataRef = useRef(false); // FIX: Moved to top level

  const requestPermission = useCallback(async () => {
    // Check if DeviceOrientationEvent is available
    if (typeof DeviceOrientationEvent === "undefined") {
      console.log('❌ DeviceOrientationEvent not available');
      setPermissionGranted(false);
      return false;
    }

    // Check for feature policy
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'accelerometer' as PermissionName });
        console.log('🔐 Accelerometer permission:', result.state);
      } catch (e) {
        console.log('⚠️ Could not query sensor permissions');
      }
    }

    // For iOS 13+ devices, need explicit permission
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        const granted = permission === "granted";
        console.log('🔐 iOS DeviceOrientation permission:', granted);
        setPermissionGranted(granted);
        return granted;
      } catch (error) {
        console.error("Device orientation permission error:", error);
        setPermissionGranted(false);
        return false;
      }
    } else {
      // For other devices, assume permission granted but verify data flow
      console.log('✅ DeviceOrientation permission auto-granted (Android/Desktop)');
      setPermissionGranted(true);
      return true;
    }
  }, []);

  // FIX #1: Auto-detect implicit permission - NO INFINITE LOOP
  useEffect(() => {
    // Early return if we've already detected data
    if (hasDetectedDataRef.current) {
      console.log('✅ Data already detected, skipping listener setup');
      return;
    }
    
    const detectDataFlow = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
        // Force update data immediately
        orientationRef.current = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        };
        
        // Set permission to true ONLY ONCE
        if (!hasDetectedDataRef.current) {
          console.log('🚀 FORCE: DeviceOrientation data detected, setting permission to TRUE');
          hasDetectedDataRef.current = true;
          setPermissionGranted(true);
        }
      }
    };

    // Only run if permission is not yet determined
    if (permissionGranted === null) {
      console.log('👂 FORCE: Implicit detection listener added');
      window.addEventListener("deviceorientation", detectDataFlow);
      
      // Check after 500ms if we got data
      const timeout = setTimeout(() => {
        if (!hasDetectedDataRef.current) {
          console.log('⏱️ FORCE: No automatic sensor data after 500ms, explicit permission required');
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener("deviceorientation", detectDataFlow);
      };
    }
  }, []); // Empty dependency array - run ONCE on mount

  useEffect(() => {
    if (permissionGranted !== true) return;

    let eventReceived = false;
    let lastEventTime = 0;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now();
      const wasFirstEvent = !eventReceived;
      eventReceived = true;
      lastEventTime = now;
      
      // Check if we're getting actual data (not null)
      const hasData = event.alpha !== null || event.beta !== null || event.gamma !== null;
      
      orientationRef.current = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      };
      
      // Log first event
      if (wasFirstEvent) {
        console.log('✅ Device orientation events working:', {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
          absolute: event.absolute,
          hasData
        });
        
        if (!hasData) {
          console.warn('⚠️ DeviceOrientation events firing but all values are NULL');
        }
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    // Verify that orientation events actually fire within 1 second
    const verificationTimeout = setTimeout(() => {
      if (!eventReceived) {
        console.warn("❌ Device orientation permission granted but no events received after 1s");
        console.log("📱 Device info:", {
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol
        });
        setPermissionGranted(false);
      }
    }, 1000);

    // Periodic check for stale data
    const staleCheckInterval = setInterval(() => {
      if (eventReceived && Date.now() - lastEventTime > 2000) {
        console.warn("⚠️ Device orientation events stopped updating");
      }
    }, 2000);

    return () => {
      clearTimeout(verificationTimeout);
      clearInterval(staleCheckInterval);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionGranted]);

  return {
    orientationRef,
    permissionGranted,
    requestPermission,
  };
};
