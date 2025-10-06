import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ARCameraProps {
  onStreamReady?: (stream: MediaStream) => void;
  children?: React.ReactNode;
}

export const ARCamera = ({ onStreamReady, children }: ARCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initCamera = async () => {
      try {
        // Request rear-facing camera
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }

        setIsReady(true);

        if (onStreamReady) {
          onStreamReady(mediaStream);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        const errorMessage = err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : "Failed to access camera. Please check your device settings.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    initCamera();

    return () => {
      // FIXED: Clean up camera stream using ref
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [onStreamReady]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Camera Access Required</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <p className="text-sm text-muted-foreground">
            This AR game requires access to your device camera to work properly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video feed as background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        playsInline
        muted
      />
      
      {/* Overlay content (game canvas, UI, etc.) - only render after camera ready */}
      {isReady && children}
    </div>
  );
};
