import { useEffect, useState, useCallback } from "react";

interface DeviceOrientationState {
  alpha: number | null; // Rotation around z-axis (0-360)
  beta: number | null;  // Rotation around x-axis (-180 to 180)
  gamma: number | null; // Rotation around y-axis (-90 to 90)
}

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<DeviceOrientationState>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    // Check if DeviceOrientationEvent is available
    if (typeof DeviceOrientationEvent === "undefined") {
      setPermissionGranted(false);
      return false;
    }

    // For iOS 13+ devices, need explicit permission
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        const granted = permission === "granted";
        setPermissionGranted(granted);
        return granted;
      } catch (error) {
        console.error("Device orientation permission error:", error);
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

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionGranted]);

  return {
    ...orientation,
    permissionGranted,
    requestPermission,
  };
};
